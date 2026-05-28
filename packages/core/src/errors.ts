export type FilecoinAgentErrorCode =
  | "CONFIGURATION_ERROR"
  | "VALIDATION_ERROR"
  | "SPENDING_POLICY_BLOCKED"
  | "BACKEND_ERROR"
  | "FILESYSTEM_ERROR";

export class FilecoinAgentError extends Error {
  readonly code: FilecoinAgentErrorCode;
  readonly cause?: unknown;

  constructor(code: FilecoinAgentErrorCode, message: string, options: { cause?: unknown } = {}) {
    super(message);
    this.name = "FilecoinAgentError";
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
