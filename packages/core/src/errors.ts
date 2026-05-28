export type FetcherErrorCode =
  | "CONFIGURATION_ERROR"
  | "VALIDATION_ERROR"
  | "SPENDING_POLICY_BLOCKED"
  | "BACKEND_ERROR"
  | "FILESYSTEM_ERROR"
  | "NOT_FOUND"
  | "SIZE_TOO_SMALL"
  | "NOT_SUPPORTED";

export class FetcherError extends Error {
  readonly code: FetcherErrorCode;
  readonly cause?: unknown;

  constructor(code: FetcherErrorCode, message: string, options: { cause?: unknown } = {}) {
    super(message);
    this.name = "FetcherError";
    this.code = code;
    this.cause = options.cause;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: redactSecrets(this.message)
    };
  }
}

export function redactSecrets(value: string): string {
  return value.replace(/0x[a-fA-F0-9]{64}/g, "0x[REDACTED_PRIVATE_KEY]");
}
