import { useEffect, useMemo, useRef } from 'react';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { Button } from './components/ui/button';

const navLinks = ['Docs', 'Examples', 'Grimoire'];

const tools = [
  ['store_file', 'Upload any file. Get a verified CID back.'],
  ['retrieve_file', 'Fetch any file by CID from the network.'],
  ['check_deal', 'Verify a storage deal is active and healthy.'],
  ['list_files', 'List all files your agent has stored.'],
  ['verify_cid', "Cryptographically verify any CID's integrity."],
] as const;

const tickerItems = [
  'npm install fetcher-fil',
  'store_file',
  'retrieve_file',
  'check_deal',
  'verify_cid',
  'list_files',
  'works with Claude',
  'GPT-4o',
  'Gemini',
  'LangChain',
  'LlamaIndex',
  'any MCP client',
];

const quote =
  "Fetcher changed how our agents handle data. We went from losing everything between sessions to having a persistent, verifiable memory on Filecoin. It just works — and that's rare in Web3.";

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
    <div className="relative h-8 w-8 rounded-full bg-[radial-gradient(circle_at_35%_30%,#d7c6ff_0%,#a87dd4_36%,#5b8dff_72%,#171027_100%)] shadow-[0_0_28px_rgba(168,125,212,0.45)]">
      <div className="absolute left-2 top-1.5 h-2 w-2 rounded-full bg-white/90 blur-[0.2px]" />
      <div className="absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full border border-white/50" />
    </div>
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
              <a key={link} href={`#${link.toLowerCase()}`} className="transition hover:text-foreground">
                {link}
              </a>
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
          Fetcher lets your AI agents store, retrieve
          <br className="hidden sm:block" />
          and verify data on Filecoin — in one install.
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
// done. your agent now has Filecoin.`}
            </pre>
            <div className="mt-6 flex flex-wrap gap-3">
              {['5 MCP tools', '1 npm install', '0 blockchain knowledge'].map((stat) => (
                <span key={stat} className="rounded-full border border-accent/25 bg-accent-soft/55 px-3 py-1.5 text-[11px] text-accent md:text-xs">
                  {stat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute bottom-0 z-30 h-40 w-full bg-gradient-to-t from-background to-transparent" />
      <img src="/fetcher-lavender-frame2.png" alt="" aria-hidden="true" className="sr-only" />
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

function ToolsSection() {
  return (
    <section id="examples" className="min-h-screen px-8 py-24 md:px-28 md:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl font-serif text-4xl leading-tight text-foreground md:text-5xl"
        >
          Five tools. One install. Full Filecoin.
        </motion.h2>
        <div className="mt-16 grid gap-5 md:grid-cols-6">
          {tools.map(([name, description], index) => (
            <motion.article
              key={name}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, delay: index * 0.1 }}
              className="rounded-xl border border-border bg-card p-6 md:col-span-2 [&:nth-last-child(2)]:md:col-start-2"
            >
              <div className="mb-6 h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_18px_rgba(168,125,212,0.8)]" />
              <h3 className="font-mono text-sm text-accent">{name}</h3>
              <p className="mt-4 leading-7 text-muted-foreground">{description}</p>
            </motion.article>
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
          <div className="h-12 w-12 rounded-full bg-[radial-gradient(circle_at_35%_25%,#f2eff8,#a87dd4_48%,#322148_100%)]" />
          <div>
            <p className="font-semibold text-foreground">Alex Chen</p>
            <p className="text-sm text-muted-foreground">AI Engineer at Latitude</p>
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
          <a href="#docs" className="mt-8 inline-flex text-sm font-semibold text-foreground transition hover:text-accent">
            Explore Grimoire →
          </a>
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
            Give your agents the power to store, retrieve and verify any data on Filecoin. One npm install.
          </p>
        </motion.div>
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
          {['Docs', 'GitHub', 'Grimoire', 'Filecoin'].map((link) => (
            <a key={link} href="#docs" className="transition hover:text-foreground">
              {link}
            </a>
          ))}
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

export default function App() {
  return (
    <main id="hero" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <CustomCursor />
      <Hero />
      <Ticker />
      <ToolsSection />
      <TestimonialSection />
      <EcosystemSection />
      <Footer />
    </main>
  );
}
