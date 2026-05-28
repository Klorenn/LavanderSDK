# Design: IndexBackend Abstraction + Critical Defects

**Date:** 2026-05-28  
**Scope:** `@fetcher-fil/core`, `@fetcher-fil/testkit`  
**Status:** Approved

---

## Problem

Four critical defects block real-world adoption of Fetcher v0.1.0:

1. **Local-only index** — `FetcherIndex` writes to `~/.fetcher/index.json`. Broken in serverless (Vercel, Lambda, Docker) and any environment where the filesystem is ephemeral or not shared.
2. **Text-only upload** — `storeFile` only accepts `content: string` via `TextEncoder`. Binary files (images, PDFs, ZIPs) are unsupported.
3. **Fabricated deal data** — `checkDeal` returns `expiryDate: Date.now() + 365 days`. `listDeals` returns data from the local index, not on-chain. Agents make decisions based on lies.
4. **Silent fallbacks that deceive agents** — `getProof` returns `proof: "unavailable"` instead of an error. `estimateCost` returns a hardcoded `$0.02/GB/month` price with no indication it is not live data.

---

## Decision: IndexBackend Interface (Option B)

Extract the index layer behind a `IndexBackend` interface — identical pattern to the existing `StorageBackend`. Three implementations ship:

- `FileIndexBackend` — current behavior, default for dev
- `MemoryIndexBackend` — in-memory, used by `testkit` and unit tests
- `FilecoinIndexBackend` — index JSON stored as a Filecoin file, portable across all environments

This mirrors the established architecture boundary and eliminates the need for any external infrastructure dependency.

---

## Architecture

```
createFetcherAgent(config)
  ├── config.backend: StorageBackend   (unchanged)
  └── config.indexBackend: IndexBackend (new — replaces indexDir)
        ├── FileIndexBackend    (~/.fetcher/index.json)
        ├── MemoryIndexBackend  (RAM, testkit)
        └── FilecoinIndexBackend (Filecoin CID, prod/serverless)
```

`FetcherConfig` changes:

```typescript
type FetcherConfig = {
  backend?: StorageBackend;
  indexBackend?: IndexBackend; // new: explicit backend
  indexDir?: string;           // kept: auto-creates FileIndexBackend if indexBackend not set
  spendingPolicy?: Partial<SpendingPolicy>;
  network?: FilecoinNetwork;
  privateKey?: `0x${string}`;
  source?: string;
};
```

Resolution order: `indexBackend` > `indexDir` > default `FileIndexBackend` at `~/.fetcher`.

---

## IndexBackend Interface

```typescript
// packages/core/src/indexBackend.ts

export interface IndexBackend {
  // Files
  addFile(file: IndexedFile): Promise<void>;
  listFiles(options: ListFilesOptions): Promise<ListFilesPage>;
  removeFile(cid: string): Promise<boolean>;

  // Memories
  storeMemory(memory: IndexedMemory): Promise<{ previousCid?: string; version: number }>;
  retrieveMemory(agentId: string, memoryKey: string): Promise<IndexedMemory | null>;
  listMemories(agentId: string, limit?: number): Promise<MemoriesPage>;
  deleteMemory(agentId: string, memoryKey: string): Promise<boolean>;

  // Stats
  getStats(agentId?: string): Promise<IndexStats>;
}
```

### FileIndexBackend

Current `FetcherIndex` class renamed and moved to `packages/core/src/backends/fileIndexBackend.ts`. Internal behavior unchanged. TTL expiry logic stays here.

### MemoryIndexBackend

Identical interface, pure in-memory `Map`. No I/O. Exported from `@fetcher-fil/testkit` alongside `FakeStorageBackend`. Unit tests switch from constructing `FetcherIndex` manually to using `MemoryIndexBackend`.

### FilecoinIndexBackend

```typescript
// packages/core/src/backends/filecoinIndexBackend.ts

class FilecoinIndexBackend implements IndexBackend {
  private backend: StorageBackend;
  private indexCid: string | null;
  private cache: IndexData | null;
  private refPath: string; // ~/.fetcher/index-ref or FETCHER_INDEX_CID env var
}
```

**Read path:** On first access, load CID from `refPath`. Download index JSON from Filecoin via `backend.download()`. Cache in memory for the process lifetime.

