import { analyzePublicPage, createDemoAssessment } from "@/domain/assessment";
import { DEMO_LEGACY_URL } from "@/domain/demo-data";
import {
  safeFetchPublicHtml,
  SafeFetchError,
  type SafeFetchErrorCode,
} from "@/lib/safe-site-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const MAX_REQUEST_BYTES = 4_096;
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const MAX_ACTIVE_ASSESSMENTS = 6;

const requestWindows = new Map<string, number[]>();
let activeAssessments = 0;

function json(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { ...init, headers });
}

function clientAddress(request: Request) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function withinRateLimit(key: string, now = Date.now()) {
  if (requestWindows.size >= 1_000) {
    for (const [entryKey, timestamps] of requestWindows) {
      if (!timestamps.some((timestamp) => now - timestamp < RATE_WINDOW_MS)) {
        requestWindows.delete(entryKey);
      }
    }
    if (requestWindows.size >= 1_000 && !requestWindows.has(key)) return false;
  }
  const recent = (requestWindows.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestWindows.set(key, recent);
    return false;
  }
  recent.push(now);
  requestWindows.set(key, recent);

  return true;
}

async function readBoundedJson(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    throw new SafeFetchError("TOO_LARGE", "The assessment request is too large.");
  }
  if (!request.body) {
    throw new SafeFetchError("INVALID_URL", "A website URL is required.");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new SafeFetchError("TOO_LARGE", "The assessment request is too large.");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(text) as { url?: unknown };
  } catch {
    throw new SafeFetchError("INVALID_URL", "The assessment request must be valid JSON.");
  }
}

function isDemoUrl(input: string) {
  try {
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(input.trim())
      ? input.trim()
      : `https://${input.trim()}`;
    const parsed = new URL(candidate);
    parsed.hash = "";
    return parsed.toString() === new URL(DEMO_LEGACY_URL).toString();
  } catch {
    return false;
  }
}

function statusForError(code: SafeFetchErrorCode) {
  switch (code) {
    case "INVALID_URL":
    case "UNSAFE_DESTINATION":
      return 400;
    case "TIMEOUT":
      return 408;
    case "TOO_LARGE":
      return 413;
    case "UNSUPPORTED_CONTENT":
      return 415;
    case "TOO_MANY_REDIRECTS":
      return 508;
    default:
      return 422;
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json({ error: "Send the assessment request as application/json." }, { status: 415 });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: "Cross-origin assessment requests are not accepted." }, { status: 403 });
  }

  if (!withinRateLimit(clientAddress(request))) {
    return json(
      { error: "Too many assessments from this address. Try again in one minute." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  if (activeAssessments >= MAX_ACTIVE_ASSESSMENTS) {
    return json(
      { error: "The assessment service is busy. Try again shortly." },
      { status: 503, headers: { "Retry-After": "5" } },
    );
  }

  activeAssessments += 1;
  try {
    const body = await readBoundedJson(request);
    if (typeof body.url !== "string") {
      throw new SafeFetchError("INVALID_URL", "A website URL is required.");
    }

    if (isDemoUrl(body.url)) {
      return json({ assessment: createDemoAssessment() });
    }

    const page = await safeFetchPublicHtml(body.url);
    const observedAt = new Date().toISOString();
    const assessment = analyzePublicPage({
      requestedUrl: page.requestedUrl,
      finalUrl: page.finalUrl,
      observedAt,
      httpStatus: page.status,
      html: page.html,
      transferredBytes: page.transferredBytes,
      redirectCount: page.redirectCount,
    });
    return json({ assessment });
  } catch (error) {
    if (error instanceof SafeFetchError) {
      return json(
        { error: error.message, code: error.code },
        { status: statusForError(error.code) },
      );
    }
    return json(
      { error: "The website could not be assessed safely." },
      { status: 500 },
    );
  } finally {
    activeAssessments -= 1;
  }
}
