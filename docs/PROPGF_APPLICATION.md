# Fetcher — ProPGF Batch 3 Application

> Fill this form at: https://fil-ecosystem.karmahq.xyz/

---

## 1. Project & Team

### 1.1 Project Name

**Fetcher — Filecoin Agent SDK**

### 1.2 Project Github

`https://github.com/Klorenn/LavanderSDK`

### 1.3 Project Website

`https://lavander-sdk.vercel.app`

### 1.4 Team Lead / Point of Contact

**Name:** [tu nombre completo]
**Title:** Lead Developer — Fetcher SDK
**Preferred Channel:** Slack / Telegram

**Email:** [tu email]

**Slack handle:** [tu handle en Filecoin Slack]

### 1.5 Category

**Core Infrastructure**

**Contributing to Core Infrastructure? Explain the critical Filecoin infra you maintain. Who depends on it?**

Fetcher is the first unified SDK connecting AI agent frameworks — MCP, LangChain, LlamaIndex — to Filecoin Onchain Cloud via Synapse SDK. It provides 17 tools for storage, verification, observability, and agent memory on Filecoin. Without Fetcher, AI developers must build their own Synapse integration from scratch — a barrier that blocks thousands of AI agents from using Filecoin as their storage backend. The project depends on `@filoz/synapse-sdk` and serves any AI developer using MCP-compatible clients (Claude Desktop, Cursor, Continue, Cody), LangChain agents, or LlamaIndex agents.

### 1.6 Open Source Status

**Fully Open Source** — MIT License. All 7 packages are public. No closed components.

---

## 2. Project Scope

### 2.1 Project Summary

Fetcher is a TypeScript SDK that gives AI agents — Claude, GPT-4o, Gemini — 17 native tools to store, retrieve, verify, and remember data on Filecoin Onchain Cloud. It is the first SDK to bridge MCP, LangChain, and LlamaIndex with Synapse SDK in a single package. The project fills a critical ecosystem gap: no existing tool gives AI agents structured, persistent, cryptographically-verifiable storage on Filecoin with zero blockchain knowledge required from the developer. Fetcher has been built over 55+ commits, spans 7 packages, passes 75 tests, and is already deployed as a live documentation site. The SDK is ready for production use on Calibration testnet and designed for mainnet with safety defaults that block all paid operations until explicitly enabled.

### 2.2 Who does this work support?

- **Application Builders** — AI developers using MCP, LangChain, or LlamaIndex
- **Application Users** — End users of AI agents that now have persistent Filecoin storage
- **Network Infrastructure** — Synapse SDK adoption and Filecoin Onchain Cloud usage
- **Storage Providers** — More paid deals from AI agent workloads

### 2.3 Total Funding Requested (USD)

**$2,000**

### Due Date

**08/31/2026** (8 weeks from July start)

### Completion Criteria

1. **npm publication** — `@fetcher-fil/core`, `@fetcher-fil/mcp`, `@fetcher-fil/langchain`, `@fetcher-fil/llamaindex`, `@fetcher-fil/sdk`, and `@fetcher-fil/testkit` published to the public npm registry at v1.0.0.

2. **All 17 tools functional** — store_file, retrieve_file, list_files, delete_file, verify_cid, check_deal, get_proof, get_balance, estimate_cost, get_storage_stats, list_deals, store_memory, retrieve_memory, update_memory, list_memories, delete_memory, prepare_storage — working identically across MCP, LangChain, LlamaIndex, and SDK adapters.

3. **Verified on Calibration testnet** — Minimum 5 paid storage deals completed and verified on-chain using the SDK against Filecoin Calibration testnet via Synapse SDK.

