import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

/* ── Types & constants ──────────────────────────────────── */

type Tab = 'mcp' | 'langchain' | 'llamaindex' | 'sdk';

const codeSnippets: Record<Tab, string> = {
  mcp: `{
  "mcpServers": {
    "fetcher": {
      "command": "npx",
      "args": ["@fetcher-fil/mcp"],
      "env": {
        "FILECOIN_PRIVATE_KEY": "0x...",
        "FILECOIN_NETWORK": "calibration",
        "FILECOIN_AGENT_ALLOW_PAID": "true"
      }
    }
  }
}`,
  langchain: `import { createFetcherTools } from "@fetcher-fil/langchain";
import { createSynapseBackend } from "@fetcher-fil/core";
import { AgentExecutor } from "langchain/agents";

const tools = createFetcherTools({
  backend: await createSynapseBackend({
    privateKey: process.env.FILECOIN_PRIVATE_KEY
  }),
  spendingPolicy: { allowPaidOperations: true }
});

const executor = new AgentExecutor({ agent, tools });

await executor.invoke({
  input: "Store the report on Filecoin"
});`,
  llamaindex: `import { createFetcherTools } from "@fetcher-fil/llamaindex";
import { createSynapseBackend } from "@fetcher-fil/core";
import { OpenAIAgent, OpenAI } from "llamaindex";

const tools = createFetcherTools({
  backend: await createSynapseBackend({
    privateKey: process.env.FILECOIN_PRIVATE_KEY
  }),
  spendingPolicy: { allowPaidOperations: true }
});

const agent = new OpenAIAgent({
  llm: new OpenAI({ model: "gpt-4o" }), tools
});

await agent.chat({ message: "Store this on Filecoin" });`,
  sdk: `import { Fetcher } from "@fetcher-fil/sdk";
import { createSynapseBackend } from "@fetcher-fil/core";

const f = new Fetcher({
  backend: await createSynapseBackend({
    privateKey: process.env.FILECOIN_PRIVATE_KEY
  }),
  spendingPolicy: { allowPaidOperations: true }
});

const { cid, url } = await f.store({
  content: "Hello Filecoin",
  filename: "hello.txt"
});

await f.memory.store({
  agentId: "my-agent",
  memoryKey: "prefs",
  data: { theme: "dark" }
});`,
};

const tabs: { id: Tab; label: string }[] = [
  { id: 'mcp', label: 'MCP Server' },
  { id: 'langchain', label: 'LangChain' },
  { id: 'llamaindex', label: 'LlamaIndex' },
  { id: 'sdk', label: 'SDK Direct' },
];

const allTools = [
  { group: 'Storage', tools: [
    { name: 'store_file', desc: 'Upload any file to Filecoin. Returns a permanent, verifiable CID with PDP proofs.' },
    { name: 'retrieve_file', desc: 'Fetch file content by CID. Supports text, base64, and JSON encoding.' },
    { name: 'list_files', desc: 'List all uploaded files with tag filtering, pagination, and deal status.' },
    { name: 'delete_file', desc: 'Remove from local index. Data remains on Filecoin permanently — by protocol design.' },
  ]},
  { group: 'Verification', tools: [
    { name: 'verify_cid', desc: 'Cryptographic integrity check with PDP evidence from Filecoin Onchain Cloud.' },
    { name: 'check_deal', desc: 'Query storage deal state: active providers, expiry, redundancy, last proof.' },
    { name: 'get_proof', desc: 'Retrieve the raw PDP cryptographic proof for audit and compliance.' },
  ]},
  { group: 'Observability', tools: [
    { name: 'get_balance', desc: 'Check FIL and USDFC balances, pending payments, and available funds.' },
    { name: 'estimate_cost', desc: 'Estimate storage cost with full breakdown before committing funds.' },
    { name: 'get_storage_stats', desc: 'Dashboard: total files, GB stored, active deals, tags used.' },
    { name: 'list_deals', desc: 'List active storage deals with provider info, expiry, and cost.' },
  ]},
  { group: 'Agent Memory', tools: [
    { name: 'store_memory', desc: 'Persist structured agent context between sessions. Versioned and TTL-aware.' },
    { name: 'retrieve_memory', desc: 'Recall agent state from previous conversations with optional fallback.' },
    { name: 'update_memory', desc: 'Patch specific fields without re-uploading the entire memory object.' },
    { name: 'list_memories', desc: 'List all memories for an agent with metadata and timestamps.' },
    { name: 'delete_memory', desc: 'Remove a memory from the index. Data stays on Filecoin permanently.' },
  ]},
  { group: 'Payments', tools: [
    { name: 'prepare_storage', desc: 'Verify balance and configure allowances before uploading large datasets.' },
  ]},
];

const reasons = [
  { title: 'MCP Native', desc: 'Works with any MCP client — Claude, Cursor, Continue, Cody, and more. 17 tools appear automatically.' },
  { title: 'Agent Memory', desc: 'Structured, versioned, TTL-aware memory that persists between sessions. Nobody else has this.' },
  { title: 'Safe by Default', desc: 'Paid operations blocked. Calibration testnet first. Explicit confirmation required for every spend.' },
  { title: 'PDP Verified', desc: 'Every file is cryptographically verified every hour via Filecoin Onchain Cloud PDP proofs.' },
  { title: 'One npm Install', desc: 'No blockchain knowledge needed. No wallet management. Just an API key and you are storing on Filecoin.' },
  { title: 'LangChain + LlamaIndex', desc: 'Native toolkits for both ecosystems. Same 17 tools, same semantics, same reliability.' },
];

const tickerItems = [
  'npm install fetcher-fil', 'store_file', 'retrieve_file', 'list_files', 'delete_file',
  'verify_cid', 'check_deal', 'get_proof', 'get_balance', 'estimate_cost',
  'get_storage_stats', 'list_deals', 'store_memory', 'retrieve_memory', 'update_memory',
  'list_memories', 'delete_memory', 'prepare_storage',
  'Claude Desktop', 'LangChain', 'LlamaIndex', 'SDK Direct', '17 tools', 'MCP',
];

