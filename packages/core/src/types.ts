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
  indexBackend?: import("./indexBackend.js").IndexBackend;
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
  url: string;
  size: number;
  timestamp: string;
  complete: boolean;
  filename: string;
  dealStatus: "active" | "pending" | "failed";
  provider: string;
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
  costUsdfc: string;
  balanceBefore: string;
  allowanceSet: boolean;
  message: string;
  shortfall?: string;
  actionNeeded?: string;
  transactionHash?: string;
};

export type BalanceResult = {
  balanceUsdfc: string;
  balanceFil: string;
  pendingPayments: string;
  availableUsdfc: string;
};

export type ListFilesResult = {
  files: Array<{
    cid: string;
    filename: string;
    size: number;
    timestamp: string;
    tags: string[];
    dealStatus: string;
    url: string;
  }>;
  total: number;
  hasMore: boolean;
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
  version: number;
};

export type RetrieveMemoryResult = {
  data: Record<string, unknown> | null;
  cid?: string;
  timestamp?: string;
  ageDays?: number;
  version?: number;
  found: boolean;
};

export type UpdateMemoryResult = {
  cid: string;
  previousCid: string;
  memoryKey: string;
  updatedFields: string[];
};

export type ListMemoriesInput = {
  agentId: string;
  limit?: number;
};

export type DeleteMemoryInput = {
  agentId: string;
  memoryKey: string;
  confirm: true;
};

export type ListMemoriesResult = {
  memories: Array<{
    memoryKey: string;
    cid: string;
    timestamp: string;
    size: number;
  }>;
  total: number;
};

export type DeleteMemoryResult = {
  deleted: boolean;
  agentId: string;
  memoryKey: string;
};

export type GetStorageStatsInput = {
  agentId?: string;
};

export type StorageStatsResult = {
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeGb: number;
  totalMemories: number;
  activeDeals: number;
  expiredDeals: number;
  totalCostUsdfc: string;
  oldestFile?: string;
  newestFile?: string;
  tagsUsed: string[];
};

export type EstimateCostInput = {
  sizeBytes: number;
  copies?: number;
  durationDays?: number;
};

export type EstimateCostResult = {
  estimatedCostUsdfc: string;
  costPerGbMonth: string;
  currentBalance: string;
  canAfford: boolean;
  breakdown: {
    storageCost: string;
    retrievalCost: string;
    providerFee: string;
  };
};

export type ListDealsInput = {
  status?: "active" | "expired" | "all";
  limit?: number;
};

export type ListDealsResult = {
  deals: Array<{
    cid: string;
    filename: string;
    providers: string[];
    expiry: string;
    costUsdfc: string;
    status: string;
  }>;
  total: number;
};

export type GetProofInput = {
  cid: string;
};

export type ProofResult = {
  proof: string;
  proofType: string;
  verifiedAt: string;
  provider: string;
  blockNumber?: number;
};

export type DealResult = {
  dealActive: boolean;
  providers: string[];
  expiryDate: string;
  redundancy: number;
  lastProofTimestamp: string;
  nextProofDue: string;
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
  getProof?(input: GetProofInput): Promise<ProofResult>;
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
  listMemories(input: ListMemoriesInput): Promise<ListMemoriesResult>;
  deleteMemory(input: DeleteMemoryInput): Promise<DeleteMemoryResult>;
  getStorageStats(input?: GetStorageStatsInput): Promise<StorageStatsResult>;
  estimateCost(input: EstimateCostInput): Promise<EstimateCostResult>;
  listDeals(input?: ListDealsInput): Promise<ListDealsResult>;
  getProof(input: GetProofInput): Promise<ProofResult>;
  checkDeal(input: VerifyInput): Promise<DealResult>;
}
