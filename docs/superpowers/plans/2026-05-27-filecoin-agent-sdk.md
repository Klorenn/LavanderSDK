# Filecoin Agent SDK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript monorepo that exposes Filecoin Onchain Cloud storage as agent-native core APIs, MCP tools, LangChain tools, and LlamaIndex tools.

**Architecture:** The adapters depend only on `@filecoin-agent/core`; they never call Synapse directly. `@filecoin-agent/core` owns validation, spending policy, normalized errors, filesystem boundaries, and the production Synapse backend seam. `@filecoin-agent/testkit` provides fake backends so the default test suite never needs a wallet.

**Tech Stack:** npm workspaces, TypeScript, Vitest, Zod, Filecoin Synapse SDK, MCP TypeScript SDK, LangChain JS tools, LlamaIndex TS tools.

---

## Scope and work-unit strategy

This is intentionally split into reviewable work units. Each task should be implemented, tested, and committed before moving on.

| Slice | Tasks | Review outcome |
|---|---:|---|
| Monorepo foundation | 1 | Existing landing survives under `apps/landing`. |
| Core SDK | 2-4 | Fake-backed core API works without Filecoin credentials. |
| MCP | 5 | MCP stdio server exposes the six MVP tools. |
| Synapse backend | 6 | Real Filecoin integration is opt-in and isolated. |
| Framework adapters | 7-8 | LangChain and LlamaIndex use the same core semantics. |
| Docs/examples | 9-10 | New dev can run the happy path and understand safety limits. |

Review workload forecast: **High** if implemented as one PR. Use work-unit commits; if publishing to a hosted repo later, prefer chained PR slices matching the table above.

## File structure map

```txt
package.json                         # npm workspace root scripts
package-lock.json                    # regenerated after workspace dependencies change
tsconfig.base.json                   # shared TS compiler base
.gitignore                           # repo-level ignores

apps/landing/                        # current React/Vite landing moved from root
  package.json
  index.html
  postcss.config.js
  tailwind.config.js
  tsconfig*.json
  vite.config.ts
  public/*
  src/*

packages/core/
  package.json
  tsconfig.json
  vitest.config.ts
  src/index.ts
  src/types.ts
  src/errors.ts
  src/schemas.ts
  src/defaults.ts
  src/agent.ts
  src/synapseBackend.ts
  src/__tests__/agent.test.ts
  src/__tests__/policy.test.ts
  src/__tests__/schemas.test.ts

packages/testkit/
  package.json
  tsconfig.json
  src/index.ts
  src/fakeStorageBackend.ts
  src/fixtures.ts
  src/__tests__/fakeStorageBackend.test.ts

packages/mcp/
  package.json
  tsconfig.json
  vitest.config.ts
  src/index.ts
  src/server.ts
  src/cli.ts
  src/toolResult.ts
  src/__tests__/server.test.ts

packages/langchain/
  package.json
  tsconfig.json
  vitest.config.ts
  src/index.ts
  src/tools.ts
  src/__tests__/tools.test.ts

packages/llamaindex/
  package.json
  tsconfig.json
  vitest.config.ts
  src/index.ts
  src/tools.ts
  src/__tests__/tools.test.ts

examples/mcp-claude/README.md
examples/langchain-agent/package.json
examples/langchain-agent/src/index.ts
examples/llamaindex-agent/package.json
examples/llamaindex-agent/src/index.ts

docs/architecture.md
docs/quickstart.md
docs/security.md
docs/superpowers/specs/2026-05-27-filecoin-agent-sdk-design.md
docs/superpowers/plans/2026-05-27-filecoin-agent-sdk.md
```

---

## Task 1: Convert current project to npm monorepo

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `apps/landing/package.json`
- Move: `index.html` → `apps/landing/index.html`
- Move: `src/` → `apps/landing/src/`
- Move: `public/` → `apps/landing/public/`
- Move: `postcss.config.js` → `apps/landing/postcss.config.js`
- Move: `tailwind.config.js` → `apps/landing/tailwind.config.js`
- Move: `tsconfig.json` → `apps/landing/tsconfig.json`
- Move: `tsconfig.app.json` → `apps/landing/tsconfig.app.json`
- Move: `tsconfig.node.json` → `apps/landing/tsconfig.node.json`
- Move: `vite.config.ts` → `apps/landing/vite.config.ts`

- [ ] **Step 1: Initialize local git repo if missing**

Run:

```bash
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || git init
```

Expected: command exits 0. If it initialized a repo, `git status --short` shows the existing project files as untracked.

- [ ] **Step 2: Move current landing app into `apps/landing`**

Run:

```bash
mkdir -p apps/landing
mv index.html postcss.config.js tailwind.config.js tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts apps/landing/
mv src public apps/landing/
```

Expected: `apps/landing/src/App.tsx` exists and root no longer contains `src/App.tsx`.

- [ ] **Step 3: Replace root `package.json` with workspace root**

Write `package.json`:

```json
{
  "name": "filecoin-agent-sdk-monorepo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*",
    "examples/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "test:watch": "npm run test:watch --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "dev": "npm --workspace apps/landing run dev",
    "preview": "npm --workspace apps/landing run preview"
  },
  "devDependencies": {
    "@types/node": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 4: Create landing package manifest**

Write `apps/landing/package.json`:

```json
{
  "name": "@filecoin-agent/landing",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@fontsource/instrument-serif": "latest",
    "@fontsource/inter": "latest",
    "@fontsource/jetbrains-mono": "latest",
    "@radix-ui/react-slot": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "framer-motion": "latest",
    "lucide-react": "latest",
    "react": "latest",
    "react-dom": "latest",
    "tailwind-merge": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@vitejs/plugin-react": "latest",
    "autoprefixer": "latest",
    "jsdom": "latest",
    "postcss": "latest",
    "tailwindcss": "^3.4.17",
    "vite": "latest"
  }
}
```

- [ ] **Step 5: Create shared TypeScript base config**

Write `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

- [ ] **Step 6: Create repo ignore rules**

Write `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
.DS_Store
```

- [ ] **Step 7: Install workspace dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is regenerated with workspace entries.

