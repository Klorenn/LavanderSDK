import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { Button } from './components/ui/button';

const navLinks = ['Docs', 'Tools', 'Integrations', 'Grimoire'];

function useHash() {
  return useSyncExternalStore(
    () => {
      const handler = () => {};
      window.addEventListener('hashchange', handler);
      return () => window.removeEventListener('hashchange', handler);
    },
    () => window.location.hash
  );
}

function navigate(hash: string) {
  window.location.hash = hash;
}

const tools = [
  { name: 'store_file', desc: 'Upload any file. Get a permanent, verified CID on Filecoin.', group: 'Storage' },
  { name: 'retrieve_file', desc: 'Fetch any file by CID. Text, JSON, or binary.', group: 'Storage' },
  { name: 'list_files', desc: 'List all files with tags, filters, and pagination.', group: 'Storage' },
  { name: 'verify_cid', desc: 'Cryptographic integrity check with PDP evidence.', group: 'Verify' },
  { name: 'check_deal', desc: 'Confirm storage deal state — active providers, expiry, redundancy.', group: 'Verify' },
  { name: 'store_memory', desc: 'Persist agent context between sessions. Versioned, TTL-aware.', group: 'Memory' },
  { name: 'retrieve_memory', desc: 'Recall agent state from previous conversations.', group: 'Memory' },
  { name: 'estimate_cost', desc: 'Estimate storage cost before uploading. Full breakdown.', group: 'Observe' },
  { name: 'get_storage_stats', desc: 'Dashboard: total files, GB stored, active deals, tags used.', group: 'Observe' },
] as const;

const tickerItems = [
  'npm install fetcher-fil',
  'store_file', 'retrieve_file', 'list_files', 'delete_file',
  'verify_cid', 'check_deal', 'get_proof',
  'get_balance', 'estimate_cost', 'get_storage_stats', 'list_deals',
  'store_memory', 'retrieve_memory', 'update_memory', 'list_memories', 'delete_memory',
  'prepare_storage',
  'Claude Desktop', 'GPT-4o', 'Gemini', 'LangChain', 'LlamaIndex',
  'SDK direct', 'any MCP client', '17 tools total',
];

const groups = ['Storage', 'Verify', 'Observe', 'Memory', 'Payments'] as const;

const quote =
  "17 tools, four frameworks, one npm install. Fetcher is the missing bridge between AI agents and Filecoin Onchain Cloud. We shipped an MCP server in two hours — the rest of the week was just playing with it.";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: 'easeOut' as const },
  }),
};

function SpiritLogo() {
  return (
    <img src="/fetcher-icon.png" alt="Fetcher" className="h-8 w-8 rounded-full object-cover shadow-[0_0_28px_rgba(168,125,212,0.45)]" />
  );
}

function CustomCursor() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cursor = document.createElement('div');
    cursor.style.cssText = `
      position: fixed; pointer-events: none; z-index: 9999;
      width: 8px; height: 8px; border-radius: 50%;
      background: rgba(168,125,212,0.8);
      transition: transform 0.15s ease;
    `;
    document.body.appendChild(cursor);

    const move = (event: MouseEvent) => {
      cursor.style.left = `${event.clientX - 4}px`;
      cursor.style.top = `${event.clientY - 4}px`;
    };
    document.addEventListener('mousemove', move);

    return () => {
      document.removeEventListener('mousemove', move);
      cursor.remove();
    };
  }, []);

  return null;
}