const navLinks = ['Why', 'Tools', 'Pricing', 'Docs'];

/* ── Hooks ──────────────────────────────────────────────── */

function useHash() {
  return useSyncExternalStore(
    (callback) => { window.addEventListener('hashchange', callback); return () => window.removeEventListener('hashchange', callback); },
    () => window.location.hash
  );
}
function navigate(hash: string) { window.location.hash = hash; }

/* ── Shared components ──────────────────────────────────── */

function SpiritLogo() {
  return <img src="/fetcher-icon.png" alt="Fetcher" className="h-8 w-8 rounded-full object-cover shadow-[0_0_24px_rgba(168,125,212,0.4)]" />;
}

function SectionHeading({ label, title, subtitle }: { label?: string; title: string; subtitle?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6 }} className="text-center mb-16">
      {label && <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80 mb-3">{label}</p>}
      <h2 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}

function HighlightText({ children }: { children: React.ReactNode }) {
  return <span className="highlight highlight-accent">{children}</span>;
}

/* ── Syntax highlighter ─────────────────────────────────── */

function highlight(code: string): string {
  return code
    .replace(/(\/\/.*$)/gm, '<span class="c">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="s">$1</span>')
    .replace(/\b(import|from|export|const|let|var|await|async|function|class|new|return|if|else|throw|try|catch|extends|implements)\b/g, '<span class="k">$1</span>')
    .replace(/\b(FILECOIN_PRIVATE_KEY|FILECOIN_NETWORK|FILECOIN_AGENT_ALLOW_PAID|calibration|mainnet)\b/g, '<span class="f">$1</span>')
    .replace(/\b(true|false|null|undefined)\b/g, '<span class="n">$1</span>')
    .replace(/\b(process|agent|executor|stored|response|storage)\b/g, '<span class="v">$1</span>')
    .replace(/\b(0x\.\.\.)\b/g, '<span class="n">$1</span>')
    .replace(/\b(gpt-4o|OpenAI|ChatOpenAI|OpenAIAgent|AgentExecutor|Fetcher|Synapse|createSynapseBackend|createFetcherTools)\b/g, '<span class="t">$1</span>')
    .replace(/\b(backend|spendingPolicy|privateKey|allowPaidOperations|agentId|memoryKey|data|ttlDays|filename|content)\b/g, '<span class="p">$1</span>')
    .replace(/([{}\[\]()])/g, '<span class="m">$1</span>');
}

/* ── Code block component ────────────────────────────────── */

function CodeBlock({ code, language, filename }: { code: string; language: string; filename: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="code-block shadow-[0_20px_60px_rgba(7,6,16,0.5)]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-[#0a0814]">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff6b8b]" /><span className="h-3 w-3 rounded-full bg-[#ffd166]" /><span className="h-3 w-3 rounded-full bg-[#7bd4a8]" />
          <span className="ml-4 font-mono text-[11px] text-muted-foreground">{filename}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase">{language}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="text-[11px] text-muted-foreground hover:text-foreground transition px-2 py-0.5 rounded hover:bg-white/5"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <pre className="p-5 md:p-7 overflow-x-auto text-[13px] md:text-sm">
        <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
      </pre>
    </div>
  );
}

/* ── Terminal component ──────────────────────────────────── */

const terminalLines = [
  { text: '$ npm install @fetcher-fil/core', color: 'text-foreground/80', delay: 0.3 },
  { text: '', color: '', delay: 0.1 },
  { text: '+ @fetcher-fil/core@0.1.0', color: 'text-[#7bd4a8]', delay: 0.4 },
  { text: '+ @filoz/synapse-sdk@0.41.0', color: 'text-[#7bd4a8]', delay: 0.3 },
  { text: '+ zod@4.4.3', color: 'text-[#7bd4a8]', delay: 0.3 },
  { text: '', color: '', delay: 0.2 },
  { text: 'added 3 packages in 1.2s', color: 'text-muted-foreground', delay: 0.5 },
  { text: '', color: '', delay: 0.3 },
  { text: '$ npx @fetcher-fil/mcp', color: 'text-accent font-semibold', delay: 0.6 },
  { text: '', color: '', delay: 0.2 },
  { text: 'Fetcher v0.1.0', color: 'text-foreground/90', delay: 0.4 },
  { text: '17 tools loaded across 5 groups', color: 'text-muted-foreground', delay: 0.3 },
  { text: 'MCP server listening on stdio', color: 'text-muted-foreground', delay: 0.4 },
  { text: '', color: '', delay: 0.2 },
  { text: 'Storage    · store_file, retrieve_file, list_files, delete_file', color: 'text-[#5b8dff]/70', delay: 0.3 },
  { text: 'Verify     · verify_cid, check_deal, get_proof', color: 'text-accent/70', delay: 0.3 },
  { text: 'Observe    · get_balance, estimate_cost, get_storage_stats, list_deals', color: 'text-[#7bd4a8]/70', delay: 0.3 },
  { text: 'Memory     · store_memory, retrieve_memory, update_memory, list_memories, delete_memory', color: 'text-[#ffd166]/70', delay: 0.3 },
  { text: 'Payments   · prepare_storage', color: 'text-[#ff6b8b]/70', delay: 0.3 },
];

