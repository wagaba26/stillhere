import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { request as httpRequest, type IncomingHttpHeaders } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";

const MAX_URL_LENGTH = 2_048;
const MAX_RESPONSE_BYTES = 750_000;
const MAX_REDIRECTS = 3;
const TOTAL_TIMEOUT_MS = 9_000;

export type SafeFetchErrorCode =
  | "INVALID_URL"
  | "UNSAFE_DESTINATION"
  | "TIMEOUT"
  | "TOO_LARGE"
  | "UNSUPPORTED_CONTENT"
  | "UNREACHABLE"
  | "TOO_MANY_REDIRECTS";

export class SafeFetchError extends Error {
  constructor(
    public readonly code: SafeFetchErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SafeFetchError";
  }
}

export interface SafeSiteResponse {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  html: string;
  transferredBytes: number;
  redirectCount: number;
}

interface PinnedAddress {
  address: string;
  family: 4 | 6;
}

interface RawResponse {
  status: number;
  headers: IncomingHttpHeaders;
  body: string;
  transferredBytes: number;
}

function ipv4Number(address: string) {
  return address
    .split(".")
    .map(Number)
    .reduce((value, part) => (value << 8) + part, 0) >>> 0;
}

function inIpv4Range(address: number, base: string, prefix: number) {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (address & mask) === (ipv4Number(base) & mask);
}

function isPublicIpv4(address: string) {
  const value = ipv4Number(address);
  const denied: Array<[string, number]> = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.88.99.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ];
  return !denied.some(([base, prefix]) => inIpv4Range(value, base, prefix));
}

function ipv6Segments(address: string) {
  let normalized = address.toLowerCase().split("%")[0];
  const ipv4Tail = normalized.match(/(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (ipv4Tail) {
    const value = ipv4Number(ipv4Tail);
    normalized = normalized.replace(
      ipv4Tail,
      `${((value >>> 16) & 0xffff).toString(16)}:${(value & 0xffff).toString(16)}`,
    );
  }
  const [left = "", right = ""] = normalized.split("::");
  const leftParts = left ? left.split(":") : [];
  const rightParts = right ? right.split(":") : [];
  const hasCompression = normalized.includes("::");
  const missing = 8 - leftParts.length - rightParts.length;
  if ((!hasCompression && missing !== 0) || (hasCompression && missing < 1)) {
    return null;
  }
  const parts = hasCompression
    ? [...leftParts, ...Array.from({ length: missing }, () => "0"), ...rightParts]
    : leftParts;
  if (parts.length !== 8 || parts.some((part) => !/^[\da-f]{1,4}$/i.test(part))) {
    return null;
  }
  return parts.map((part) => Number.parseInt(part, 16));
}

function isPublicIpv6(address: string) {
  const normalized = address.toLowerCase().split("%")[0];
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPublicIpv4(mapped[1]);

  // Public global unicast is currently 2000::/3. Explicitly exclude
  // documentation and transition ranges that can encode a private endpoint.
  const segments = ipv6Segments(normalized);
  if (!segments || segments[0] < 0x2000 || segments[0] > 0x3fff) return false;
  return (
    segments[0] !== 0x2002 &&
    !(segments[0] === 0x2001 && segments[1] === 0x0000) &&
    !(segments[0] === 0x2001 && segments[1] === 0x0db8)
  );
}

export function isPublicIpAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return isPublicIpv4(address);
  if (family === 6) return isPublicIpv6(address);
  return false;
}

function normalizedHostname(url: URL) {
  return url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
}

function isBlockedHostname(hostname: string) {
  const exact = new Set([
    "0",
    "instance-data",
    "localhost",
    "localhost.localdomain",
    "metadata.google.internal",
  ]);
  const suffixes = [
    ".example",
    ".home",
    ".internal",
    ".invalid",
    ".lan",
    ".local",
    ".localhost",
    ".onion",
    ".test",
  ];
  return exact.has(hostname) || suffixes.some((suffix) => hostname.endsWith(suffix));
}

export function parseAssessmentUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
    throw new SafeFetchError("INVALID_URL", "Enter a public website URL of 2,048 characters or fewer.");
  }

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new SafeFetchError("INVALID_URL", "Enter a valid public http or https URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SafeFetchError("INVALID_URL", "Only public http and https URLs can be assessed.");
  }
  if (url.username || url.password) {
    throw new SafeFetchError("INVALID_URL", "URLs containing credentials are not accepted.");
  }
  if (
    (url.port && url.protocol === "http:" && url.port !== "80") ||
    (url.port && url.protocol === "https:" && url.port !== "443")
  ) {
    throw new SafeFetchError("UNSAFE_DESTINATION", "Only standard public web ports 80 and 443 are allowed.");
  }

  const hostname = normalizedHostname(url);
  if (!hostname || isBlockedHostname(hostname)) {
    throw new SafeFetchError("UNSAFE_DESTINATION", "Private, local, reserved, and test-network destinations are blocked.");
  }
  if (isIP(hostname) && !isPublicIpAddress(hostname)) {
    throw new SafeFetchError("UNSAFE_DESTINATION", "Private, local, reserved, and test-network destinations are blocked.");
  }

  url.hash = "";
  return url;
}