function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -200]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, -250]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let forward = true;
    const handleEnded = () => {
      forward = !forward;
      video.playbackRate = forward ? 1 : -1;
      void video.play();
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-background">
      <video
        id="hero-video"
        ref={videoRef}
        src="/fetcher-lavender.mp4"
        poster="/fetcher-lavender-frame1.png"
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(168,125,212,0.10),transparent_38%),linear-gradient(180deg,rgba(7,6,16,0.26),rgba(7,6,16,0.08)_45%,rgba(7,6,16,0.72))]" />

      <nav className="relative z-40 flex items-center justify-between px-8 py-4 md:px-28">
        <div className="flex items-center gap-7">
          <a href="#hero" className="flex items-center gap-3" aria-label="Fetcher home">
            <SpiritLogo />
            <span className="text-xl font-bold tracking-tight">Fetcher</span>
          </a>
          <div className="hidden items-center gap-7 text-sm font-medium text-foreground/72 md:flex">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => navigate(link === 'Docs' ? '#docs' : `#${link.toLowerCase()}`)}
                className="bg-transparent border-0 cursor-pointer transition hover:text-foreground"
              >
                {link}
              </button>
            ))}
          </div>
        </div>
        <Button className="rounded-lg bg-[#F2EFF8] px-4 font-semibold text-[#070610] hover:opacity-90">
          npm install
        </Button>
      </nav>

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-30 mx-auto mt-16 flex max-w-5xl flex-col items-center px-4 text-center md:mt-20"
      >
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="liquid-glass mb-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/90"
        >
          <span className="rounded-md bg-accent px-2 py-1 text-xs font-bold text-background">MCP</span>
          <span className="rounded-md bg-[#5b8dff]/20 px-2 py-1 text-xs font-bold text-[#9db8ff]">LangChain</span>
          <span className="rounded-md bg-[#a87dd4]/20 px-2 py-1 text-xs font-bold text-accent">LlamaIndex</span>
          <span>Connect your AI agents to Filecoin</span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="mb-3 text-5xl font-medium leading-tight tracking-[-2px] text-foreground md:text-7xl"
          aria-label="Your data. One clear spirit away."
        >
          Your data.
          <br />
          One clear <span className="font-serif italic">spirit</span> away.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="mb-8 max-w-2xl text-lg leading-8 text-hero-subtitle opacity-90"
        >
          Fetcher gives your AI agents 17 tools to store, retrieve,
          <br className="hidden sm:block" />
          verify and remember data on Filecoin — in one install.
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.3}>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button size="pill" className="rounded-full bg-foreground px-8 py-3.5 text-base font-medium text-background">
              Get Started for Free
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ y: dashboardY, mixBlendMode: 'luminosity' }}
        variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4 } } }}
        initial="hidden"
        animate="visible"
        className="relative z-20 mx-auto mt-10 aspect-video w-[90%] max-w-5xl rounded-2xl md:mt-12"
      >
        <div className="liquid-glass h-full rounded-2xl p-4 shadow-[0_30px_100px_rgba(7,6,16,0.65)] md:p-7">
          <div className="h-full rounded-xl border border-white/10 bg-[#05040b]/88 p-4 text-left font-mono text-xs text-foreground/90 shadow-2xl md:p-7 md:text-sm">
            <div className="mb-5 flex gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff6b8b]" />
              <span className="h-3 w-3 rounded-full bg-[#ffd166]" />
              <span className="h-3 w-3 rounded-full bg-[#a87dd4]" />
            </div>
            <pre className="whitespace-pre-wrap leading-7 text-foreground/88">
{`{
  "mcpServers": {
    "fetcher": {
      "command": "npx fetcher-fil"
    }
  }
}
// done. your agent now has Filecoin.
// 17 tools. 3 frameworks. 1 install.`}
            </pre>
            <div className="mt-6 flex flex-wrap gap-3">
              {['17 MCP tools', '1 npm install', '0 blockchain knowledge', 'LangChain', 'LlamaIndex', 'Agent memory'].map((stat) => (
                <span key={stat} className="rounded-full border border-accent/25 bg-accent-soft/55 px-3 py-1.5 text-[11px] text-accent md:text-xs">
                  {stat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute bottom-0 z-30 h-40 w-full bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

function Ticker() {
  const track = useMemo(() => [...tickerItems, ...tickerItems], []);

  return (
    <div className="overflow-hidden border-y border-border/50 bg-accent-soft py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-accent">
      <div className="flex w-max animate-ticker gap-4 whitespace-nowrap">
        {track.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-4">
            {item} <span aria-hidden="true">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const codeSnippets = {
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
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";

const backend = await createSynapseBackend({
  privateKey: process.env.FILECOIN_PRIVATE_KEY
});

const tools = createFetcherTools({
  backend,
  spendingPolicy: { allowPaidOperations: true }
});

const agent = await createOpenAIFunctionsAgent({
  llm: new ChatOpenAI({ model: "gpt-4o" }),
  tools
});

const executor = new AgentExecutor({ agent, tools });

await executor.invoke({
  input: "Store the quarterly report on Filecoin"
});`,
  llamaindex: `import { createFetcherTools } from "@fetcher-fil/llamaindex";
import { createSynapseBackend } from "@fetcher-fil/core";
import { OpenAIAgent, OpenAI } from "llamaindex";

const backend = await createSynapseBackend({
  privateKey: process.env.FILECOIN_PRIVATE_KEY
});

const tools = createFetcherTools({
  backend,
  spendingPolicy: { allowPaidOperations: true }
});

const agent = new OpenAIAgent({
  llm: new OpenAI({ model: "gpt-4o" }),
  tools
});

const response = await agent.chat({
  message: "What files have I stored?"
});`,
  sdk: `import { Fetcher } from "@fetcher-fil/sdk";
import { createSynapseBackend } from "@fetcher-fil/core";

const fetcher = new Fetcher({
  backend: await createSynapseBackend({
    privateKey: process.env.FILECOIN_PRIVATE_KEY
  }),
  spendingPolicy: { allowPaidOperations: true }
});

const { cid, url } = await fetcher.store({
  content: "Hello Filecoin",
  filename: "hello.txt"
});

await fetcher.memory.store({
  agentId: "my-agent",
  memoryKey: "preferences",
  data: { theme: "dark" }
});

const stats = await fetcher.stats();`
};

const tabs = [
  { id: 'mcp', label: 'MCP', color: 'bg-accent', textColor: 'text-accent' },
  { id: 'langchain', label: 'LangChain', color: 'bg-[#5b8dff]', textColor: 'text-[#5b8dff]' },
  { id: 'llamaindex', label: 'LlamaIndex', color: 'bg-[#a87dd4]', textColor: 'text-[#a87dd4]' },
  { id: 'sdk', label: 'SDK', color: 'bg-[#7bd4a8]', textColor: 'text-[#7bd4a8]' },
] as const;

type TabId = typeof tabs[number]['id'];

function highlightCode(code: string): string {
  return code
    .replace(/(import\s+.*?from\s+["'].*?["'])/g, '<span class="text-[#d7c6ff]">$1</span>')
    .replace(/(const\s+\w+|let\s+\w+|await\s+)/g, '<span class="text-[#5b8dff]">$1</span>')
    .replace(/(async\s+|function\s+|class\s+|new\s+)/g, '<span class="text-[#5b8dff]">$1</span>')
    .replace(/(["'])((?:(?=(\\?))\3.)*?)\1/g, '<span class="text-[#7bd4a8]">$1$2$1</span>')
    .replace(/(FILECOIN_PRIVATE_KEY|FILECOIN_NETWORK|FILECOIN_AGENT_ALLOW_PAID)/g, '<span class="text-[#ffd166]">$1</span>')
    .replace(/(0x\.\.\.)/g, '<span class="text-[#ff6b8b]">$1</span>')
    .replace(/(calibration|mainnet|true|false)/g, '<span class="text-[#ff6b8b]">$1</span>')
    .replace(/({|\}|\(|\))/g, '<span class="text-foreground/50">$1</span>')
    .replace(/(process\.env)/g, '<span class="text-[#a87dd4]">$1</span>')
    .replace(/(\.store\(|\.memory\.|\.stats\(|\.chat\(|\.invoke\(|\.retrieve\()/g, '<span class="text-accent">$1</span>')
    .replace(/("""|`)/g, '<span class="text-foreground/50">$1</span>')
    .replace(/(models)/g, '<span class="text-[#d7c6ff]">$1</span>');
}

function CodeDemo() {
  const [activeTab, setActiveTab] = useState<TabId>('mcp');
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const snippet = codeSnippets[activeTab];

  return (
    <section ref={sectionRef} id="quickstart" className="px-8 py-24 md:px-28 md:py-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">
            Pick your framework. It just works.
          </h2>
          <p className="mt-4 mx-auto max-w-xl text-lg text-muted-foreground">
            Same 17 tools. Same semantics. Four integrations. One <code className="rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent">npm install</code>.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-12 rounded-2xl border border-border/60 bg-[#05040b] shadow-[0_30px_90px_rgba(7,6,16,0.7)] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/40 bg-[#0a0814]">
            <span className="h-3 w-3 rounded-full bg-[#ff6b8b]" />
            <span className="h-3 w-3 rounded-full bg-[#ffd166]" />
            <span className="h-3 w-3 rounded-full bg-[#7bd4a8]" />
            <div className="ml-6 flex gap-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? `${tab.textColor} bg-white/5`
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className={`absolute bottom-0 left-2 right-2 h-0.5 ${tab.color} rounded-full`}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="p-5 md:p-8 font-mono text-xs md:text-sm leading-relaxed min-h-[200px]">
              <pre className="whitespace-pre-wrap text-foreground/85">
                <code dangerouslySetInnerHTML={{ __html: highlightCode(snippet) }} />
              </pre>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                navigator.clipboard.writeText(snippet);
              }}
              className="absolute top-3 right-3 rounded-md bg-white/5 px-2.5 py-1.5 text-[11px] text-foreground/50 hover:text-foreground hover:bg-white/10 transition"
              title="Copy to clipboard"
            >
              copy
            </motion.button>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-[#0a0814] text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7bd4a8] animate-pulse" />
              {activeTab === 'mcp' ? '~/.config/claude/claude_desktop_config.json' :
               activeTab === 'langchain' ? 'src/agent.ts' :
               activeTab === 'llamaindex' ? 'src/agent.ts' : 'src/index.ts'}
            </span>
            <span className="flex items-center gap-4">
              <span className="text-[#7bd4a8]">{snippet.split('\n').length} lines</span>
              <span>{activeTab === 'mcp' ? 'JSON config' : 'TypeScript'}</span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ToolsSection() {
  return (
    <section id="tools" className="px-8 py-24 md:px-28 md:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl font-serif text-4xl leading-tight text-foreground md:text-5xl"
        >
          17 tools. One install. Full Filecoin Onchain Cloud.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 max-w-2xl text-lg text-muted-foreground"
        >
          Five groups — Storage, Verify, Observe, Memory, Payments — available on MCP, LangChain, LlamaIndex, and SDK direct.
        </motion.p>
        <div className="mt-16 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {tools.map(({ name, desc, group }, index) => (
            <motion.article
              key={name}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-5 flex items-center gap-2">
                <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">{group}</span>
              </div>
              <h3 className="font-mono text-sm text-accent">{name}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{desc}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function IntegrationsSection() {
  const cards = [
    { title: 'MCP Server', desc: 'Claude Desktop in one config line. Zero code.', color: 'accent', badge: 'MCP' },
    { title: 'LangChain Toolkit', desc: 'FetcherToolkit with 17 DynamicStructuredTools. Native ReAct support.', color: '[#5b8dff]', badge: 'LangChain' },
    { title: 'LlamaIndex Tools', desc: '17 FunctionTools for OpenAIAgent. Full JSON schema support.', color: '[#a87dd4]', badge: 'LlamaIndex' },
    { title: 'SDK Direct', desc: 'Fetcher class with fluent API: fetcher.store(), fetcher.memory.store(), fetcher.stats().', color: '[#7bd4a8]', badge: 'SDK' },
  ];

  return (
    <section id="integrations" className="px-8 py-24 md:px-28 md:py-32 bg-card/30">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl font-serif text-4xl leading-tight text-foreground md:text-5xl"
        >
          One SDK. Four ways to use it.
        </motion.h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-xl border border-border bg-background p-7"
            >
              <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-${card.color} bg-${card.color}/10`}>
                {card.badge}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-foreground">{card.title}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const words = quote.split(' ');
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end center'] });

  return (
    <section ref={sectionRef} className="flex min-h-screen items-center px-8 py-24 md:px-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-4xl font-medium leading-tight tracking-[-1px] md:text-6xl md:leading-tight">
          {words.map((word, index) => {
            const start = index / words.length;
            const end = Math.min(1, start + 0.14);
            const opacity = useTransform(scrollYProgress, [start, end], [0.2, 1]);
            const color = useTransform(scrollYProgress, [start, end], ['hsl(270 10% 35%)', 'hsl(270 30% 95%)']);

            return (
              <motion.span key={`${word}-${index}`} style={{ opacity, color }} className="mr-[0.3em] inline-block">
                {word}
              </motion.span>
            );
          })}
        </p>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mt-12 flex items-center gap-4"
        >
          <img src="/fetcher-icon.png" alt="" className="h-12 w-12 rounded-full object-cover shadow-[0_0_20px_rgba(168,125,212,0.35)]" />
          <div>
            <p className="font-semibold text-foreground">Ghost</p>
            <p className="text-sm text-muted-foreground">Filecoin ProPGF Batch 3</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function EcosystemSection() {
  return (
    <section id="grimoire" className="px-8 py-24 md:px-28">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_auto_1fr] md:gap-14">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="py-4"
        >
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Grimoire</p>
          <h2 className="mt-5 font-serif text-4xl text-foreground md:text-5xl">The keeper of secrets</h2>
          <p className="mt-6 max-w-md leading-8 text-muted-foreground">
            Store API keys, credentials and secrets permanently on Filecoin. Your agents never lose them between sessions.
          </p>
        </motion.div>

        <div className="hidden w-px bg-border md:block" />

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="py-4"
        >
          <div className="flex items-center gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#9db8ff]">Fetcher</p>
            <span className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs text-accent">You are here</span>
          </div>
          <h2 className="mt-5 font-serif text-4xl text-foreground md:text-5xl">The spirit messenger</h2>
          <p className="mt-6 max-w-md leading-8 text-muted-foreground">
            17 tools. MCP, LangChain, LlamaIndex, SDK. Agent memory. One npm install.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function DocsSection() {
  return (
    <section id="docs" className="px-8 py-24 md:px-28 md:py-32 bg-card/20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent mb-3">Documentation</p>
          <h2 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">Everything you need</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            From zero to Filecoin in five minutes. MCP, LangChain, LlamaIndex, SDK — same 17 tools, same semantics.
          </p>
        </motion.div>

        <div className="space-y-20">
          {/* Quickstart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-accent mb-2">Get started</h3>
            <h2 className="font-serif text-3xl text-foreground mb-6">Quickstart</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-6">
                <h4 className="font-semibold text-foreground mb-3">1. Get a wallet</h4>
                <p className="text-sm text-muted-foreground leading-6">
                  Add Filecoin Calibration to MetaMask: RPC <code className="rounded bg-accent-soft px-1 text-xs text-accent">https://api.calibration.node.glif.io/rpc/v1</code>, Chain ID <code className="rounded bg-accent-soft px-1 text-xs text-accent">314159</code>. Get test tokens at <code className="rounded bg-accent-soft px-1 text-xs text-accent">faucet.calibration.fildev.network</code>.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-6">
                <h4 className="font-semibold text-foreground mb-3">2. Install</h4>
                <p className="text-sm text-muted-foreground leading-6">
                  <code className="rounded bg-accent-soft px-1 text-xs text-accent">npm install @fetcher-fil/core</code>. Add your adapter: <code className="rounded bg-accent-soft px-1 text-xs text-accent">@fetcher-fil/mcp</code>, <code className="rounded bg-accent-soft px-1 text-xs text-accent">@fetcher-fil/langchain</code>, or <code className="rounded bg-accent-soft px-1 text-xs text-accent">@fetcher-fil/llamaindex</code>.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-6">
                <h4 className="font-semibold text-foreground mb-3">3. Configure</h4>
                <p className="text-sm text-muted-foreground leading-6">
                  Set <code className="rounded bg-accent-soft px-1 text-xs text-accent">FILECOIN_PRIVATE_KEY</code> env var with your EVM wallet private key. Start on Calibration testnet first.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-6">
                <h4 className="font-semibold text-foreground mb-3">4. Use it</h4>
                <p className="text-sm text-muted-foreground leading-6">
                  For MCP: add the config to Claude Desktop. For code: <code className="rounded bg-accent-soft px-1 text-xs text-accent">createFetcherTools({'{ backend, spendingPolicy }'})</code>. That's it. 17 tools available.
                </p>
              </div>
            </div>
          </motion.div>

          {/* MCP Setup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-accent mb-2">Integration</h3>
            <h2 className="font-serif text-3xl text-foreground mb-6">MCP Setup — Claude Desktop</h2>
            <div className="rounded-xl border border-border bg-[#05040b] p-5 md:p-7">
              <div className="mb-4 flex gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff6b8b]" />
                <span className="h-3 w-3 rounded-full bg-[#ffd166]" />
                <span className="h-3 w-3 rounded-full bg-[#7bd4a8]" />
                <span className="ml-4 font-mono text-xs text-muted-foreground">~/.config/claude/claude_desktop_config.json</span>
              </div>
              <pre className="font-mono text-xs md:text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
{`{
  <span class="text-[#5b8dff]">"mcpServers"</span>: {
    <span class="text-[#5b8dff]">"fetcher"</span>: {
      <span class="text-[#5b8dff]">"command"</span>: <span class="text-[#7bd4a8]">"npx"</span>,
      <span class="text-[#5b8dff]">"args"</span>: [<span class="text-[#7bd4a8]">"@fetcher-fil/mcp"</span>],
      <span class="text-[#5b8dff]">"env"</span>: {
        <span class="text-[#5b8dff]">"FILECOIN_PRIVATE_KEY"</span>: <span class="text-[#7bd4a8]">"0x..."</span>,
        <span class="text-[#5b8dff]">"FILECOIN_NETWORK"</span>: <span class="text-[#7bd4a8]">"calibration"</span>,
        <span class="text-[#5b8dff]">"FILECOIN_AGENT_ALLOW_PAID"</span>: <span class="text-[#7bd4a8]">"true"</span>
      }
    }
  }
}`}
              </pre>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { label: 'Env', value: 'FILECOIN_PRIVATE_KEY', desc: 'EVM wallet private key (required)' },
                { label: 'Env', value: 'FILECOIN_NETWORK', desc: 'calibration | mainnet (default: calibration)' },
                { label: 'Env', value: 'FILECOIN_AGENT_ALLOW_PAID', desc: 'true to enable storage payments' },
              ].map((env) => (
                <div key={env.value} className="rounded-lg border border-border bg-background p-4">
                  <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent uppercase">{env.label}</span>
                  <code className="mt-2 block text-xs font-semibold text-foreground">{env.value}</code>
                  <p className="mt-1 text-xs text-muted-foreground">{env.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* API Reference — all 17 tools */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-accent mb-2">Reference</h3>
            <h2 className="font-serif text-3xl text-foreground mb-6">API — All 17 Tools</h2>
            <p className="mb-10 text-muted-foreground leading-7">
              Available on all adapters: MCP, LangChain, LlamaIndex, SDK. Same names, same semantics.
            </p>

            {[
              { group: 'Storage', color: 'text-[#5b8dff]', tools: [
                { name: 'store_file', params: 'content, filename, mimeType?, tags?, copies?, confirmPaidOperation?', returns: '{ cid, url, size, timestamp, dealStatus, provider }' },
                { name: 'retrieve_file', params: 'cid, outputPath?, encoding?', returns: '{ content, mimeType, size, cid, latencyMs }' },
                { name: 'list_files', params: 'tag?, limit?, before?', returns: '{ files: [{ cid, filename, size, tags, dealStatus, url }], total, hasMore }' },
                { name: 'delete_file', params: 'cid, confirm', returns: '{ removedFromIndex, cid, note }' },
              ]},
              { group: 'Verify', color: 'text-[#a87dd4]', tools: [
                { name: 'verify_cid', params: 'cid, checkGateways?', returns: '{ verified, accessible, integrity, size, gatewaysChecked }' },
                { name: 'check_deal', params: 'cid', returns: '{ dealActive, providers[], expiryDate, redundancy, lastProofTimestamp }' },
                { name: 'get_proof', params: 'cid', returns: '{ proof, proofType, verifiedAt, provider, blockNumber? }' },
              ]},
              { group: 'Observe', color: 'text-[#7bd4a8]', tools: [
                { name: 'get_balance', params: '—', returns: '{ balanceUsdfc, balanceFil, pendingPayments, availableUsdfc }' },
                { name: 'estimate_cost', params: 'sizeBytes, copies?, durationDays?', returns: '{ estimatedCostUsdfc, breakdown: { storageCost, retrievalCost, providerFee } }' },
                { name: 'get_storage_stats', params: 'agentId?', returns: '{ totalFiles, totalSizeGb, totalMemories, activeDeals, tagsUsed[] }' },
                { name: 'list_deals', params: 'status?, limit?', returns: '{ deals: [{ cid, providers[], expiry, status }], total }' },
              ]},
              { group: 'Memory', color: 'text-[#ffd166]', tools: [
                { name: 'store_memory', params: 'agentId, memoryKey, data, ttlDays?, overwrite?', returns: '{ cid, memoryKey, agentId, timestamp, version, previousCid? }' },
                { name: 'retrieve_memory', params: 'agentId, memoryKey, fallback?', returns: '{ data, cid, timestamp, ageDays, version, found }' },
                { name: 'update_memory', params: 'agentId, memoryKey, patch', returns: '{ cid, previousCid, memoryKey, updatedFields[] }' },
                { name: 'list_memories', params: 'agentId, limit?', returns: '{ memories: [{ memoryKey, cid, size }], total }' },
                { name: 'delete_memory', params: 'agentId, memoryKey, confirm', returns: '{ deleted, agentId, memoryKey }' },
              ]},
              { group: 'Payments', color: 'text-[#ff6b8b]', tools: [
                { name: 'prepare_storage', params: 'bytes, months?, confirmPaidOperation?', returns: '{ ready, costUsdfc, balanceBefore, allowanceSet, shortfall? }' },
              ]},
            ].map(({ group, color, tools: groupTools }) => (
              <div key={group} className="mb-10">
                <h4 className={`font-mono text-sm font-semibold ${color} mb-4 uppercase tracking-wider`}>{group}</h4>
                <div className="space-y-3">
                  {groupTools.map((t) => (
                    <div key={t.name} className="rounded-lg border border-border bg-background p-4 md:p-5">
                      <div className="flex flex-wrap items-baseline gap-2 mb-2">
                        <code className="font-mono text-sm font-bold text-accent">{t.name}</code>
                        <span className="text-xs text-muted-foreground">({t.params})</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                        <span className="text-[#5b8dff]">→</span> {t.returns}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Memory Guide */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-accent mb-2">Differential</h3>
            <h2 className="font-serif text-3xl text-foreground mb-6">Agent Memory — Persist between sessions</h2>
            <p className="mb-8 text-muted-foreground leading-7">
              Fetcher gives AI agents structured, versioned memory on Filecoin. Nobody else has this. Each memory is stored as JSON, indexed locally, and retrievable across sessions with automatic TTL expiration.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              {[
                { title: 'Versioned', desc: 'Every store_memory increments the version counter. Detect conflicts and track changes over time.' },
                { title: 'TTL-aware', desc: 'Set ttlDays to auto-expire memories. Expired memories return found: false on retrieval.' },
                { title: 'Patch updates', desc: 'update_memory merges specific fields without replacing the whole object. Only changed keys are re-uploaded.' },
                { title: 'Fallback values', desc: 'retrieve_memory accepts an optional fallback object — no need for null checks in agent logic.' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-background p-5">
                  <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                  <p className="mt-2 text-sm text-muted-foreground leading-6">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-border bg-[#05040b] p-5 md:p-7 overflow-x-auto">
              <pre className="font-mono text-xs md:text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
{`<span class="text-muted-foreground">// Store memory</span>
<span class="text-[#5b8dff]">await</span> fetcher.memory.store({
  <span class="text-[#5b8dff]">agentId</span>: <span class="text-[#7bd4a8]">"my-assistant"</span>,
  <span class="text-[#5b8dff]">memoryKey</span>: <span class="text-[#7bd4a8]">"preferences"</span>,
  <span class="text-[#5b8dff]">data</span>: { <span class="text-[#5b8dff]">theme</span>: <span class="text-[#7bd4a8]">"dark"</span>, <span class="text-[#5b8dff]">lang</span>: <span class="text-[#7bd4a8]">"es"</span> },
  <span class="text-[#5b8dff]">ttlDays</span>: <span class="text-[#ff6b8b]">30</span>
});

<span class="text-muted-foreground">// Retrieve next session</span>
<span class="text-[#5b8dff]">const</span> mem = <span class="text-[#5b8dff]">await</span> fetcher.memory.retrieve({
  <span class="text-[#5b8dff]">agentId</span>: <span class="text-[#7bd4a8]">"my-assistant"</span>,
  <span class="text-[#5b8dff]">memoryKey</span>: <span class="text-[#7bd4a8]">"preferences"</span>,
  <span class="text-[#5b8dff]">fallback</span>: { <span class="text-[#5b8dff]">theme</span>: <span class="text-[#7bd4a8]">"light"</span> }
});
<span class="text-muted-foreground">// → { found: true, data: { theme: "dark", lang: "es" }, version: 1 }</span>

<span class="text-muted-foreground">// Update a single field</span>
<span class="text-[#5b8dff]">await</span> fetcher.memory.update({
  <span class="text-[#5b8dff]">agentId</span>: <span class="text-[#7bd4a8]">"my-assistant"</span>,
  <span class="text-[#5b8dff]">memoryKey</span>: <span class="text-[#7bd4a8]">"preferences"</span>,
  <span class="text-[#5b8dff]">patch</span>: { <span class="text-[#5b8dff]">theme</span>: <span class="text-[#7bd4a8]">"system"</span> }
});
<span class="text-muted-foreground">// → { cid, previousCid, updatedFields: ["theme"], version: 2 }</span>`}
              </pre>
            </div>
          </motion.div>

          {/* Safety */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-accent mb-2">Safety</h3>
            <h2 className="font-serif text-3xl text-foreground mb-6">Security defaults</h2>
            <p className="mb-6 text-muted-foreground leading-7">
              AI agents are useful, but they shouldn't have unlimited spending power. Fetcher blocks paid operations by default.
            </p>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/50">
                    <th className="px-5 py-3 font-medium text-foreground">Setting</th>
                    <th className="px-5 py-3 font-medium text-foreground">Default</th>
                    <th className="px-5 py-3 font-medium text-foreground hidden md:table-cell">Why</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ['Network', 'Calibration', 'Testnet first. Mainnet is an explicit decision.'],
                    ['Paid operations', 'Disabled', 'Agents should not spend money without approval.'],
                    ['Confirmation', 'Required', 'Every paid operation needs confirmPaidOperation: true'],
                    ['Max bytes/call', '10 MiB', 'Prevents runaway storage costs from a single call.'],
                    ['Min data size', '127 bytes', 'Filecoin protocol minimum enforced by Synapse.'],
                  ].map(([setting, def, why]) => (
                    <tr key={setting} className="bg-background">
                      <td className="px-5 py-3 font-medium text-foreground">{setting}</td>
                      <td className="px-5 py-3"><code className="rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent">{def}</code></td>
                      <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                { emoji: '🔑', text: 'Never commit private keys. Use env vars or Grimoire for secret management.' },
                { emoji: '🧪', text: 'Start on Calibration testnet. Enable mainnet only in controlled deployments.' },
                { emoji: '💰', text: 'Use estimate_cost before uploading. Let the agent decide if it can afford storage.' },
                { emoji: '📁', text: 'Prefer outputPath for large retrievals. Avoid printing huge byte arrays in agent context.' },
              ].map((rule) => (
                <div key={rule.text} className="rounded-lg border border-border bg-background p-4 flex gap-3 items-start">
                  <span className="text-lg shrink-0">{rule.emoji}</span>
                  <p className="text-sm text-muted-foreground leading-6">{rule.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="docs" className="border-t-[0.5px] border-border bg-background px-8 py-12 md:px-28">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <SpiritLogo />
            <span className="text-xl font-bold tracking-tight">Fetcher</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">The spirit that fetches data from Filecoin</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-muted-foreground md:justify-center">
          <button onClick={() => navigate('#docs')} className="transition hover:text-foreground bg-transparent border-0 cursor-pointer">Docs</button>
          <a href="https://github.com/Klorenn/" target="_blank" rel="noopener noreferrer" className="transition hover:text-foreground">GitHub</a>
          <a href="https://x.com/kl0ren" target="_blank" rel="noopener noreferrer" className="transition hover:text-foreground">X / Twitter</a>
          <a href="https://filecoin.io" target="_blank" rel="noopener noreferrer" className="transition hover:text-foreground">Filecoin</a>
        </div>
        <div className="md:text-right">
          <span className="rounded-full border border-accent/25 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
            Filecoin ProPGF Batch 3
          </span>
          <p className="mt-4 text-sm text-muted-foreground">MIT License · Open Source</p>
        </div>
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <>
      <Hero />
      <Ticker />
      <CodeDemo />
      <ToolsSection />
      <IntegrationsSection />
      <TestimonialSection />
      <EcosystemSection />
      <Footer />
    </>
  );
}

export default function App() {
  const hash = useHash();

  if (hash === '#docs') {
    return (
      <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
        <CustomCursor />
        <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl px-8 py-4 md:px-28 flex items-center justify-between">
          <button onClick={() => navigate('#')} className="flex items-center gap-3 bg-transparent border-0 cursor-pointer">
            <SpiritLogo />
            <span className="text-xl font-bold tracking-tight">Fetcher</span>
          </button>
          <button
            onClick={() => navigate('#')}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent-soft transition"
          >
            ← Back to home
          </button>
        </nav>
        <DocsSection />
      </main>
    );
  }

  return (
    <main id="hero" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <CustomCursor />
      <LandingPage />
    </main>
  );
}