- [ ] **Step 8: Verify landing still builds and tests**

Run:

```bash
npm --workspace apps/landing test
npm --workspace apps/landing run build
```

Expected: Vitest passes and Vite emits `apps/landing/dist`.

- [ ] **Step 9: Commit monorepo foundation**

Run:

```bash
git add -A
git commit -m "chore: convert project to monorepo"
```

Expected: one commit with only workspace restructure and landing preservation.

---

## Task 2: Create core package contracts, schemas, and errors

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/errors.ts`
- Create: `packages/core/src/defaults.ts`
- Create: `packages/core/src/schemas.ts`
- Create: `packages/core/src/__tests__/schemas.test.ts`

- [ ] **Step 1: Write failing schema tests**

Write `packages/core/src/__tests__/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { storeTextInputSchema, verifyInputSchema } from "../schemas.js";

const validPieceCid = "bafkzcibaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("core schemas", () => {
  it("accepts a safe storeText input", () => {
    const parsed = storeTextInputSchema.parse({
      text: "A report long enough to pass the SDK layer. Filecoin upload minimums are enforced by the backend.",
      metadata: { app: "agent" },
      copies: 2,
      confirmPaidOperation: true
    });

    expect(parsed.copies).toBe(2);
  });

  it("rejects empty text", () => {
    expect(() => storeTextInputSchema.parse({ text: "" })).toThrow();
  });

  it("rejects non PieceCID-shaped values", () => {
    expect(() => verifyInputSchema.parse({ pieceCid: "not-a-piece-cid" })).toThrow();
  });

  it("accepts PieceCID-shaped values", () => {
    expect(verifyInputSchema.parse({ pieceCid: validPieceCid }).pieceCid).toBe(validPieceCid);
  });
});
```

- [ ] **Step 2: Run schema tests and confirm failure**

Run:

```bash
npm --workspace packages/core test -- schemas.test.ts
```

Expected: command fails because `packages/core` does not exist yet.

- [ ] **Step 3: Create core package manifest**

Write `packages/core/package.json`:

```json
{
  "name": "@filecoin-agent/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@filoz/synapse-sdk": "latest",
    "viem": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 4: Create core TypeScript and Vitest config**

Write `packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__tests__/**"]
}
```

Write `packages/core/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
```

- [ ] **Step 5: Define shared types**

Write `packages/core/src/types.ts`:

```ts
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
```

- [ ] **Step 6: Define normalized errors**

Write `packages/core/src/errors.ts`:

```ts
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
```

- [ ] **Step 7: Define defaults**

Write `packages/core/src/defaults.ts`:

```ts
import type { SpendingPolicy } from "./types.js";

export const DEFAULT_SOURCE = "filecoin-agent-sdk";
export const DEFAULT_NETWORK = "calibration";

export const DEFAULT_SPENDING_POLICY: SpendingPolicy = {
  allowPaidOperations: false,
  maxStorageBytesPerCall: 10 * 1024 * 1024,
  requireConfirmation: true
};
```

- [ ] **Step 8: Define Zod schemas**

Write `packages/core/src/schemas.ts`:

```ts
import { z } from "zod";

const pieceCidSchema = z
  .string()
  .regex(/^bafkzcib[a-z2-7]{50,70}$/i, "Expected a Filecoin PieceCID beginning with bafkzcib");

const metadataSchema = z
  .record(z.string().min(1).max(32), z.string().max(128))
  .refine((value) => Object.keys(value).length <= 5, "Piece metadata supports at most 5 keys")
  .optional();

export const storeTextInputSchema = z.object({
  text: z.string().min(1),
  metadata: metadataSchema,
  copies: z.number().int().min(1).max(10).optional(),
  confirmPaidOperation: z.boolean().optional()
});

export const storeFileInputSchema = z.object({
  path: z.string().min(1),
  metadata: metadataSchema,
  copies: z.number().int().min(1).max(10).optional(),
  confirmPaidOperation: z.boolean().optional()
});

export const retrieveInputSchema = z.object({
  pieceCid: pieceCidSchema,
  outputPath: z.string().min(1).optional(),
  withCDN: z.boolean().optional()
});

export const verifyInputSchema = z.object({
  pieceCid: pieceCidSchema
});

export const prepareStorageInputSchema = z.object({
  bytes: z.number().int().positive(),
  months: z.number().int().min(1).max(60).optional(),
  confirmPaidOperation: z.boolean().optional()
});
```

- [ ] **Step 9: Export public API**

Write `packages/core/src/index.ts`:

```ts
export * from "./types.js";
export * from "./errors.js";
export * from "./defaults.js";
export * from "./schemas.js";
```

- [ ] **Step 10: Install and run schema tests**

Run:

```bash
npm install
npm --workspace packages/core test -- schemas.test.ts
```

Expected: schema tests pass.

- [ ] **Step 11: Build core package**

Run:

```bash
npm --workspace packages/core run build
```

Expected: `packages/core/dist/index.js` exists.

- [ ] **Step 12: Commit core contracts**

Run:

```bash
git add -A
git commit -m "feat(core): add storage contracts and schemas"
```

Expected: commit contains only core package contracts, schemas, errors, and tests.

---

## Task 3: Implement fake-backed core agent facade

**Files:**
- Create: `packages/core/src/agent.ts`
- Modify: `packages/core/src/index.ts`
- Create: `packages/core/src/__tests__/agent.test.ts`
- Create: `packages/core/src/__tests__/policy.test.ts`

- [ ] **Step 1: Write failing agent facade tests**

Write `packages/core/src/__tests__/agent.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createFilecoinAgent } from "../agent.js";
import type { StorageBackend, StoreResult, VerifyResult } from "../types.js";

const pieceCid = "bafkzcibbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

function createBackend(): StorageBackend {
  const stored = new Map<string, Uint8Array>();

  return {
    async upload(data: Uint8Array): Promise<StoreResult> {
      stored.set(pieceCid, data);
      return {
        pieceCid,
        size: data.byteLength,
        complete: true,
        copies: [{ providerId: 1, status: "stored" }, { providerId: 2, status: "stored" }],
        failedAttempts: []
      };
    },
    async download() {
      return stored.get(pieceCid) ?? new Uint8Array();
    },
    async verify(): Promise<VerifyResult> {
      return {
        pieceCid,
        verified: stored.has(pieceCid),
        status: stored.has(pieceCid) ? "stored" : "missing",
        copies: stored.has(pieceCid) ? 2 : 0,
        checkedAt: "2026-05-27T00:00:00.000Z",
        evidence: [{ type: "dataset", status: "stored", detail: "fake backend has piece" }]
      };
    },
    async prepareStorage() {
      return { ready: true, message: "fake backend ready" };
    },
    async getBalance() {
      return { fil: "1", usdfc: "1", runwayDays: 30 };
    }
  };
}

describe("createFilecoinAgent", () => {
  it("stores text through the configured backend", async () => {
    const agent = createFilecoinAgent({
      backend: createBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    const result = await agent.storeText({ text: "hello filecoin" });

    expect(result.pieceCid).toBe(pieceCid);
    expect(result.size).toBe(new TextEncoder().encode("hello filecoin").byteLength);
    expect(result.complete).toBe(true);
  });

  it("retrieves bytes by PieceCID", async () => {
    const agent = createFilecoinAgent({
      backend: createBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    await agent.storeText({ text: "retrievable" });
    const result = await agent.retrieve({ pieceCid });

    expect(new TextDecoder().decode(result.bytes)).toBe("retrievable");
  });

  it("verifies stored data", async () => {
    const agent = createFilecoinAgent({
      backend: createBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    await agent.storeText({ text: "verify me" });
    const result = await agent.verify({ pieceCid });

    expect(result.verified).toBe(true);
    expect(result.status).toBe("stored");
  });
});
```

Write `packages/core/src/__tests__/policy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createFilecoinAgent } from "../agent.js";
import { FilecoinAgentError } from "../errors.js";
import type { StorageBackend } from "../types.js";

const backend: StorageBackend = {
  async upload() {
    throw new Error("backend should not be called");
  },
  async download() {
    return new Uint8Array();
  },
  async verify(input) {
    return { ...input, verified: false, status: "missing", copies: 0, checkedAt: new Date(0).toISOString(), evidence: [] };
  },
  async prepareStorage() {
    return { ready: true, message: "ready" };
  },
  async getBalance() {
    return {};
  }
};

describe("spending policy", () => {
  it("blocks paid store operations by default", async () => {
    const agent = createFilecoinAgent({ backend });

    await expect(agent.storeText({ text: "blocked" })).rejects.toMatchObject({
      code: "SPENDING_POLICY_BLOCKED"
    });
  });

  it("requires explicit confirmation when configured", async () => {
    const agent = createFilecoinAgent({
      backend,
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: true }
    });

    await expect(agent.storeText({ text: "blocked" })).rejects.toBeInstanceOf(FilecoinAgentError);
  });
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
npm --workspace packages/core test -- agent.test.ts policy.test.ts
```

Expected: tests fail because `createFilecoinAgent` is not exported.

- [ ] **Step 3: Implement agent facade**

Write `packages/core/src/agent.ts`:

```ts
import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";
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
```

Modify `packages/core/src/index.ts`:

```ts
export * from "./types.js";
export * from "./errors.js";
export * from "./defaults.js";
export * from "./schemas.js";
export * from "./agent.js";
```

- [ ] **Step 4: Run core tests**

Run:

```bash
npm --workspace packages/core test
```

Expected: all core tests pass.

- [ ] **Step 5: Build core**

Run:

```bash
npm --workspace packages/core run build
```

Expected: TypeScript build succeeds.

- [ ] **Step 6: Commit core facade**

Run:

```bash
git add -A
git commit -m "feat(core): add fake-backed agent facade"
```

Expected: commit includes the agent facade and tests.

---

## Task 4: Extract reusable testkit package

**Files:**
- Create: `packages/testkit/package.json`
- Create: `packages/testkit/tsconfig.json`
- Create: `packages/testkit/src/index.ts`
- Create: `packages/testkit/src/fixtures.ts`
- Create: `packages/testkit/src/fakeStorageBackend.ts`
- Create: `packages/testkit/src/__tests__/fakeStorageBackend.test.ts`

- [ ] **Step 1: Write failing testkit test**

Write `packages/testkit/src/__tests__/fakeStorageBackend.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createFakeStorageBackend } from "../fakeStorageBackend.js";

const pieceCid = "bafkzcibcccccccccccccccccccccccccccccccccccccccccccccccccccc";

describe("createFakeStorageBackend", () => {
  it("stores, downloads, and verifies bytes", async () => {
    const backend = createFakeStorageBackend({ pieceCid });
    const data = new TextEncoder().encode("fake storage works");

    const stored = await backend.upload(data);
    const downloaded = await backend.download({ pieceCid: stored.pieceCid });
    const verified = await backend.verify({ pieceCid: stored.pieceCid });

    expect(stored.pieceCid).toBe(pieceCid);
    expect(new TextDecoder().decode(downloaded)).toBe("fake storage works");
    expect(verified).toMatchObject({ verified: true, status: "stored", copies: 2 });
  });
});
```

- [ ] **Step 2: Create testkit package manifest**

Write `packages/testkit/package.json`:

```json
{
  "name": "@filecoin-agent/testkit",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@filecoin-agent/core": "0.1.0"
  },
  "devDependencies": {
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

Write `packages/testkit/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__tests__/**"]
}
```

- [ ] **Step 3: Implement fixtures and fake backend**

Write `packages/testkit/src/fixtures.ts`:

```ts
export const TEST_PIECE_CID = "bafkzcibcccccccccccccccccccccccccccccccccccccccccccccccccccc";
export const SECOND_TEST_PIECE_CID = "bafkzcibdddddddddddddddddddddddddddddddddddddddddddddddddddd";
```

Write `packages/testkit/src/fakeStorageBackend.ts`:

```ts
import type { StorageBackend, StoreResult, VerifyResult } from "@filecoin-agent/core";
import { TEST_PIECE_CID } from "./fixtures.js";

export type FakeStorageBackendOptions = {
  pieceCid?: string;
  failUploads?: boolean;
  copyCount?: number;
};

export function createFakeStorageBackend(options: FakeStorageBackendOptions = {}): StorageBackend {
  const stored = new Map<string, Uint8Array>();
  const pieceCid = options.pieceCid ?? TEST_PIECE_CID;
  const copyCount = options.copyCount ?? 2;

  return {
    async upload(data: Uint8Array): Promise<StoreResult> {
      if (options.failUploads) {
        return {
          pieceCid,
          size: data.byteLength,
          complete: false,
          copies: [],
          failedAttempts: [{ providerId: 1, reason: "fake upload failure" }]
        };
      }

      stored.set(pieceCid, data);
      return {
        pieceCid,
        size: data.byteLength,
        complete: true,
        copies: Array.from({ length: copyCount }, (_, index) => ({ providerId: index + 1, status: "stored" })),
        failedAttempts: []
      };
    },

    async download(input) {
      return stored.get(input.pieceCid) ?? new Uint8Array();
    },

    async verify(input): Promise<VerifyResult> {
      const exists = stored.has(input.pieceCid);
      return {
        pieceCid: input.pieceCid,
        verified: exists,
        status: exists ? "stored" : "missing",
        copies: exists ? copyCount : 0,
        checkedAt: "2026-05-27T00:00:00.000Z",
        evidence: exists ? [{ type: "dataset", status: "stored", detail: "fake backend has piece" }] : []
      };
    },

    async prepareStorage() {
      return { ready: true, message: "fake backend ready" };
    },

    async getBalance() {
      return { fil: "1", usdfc: "1", runwayDays: 30 };
    }
  };
}
```

Write `packages/testkit/src/index.ts`:

```ts
export * from "./fixtures.js";
export * from "./fakeStorageBackend.js";
```

- [ ] **Step 4: Install and test testkit**

Run:

```bash
npm install
npm --workspace packages/testkit test
npm --workspace packages/testkit run build
```

Expected: fake backend test passes and package builds.

- [ ] **Step 5: Commit testkit**

Run:

```bash
git add -A
git commit -m "feat(testkit): add fake Filecoin storage backend"
```

Expected: commit includes reusable testkit only.

---

## Task 5: Add MCP stdio server over core

**Files:**
- Create: `packages/mcp/package.json`
- Create: `packages/mcp/tsconfig.json`
- Create: `packages/mcp/vitest.config.ts`
- Create: `packages/mcp/src/index.ts`
- Create: `packages/mcp/src/toolResult.ts`
- Create: `packages/mcp/src/server.ts`
- Create: `packages/mcp/src/cli.ts`
- Create: `packages/mcp/src/__tests__/server.test.ts`

- [ ] **Step 1: Write failing MCP server test**

Write `packages/mcp/src/__tests__/server.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createFilecoinMcpServer } from "../server.js";
import { createFakeStorageBackend } from "@filecoin-agent/testkit";

const pieceCid = "bafkzcibeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

describe("createFilecoinMcpServer", () => {
  it("creates an MCP server with Filecoin identity", () => {
    const server = createFilecoinMcpServer({
      backend: createFakeStorageBackend({ pieceCid }),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    expect(server).toBeTruthy();
  });
});
```

- [ ] **Step 2: Create MCP package manifest**

Write `packages/mcp/package.json`:

```json
{
  "name": "@filecoin-agent/mcp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "filecoin-agent-mcp": "dist/cli.js"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@filecoin-agent/core": "0.1.0",
    "@modelcontextprotocol/server": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@filecoin-agent/testkit": "0.1.0",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

Write `packages/mcp/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__tests__/**"]
}
```

Write `packages/mcp/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
```

- [ ] **Step 3: Implement MCP result formatter**

Write `packages/mcp/src/toolResult.ts`:

```ts
export function toMcpJsonResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}
```

- [ ] **Step 4: Implement MCP server and tools**

Write `packages/mcp/src/server.ts`:

```ts
import { McpServer } from "@modelcontextprotocol/server";
import {
  createFilecoinAgent,
  prepareStorageInputSchema,
  retrieveInputSchema,
  storeFileInputSchema,
  storeTextInputSchema,
  verifyInputSchema,
  type FilecoinAgentConfig
} from "@filecoin-agent/core";
import { toMcpJsonResult } from "./toolResult.js";

export function createFilecoinMcpServer(config: FilecoinAgentConfig) {
  const storage = createFilecoinAgent(config);
  const server = new McpServer({ name: "filecoin-agent", version: "0.1.0" });

  server.registerTool(
    "filecoin_store_text",
    {
      title: "Store text on Filecoin",
      description: "Store short text generated by an AI agent on Filecoin Onchain Cloud. This may spend storage funds when spending policy allows it.",
      inputSchema: storeTextInputSchema
    },
    async (input) => toMcpJsonResult(await storage.storeText(input))
  );

  server.registerTool(
    "filecoin_store_file",
    {
      title: "Store a local file on Filecoin",
      description: "Store a readable local file on Filecoin Onchain Cloud. Use only for paths the host process is allowed to read.",
      inputSchema: storeFileInputSchema
    },
    async (input) => toMcpJsonResult(await storage.storeFile(input))
  );

  server.registerTool(
    "filecoin_retrieve",
    {
      title: "Retrieve data from Filecoin",
      description: "Retrieve data by PieceCID. Prefer outputPath for large content so the agent does not print large byte arrays.",
      inputSchema: retrieveInputSchema
    },
    async (input) => {
      const result = await storage.retrieve(input);
      return toMcpJsonResult({ ...result, bytes: result.bytes ? `[${result.bytes.byteLength} bytes]` : undefined });
    }
  );

  server.registerTool(
    "filecoin_verify",
    {
      title: "Verify Filecoin storage",
      description: "Verify whether a PieceCID appears stored according to Filecoin Onchain Cloud/PDP-oriented evidence exposed by the backend.",
      inputSchema: verifyInputSchema
    },
    async (input) => toMcpJsonResult(await storage.verify(input))
  );

  server.registerTool(
    "filecoin_prepare_storage",
    {
      title: "Prepare Filecoin storage balance",
      description: "Estimate and prepare storage balance/approval for upcoming uploads. This may create a transaction when configured with a real backend.",
      inputSchema: prepareStorageInputSchema
    },
    async (input) => toMcpJsonResult(await storage.prepareStorage(input))
  );

  server.registerTool(
    "filecoin_balance",
    {
      title: "Check Filecoin storage balance",
      description: "Check FIL/USDFC balance and storage runway when the backend supports it.",
      inputSchema: undefined
    },
    async () => toMcpJsonResult(await storage.getBalance())
  );

  return server;
}
```

- [ ] **Step 5: Implement CLI entrypoint**

Write `packages/mcp/src/cli.ts`:

```ts
#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createFilecoinMcpServer } from "./server.js";
import { createSynapseBackend } from "@filecoin-agent/core";

const privateKey = process.env.FILECOIN_PRIVATE_KEY as `0x${string}` | undefined;
const network = process.env.FILECOIN_NETWORK === "mainnet" ? "mainnet" : "calibration";

if (!privateKey) {
  throw new Error("FILECOIN_PRIVATE_KEY is required for the production MCP server");
}

const server = createFilecoinMcpServer({
  privateKey,
  network,
  backend: await createSynapseBackend({ privateKey, network }),
  spendingPolicy: {
    allowPaidOperations: process.env.FILECOIN_AGENT_ALLOW_PAID === "true",
    requireConfirmation: true
  }
});

await server.connect(new StdioServerTransport());
```

This step will not build until Task 6 exports `createSynapseBackend`. Keep the failing build visible; do not hide it with dynamic `any` imports.

- [ ] **Step 6: Export MCP API**

Write `packages/mcp/src/index.ts`:

```ts
export * from "./server.js";
export * from "./toolResult.js";
```

- [ ] **Step 7: Run MCP tests**

Run:

```bash
npm install
npm --workspace packages/mcp test
```

Expected: server creation test passes.

- [ ] **Step 8: Commit MCP package before production CLI build is wired**

Run:

```bash
git add -A
git commit -m "feat(mcp): add Filecoin storage tools"
```

Expected: commit contains MCP server implementation and tests. If TypeScript build fails only because `createSynapseBackend` is not implemented yet, record that in the commit body with `git commit --amend` only if the team requires build-green commits; otherwise implement Task 6 before committing Task 5.

---

## Task 6: Add production Synapse backend behind core seam

**Files:**
- Create: `packages/core/src/synapseBackend.ts`
- Modify: `packages/core/src/index.ts`
- Create: `packages/core/src/__tests__/synapseBackend.test.ts`
- Modify: `packages/mcp/src/cli.ts` if imports need adjustment after package install

- [ ] **Step 1: Write non-network Synapse backend tests**

Write `packages/core/src/__tests__/synapseBackend.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { FilecoinAgentError } from "../errors.js";
import { createSynapseBackend } from "../synapseBackend.js";

describe("createSynapseBackend", () => {
  it("requires a private key", async () => {
    await expect(createSynapseBackend({ network: "calibration" })).rejects.toBeInstanceOf(FilecoinAgentError);
  });

  it("accepts a 0x private key-shaped value without logging it", async () => {
    const backendPromise = createSynapseBackend({
      network: "calibration",
      privateKey: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    });

    await expect(backendPromise).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement Synapse backend factory**

Write `packages/core/src/synapseBackend.ts`:

```ts
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
          ? result.copies.map((copy: { providerId?: bigint | number; status?: string }) => ({
              providerId: copy.providerId === undefined ? undefined : Number(copy.providerId),
              status: copy.status ?? "stored"
            }))
          : [],
        failedAttempts: Array.isArray(result.failedAttempts)
          ? result.failedAttempts.map((attempt: { providerId?: bigint | number; reason?: string }) => ({
              providerId: attempt.providerId === undefined ? undefined : Number(attempt.providerId),
              reason: attempt.reason ?? "unknown failure"
            }))
          : []
      };
    },

    async download(input) {
      return synapse.storage.download({ pieceCid: input.pieceCid, withCDN: input.withCDN });
    },

    async verify(input): Promise<VerifyResult> {
      const dataSets = await synapse.storage.getDataSets();
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
```

- [ ] **Step 3: Export Synapse backend**

Modify `packages/core/src/index.ts`:

```ts
export * from "./types.js";
export * from "./errors.js";
export * from "./defaults.js";
export * from "./schemas.js";
export * from "./agent.js";
export * from "./synapseBackend.js";
```

- [ ] **Step 4: Run core tests and build**

Run:

```bash
npm --workspace packages/core test
npm --workspace packages/core run build
```

Expected: tests pass. If Synapse SDK type names differ, adjust only `synapseBackend.ts`; do not leak Synapse types into adapter packages.

- [ ] **Step 5: Build MCP package**

Run:

```bash
npm --workspace packages/mcp run build
```

Expected: MCP package builds now that `createSynapseBackend` exists.

- [ ] **Step 6: Add opt-in integration test script**

Modify `packages/core/package.json` scripts section to include:

```json
{
  "build": "tsc -p tsconfig.json",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:integration": "FILECOIN_AGENT_ENABLE_INTEGRATION=1 vitest run src/**/*.integration.test.ts"
}
```

Expected: normal `npm --workspace packages/core test` still does not need a wallet.

- [ ] **Step 7: Commit Synapse backend**

Run:

```bash
git add -A
git commit -m "feat(core): add Synapse storage backend"
```

Expected: commit isolates production Filecoin wiring.

---

## Task 7: Add LangChain adapter

**Files:**
- Create: `packages/langchain/package.json`
- Create: `packages/langchain/tsconfig.json`
- Create: `packages/langchain/vitest.config.ts`
- Create: `packages/langchain/src/index.ts`
- Create: `packages/langchain/src/tools.ts`
- Create: `packages/langchain/src/__tests__/tools.test.ts`

- [ ] **Step 1: Write failing LangChain adapter test**

Write `packages/langchain/src/__tests__/tools.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createFakeStorageBackend, TEST_PIECE_CID } from "@filecoin-agent/testkit";
import { createFilecoinTools } from "../tools.js";

