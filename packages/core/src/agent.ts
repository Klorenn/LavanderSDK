import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { DEFAULT_SPENDING_POLICY } from "./defaults.js";
import { FilecoinAgentError } from "./errors.js";
import {
  prepareStorageInputSchema,
  retrieveInputSchema,
  storeFileInputSchema,
  storeTextInputSchema,
  verifyInputSchema
} from "./schemas.js";
import type {
  FilecoinAgentConfig,
  FilecoinAgentStorage,
  PrepareStorageInput,
  SpendingPolicy,
  StorageBackend
} from "./types.js";

export function createFilecoinAgent(config: FilecoinAgentConfig): FilecoinAgentStorage {
  if (!config.backend) {
    throw new FilecoinAgentError(
      "CONFIGURATION_ERROR",
      "No storage backend configured. Pass a test backend or create a Synapse backend."
    );
  }

  const backend = config.backend;
  const policy: SpendingPolicy = { ...DEFAULT_SPENDING_POLICY, ...config.spendingPolicy };

  return {
    async storeText(input) {
      const parsed = storeTextInputSchema.parse(input);
      const data = new TextEncoder().encode(parsed.text);
      assertPaidOperationAllowed(policy, data.byteLength, parsed.confirmPaidOperation);
      return backend.upload(data, { metadata: parsed.metadata, copies: parsed.copies });
    },

    async storeFile(input) {
      const parsed = storeFileInputSchema.parse(input);
      const data = await readFile(parsed.path).catch((cause) => {
        throw new FilecoinAgentError("FILESYSTEM_ERROR", `Unable to read file: ${parsed.path}`, { cause });
      });
      assertPaidOperationAllowed(policy, data.byteLength, parsed.confirmPaidOperation);
      return backend.upload(data, { metadata: parsed.metadata, copies: parsed.copies });
    },

    async retrieve(input) {
      const parsed = retrieveInputSchema.parse(input);
      const bytes = await backend.download({ pieceCid: parsed.pieceCid, withCDN: parsed.withCDN });

      if (parsed.outputPath) {
        await mkdir(dirname(parsed.outputPath), { recursive: true });
        await writeFile(parsed.outputPath, bytes);
        return { pieceCid: parsed.pieceCid, size: bytes.byteLength, outputPath: parsed.outputPath };
      }

      return { pieceCid: parsed.pieceCid, size: bytes.byteLength, bytes };
    },

    async verify(input) {
      return backend.verify(verifyInputSchema.parse(input));
    },

    async prepareStorage(input: PrepareStorageInput) {
      const parsed = prepareStorageInputSchema.parse(input);
      assertPaidOperationAllowed(policy, parsed.bytes, parsed.confirmPaidOperation);
      return backend.prepareStorage(parsed);
    },

    async getBalance() {
      return backend.getBalance();
    }
  };
}

function assertPaidOperationAllowed(policy: SpendingPolicy, bytes: number, confirmed?: boolean): void {
  if (!policy.allowPaidOperations) {
    throw new FilecoinAgentError(
      "SPENDING_POLICY_BLOCKED",
      "Paid Filecoin operation blocked by spending policy. Set allowPaidOperations when you intentionally enable storage payments."
    );
  }

  if (bytes > policy.maxStorageBytesPerCall) {
    throw new FilecoinAgentError(
      "SPENDING_POLICY_BLOCKED",
      `Paid Filecoin operation blocked because ${bytes} bytes exceeds maxStorageBytesPerCall=${policy.maxStorageBytesPerCall}.`
    );
  }

  if (policy.requireConfirmation && confirmed !== true) {
    throw new FilecoinAgentError(
      "SPENDING_POLICY_BLOCKED",
      "Paid Filecoin operation requires confirmPaidOperation=true."
    );
  }
}