**Write path:** After any mutation, serialize updated index to JSON, upload via `backend.upload()`, store new CID in `refPath`. One upload per write.

**Bootstrap:** If no CID exists yet (first run), starts with empty index. First write creates the initial Filecoin record.

**CID ref storage priority:** `FETCHER_INDEX_CID` env var → `~/.fetcher/index-ref` file. Env var wins — makes it deployable in serverless via environment configuration.

---

## Binary Upload

### Input type change

```typescript
type StoreFileInput = {
  content?: string;            // text / JSON — existing behavior
  data?: Uint8Array | Buffer;  // binary
  filename: string;
  mimeType?: string;           // optional — auto-detected from filename if absent
  tags?: string[];
  copies?: number;
  confirmPaidOperation?: boolean;
};
```

Exactly one of `content` or `data` must be present. Both present or neither present → `FetcherError("INVALID_INPUT", ...)`.

### MIME detection

Inline lookup table in `defaults.ts` — no external dependency:

```typescript
const MIME_BY_EXT: Record<string, string> = {
  txt: "text/plain", json: "application/json", md: "text/markdown",
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg",
  jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
  svg: "image/svg+xml", mp4: "video/mp4", mp3: "audio/mpeg",
  zip: "application/zip", tar: "application/x-tar",
  csv: "text/csv", html: "text/html", xml: "application/xml",
  wasm: "application/wasm", bin: "application/octet-stream",
};
```

Fallback: `"application/octet-stream"`.

---

## Real Deal Data

### `checkDeal`

Remove fake `expiryDate`. Call `backend.verify()` for real PDP evidence. If `StorageBackend` exposes `getDealExpiry?(cid: string): Promise<string | null>` (optional method), use it. Otherwise `expiryDate: null` with `expirySource: "unavailable"`.

```typescript
// StorageBackend — new optional method
getDealExpiry?(cid: string): Promise<string | null>;
```

### `listDeals`

For each CID in the local index: return stored metadata + call `backend.verify()` lazily for the first 20 entries. Entries beyond 20 get `status: "unverified"` without a network call. Add `verified: boolean` field to each deal in the result.

This is honest: agents see what is actually known vs what has been checked.

---

## Silent Fallback Fixes

### `getProof`

```typescript
// Before
if (backend.getProof) { return backend.getProof(parsed); }
return { proof: "unavailable", ... }; // ← lies

// After
if (!backend.getProof) {
  throw new FetcherError(
    "NOT_SUPPORTED",
    "getProof is not supported by the configured storage backend."
  );
}
return backend.getProof(parsed);
```

### `estimateCost`

Add `priceSource` field to result:

```typescript
type EstimateCostResult = {
  // ... existing fields ...
  priceSource: "live" | "estimated";
  priceAsOf: string; // ISO timestamp
};
```

Attempt to call `backend.getPricing?.()` (new optional `StorageBackend` method). If available and succeeds → `priceSource: "live"`. If unavailable or throws → use hardcoded `0.02`, set `priceSource: "estimated"`, log warning via `console.warn`.

---

## File Locations

```
packages/core/src/
  indexBackend.ts              ← new: IndexBackend interface + shared types
  backends/
    fileIndexBackend.ts        ← renamed from indexStore.ts
    filecoinIndexBackend.ts    ← new
  defaults.ts                  ← add MIME_BY_EXT table
  agent.ts                     ← update to use IndexBackend, fix binary/deals/getProof/estimateCost
  types.ts                     ← update StoreFileInput, EstimateCostResult, add getDealExpiry/getPricing

packages/testkit/src/
  memoryIndexBackend.ts        ← new: replaces inline index logic in tests
  index.ts                     ← export MemoryIndexBackend
```

---

## Breaking Changes

None for existing consumers. `indexDir` still works. `storeFile` with `content: string` still works. All additions are additive.

---

## Tests

Each `IndexBackend` implementation gets its own test file. All existing agent tests switch to `MemoryIndexBackend` — no filesystem I/O in unit tests.

`FilecoinIndexBackend` tests use `FakeStorageBackend` from testkit — no real network.

---

## Out of Scope

- Batch operations (`store_batch`, `retrieve_batch`) — v0.2.0
- Memory search — v0.3.0
- New adapters (OpenAI, Vercel AI SDK) — v0.2.0
- Encryption — v0.3.0
- CLI — v0.2.0