describe("createFilecoinTools", () => {
  it("returns named LangChain tools", () => {
    const tools = createFilecoinTools({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    expect(tools.map((tool) => tool.name)).toEqual([
      "filecoin_store_text",
      "filecoin_store_file",
      "filecoin_retrieve",
      "filecoin_verify",
      "filecoin_prepare_storage",
      "filecoin_balance"
    ]);
  });

  it("stores text and returns JSON", async () => {
    const [storeText] = createFilecoinTools({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    const result = await storeText.invoke({ text: "langchain text" });
    expect(JSON.parse(String(result))).toMatchObject({ pieceCid: TEST_PIECE_CID, complete: true });
  });
});
```

- [ ] **Step 2: Create LangChain package manifest and config**

Write `packages/langchain/package.json`:

```json
{
  "name": "@filecoin-agent/langchain",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@filecoin-agent/core": "0.1.0",
    "zod": "latest"
  },
  "peerDependencies": {
    "@langchain/core": ">=0.3.0 <2"
  },
  "devDependencies": {
    "@filecoin-agent/testkit": "0.1.0",
    "@langchain/core": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

Write `packages/langchain/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__tests__/**"]
}
```

Write `packages/langchain/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
```

- [ ] **Step 3: Implement LangChain tools**

Write `packages/langchain/src/tools.ts`:

```ts
import { tool } from "@langchain/core/tools";
import {
  createFilecoinAgent,
  prepareStorageInputSchema,
  retrieveInputSchema,
  storeFileInputSchema,
  storeTextInputSchema,
  verifyInputSchema,
  type FilecoinAgentConfig
} from "@filecoin-agent/core";

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function createFilecoinTools(config: FilecoinAgentConfig) {
  const storage = createFilecoinAgent(config);

  return [
    tool(async (input) => stringify(await storage.storeText(input)), {
      name: "filecoin_store_text",
      description: "Store short text on Filecoin Onchain Cloud and return a PieceCID.",
      schema: storeTextInputSchema
    }),
    tool(async (input) => stringify(await storage.storeFile(input)), {
      name: "filecoin_store_file",
      description: "Store a local file on Filecoin Onchain Cloud and return a PieceCID.",
      schema: storeFileInputSchema
    }),
    tool(async (input) => {
      const result = await storage.retrieve(input);
      return stringify({ ...result, bytes: result.bytes ? `[${result.bytes.byteLength} bytes]` : undefined });
    }, {
      name: "filecoin_retrieve",
      description: "Retrieve Filecoin data by PieceCID. Use outputPath for large data.",
      schema: retrieveInputSchema
    }),
    tool(async (input) => stringify(await storage.verify(input)), {
      name: "filecoin_verify",
      description: "Verify Filecoin storage state for a PieceCID.",
      schema: verifyInputSchema
    }),
    tool(async (input) => stringify(await storage.prepareStorage(input)), {
      name: "filecoin_prepare_storage",
      description: "Prepare balance and approval for Filecoin storage uploads.",
      schema: prepareStorageInputSchema
    }),
    tool(async () => stringify(await storage.getBalance()), {
      name: "filecoin_balance",
      description: "Check Filecoin storage payment balance and runway.",
      schema: undefined
    })
  ];
}
```

Write `packages/langchain/src/index.ts`:

```ts
export * from "./tools.js";
```

- [ ] **Step 4: Install, test, and build LangChain adapter**

Run:

```bash
npm install
npm --workspace packages/langchain test
npm --workspace packages/langchain run build
```

Expected: LangChain adapter tests pass and package builds.

- [ ] **Step 5: Commit LangChain adapter**

Run:

```bash
git add -A
git commit -m "feat(langchain): add Filecoin storage tools"
```

Expected: commit contains LangChain package only.

---

## Task 8: Add LlamaIndex adapter

**Files:**
- Create: `packages/llamaindex/package.json`
- Create: `packages/llamaindex/tsconfig.json`
- Create: `packages/llamaindex/vitest.config.ts`
- Create: `packages/llamaindex/src/index.ts`
- Create: `packages/llamaindex/src/tools.ts`
- Create: `packages/llamaindex/src/__tests__/tools.test.ts`

- [ ] **Step 1: Write failing LlamaIndex adapter test**

Write `packages/llamaindex/src/__tests__/tools.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createFakeStorageBackend } from "@filecoin-agent/testkit";
import { createFilecoinTools } from "../tools.js";

describe("createFilecoinTools", () => {
  it("returns named LlamaIndex tools", () => {
    const tools = createFilecoinTools({
      backend: createFakeStorageBackend(),
      spendingPolicy: { allowPaidOperations: true, requireConfirmation: false }
    });

    expect(tools.map((tool) => tool.metadata.name)).toEqual([
      "filecoin_store_text",
      "filecoin_store_file",
      "filecoin_retrieve",
      "filecoin_verify",
      "filecoin_prepare_storage",
      "filecoin_balance"
    ]);
  });
});
```

- [ ] **Step 2: Create LlamaIndex package manifest and config**

Write `packages/llamaindex/package.json`:

```json
{
  "name": "@filecoin-agent/llamaindex",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@filecoin-agent/core": "0.1.0",
    "zod": "latest"
  },
  "peerDependencies": {
    "llamaindex": ">=0.10.0 <1"
  },
  "devDependencies": {
    "@filecoin-agent/testkit": "0.1.0",
    "llamaindex": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

Write `packages/llamaindex/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__tests__/**"]
}
```

Write `packages/llamaindex/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
```

- [ ] **Step 3: Implement LlamaIndex tools**

Write `packages/llamaindex/src/tools.ts`:

```ts
import { tool } from "llamaindex";
import {
  createFilecoinAgent,
  prepareStorageInputSchema,
  retrieveInputSchema,
  storeFileInputSchema,
  storeTextInputSchema,
  verifyInputSchema,
  type FilecoinAgentConfig
} from "@filecoin-agent/core";

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function createFilecoinTools(config: FilecoinAgentConfig) {
  const storage = createFilecoinAgent(config);

  return [
    tool({
      name: "filecoin_store_text",
      description: "Store short text on Filecoin Onchain Cloud and return a PieceCID.",
      parameters: storeTextInputSchema,
      execute: async (input) => stringify(await storage.storeText(input))
    }),
    tool({
      name: "filecoin_store_file",
      description: "Store a local file on Filecoin Onchain Cloud and return a PieceCID.",
      parameters: storeFileInputSchema,
      execute: async (input) => stringify(await storage.storeFile(input))
    }),
    tool({
      name: "filecoin_retrieve",
      description: "Retrieve Filecoin data by PieceCID. Use outputPath for large data.",
      parameters: retrieveInputSchema,
      execute: async (input) => {
        const result = await storage.retrieve(input);
        return stringify({ ...result, bytes: result.bytes ? `[${result.bytes.byteLength} bytes]` : undefined });
      }
    }),
    tool({
      name: "filecoin_verify",
      description: "Verify Filecoin storage state for a PieceCID.",
      parameters: verifyInputSchema,
      execute: async (input) => stringify(await storage.verify(input))
    }),
    tool({
      name: "filecoin_prepare_storage",
      description: "Prepare balance and approval for Filecoin storage uploads.",
      parameters: prepareStorageInputSchema,
      execute: async (input) => stringify(await storage.prepareStorage(input))
    }),
    tool({
      name: "filecoin_balance",
      description: "Check Filecoin storage payment balance and runway.",
      parameters: undefined,
      execute: async () => stringify(await storage.getBalance())
    })
  ];
}
```

Write `packages/llamaindex/src/index.ts`:

```ts
export * from "./tools.js";
```

- [ ] **Step 4: Install, test, and build LlamaIndex adapter**

Run:

```bash
npm install
npm --workspace packages/llamaindex test
npm --workspace packages/llamaindex run build
```

Expected: LlamaIndex adapter tests pass and package builds.

- [ ] **Step 5: Commit LlamaIndex adapter**

Run:

```bash
git add -A
git commit -m "feat(llamaindex): add Filecoin storage tools"
```

Expected: commit contains LlamaIndex package only.

---

## Task 9: Add examples and user-facing docs

**Files:**
- Create: `docs/architecture.md`
- Create: `docs/quickstart.md`
- Create: `docs/security.md`
- Create: `examples/mcp-claude/README.md`
- Create: `examples/langchain-agent/package.json`
- Create: `examples/langchain-agent/src/index.ts`
- Create: `examples/llamaindex-agent/package.json`
- Create: `examples/llamaindex-agent/src/index.ts`

- [ ] **Step 1: Write architecture doc**

Write `docs/architecture.md`:

```md
# Filecoin Agent SDK Architecture

Filecoin Agent SDK is a thin agent-native layer over Filecoin Onchain Cloud. The project does not replace Synapse SDK or `foc-cli`; it gives agent frameworks one small, safe contract for storage.

## Decision

Adapters depend on `@filecoin-agent/core`. Only core knows about Synapse.

```txt
MCP tools ───────┐
LangChain tools ─┼──> @filecoin-agent/core ──> Synapse SDK ──> Filecoin Onchain Cloud
LlamaIndex tools ┘
```

## Why this boundary exists

- Agent frameworks change faster than storage semantics.
- Filecoin/Synapse details should not leak into every adapter.
- Spending policy must be enforced once.
- Tests should run without wallet credentials.

## Core contract

The MVP exposes six operations: `storeText`, `storeFile`, `retrieve`, `verify`, `prepareStorage`, and `getBalance`.
```

- [ ] **Step 2: Write quickstart doc**

Write `docs/quickstart.md`:

```md
# Filecoin Agent SDK Quickstart

Start on Calibration testnet. Mainnet should be an explicit decision.

## MCP

```json
{
  "mcpServers": {
    "filecoin-agent": {
      "command": "npx",
      "args": ["@filecoin-agent/mcp"],
      "env": {
        "FILECOIN_PRIVATE_KEY": "0x...",
        "FILECOIN_NETWORK": "calibration",
        "FILECOIN_AGENT_ALLOW_PAID": "true"
      }
    }
  }
}
```

Ask your agent:

```txt
Store this short report on Filecoin and verify it after upload.
```

## LangChain

```ts
import { createFilecoinTools } from "@filecoin-agent/langchain";
import { createSynapseBackend } from "@filecoin-agent/core";

const backend = await createSynapseBackend({ privateKey: process.env.FILECOIN_PRIVATE_KEY as `0x${string}` });
const tools = createFilecoinTools({
  backend,
  spendingPolicy: { allowPaidOperations: true, requireConfirmation: true }
});
```

## LlamaIndex

```ts
import { createFilecoinTools } from "@filecoin-agent/llamaindex";
import { createSynapseBackend } from "@filecoin-agent/core";

const backend = await createSynapseBackend({ privateKey: process.env.FILECOIN_PRIVATE_KEY as `0x${string}` });
const tools = createFilecoinTools({
  backend,
  spendingPolicy: { allowPaidOperations: true, requireConfirmation: true }
});
```
```

- [ ] **Step 3: Write security doc**

Write `docs/security.md`:

```md
# Filecoin Agent SDK Security

Agents are useful, but they are not financially responsible adults. The SDK therefore blocks paid operations by default.

## Defaults

| Setting | Default |
|---|---|
| Network | Calibration |
| Paid operations | Disabled |
| Confirmation | Required |
| Max bytes per paid call | 10 MiB |

## Rules

- Never commit private keys.
- Use Calibration before mainnet.
- Use `confirmPaidOperation: true` only when the user or application policy approved the spend.
- Prefer `outputPath` for retrievals that may be large.
- Enable mainnet only in controlled deployments.
```

- [ ] **Step 4: Add examples**

Write `examples/mcp-claude/README.md`:

```md
# MCP Example

This example configures an MCP-compatible host to run Filecoin Agent SDK over stdio.

```json
{
  "mcpServers": {
    "filecoin-agent": {
      "command": "node",
      "args": ["../../packages/mcp/dist/cli.js"],
      "env": {
        "FILECOIN_PRIVATE_KEY": "0x...",
        "FILECOIN_NETWORK": "calibration",
        "FILECOIN_AGENT_ALLOW_PAID": "true"
      }
    }
  }
}
```
```

Write `examples/langchain-agent/package.json`:

```json
{
  "name": "filecoin-agent-langchain-example",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts"
  },
  "dependencies": {
    "@filecoin-agent/core": "0.1.0",
    "@filecoin-agent/langchain": "0.1.0",
    "@langchain/core": "latest",
    "tsx": "latest"
  }
}
```

Write `examples/langchain-agent/src/index.ts`:

```ts
import { createFilecoinTools } from "@filecoin-agent/langchain";
import { createSynapseBackend } from "@filecoin-agent/core";

const privateKey = process.env.FILECOIN_PRIVATE_KEY as `0x${string}` | undefined;
if (!privateKey) throw new Error("FILECOIN_PRIVATE_KEY is required");

const backend = await createSynapseBackend({ privateKey, network: "calibration" });
const tools = createFilecoinTools({
  backend,
  spendingPolicy: { allowPaidOperations: true, requireConfirmation: true }
});

console.log(tools.map((tool) => tool.name));
```

Write `examples/llamaindex-agent/package.json`:

```json
{
  "name": "filecoin-agent-llamaindex-example",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts"
  },
  "dependencies": {
    "@filecoin-agent/core": "0.1.0",
    "@filecoin-agent/llamaindex": "0.1.0",
    "llamaindex": "latest",
    "tsx": "latest"
  }
}
```

Write `examples/llamaindex-agent/src/index.ts`:

```ts
import { createFilecoinTools } from "@filecoin-agent/llamaindex";
import { createSynapseBackend } from "@filecoin-agent/core";

const privateKey = process.env.FILECOIN_PRIVATE_KEY as `0x${string}` | undefined;
if (!privateKey) throw new Error("FILECOIN_PRIVATE_KEY is required");

const backend = await createSynapseBackend({ privateKey, network: "calibration" });
const tools = createFilecoinTools({
  backend,
  spendingPolicy: { allowPaidOperations: true, requireConfirmation: true }
});

console.log(tools.map((tool) => tool.metadata.name));
```

- [ ] **Step 5: Commit docs and examples**

Run:

```bash
git add -A
git commit -m "docs: add Filecoin Agent SDK quickstarts"
```

Expected: commit contains docs and examples only.

---

## Task 10: Final verification and release readiness pass

**Files:**
- Modify: `README.md` if absent create it
- Modify: package manifests if workspace scripts need correction
- Modify: docs only if verification reveals inaccurate commands

- [ ] **Step 1: Create root README**

Write `README.md`:

```md
# Filecoin Agent SDK

Agent-native tools for Filecoin Onchain Cloud.

## Packages

| Package | Purpose |
|---|---|
| `@filecoin-agent/core` | Core storage API, spending policy, Synapse backend seam. |
| `@filecoin-agent/mcp` | MCP stdio server exposing Filecoin storage tools. |
| `@filecoin-agent/langchain` | LangChain JS tools. |
| `@filecoin-agent/llamaindex` | LlamaIndex TS tools. |
| `@filecoin-agent/testkit` | Fake backend and fixtures for tests. |

## Verify locally

```bash
npm test
npm run build
```

## Safety

Paid operations are blocked by default. Start on Calibration and read `docs/security.md` before enabling mainnet.
```

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm test
```

Expected: all non-integration tests pass without `FILECOIN_PRIVATE_KEY`.

- [ ] **Step 3: Run full build**

Run:

```bash
npm run build
```

Expected: all packages and landing build.

- [ ] **Step 4: Verify no private key leaks in repository files**

Run:

```bash
rg "0x[a-fA-F0-9]{64}" . --glob '!node_modules/**' --glob '!package-lock.json'
```

Expected: only synthetic test keys appear in tests or docs. If real secrets appear, remove them before committing.

- [ ] **Step 5: Review changed-line size**

Run:

```bash
git diff --stat HEAD~5..HEAD
```

Expected: changes are split into work-unit commits. If a hosted PR would exceed 400 changed lines, split by the slices in this plan.

- [ ] **Step 6: Commit release readiness**

Run:

```bash
git add -A
git commit -m "docs: prepare Filecoin Agent SDK release preview"
```

Expected: final commit includes README and any verification-driven docs corrections.

---

## Execution checklist

- [ ] Task 1 committed: `chore: convert project to monorepo`
- [ ] Task 2 committed: `feat(core): add storage contracts and schemas`
- [ ] Task 3 committed: `feat(core): add fake-backed agent facade`
- [ ] Task 4 committed: `feat(testkit): add fake Filecoin storage backend`
- [ ] Task 5 committed: `feat(mcp): add Filecoin storage tools`
- [ ] Task 6 committed: `feat(core): add Synapse storage backend`
- [ ] Task 7 committed: `feat(langchain): add Filecoin storage tools`
- [ ] Task 8 committed: `feat(llamaindex): add Filecoin storage tools`
- [ ] Task 9 committed: `docs: add Filecoin Agent SDK quickstarts`
- [ ] Task 10 committed: `docs: prepare Filecoin Agent SDK release preview`

## Verification commands

```bash
npm test
npm run build
npm --workspace apps/landing test
npm --workspace apps/landing run build
npm --workspace packages/core test
npm --workspace packages/core run build
npm --workspace packages/mcp test
npm --workspace packages/mcp run build
npm --workspace packages/langchain test
npm --workspace packages/langchain run build
npm --workspace packages/llamaindex test
npm --workspace packages/llamaindex run build
npm --workspace packages/testkit test
npm --workspace packages/testkit run build
```

## Known implementation cautions

- If the MCP SDK package has moved from `@modelcontextprotocol/server` to a stable replacement, update only `packages/mcp/package.json`, `packages/mcp/src/server.ts`, and `packages/mcp/src/cli.ts` in the MCP task.
- If Synapse result field names differ from the docs, update only `packages/core/src/synapseBackend.ts` and keep the public core types stable.
- If LlamaIndex tool metadata shape differs, update only `packages/llamaindex/src/tools.ts` and its test.
- Keep every adapter output JSON-stringified and compact. Agents do worse when tool responses become essays.
