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

**[tu monto]**

### 2.4 Milestones & Budget

| # | Milestone | Deliverable | Timeline | Budget |
|---|---|---|---|---|
| M1 | Core Storage + MCP Server | MCP server functional with 6 storage/verify tools over Synapse. Published to npm. Tests on Calibration. | Weeks 1-2 | [$$] |
| M2 | Agent Memory System | 5 memory tools (store, retrieve, update, list, delete). Persistence between sessions. Demo video. | Weeks 3-4 | [$$] |
| M3 | Observability + LangChain + LlamaIndex | 4 observe tools. Native LangChain toolkit. Native LlamaIndex tools. SDK direct class. | Weeks 5-7 | [$$] |
| M4 | Documentation + Launch | Full docs site, integration guides, landing page live, community announcement, v1.0.0 npm release, final ProPGF report. | Week 8 | [$$] |

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

**[tu selección: < $10K / $10-$100K / $100-$1M / $1M+]**

### 4.2 What % of total team monthly burn depends on this grant?

**[tu porcentaje]**

### 4.3 If this grant is not awarded, what happens?

The SDK is already built and open-source. Without funding, development velocity slows — I continue maintaining it part-time. Features like Python SDK, payment rails, and dashboard UI are deprioritized. The core TypeScript SDK remains available but without dedicated support, documentation updates, or community growth efforts. The opportunity cost is high: the AI agent ecosystem is moving fast, and without dedicated resources, Filecoin risks losing this integration window to centralized alternatives.

### 4.4 Core Team

**[tu nombre]** — Lead Developer
- Built the entire Fetcher SDK (55+ commits, 7 packages, 75 tests)
- Full-stack TypeScript, Synapse SDK integration, MCP protocol, React/Vite landing page
- [tu experiencia relevante]

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