async function withDeadline<T>(promise: Promise<T>, deadline: number) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) {
    throw new SafeFetchError("TIMEOUT", "The website assessment timed out.");
  }
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new SafeFetchError("TIMEOUT", "The website assessment timed out.")),
          remaining,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function resolvePublicAddress(url: URL, deadline: number): Promise<PinnedAddress> {
  const hostname = normalizedHostname(url);
  const literalFamily = isIP(hostname);
  if (literalFamily) {
    if (!isPublicIpAddress(hostname)) {
      throw new SafeFetchError("UNSAFE_DESTINATION", "The address is not on the public internet.");
    }
    return { address: hostname, family: literalFamily as 4 | 6 };
  }

  let addresses: LookupAddress[];
  try {
    addresses = await withDeadline(
      lookup(hostname, { all: true, verbatim: true }),
      deadline,
    );
  } catch (error) {
    if (error instanceof SafeFetchError) throw error;
    throw new SafeFetchError("UNREACHABLE", "The website hostname could not be resolved.");
  }

  if (!addresses.length || addresses.some((entry) => !isPublicIpAddress(entry.address))) {
    throw new SafeFetchError(
      "UNSAFE_DESTINATION",
      "The hostname resolves to a private, local, reserved, or mixed-trust destination.",
    );
  }

  const selected = addresses.find((entry) => entry.family === 4) ?? addresses[0];
  return { address: selected.address, family: selected.family as 4 | 6 };
}

function requestOnce(url: URL, pinned: PinnedAddress, deadline: number) {
  return new Promise<RawResponse>((resolve, reject) => {
    const timeoutMs = Math.max(1, deadline - Date.now());
    const headers = {
      Accept: "text/html,application/xhtml+xml;q=0.9",
      "Accept-Encoding": "identity",
      "Cache-Control": "no-cache",
      Host: url.host,
      "User-Agent": "StillHereAssessment/1.0 (+https://stillhere-azure.vercel.app)",
    };
    const commonOptions = {
      family: pinned.family,
      headers,
      hostname: pinned.address,
      method: "GET",
      path: `${url.pathname}${url.search}`,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      timeout: timeoutMs,
    };
    const onResponse = (response: import("node:http").IncomingMessage) => {
      const status = response.statusCode ?? 0;
      const contentLength = Number(response.headers["content-length"] ?? 0);
      const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
      const contentEncoding = String(response.headers["content-encoding"] ?? "identity").toLowerCase();

      if ([301, 302, 303, 307, 308].includes(status)) {
        response.resume();
        resolve({
          status,
          headers: response.headers,
          body: "",
          transferredBytes: 0,
        });
        return;
      }

      if (contentLength > MAX_RESPONSE_BYTES) {
        response.resume();
        reject(new SafeFetchError("TOO_LARGE", "The HTML response is larger than the 750 KB assessment limit."));
        return;
      }
      if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        response.resume();
        reject(new SafeFetchError("UNSUPPORTED_CONTENT", "The URL did not return an HTML page."));
        return;
      }
      if (contentEncoding && contentEncoding !== "identity") {
        response.resume();
        reject(new SafeFetchError("UNSUPPORTED_CONTENT", "The server returned an unsupported compressed response."));
        return;
      }

      const chunks: Buffer[] = [];
      let transferredBytes = 0;
      response.on("data", (chunk: Buffer | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        transferredBytes += buffer.length;
        if (transferredBytes > MAX_RESPONSE_BYTES) {
          response.destroy(
            new SafeFetchError("TOO_LARGE", "The HTML response exceeded the 750 KB assessment limit."),
          );
          return;
        }
        chunks.push(buffer);
      });
      response.on("end", () => {
        resolve({
          status,
          headers: response.headers,
          body: Buffer.concat(chunks).toString("utf8"),
          transferredBytes,
        });
      });
      response.on("aborted", () => {
        reject(new SafeFetchError("UNREACHABLE", "The website closed the response before it completed."));
      });
      response.on("error", reject);
    };

    const request =
      url.protocol === "https:"
        ? httpsRequest(
            { ...commonOptions, servername: normalizedHostname(url) },
            onResponse,
          )
        : httpRequest(commonOptions, onResponse);

    request.on("timeout", () => {
      request.destroy(new SafeFetchError("TIMEOUT", "The website assessment timed out."));
    });
    request.on("error", (error) => {
      reject(
        error instanceof SafeFetchError
          ? error
          : new SafeFetchError(
              "UNREACHABLE",
              "The website could not be reached over a valid public connection.",
            ),
      );
    });
    request.end();
  });
}

export async function safeFetchPublicHtml(input: string): Promise<SafeSiteResponse> {
  const requested = parseAssessmentUrl(input);
  const requestedUrl = requested.toString();
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;
  let current = requested;
  let transferredBytes = 0;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const pinned = await resolvePublicAddress(current, deadline);
    const response = await withDeadline(requestOnce(current, pinned, deadline), deadline);
    transferredBytes += response.transferredBytes;

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location;
      if (!location) {
        throw new SafeFetchError("UNREACHABLE", "The website returned an incomplete redirect.");
      }
      if (redirectCount === MAX_REDIRECTS) {
        throw new SafeFetchError("TOO_MANY_REDIRECTS", "The website exceeded the three-redirect assessment limit.");
      }
      current = parseAssessmentUrl(new URL(location, current).toString());
      continue;
    }

    return {
      requestedUrl,
      finalUrl: current.toString(),
      status: response.status,
      html: response.body,
      transferredBytes,
      redirectCount,
    };
  }

  throw new SafeFetchError("TOO_MANY_REDIRECTS", "The website exceeded the redirect limit.");
}
