import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FiActivity, FiEye, FiRadio, FiShield } from "react-icons/fi";
import { Brand, ThemeToggle } from "@/components/sentinel/Layout";
import { PublicFooter } from "@/components/sentinel/PublicFooter";
import {
  CyberBackdrop,
  DetectionPanel,
  PipelineGraphic,
  RadarGraphic,
  ThreatGlobeGraphic,
} from "@/components/sentinel/HeroGraphics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "API Sentinel — Runtime BOLA & Shadow API Detection Engine" },
      {
        name: "description",
        content:
          "Stop broken object level authorization attacks and discover shadow APIs in real time, with OWASP API Top 10 mapping.",
      },
      { property: "og:title", content: "API Sentinel — Runtime API Security" },
      {
        property: "og:description",
        content: "Real-time BOLA detection, shadow API discovery and live traffic monitoring.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: FiShield,
    title: "Real-Time BOLA Detection",
    body: "Behavioural baselines flag object-ID enumeration and cross-tenant access the moment it happens — not in next quarter's pentest.",
  },
  {
    icon: FiEye,
    title: "Shadow API Discovery",
    body: "Continuously fingerprints every route your gateways actually serve and reconciles it against your documented catalogue.",
  },
  {
    icon: FiRadio,
    title: "Live Traffic Monitoring",
    body: "A streaming feed of requests with risk scoring, latency and source attribution, updated every few seconds.",
  },
  {
    icon: FiActivity,
    title: "OWASP Top 10 Mapping",
    body: "Every finding lands pre-mapped to the OWASP API Security Top 10 so remediation owners know exactly what to fix.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Brand />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/login"
              className="rounded-lg border border-border px-3.5 py-2 text-sm transition-colors hover:bg-surface"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <CyberBackdrop />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Runtime detection engine · v4.2
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-gradient mt-6 text-5xl font-semibold tracking-tight sm:text-7xl"
          >
            API Sentinel
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground"
          >
            Runtime BOLA & shadow API detection for teams whose attack surface changes faster than
            their documentation. Watch every request, catch broken authorization as it is exploited.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-9 flex flex-wrap justify-center gap-3"
          >
            <Link
              to="/login"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--glow)] transition-transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
            <Link
              to="/signup"
              className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold transition-colors hover:border-primary/50"
            >
              Create Free Account
            </Link>
          </motion.div>
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["4.8M", "requests / day"],
              ["128", "BOLA attempts blocked"],
              ["17", "shadow APIs found"],
              ["<40ms", "detection latency"],
            ].map(([v, l]) => (
              <div key={l} className="glass-card p-4">
                <p className="text-xl font-semibold">{v}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {l}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto grid max-w-5xl items-center gap-8 px-5 pb-24 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto aspect-square w-full max-w-sm"
          >
            <RadarGraphic />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <DetectionPanel />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Sentinel fingerprints every live route, baselines who may touch which object, and cuts
              off enumeration mid-attack.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-semibold tracking-tight">
              Attacks arrive from everywhere. Detection happens in one place.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Every request from every region is normalised, baselined and scored inline before it
              reaches your objects — a single enforcement point for your whole API estate.
            </p>
            <div className="mt-6">
              <PipelineGraphic />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto aspect-square w-full max-w-sm"
          >
            <ThreatGlobeGraphic />
          </motion.div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          Built for the attacks scanners never see
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass-card p-5"
            >
              <span className="inline-grid size-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <f.icon className="size-4.5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