4. **Full test suite passing** — All 75+ tests passing across 7 packages without requiring a wallet or network access (via @fetcher-fil/testkit's fake storage backend and memory index backend).

5. **Documentation site live** — `https://lavander-sdk.vercel.app` deployed with complete documentation: project overview, step-by-step guide (wallet setup, faucet, first upload), MCP configuration, architecture reference, full API reference for all 17 tools, agent memory guide, LangChain/LlamaIndex/SDK integration guides, security defaults, and troubleshooting.

6. **Community announcement** — Post in Filecoin Slack (#fil-dev) and Filecoin Forum announcing the v1.0.0 release with demo video and quickstart instructions.

### 2.4 Milestones & Budget

**Milestone 1 — Core SDK + MCP Server + Agent Memory · $1,000 · Weeks 1-4**

Title: Core SDK, MCP Server, and Agent Memory System

Deliverable: The full Fetcher SDK core published to npm with 11 tools across 2 adapters. MCP stdio server exposing storage, verification, and memory tools. Agent memory system with versioned, TTL-aware persistence between sessions. Unit tests passing with fake backends (no wallet required).

Completion criteria:
- `@fetcher-fil/core` and `@fetcher-fil/mcp` published to npm at v0.1.0
- 11 tools functional via MCP: store_file, retrieve_file, list_files, delete_file, verify_cid, check_deal, get_proof, store_memory, retrieve_memory, update_memory, list_memories
- Agent memory system with version tracking, TTL expiration, and fallback values
- Spending policy enforced: paid operations blocked by default, confirmation required
- All tests passing with FakeStorageBackend and MemoryIndexBackend
- Demo video: agent storing data and remembering context between sessions

**Milestone 2 — LangChain + LlamaIndex + Observability + Launch · $1,000 · Weeks 5-8**

Title: Multi-Framework Support, Observability Tools, and Public Launch

Deliverable: Fetcher available on all 4 frameworks (MCP, LangChain, LlamaIndex, SDK). Observability tools for cost estimation, balance checking, and storage stats. Full documentation site deployed. v1.0.0 published to npm. Community announcement.

Completion criteria:
- `@fetcher-fil/langchain`, `@fetcher-fil/llamaindex`, and `@fetcher-fil/sdk` published to npm at v1.0.0
- All 17 tools available identically across all 4 adapters
- 4 observability tools: get_balance, estimate_cost, get_storage_stats, list_deals
- Fetcher SDK class with fluent API and memory namespace
- Documentation site live at lavander-sdk.vercel.app with 9 sections
- Minimum 5 verified paid storage deals completed on Calibration testnet
- All 75+ tests passing across 7 packages
- Community announcement posted in Filecoin Slack (#fil-dev) and Filecoin Forum
- Final ProPGF report submitted with on-chain verification links

---

## 3. Target Network Objectives & KPIs

### Objective 1: Drive Paid Onchain Deals

**Direct**

Every file stored via Fetcher generates a paid storage deal on Filecoin via Synapse SDK. The SDK's `estimate_cost` and `prepare_storage` tools make it safe for agents to commit to paid deals.

| Metric | Data source | How measured | Target |
|---|---|---|---|
| Paid deals created via Fetcher | Synapse SDK / Filecoin chain | Track deals originating from Fetcher's Synapse backend | 500+ deals in first 3 months |
| Monthly active integrations | npm downloads + GitHub clones | npm download counts for @fetcher-fil/* packages | 200+ monthly |

### Objective 2: Strengthen Network Profitability & Cryptoeconomics

**Indirect**

Fetcher lowers the barrier for AI developers to use Filecoin Onchain Cloud. By abstracting wallet management, spending policies, and Synapse complexity behind 17 agent-native tools, Fetcher converts AI developers who would otherwise use centralized storage into Filecoin users. Each new developer onboarding through Fetcher is a potential long-term storage customer generating recurring paid deals and USDFC demand.

### Objective 3: Scale Paid Onchain Flagship Client Adoption

**Direct**

Fetcher targets the AI agent ecosystem — the fastest-growing segment of software development. MCP alone has thousands of integrations. LangChain has millions of monthly downloads. Fetcher positions Filecoin as the default storage backend for this ecosystem.

| Metric | Data source | How measured | Target |
|---|---|---|---|
| MCP server integrations | GitHub stars + community reports | Track MCP configs using @fetcher-fil/mcp | 50+ integrations |
| LangChain/LlamaIndex agent usage | GitHub examples + community | Track repos importing @fetcher-fil/langchain or llamaindex | 30+ projects |

### 3.1 Impact pathway (for indirect contributions)

Fetcher → AI developers install SDK (output) → AI agents store data on Filecoin instead of S3/IPFS (outcome) → More paid deals, more USDFC locked, more storage provider revenue (impact on Objective 2 KPIs). The pathway is: lower barrier → more developers → more agents → more deals → stronger network economics.

### 3.2 Verification metrics (for direct contributions)

| Metric | Data source | How measured | Target |
|---|---|---|---|
| Monthly active @fetcher-fil npm downloads | npm registry | npm API | 500+ monthly |
| GitHub stars | GitHub API | Repository stars | 100+ |
| Deals created via SDK | Synapse/Filecoin chain | Tagged transactions | 500+ |
| Community integrations | GitHub search | Repos importing fetcher-fil | 50+ |

### 3.3 References

1. **Filecoin Slack community** — Developers who have expressed interest in MCP + Filecoin integration
2. **Synapse SDK team** — `@filoz/synapse-sdk` is the core dependency; Fetcher drives adoption of their SDK
3. **AI agent developers** — LangChain and LlamaIndex community members seeking Filecoin storage solutions

---

## 4. Operations & Team

### 4.1 Monthly Operating Burn

**< $10K (basic solo operation or part-time team)**

### 4.2 What % of total team monthly burn depends on this grant?

**100%** — This is a solo-developer project. The grant directly funds dedicated development time. Without it, all work happens on nights and weekends with no dedicated allocation.

### 4.3 If this grant is not awarded, what happens?

The SDK is already built and functional as open-source software. Without funding, development continues at a significantly slower pace — nights and weekends only. The npm publication, documentation site maintenance, community support, and the planned Python SDK are deprioritized indefinitely. The core TypeScript SDK remains available on GitHub under MIT license for anyone to use or fork, but without dedicated time for community growth, onboarding support, or responding to Synapse SDK updates. The risk is that the AI agent ecosystem moves fast — LangChain and MCP are growing exponentially — and without dedicated resources, Filecoin misses the window to establish itself as the default storage backend for AI agents before centralized alternatives capture the market.

### 4.4 Core Team

**Kl0ren** — Lead Developer & Sole Contributor
- Built the entire Fetcher SDK: 55+ commits, 7 packages, 75 tests, full documentation site
- Full-stack TypeScript: React, Vite, Tailwind, Framer Motion, Node.js
- Synapse SDK integration, MCP protocol implementation, LangChain/LlamaIndex tool development
- Filecoin Calibration testnet validation with real on-chain transactions
- Open-source maintainer with published projects on GitHub

### 4.5 Has your team received a ProPGF grant or funding from PLFIF before?

**No**

---

## 5. Risks

### 5.1 Key risks & dependencies

| Risk | Mitigation |
|---|---|
| Synapse SDK breaking changes | Pinned dependency (`^0.41`). Fetcher's StorageBackend interface isolates Synapse — only one file needs updating if the API changes. |
| Calibration testnet instability | SDK defaults to Calibration but is designed for mainnet. Error handling surfaces chain issues clearly to the agent. |
| Low MCP adoption for Filecoin | Fetcher supports 4 frameworks (MCP, LangChain, LlamaIndex, SDK) — not dependent on any single one. |
| Solo developer bus factor | Code is open-source (MIT). Architecture is documented. Community can fork and maintain. |

---

## 6. Other

### Anything else?

Fetcher has been built entirely as a solo open-source project over the past weeks. The codebase is clean, tested, documented, and deployed. The SDK already works against Calibration testnet with real Synapse transactions. What remains is: publishing to npm, growing community adoption, adding Python SDK support, and building the payment rails abstraction. ProPGF funding would accelerate all of these and ensure Filecoin has a first-class SDK in the AI agent ecosystem before centralized alternatives capture this market.

### Feedback on the application process?

[tu feedback]
