import { Synapse, mainnet } from "@filoz/synapse-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { FilecoinAgentError } from "./errors.js";
import { DEFAULT_NETWORK, DEFAULT_SOURCE } from "./defaults.js";
import type {
  BalanceResult,
  FilecoinNetwork,
  PrepareStorageResult,
  StorageBackend,
  StoreResult,
  VerifyResult
} from "./types.js";

export type SynapseBackendConfig = {
  privateKey?: `0x${string}`;
  network?: FilecoinNetwork;
  source?: string;
  withCDN?: boolean;
};

export async function createSynapseBackend(config: SynapseBackendConfig): Promise<StorageBackend> {
  if (!config.privateKey) {
    throw new FilecoinAgentError("CONFIGURATION_ERROR", "A Filecoin private key is required to create the Synapse backend.");
  }

  const network = config.network ?? DEFAULT_NETWORK;
  const synapse = Synapse.create({
    account: privateKeyToAccount(config.privateKey),
    source: config.source ?? DEFAULT_SOURCE,
    ...(network === "mainnet" ? { chain: mainnet } : {}),
    ...(config.withCDN === true ? { withCDN: true } : {})
  });

  return {
    async upload(data, options): Promise<StoreResult> {
      const result = await synapse.storage.upload(data, {
        ...(options?.copies ? { copies: options.copies } : {}),
        ...(options?.metadata ? { metadata: options.metadata } : {})
      });

      return {
        pieceCid: String(result.pieceCid),
        size: Number(result.size),
        complete: Boolean(result.complete),
        copies: Array.isArray(result.copies)
          ? result.copies.map((copy) => ({
              providerId: copy.providerId === undefined ? undefined : Number(copy.providerId),
              status: "stored"
            }))
          : [],
        failedAttempts: Array.isArray(result.failedAttempts)
          ? result.failedAttempts.map((attempt) => ({
              providerId: attempt.providerId === undefined ? undefined : Number(attempt.providerId),
              reason: attempt.error ?? "unknown failure"
            }))
          : []
      };
    },

    async download(input) {
      return synapse.storage.download({ pieceCid: input.pieceCid, withCDN: input.withCDN });
    },

    async verify(input): Promise<VerifyResult> {
      const dataSets = await synapse.storage.findDataSets();
      let copies = 0;
      const evidence: VerifyResult["evidence"] = [];

      for (const dataSet of dataSets) {
        const context = await synapse.storage.createContext({ dataSetId: dataSet.pdpVerifierDataSetId });
        for await (const piece of context.getPieces()) {
          if (String(piece.pieceCid) === input.pieceCid) {
            copies += 1;
            evidence.push({
              type: "dataset",
              status: dataSet.isLive ? "live" : "not-live",
              detail: `dataset=${String(dataSet.pdpVerifierDataSetId)}`
            });
          }
        }
      }

      return {
        pieceCid: input.pieceCid,
        verified: copies > 0,
        status: copies > 0 ? "stored" : "missing",
        copies,
        checkedAt: new Date().toISOString(),
        evidence
      };
    },

    async prepareStorage(input): Promise<PrepareStorageResult> {
      const prep = await synapse.storage.prepare({ dataSize: BigInt(input.bytes) });
      const ready = Boolean(prep.costs?.ready ?? !prep.transaction);

      if (!prep.transaction) {
        return { ready, message: "Storage account is already prepared." };
      }

      const { hash } = await prep.transaction.execute();
      return { ready: true, transactionHash: hash, message: "Storage account prepared." };
    },

    async getBalance(): Promise<BalanceResult> {
      const walletBalance = await synapse.payments.walletBalance();
      return { usdfc: String(walletBalance) };
    }
  };
}
