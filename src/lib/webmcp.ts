export function hasWebMcp(
  candidate: Pick<Document, "modelContext"> | undefined =
    typeof document === "undefined" ? undefined : document,
) {
  return typeof candidate?.modelContext?.registerTool === "function";
}

export function asToolInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Tool input must be an object.");
  }
  return input as Record<string, unknown>;
}

export function optionalString(
  input: Record<string, unknown>,
  key: string,
  maxLength = 200,
) {
  const value = input[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new TypeError(`${key} must be a string.`);
  return value.trim().slice(0, maxLength);
}

export function requiredString(
  input: Record<string, unknown>,
  key: string,
  maxLength = 500,
) {
  const value = optionalString(input, key, maxLength);
  if (!value) throw new TypeError(`${key} is required.`);
  return value;
}

export function optionalBoolean(input: Record<string, unknown>, key: string) {
  const value = input[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") throw new TypeError(`${key} must be a boolean.`);
  return value;
}

export function optionalNumber(input: Record<string, unknown>, key: string) {
  const value = input[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${key} must be a finite number.`);
  }
  return value;
}
