export type FilecoinNetwork = "calibration" | "mainnet";

export type SpendingPolicy = {
  allowPaidOperations: boolean;
  maxStorageBytesPerCall: number;
  requireConfirmation: boolean;
};

export type FetcherConfig = {
  network?: FilecoinNetwork;
  privateKey?: `0x${string}`;
  source?: string;
  spendingPolicy?: Partial<SpendingPolicy>;
  backend?: StorageBackend;
  indexDir?: string;
};

export type StoreFileInput = {
  content: string;
  filename: string;
  mimeType?: string;
  tags?: string[];
  copies?: number;
  confirmPaidOperation?: boolean;
};

export type RetrieveInput = {
  cid: string;
  outputPath?: string;
  withCDN?: boolean;
  encoding?: "text" | "base64" | "json";
};

export type VerifyInput = {
  cid: string;
  checkGateways?: boolean;
};

export type PrepareStorageInput = {
  bytes: number;
  months?: number;
  confirmPaidOperation?: boolean;
};

export type ListFilesInput = {
  tag?: string;
  limit?: number;
  before?: string;
};

export type DeleteFileInput = {
  cid: string;
  confirm: true;
};

export type StoreMemoryInput = {
  agentId: string;
  memoryKey: string;
  data: Record<string, unknown>;
  ttlDays?: number;
  overwrite?: boolean;
  confirmPaidOperation?: boolean;
};

export type RetrieveMemoryInput = {
  agentId: string;
  memoryKey: string;
  fallback?: Record<string, unknown>;
};

export type UpdateMemoryInput = {
  agentId: string;
  memoryKey: string;
  patch: Record<string, unknown>;
  confirmPaidOperation?: boolean;
};

export type StoreResult = {
  cid: string;
  size: number;
  complete: boolean;
  filename: string;
  copies: Array<{ providerId?: number; status: string }>;
  failedAttempts: Array<{ providerId?: number; reason: string }>;
};

export type RetrieveResult = {
  cid: string;
  size: number;
  bytes?: Uint8Array;
  outputPath?: string;
  mimeType?: string;
  latencyMs?: number;
};

export type VerifyResult = {
  cid: string;
  verified: boolean;
  accessible?: boolean;
  status: "stored" | "pending" | "missing" | "unknown";
  copies: number;
  checkedAt: string;
  gatewaysChecked?: number;
  latencyMs?: number;
  integrity: boolean;
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

export type ListFilesResult = {
  files: Array<{
    cid: string;
    filename: string;
    size: number;
    timestamp: string;
    tags: string[];
  }>;
  total: number;
};

export type DeleteFileResult = {
  removedFromIndex: boolean;
  cid: string;
  note: string;
};

export type StoreMemoryResult = {
  cid: string;
  memoryKey: string;
  agentId: string;
  timestamp: string;
  previousCid?: string;
};

export type RetrieveMemoryResult = {
  data: Record<string, unknown> | null;
  cid?: string;
  timestamp?: string;
  ageDays?: number;
  found: boolean;
};

export type UpdateMemoryResult = {
  cid: string;
  previousCid: string;
  memoryKey: string;
  updatedFields: string[];
};

export type BackendUploadOptions = {
  metadata?: Record<string, string>;
  copies?: number;
};

export interface StorageBackend {
  upload(data: Uint8Array, options?: BackendUploadOptions): Promise<StoreResult>;
  download(input: { cid: string; withCDN?: boolean }): Promise<Uint8Array>;
  verify(input: VerifyInput): Promise<VerifyResult>;
  prepareStorage(input: PrepareStorageInput): Promise<PrepareStorageResult>;
  getBalance(): Promise<BalanceResult>;
}

export interface FetcherStorage {
  storeFile(input: StoreFileInput): Promise<StoreResult>;
  retrieve(input: RetrieveInput): Promise<RetrieveResult>;
  verify(input: VerifyInput): Promise<VerifyResult>;
  prepareStorage(input: PrepareStorageInput): Promise<PrepareStorageResult>;
  getBalance(): Promise<BalanceResult>;
  listFiles(input: ListFilesInput): Promise<ListFilesResult>;
  deleteFile(input: DeleteFileInput): Promise<DeleteFileResult>;
  storeMemory(input: StoreMemoryInput): Promise<StoreMemoryResult>;
  retrieveMemory(input: RetrieveMemoryInput): Promise<RetrieveMemoryResult>;
  updateMemory(input: UpdateMemoryInput): Promise<UpdateMemoryResult>;
}
