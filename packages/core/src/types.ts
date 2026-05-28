export type FilecoinNetwork = "calibration" | "mainnet";

export type SpendingPolicy = {
  allowPaidOperations: boolean;
  maxStorageBytesPerCall: number;
  requireConfirmation: boolean;
};

export type FilecoinAgentConfig = {
  network?: FilecoinNetwork;
  privateKey?: `0x${string}`;
  source?: string;
  spendingPolicy?: Partial<SpendingPolicy>;
  backend?: StorageBackend;
};

export type StoreTextInput = {
  text: string;
  metadata?: Record<string, string>;
  copies?: number;
  confirmPaidOperation?: boolean;
};

export type StoreFileInput = {
  path: string;
  metadata?: Record<string, string>;
  copies?: number;
  confirmPaidOperation?: boolean;
};

export type RetrieveInput = {
  pieceCid: string;
  outputPath?: string;
  withCDN?: boolean;
};

export type VerifyInput = {
  pieceCid: string;
};

export type PrepareStorageInput = {
  bytes: number;
  months?: number;
  confirmPaidOperation?: boolean;
};

export type StoreResult = {
  pieceCid: string;
  size: number;
  complete: boolean;
  copies: Array<{ providerId?: number; status: string }>;
  failedAttempts: Array<{ providerId?: number; reason: string }>;
};

export type RetrieveResult = {
  pieceCid: string;
  size: number;
  bytes?: Uint8Array;
  outputPath?: string;
};

export type VerifyResult = {
  pieceCid: string;
  verified: boolean;
  status: "stored" | "pending" | "missing" | "unknown";
  copies: number;
  checkedAt: string;
  evidence: Array<{ type: "pdp" | "dataset" | "provider"; status: string; detail: string }>;
};

export type PrepareStorageResult = {
  ready: boolean;
  requiredDeposit?: string;
  transactionHash?: string;
  message: string;
};

export type BalanceResult = {
  fil?: string;
  usdfc?: string;
  runwayDays?: number;
};

export type BackendUploadOptions = {
  metadata?: Record<string, string>;
  copies?: number;
};

export interface StorageBackend {
  upload(data: Uint8Array, options?: BackendUploadOptions): Promise<StoreResult>;
  download(input: { pieceCid: string; withCDN?: boolean }): Promise<Uint8Array>;
  verify(input: VerifyInput): Promise<VerifyResult>;
  prepareStorage(input: PrepareStorageInput): Promise<PrepareStorageResult>;
  getBalance(): Promise<BalanceResult>;
}

export interface FilecoinAgentStorage {
  storeText(input: StoreTextInput): Promise<StoreResult>;
  storeFile(input: StoreFileInput): Promise<StoreResult>;
  retrieve(input: RetrieveInput): Promise<RetrieveResult>;
  verify(input: VerifyInput): Promise<VerifyResult>;
  prepareStorage(input: PrepareStorageInput): Promise<PrepareStorageResult>;
  getBalance(): Promise<BalanceResult>;
}