function Terminal() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!started) return;
    if (visibleLines >= terminalLines.length) return;
    const line = terminalLines[visibleLines];
    const timer = setTimeout(() => setVisibleLines(v => v + 1), line.delay * 1000);
    return () => clearTimeout(timer);
  }, [started, visibleLines]);

  const allDone = visibleLines >= terminalLines.length;

  return (
    <div className="h-full rounded-xl border border-white/10 bg-[#05040b]/90 shadow-2xl flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 shrink-0 bg-[#0a0814]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b8b]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#7bd4a8]" />
        <span className="ml-3 text-[10px] text-muted-foreground font-mono tracking-wider">fetcher — zsh</span>
      </div>
      <div className="flex-1 p-4 md:p-6 space-y-0.5 font-mono overflow-y-auto">
        {terminalLines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className={`text-[10px] md:text-[12px] ${line.color} leading-relaxed`}
          >
            {line.text || '\u00A0'}
            {i === visibleLines - 1 && !allDone && i >= 1 && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                className="inline-block w-2 h-[14px] bg-accent ml-0.5 align-middle rounded-sm"
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Sections ────────────────────────────────────────────── */

function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -180]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, -280]);

  return (
    <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-background">
      <video src="/fetcher-lavender.mp4" poster="/fetcher-lavender-frame1.png" autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(168,125,212,0.12),transparent_38%),linear-gradient(180deg,rgba(7,6,16,0.26),rgba(7,6,16,0.08)_45%,rgba(7,6,16,0.72))]" />

      <nav className="relative z-40 flex items-center justify-between px-8 py-4 md:px-28">
        <div className="flex items-center gap-7">
          <button onClick={() => navigate('#')} className="flex items-center gap-3 bg-transparent border-0 cursor-pointer"><SpiritLogo /><span className="text-xl font-bold tracking-tight">Fetcher</span></button>
          <div className="hidden items-center gap-7 text-sm font-medium text-foreground/70 md:flex">
            {navLinks.map(link => <button key={link} onClick={() => navigate(`#${link.toLowerCase()}`)} className="bg-transparent border-0 cursor-pointer text-foreground/70 transition hover:text-foreground">{link}</button>)}
          </div>
        </div>
        <button onClick={() => navigate('#quickstart')} className="rounded-lg bg-[#F2EFF8] px-4 py-2 text-sm font-semibold text-[#070610] hover:opacity-90 transition">Get Started</button>
      </nav>

      <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-30 mx-auto mt-16 flex max-w-4xl flex-col items-center px-4 text-center md:mt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="liquid-glass mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/90">
          <span className="rounded-md bg-accent/80 px-2 py-1 text-xs font-bold text-background">MCP</span>
          <span className="rounded-md bg-[#5b8dff]/20 px-2 py-1 text-xs font-bold text-[#9db8ff]">LangChain</span>
          <span className="rounded-md bg-accent/20 px-2 py-1 text-xs font-bold text-accent">LlamaIndex</span>
          <span>Connect AI agents to Filecoin</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="mb-4 text-5xl font-medium leading-tight tracking-[-2px] text-foreground md:text-7xl">
          Your data.
          <br />
          One <span className="font-serif italic text-accent">spirit</span> away.
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mb-8 max-w-xl text-lg leading-8 text-hero-subtitle/90">
          <HighlightText>17 tools</HighlightText> to store, retrieve, verify and remember data on{' '}
          <HighlightText>Filecoin Onchain Cloud</HighlightText> — MCP, LangChain, LlamaIndex, SDK. One npm install.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }} className="flex items-center gap-4">
          <button onClick={() => navigate('#quickstart')} className="rounded-full bg-foreground px-8 py-3.5 text-base font-medium text-background hover:bg-foreground/90 transition">Get Started</button>
          <button onClick={() => navigate('#docs')} className="rounded-full border border-border px-8 py-3.5 text-base font-medium text-foreground hover:border-accent/50 transition">Read Docs</button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="mt-12 text-center text-sm text-muted-foreground">
          <span>Open source · </span>
          <a href="https://github.com/Klorenn" target="_blank" rel="noopener" className="text-accent/80 hover:text-accent transition">github.com/Klorenn</a>
          <span className="mx-2 text-border">|</span>
          <span>2026</span>
        </motion.div>
      </motion.div>

      <motion.div style={{ y: dashboardY }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="relative z-20 mx-auto mt-10 min-h-[460px] md:min-h-[520px] w-[90%] max-w-4xl rounded-2xl md:mt-14">
        <div className="liquid-glass h-full rounded-2xl p-4 shadow-[0_30px_100px_rgba(7,6,16,0.65)] md:p-7">
          <Terminal />
        </div>
      </motion.div>

      <div className="pointer-events-none absolute bottom-0 z-30 h-40 w-full bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

function Ticker() {
  const track = useMemo(() => [...tickerItems, ...tickerItems], []);
  return (
    <div className="overflow-hidden border-y border-border/50 bg-accent-soft/50 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-accent/80">
      <div className="flex w-max animate-ticker gap-4 whitespace-nowrap">
        {track.map((item, i) => <span key={`${item}-${i}`} className="flex items-center gap-4">{item} <span aria-hidden="true">·</span></span>)}
      </div>
    </div>
  );
}

function CodeDemo() {
  const [tab, setTab] = useState<Tab>('mcp');
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  const code = codeSnippets[tab];
  const filename = tab === 'mcp' ? 'mcp-config.json' : tab === 'langchain' ? 'src/agent.ts' : tab === 'llamaindex' ? 'src/agent.ts' : 'src/index.ts';
  const lang = tab === 'mcp' ? 'JSON' : 'TypeScript';

  return (
    <section ref={ref} id="quickstart" className="px-8 py-24 md:px-28 md:py-32">
      <div className="mx-auto max-w-4xl">
        <SectionHeading label="Quickstart" title="Pick your framework. It just works." subtitle="Same 17 tools. Same semantics. Four integrations. One npm install." />

        <motion.div initial={{ opacity: 0, y: 36 }} animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }} transition={{ duration: 0.7, delay: 0.3 }} className="code-block shadow-[0_30px_90px_rgba(7,6,16,0.7)]">
          <div className="flex items-center border-b border-border/40 bg-[#0a0814]">
            <div className="flex items-center gap-2 px-3 py-3 border-r border-border/40">
              <span className="h-3 w-3 rounded-full bg-[#ff6b8b]" /><span className="h-3 w-3 rounded-full bg-[#ffd166]" /><span className="h-3 w-3 rounded-full bg-[#7bd4a8]" />
            </div>
            <div className="flex gap-0.5 px-2">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`relative px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    tab === t.id ? 'text-accent bg-accent/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                  }`}
                >
                  {t.label}
                  {tab === t.id && <motion.div layoutId="tab-line" className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />}
                </button>
              ))}
            </div>
            <div className="ml-auto pr-4 flex items-center gap-2 text-[10px] text-muted-foreground uppercase">
              <span>{filename}</span>
              <span className="text-accent/60">·</span>
              <span>{lang}</span>
            </div>
          </div>
          <pre className="p-5 md:p-7 overflow-x-auto text-[13px] md:text-sm max-h-[420px] overflow-y-auto">
            <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
          </pre>
        </motion.div>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section id="why" className="px-8 py-24 md:px-28 md:py-32 bg-card/30">
      <div className="mx-auto max-w-6xl">
        <SectionHeading label="Why Fetcher" title="The missing bridge" subtitle="No other SDK gives AI agents storage, memory, verification, and observability on Filecoin Onchain Cloud — in one package." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <motion.div key={r.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: i * 0.08 }}
              className="card-glow rounded-xl border border-border bg-background p-6 cursor-default">
              <div className="h-2 w-2 rounded-full bg-accent mb-3" />
              <h3 className="font-semibold text-foreground">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-6">{r.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolsSection() {
  const groupStyles: Record<string, { dot: string; border: string; text: string }> = {
    'Storage':      { dot: 'bg-[#5b8dff]', border: 'border-[#5b8dff]/20 hover:border-[#5b8dff]/40', text: 'text-[#5b8dff]' },
    'Verification': { dot: 'bg-accent',     border: 'border-accent/20 hover:border-accent/40',         text: 'text-accent' },
    'Observability':{ dot: 'bg-[#7bd4a8]', border: 'border-[#7bd4a8]/20 hover:border-[#7bd4a8]/40', text: 'text-[#7bd4a8]' },
    'Agent Memory': { dot: 'bg-[#ffd166]', border: 'border-[#ffd166]/20 hover:border-[#ffd166]/40', text: 'text-[#ffd166]' },
    'Payments':     { dot: 'bg-[#ff6b8b]', border: 'border-[#ff6b8b]/20 hover:border-[#ff6b8b]/40', text: 'text-[#ff6b8b]' },
  };

  return (
    <section id="tools" className="px-8 py-24 md:px-28 md:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading label="API" title="17 tools. Five groups." subtitle="Available identically across MCP, LangChain, LlamaIndex, and SDK." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {allTools.map(({ group, tools: groupTools }, i) => {
            const s = groupStyles[group];
            return (
              <motion.div key={group} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`rounded-xl border bg-background p-5 transition-all duration-300 ${s.border} card-glow`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">{group}</h3>
                  <span className="ml-auto text-[10px] text-muted-foreground">{groupTools.length}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {groupTools.map(t => (
                    <code key={t.name} className="text-[10px] font-mono text-muted-foreground/80 leading-relaxed">
                      {t.name}
                    </code>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function IntegrationsSection() {
  const cards = [
    { title: 'MCP Server', desc: 'Works with any MCP client — Claude, Cursor, Continue, Cody. 17 tools appear automatically in any LLM.', gradient: 'from-accent/20 to-accent/5' },
    { title: 'LangChain Toolkit', desc: 'FetcherToolkit with 17 DynamicStructuredTools. Native ReAct agent support. Full type safety.', gradient: 'from-[#5b8dff]/20 to-[#5b8dff]/5' },
    { title: 'LlamaIndex Tools', desc: '17 FunctionTools for OpenAIAgent. Full JSON Schema support. Compatible with any LlamaIndex agent.', gradient: 'from-accent/20 to-[#a87dd4]/5' },
    { title: 'SDK Direct', desc: 'Fetcher class with fluent API: fetcher.store(), fetcher.memory.store(), fetcher.stats().', gradient: 'from-[#7bd4a8]/20 to-[#7bd4a8]/5' },
  ];

  return (
    <section id="integrations" className="px-8 py-24 md:px-28 md:py-32 bg-card/20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="One SDK. Four ways." subtitle="Every integration exposes the same 17 tools with the same semantics." />
        <div className="grid gap-6 sm:grid-cols-2">
          {cards.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`card-glow rounded-xl border border-border bg-gradient-to-br ${c.gradient} p-7`}>
              <div className="h-2 w-2 rounded-full bg-accent mb-3" />
              <h3 className="mt-4 text-xl font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-6">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialSection() {
  const ref = useRef<HTMLElement>(null);
  const words = "17 tools, four frameworks, one npm install. Fetcher is the missing bridge between AI agents and Filecoin Onchain Cloud. We shipped an MCP server in two hours — the rest of the week was just playing with it.".split(' ');
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end center'] });

  return (
    <section ref={ref} className="flex min-h-[80vh] items-center px-8 py-24 md:px-28">
      <div className="mx-auto max-w-4xl">
        <p className="text-4xl font-medium leading-tight tracking-[-1px] md:text-6xl md:leading-tight">
          {words.map((word, i) => {
            const s = i / words.length; const e = Math.min(1, s + 0.14);
            const opacity = useTransform(scrollYProgress, [s, e], [0.15, 1]);
            const color = useTransform(scrollYProgress, [s, e], ['hsl(270 10% 35%)', 'hsl(270 30% 95%)']);
            return <motion.span key={`${word}-${i}`} style={{ opacity, color }} className="mr-[0.3em] inline-block">{word}</motion.span>;
          })}
        </p>
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.5 }} className="mt-12 flex items-center gap-4">
          <img src="/fetcher-icon.png" alt="" className="h-12 w-12 rounded-full object-cover shadow-[0_0_20px_rgba(168,125,212,0.35)]" />
          <div><p className="font-semibold text-foreground">Ghost</p><p className="text-sm text-muted-foreground">Filecoin ProPGF Batch 3</p></div>
        </motion.div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="px-8 py-24 md:px-28 md:py-32 bg-card/20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading label="Pricing" title="Open source. You pay Filecoin." subtitle="Fetcher is MIT licensed. You only pay Filecoin network costs — Synapse storage and PDP verification fees." />
        <div className="grid gap-6 md:grid-cols-3 max-w-3xl mx-auto">
          {[
            { title: 'Fetcher SDK', price: 'Free', desc: 'MIT License. All 17 tools. No limits.', features: ['Full source code', 'MCP + LangChain + LlamaIndex', 'Agent memory system', 'Community support'] },
            { title: 'Storage', price: '~$0.02/GB', desc: 'Filecoin network cost via Synapse', features: ['Paid per byte stored', 'PDP verified hourly', 'Calibration: free testnet', 'Mainnet: real FIL'] },
            { title: 'Enterprise', price: 'Coming', desc: 'Priority support + SLAs', features: ['Dedicated support', 'Custom integrations', 'SLA guarantees', 'Private deployments'] },
          ].map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`rounded-xl border ${i === 0 ? 'border-accent/30 bg-accent/5' : 'border-border bg-background'} p-6 card-glow`}>
              <h3 className="font-semibold text-foreground">{p.title}</h3>
              <p className="mt-1 font-serif text-3xl text-accent">{p.price}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-5 space-y-2">
                {p.features.map(f => <li key={f} className="text-xs text-muted-foreground flex items-center gap-2"><span className="text-accent font-bold">—</span>{f}</li>)}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DocsSection() {
  const docTabs = ['Overview', 'Quickstart', 'MCP Setup', 'Architecture', 'API Reference', 'Agent Memory', 'Integrations', 'Security'] as const;
  const [docTab, setDocTab] = useState<typeof docTabs[number]>('Overview');

  return (
    <section id="docs" className="px-8 py-24 md:px-28 md:py-32">
      <div className="mx-auto max-w-4xl">
        <SectionHeading label="Documentation" title="Everything you need" subtitle="From why Fetcher exists to every tool, integration, and safety default." />

        <div className="flex flex-wrap gap-1 mb-12 border-b border-border pb-4 overflow-x-auto">
          {docTabs.map(t => (
            <button key={t} onClick={() => setDocTab(t)}
              className={`relative px-3 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                docTab === t ? 'text-accent bg-accent/5' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t}
              {docTab === t && <motion.div layoutId="doc-tab" className="absolute bottom-[-17px] left-2 right-2 h-0.5 bg-accent rounded-full" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Overview ──────────────────────────────────── */}
          {docTab === 'Overview' && <OverviewDoc />}

          {/* ── Quickstart ────────────────────────────────── */}
          {docTab === 'Quickstart' && <QuickstartDoc />}

          {/* ── MCP Setup ─────────────────────────────────── */}
          {docTab === 'MCP Setup' && <McpDoc />}

          {/* ── Architecture ──────────────────────────────── */}
          {docTab === 'Architecture' && <ArchitectureDoc />}

          {/* ── API Reference ─────────────────────────────── */}
          {docTab === 'API Reference' && <ApiDoc />}

          {/* ── Agent Memory ──────────────────────────────── */}
          {docTab === 'Agent Memory' && <MemoryDoc />}

          {/* ── Integrations ──────────────────────────────── */}
          {docTab === 'Integrations' && <IntegrationsDoc />}

          {/* ── Security ──────────────────────────────────── */}
          {docTab === 'Security' && <SecurityDoc />}

        </AnimatePresence>
      </div>
    </section>
  );
}

function DocSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div key={Math.random()} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-16">
      {children}
    </motion.div>
  );
}

function DocBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-2">{title}</h2>
      <div className="text-muted-foreground leading-7 text-sm md:text-base space-y-4">{children}</div>
    </div>
  );
}

/* ── Overview Tab ──────────────────────────────────────────── */

function OverviewDoc() {
  return (
    <DocSection>
      <DocBlock title="What is Fetcher?">
        <p>Fetcher is an <span className="text-accent font-semibold">open-source TypeScript SDK</span> that connects AI agents — Claude, GPT-4o, Gemini, LangChain agents, LlamaIndex agents — to <span className="text-accent font-semibold">Filecoin Onchain Cloud</span>, the world's largest decentralized storage network.</p>
        <p>One <code className="rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent">npm install</code>. One config line. Your agent gains 17 powerful tools to store, retrieve, verify, and remember data — with cryptographic PDP proofs every hour.</p>
      </DocBlock>

      <DocBlock title="The problem it solves">
        <p>AI agents today have <span className="text-accent font-semibold">five critical gaps</span> that no other SDK addresses simultaneously:</p>
        <div className="grid gap-3 not-prose">
          {[
            { gap: 'No Filecoin MCP Server', fix: 'Add one JSON block to any MCP client — 17 Filecoin tools appear automatically.' },
            { gap: 'No LangChain Toolkit for Filecoin', fix: 'createFetcherTools() returns 17 native DynamicStructuredTools.' },
            { gap: 'No LlamaIndex Tools for Filecoin', fix: 'createFetcherTools() returns 17 native FunctionTools with JSON Schema.' },
            { gap: 'No persistent agent memory', fix: 'Structured, versioned, TTL-aware memory that persists between sessions.' },
            { gap: 'No storage observability', fix: 'get_storage_stats, estimate_cost, list_deals, get_balance — dashboard for agents.' },
          ].map(g => (
            <div key={g.gap} className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">{g.gap}</p>
              <p className="text-sm text-muted-foreground">{g.fix}</p>
            </div>
          ))}
        </div>
      </DocBlock>

      <DocBlock title="Why Filecoin Onchain Cloud?">
        <p>Filecoin is not just "decentralized storage." With <span className="text-accent font-semibold">Synapse SDK</span> and Filecoin Onchain Cloud, it becomes a production-grade backend:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>PDP (Proof of Data Possession)</strong> — Every file is cryptographically verified every hour on-chain. Call <code className="rounded bg-accent/10 px-1 text-xs text-accent">verify_cid</code> and get mathematical proof the data exists and hasn't been altered.</li>
          <li><strong>Filecoin Pay</strong> — Programmable on-chain payments in USDFC. Check balances and estimate costs before spending.</li>
          <li><strong>Permanent addressing</strong> — Every file gets a permanent CID. No broken links. No server migrations. The CID is the file.</li>
        </ul>
      </DocBlock>

      <DocBlock title="What Fetcher is NOT">
        <p>Fetcher does not replace Synapse SDK or the Filecoin protocol. It is a thin agent-native layer that gives AI frameworks a safe, consistent contract for storage. It does not manage wallets, encrypt data, delete data from Filecoin, or provide a Python/Go SDK (on the roadmap).</p>
      </DocBlock>
    </DocSection>
  );
}

/* ── Quickstart Tab ────────────────────────────────────────── */

function QuickstartDoc() {
  return (
    <DocSection>
      <DocBlock title="Four steps to Filecoin">
        <p className="mb-6">From zero to storing data on Filecoin with your AI agent — in under five minutes.</p>
        <div className="grid gap-4 md:grid-cols-2 not-prose">
          {[
            { step: '1', title: 'Get a wallet', desc: 'Add Filecoin Calibration to MetaMask. RPC: api.calibration.node.glif.io/rpc/v1, Chain ID: 314159. Get test FIL from faucet.calibration.fildev.network.' },
            { step: '2', title: 'Install', desc: 'npm install @fetcher-fil/core. Add your adapter: @fetcher-fil/mcp for MCP clients (Claude, Cursor, Continue...), @fetcher-fil/langchain, or @fetcher-fil/llamaindex.' },
            { step: '3', title: 'Configure', desc: 'Set FILECOIN_PRIVATE_KEY env var. Start on Calibration testnet. Enable FILECOIN_AGENT_ALLOW_PAID=true when ready.' },
            { step: '4', title: 'Use it', desc: 'MCP: add JSON config. Code: createFetcherTools({ backend, spendingPolicy }). Your agent has 17 tools.' },
          ].map(s => (
            <div key={s.step} className="rounded-xl border border-border bg-background p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent shrink-0">{s.step}</span>
                <h4 className="font-semibold text-foreground">{s.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-6">{s.desc}</p>
            </div>
          ))}
        </div>
      </DocBlock>
    </DocSection>
  );
}

/* ── MCP Setup Tab ─────────────────────────────────────────── */

function McpDoc() {
  return (
    <DocSection>
      <DocBlock title="MCP Client Configuration">
        <p>Add this JSON block to your MCP client config — Claude Desktop, Cursor, Continue, Cody, or any MCP-compatible host. Restart the client. Your LLM now has 17 Filecoin tools.</p>
        <div className="not-prose mt-4">
          <CodeBlock code={codeSnippets.mcp} language="JSON" filename="mcp-config.json" />
        </div>
      </DocBlock>

      <DocBlock title="Environment Variables">
        <div className="not-prose grid gap-4 md:grid-cols-2">
          {[
            { label: 'Required', var: 'FILECOIN_PRIVATE_KEY', desc: 'Your EVM wallet private key (0x...) — used to sign storage transactions.' },
            { label: 'Optional', var: 'FILECOIN_NETWORK', desc: 'Network to use. calibration (default, testnet) or mainnet (production).' },
            { label: 'Optional', var: 'FILECOIN_AGENT_ALLOW_PAID', desc: 'Set to true to enable storage payments. Blocked by default for safety.' },
            { label: 'Optional', var: 'FILECOIN_AGENT_ID', desc: 'Default agent ID for memory operations. Useful when running multiple agents.' },
          ].map(e => (
            <div key={e.var} className="rounded-lg border border-border bg-background p-4">
              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent uppercase">{e.label}</span>
              <code className="mt-2 block text-xs font-semibold text-foreground">{e.var}</code>
              <p className="mt-1 text-xs text-muted-foreground leading-5">{e.desc}</p>
            </div>
          ))}
        </div>
      </DocBlock>
    </DocSection>
  );
}

/* ── Architecture Tab ──────────────────────────────────────── */

function ArchitectureDoc() {
  return (
    <DocSection>
      <DocBlock title="Package Architecture">
        <p>The SDK is a monorepo of 7 packages. Adapters depend on <code className="rounded bg-accent/10 px-1 text-xs text-accent">@fetcher-fil/core</code>. Only core knows about Synapse.</p>
        <div className="not-prose overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">{['Package', 'Purpose', 'Dependencies'].map(h => <th key={h} className="px-4 py-2 text-left font-medium text-foreground">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {[
                ['@fetcher-fil/core', 'Core API, types, schemas, Synapse backend, IndexBackend interface', '@filoz/synapse-sdk, viem, zod'],
                ['@fetcher-fil/mcp', 'MCP stdio server — npx @fetcher-fil/mcp', '@modelcontextprotocol/server, core'],
                ['@fetcher-fil/langchain', '17 LangChain DynamicStructuredTools', '@langchain/core, core'],
                ['@fetcher-fil/llamaindex', '17 LlamaIndex FunctionTools', 'llamaindex, core'],
                ['@fetcher-fil/sdk', 'Direct programmatic API — Fetcher class', 'core'],
                ['@fetcher-fil/testkit', 'Fake backend + MemoryIndexBackend for testing', 'core'],
                ['@fetcher-fil/landing', 'Documentation site (React + Vite + Tailwind)', '—'],
              ].map(([pkg, purpose, deps]) => (
                <tr key={pkg} className="bg-background"><td className="px-4 py-2.5 font-mono text-xs text-accent">{pkg}</td><td className="px-4 py-2.5 text-muted-foreground">{purpose}</td><td className="px-4 py-2.5 text-xs text-muted-foreground">{deps}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocBlock>

      <DocBlock title="Key Design Decisions">
        <div className="grid gap-4 md:grid-cols-2 not-prose">
          {[
            { t: 'StorageBackend interface', d: 'Pluggable backend. Production uses createSynapseBackend(). Tests use createFakeStorageBackend(). No wallet needed for development.' },
            { t: 'IndexBackend interface', d: 'Three implementations: FileIndexBackend (local JSON), MemoryIndexBackend (in-memory tests), FilecoinIndexBackend (index on Filecoin — portable).' },
            { t: 'Spending policy enforced once', d: 'Every paid operation passes through assertPaidOperationAllowed() in core. Paid ops blocked by default. Confirmation required.' },
            { t: 'Adapters depend on core', d: 'MCP, LangChain, LlamaIndex, SDK import from core. They never touch Synapse directly. Synapse can evolve independently.' },
          ].map(i => (
            <div key={i.t} className="rounded-lg border border-border bg-background p-4">
              <h4 className="font-semibold text-foreground text-sm">{i.t}</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-5">{i.d}</p>
            </div>
          ))}
        </div>
      </DocBlock>
    </DocSection>
  );
}

/* ── API Reference Tab ─────────────────────────────────────── */

function ApiDoc() {
  return (
    <DocSection>
      <DocBlock title="All 17 Tools">
        <p>Every tool is available identically across MCP, LangChain, LlamaIndex, and SDK. The semantics never change — only the calling convention differs by framework.</p>
        <div className="not-prose space-y-10 mt-6">
          {allTools.map(({ group, tools: groupTools }) => (
            <div key={group}>
              <h3 className="font-mono text-sm font-semibold text-accent mb-4 uppercase tracking-wider">{group}</h3>
              <div className="space-y-3">
                {groupTools.map(t => (
                  <div key={t.name} className="rounded-lg border border-border bg-background p-4">
                    <code className="font-mono text-sm font-bold text-accent">{t.name}</code>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-5">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DocBlock>
    </DocSection>
  );
}

/* ── Agent Memory Tab ──────────────────────────────────────── */

function MemoryDoc() {
  return (
    <DocSection>
      <DocBlock title="Fetcher's Differentiator">
        <p>Structured, versioned, TTL-aware memory that persists between agent sessions on Filecoin. No other SDK has this. Each memory entry is stored as a JSON object on Filecoin, indexed locally by agent_id and memory_key.</p>
        <div className="grid gap-4 md:grid-cols-2 not-prose mt-4">
          {[
            { t: 'Versioned', d: 'Every store_memory increments the version counter. Track changes and detect conflicts over time.' },
            { t: 'TTL-aware', d: 'Set ttlDays to auto-expire memories. Expired entries return found: false without errors.' },
            { t: 'Patch updates', d: 'update_memory merges specific fields without replacing the entire object. Only changed keys are re-uploaded to Filecoin.' },
            { t: 'Fallback values', d: 'retrieve_memory accepts an optional fallback object — clean agent code without null checks.' },
          ].map(i => (
            <div key={i.t} className="rounded-lg border border-border bg-background p-4">
              <h4 className="font-semibold text-foreground text-sm">{i.t}</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-5">{i.d}</p>
            </div>
          ))}
        </div>
      </DocBlock>

      <DocBlock title="Example">
        <div className="not-prose">
          <CodeBlock
            code={`// Store memory — persists between sessions
await f.memory.store({
  agentId: "my-assistant",
  memoryKey: "preferences",
  data: { theme: "dark", lang: "es" },
  ttlDays: 30
});

// Retrieve next session — agent remembers context
const mem = await f.memory.retrieve({
  agentId: "my-assistant",
  memoryKey: "preferences",
  fallback: { theme: "light" }
});
// → { found: true, data: { theme: "dark", lang: "es" }, version: 1 }

// Update a single field without re-uploading everything
await f.memory.update({
  agentId: "my-assistant",
  memoryKey: "preferences",
  patch: { theme: "system" }
});
// → { updatedFields: ["theme"], version: 2 }`}
            language="TypeScript" filename="memory-example.ts" />
        </div>
      </DocBlock>
    </DocSection>
  );
}

/* ── Integrations Tab ──────────────────────────────────────── */

function IntegrationsDoc() {
  return (
    <DocSection>
      <DocBlock title="LangChain">
        <p>Fetcher provides 17 native DynamicStructuredTools via createFetcherTools(). Works with any LangChain agent — ReAct, OpenAI Functions, or custom.</p>
        <div className="not-prose mt-4">
          <CodeBlock
            code={`import { createFetcherTools } from "@fetcher-fil/langchain";
import { createSynapseBackend } from "@fetcher-fil/core";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";

const backend = await createSynapseBackend({
  privateKey: process.env.FILECOIN_PRIVATE_KEY
});

const tools = createFetcherTools({
  backend,
  spendingPolicy: { allowPaidOperations: true }
});

const executor = new AgentExecutor({
  agent: await createOpenAIFunctionsAgent({
    llm: new ChatOpenAI({ model: "gpt-4o" }), tools, prompt
  }),
  tools
});

await executor.invoke({
  input: "Store the quarterly report on Filecoin and remember the CID."
});`}
            language="TypeScript" filename="langchain-example.ts" />
        </div>
      </DocBlock>

      <DocBlock title="LlamaIndex">
        <p>Fetcher provides 17 native FunctionTools. Full JSON Schema support. Compatible with OpenAIAgent and any LlamaIndex agent.</p>
        <div className="not-prose mt-4">
          <CodeBlock
            code={`import { createFetcherTools } from "@fetcher-fil/llamaindex";
import { createSynapseBackend } from "@fetcher-fil/core";
import { OpenAIAgent, OpenAI } from "llamaindex";

const tools = createFetcherTools({
  backend: await createSynapseBackend({
    privateKey: process.env.FILECOIN_PRIVATE_KEY
  }),
  spendingPolicy: { allowPaidOperations: true }
});

const agent = new OpenAIAgent({
  llm: new OpenAI({ model: "gpt-4o" }), tools
});

await agent.chat({
  message: "Store this report on Filecoin and verify it."
});`}
            language="TypeScript" filename="llamaindex-example.ts" />
        </div>
      </DocBlock>

      <DocBlock title="SDK Direct">
        <p>The Fetcher class provides a fluent programmatic API with chained methods and memory namespace. No agent framework required.</p>
        <div className="not-prose mt-4">
          <CodeBlock
            code={`import { Fetcher } from "@fetcher-fil/sdk";
import { createSynapseBackend } from "@fetcher-fil/core";

const f = new Fetcher({
  backend: await createSynapseBackend({
    privateKey: process.env.FILECOIN_PRIVATE_KEY
  }),
  spendingPolicy: { allowPaidOperations: true }
});

// Storage
const { cid, url } = await f.store({
  content: "Hello Filecoin", filename: "hello.txt"
});

// Agent Memory
await f.memory.store({
  agentId: "my-agent", memoryKey: "prefs",
  data: { theme: "dark" }
});
const mem = await f.memory.retrieve({
  agentId: "my-agent", memoryKey: "prefs"
});

// Observability
const stats = await f.stats();
const cost = await f.estimateCost({ sizeBytes: 1024 * 1024 });

// Verification
const proof = await f.verify({ cid });`}
            language="TypeScript" filename="sdk-example.ts" />
        </div>
      </DocBlock>
    </DocSection>
  );
}

/* ── Security Tab ──────────────────────────────────────────── */

function SecurityDoc() {
  return (
    <DocSection>
      <DocBlock title="Safety by Default">
        <p>AI agents are useful but should not have unlimited spending power. Fetcher ships with aggressive safety defaults that block all paid operations until explicitly enabled.</p>
        <div className="not-prose overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">{['Setting', 'Default', 'Override', 'Why'].map(h => <th key={h} className="px-4 py-2 text-left font-medium text-foreground">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {[
                ['Network', 'Calibration', 'FILECOIN_NETWORK=mainnet', 'Testnet first. Mainnet requires explicit opt-in.'],
                ['Paid operations', 'Blocked', 'allowPaidOperations: true', 'Agents must not spend FIL without developer approval.'],
                ['Confirmation', 'Required', 'confirmPaidOperation: true', 'Every paid call needs explicit confirmation from the agent.'],
                ['Max per call', '10 MiB', 'maxStorageBytesPerCall', 'Prevents runaway storage costs from a single agent action.'],
                ['Min data', '127 bytes', '—', 'Filecoin protocol minimum enforced by Synapse SDK.'],
              ].map(([s, d, o, w]) => (
                <tr key={s} className="bg-background"><td className="px-4 py-2.5 font-medium text-foreground">{s}</td><td className="px-4 py-2.5"><code className="rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent">{d}</code></td><td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{o}</td><td className="px-4 py-2.5 text-muted-foreground text-xs">{w}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocBlock>

      <DocBlock title="Best Practices">
        <div className="grid gap-3 not-prose">
          {[
            'Never commit private keys to version control. Use environment variables or a secrets manager like Grimoire.',
            'Always start on Calibration testnet. Enable mainnet only after thorough testing in controlled deployments.',
            'Use estimate_cost before every upload. Let the agent decide if storage is affordable before committing funds.',
            'Prefer the outputPath parameter for large retrievals. Avoid printing huge byte arrays in agent context windows.',
            'Keep your @fetcher-fil packages updated. Security fixes and Synapse SDK compatibility updates are released regularly.',
            'Use confirmPaidOperation: true only when the user or application policy has explicitly approved the storage spend.',
          ].map(r => (
            <div key={r} className="rounded-lg border border-border bg-background p-4 flex gap-3 items-start">
              <span className="text-accent shrink-0 mt-0.5 font-bold">—</span>
              <p className="text-sm text-muted-foreground leading-6">{r}</p>
            </div>
          ))}
        </div>
      </DocBlock>
    </DocSection>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background px-8 py-12 md:px-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3"><SpiritLogo /><span className="text-xl font-bold tracking-tight">Fetcher</span></div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">The spirit messenger — 17 tools for AI agents on Filecoin Onchain Cloud. MCP, LangChain, LlamaIndex, SDK.</p>
            <div className="mt-4 flex items-center gap-3">
              <a href="https://github.com/Klorenn/" target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground transition text-sm">GitHub</a>
              <span className="text-border">·</span>
              <a href="https://x.com/kl0ren" target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground transition text-sm">X / Twitter</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-3">Navigation</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {['Why', 'Tools', 'Docs'].map(l => <button key={l} onClick={() => navigate(`#${l.toLowerCase()}`)} className="block bg-transparent border-0 cursor-pointer hover:text-foreground transition">{l}</button>)}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-3">Ecosystem</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="https://filecoin.io" target="_blank" rel="noopener" className="block hover:text-foreground transition">Filecoin</a>
              <a href="https://github.com/Klorenn/" target="_blank" rel="noopener" className="block hover:text-foreground transition">GitHub</a>
              <span className="block text-accent/70">ProPGF Batch 3</span>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-4">
          <span>MIT License · Developed by <a href="https://github.com/Klorenn" target="_blank" rel="noopener" className="text-accent hover:text-accent/80 transition">Kl0ren</a> · 2026</span>
          <span>Built for the Filecoin ecosystem</span>
        </div>
      </div>
    </footer>
  );
}

/* ── Page components ─────────────────────────────────────── */

function LandingPage() {
  return <>
    <Hero /><Ticker /><CodeDemo /><WhySection /><ToolsSection /><IntegrationsSection /><TestimonialSection /><PricingSection /><Footer />
  </>;
}

function DocsPage() {
  return <>
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl px-8 py-4 md:px-28 flex items-center justify-between">
      <button onClick={() => navigate('#')} className="flex items-center gap-3 bg-transparent border-0 cursor-pointer"><SpiritLogo /><span className="text-xl font-bold tracking-tight">Fetcher</span></button>
      <button onClick={() => navigate('#')} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent-soft transition">← Back to home</button>
    </nav>
    <DocsSection />
    <Footer />
  </>;
}

export default function App() {
  const hash = useHash();

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {hash === '#docs' ? <DocsPage /> : <LandingPage />}
    </main>
  );
}
