import { motion } from "framer-motion";

/** Decorative animated background: gradient orbs + scanning line. */
export function CyberBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="orb animate-float -left-24 top-[-6rem] size-[26rem]" />
      <div className="orb animate-float right-[-8rem] top-24 size-[22rem] [animation-delay:2s]" />
      <motion.div
        initial={{ y: "-10%" }}
        animate={{ y: "110%" }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        className="absolute inset-x-0 h-24 bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]"
      />
    </div>
  );
}

/** Radar-style SVG showing endpoints being scanned. */
export function RadarGraphic() {
  const dots = [
    { x: 120, y: 70, r: 4, delay: 0 },
    { x: 68, y: 128, r: 3, delay: 0.6 },
    { x: 158, y: 148, r: 5, delay: 1.2 },
    { x: 104, y: 176, r: 3, delay: 1.8 },
  ];
  return (
    <svg viewBox="0 0 240 240" className="size-full" role="img" aria-label="API traffic radar">
      <defs>
        <linearGradient id="sentinel-sweep-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="text-primary">
        {[110, 82, 54, 26].map((r) => (
          <circle key={r} cx="120" cy="120" r={r} fill="none" stroke="currentColor" strokeOpacity="0.25" />
        ))}
        <line x1="10" y1="120" x2="230" y2="120" stroke="currentColor" strokeOpacity="0.15" />
        <line x1="120" y1="10" x2="120" y2="230" stroke="currentColor" strokeOpacity="0.15" />
        <g className="animate-sweep" style={{ transformOrigin: "120px 120px" }}>
          <path d="M120 120 L120 10 A110 110 0 0 1 220 85 Z" fill="url(#sentinel-sweep-grad)" />
        </g>
        {dots.map((d) => (
          <g key={`${d.x}-${d.y}`}>
            <circle
              cx={d.x}
              cy={d.y}
              r={d.r * 3}
              fill="currentColor"
              className="animate-radar-ping"
              style={{ transformOrigin: `${d.x}px ${d.y}px`, animationDelay: `${d.delay}s` }}
            />
            <circle cx={d.x} cy={d.y} r={d.r} fill="currentColor" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Fake terminal panel showing live detections. */
/** Animated encrypted-channel graphic for contact/support pages. */
/** Globe with attack arcs travelling toward the protected core. */
export function ThreatGlobeGraphic() {
  const arcs = [
    "M30 150 Q90 60 150 110",
    "M20 90 Q100 130 190 70",
    "M60 190 Q140 150 210 120",
  ];
  return (
    <svg viewBox="0 0 240 240" className="size-full" role="img" aria-label="Global attack origins">
      <g className="text-primary">
        <circle cx="120" cy="120" r="96" fill="none" stroke="currentColor" strokeOpacity="0.25" />
        {[30, 58, 86].map((r) => (
          <ellipse
            key={r}
            cx="120"
            cy="120"
            rx={r}
            ry="96"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.14"
          />
        ))}
        {[-60, -20, 20, 60].map((dy) => (
          <ellipse
            key={dy}
            cx="120"
            cy={120 + dy}
            rx={Math.sqrt(Math.max(96 * 96 - dy * dy, 1))}
            ry="10"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.14"
          />
        ))}
        {arcs.map((d, i) => (
          <g key={d}>
            <motion.path
              d={d}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, repeatDelay: 1.5 }}
            />
            <motion.circle
              r="3"
              fill="currentColor"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, repeatDelay: 1.5 }}
            >
              <animateMotion dur="2s" repeatCount="indefinite" path={d} begin={`${i * 0.5}s`} />
            </motion.circle>
          </g>
        ))}
        <circle cx="120" cy="120" r="9" fill="currentColor" />
        <circle
          cx="120"
          cy="120"
          r="22"
          fill="currentColor"
          className="animate-radar-ping"
          style={{ transformOrigin: "120px 120px" }}
        />
      </g>
    </svg>
  );
}

/** Inspection pipeline: request packets flowing through detection stages. */
export function PipelineGraphic() {
  const stages = ["Ingest", "Baseline", "Score", "Enforce"];
  return (
    <div className="glass-card p-5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        inspection pipeline
      </p>
      <div className="mt-5 flex items-center gap-2">
        {stages.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className="flex-1 text-center">
              <motion.div
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }}
                className="mx-auto grid size-9 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-[10px] font-semibold text-primary"
              >
                {i + 1}
              </motion.div>
              <p className="mt-2 text-[10px] text-muted-foreground">{s}</p>
            </div>
            {i < stages.length - 1 && (
              <div className="relative h-px flex-1 bg-border">
                <motion.span
                  className="absolute -top-[3px] size-1.5 rounded-full bg-primary"
                  initial={{ left: "0%" }}
                  animate={{ left: "100%" }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.5, ease: "linear" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          ["p50", "6ms"],
          ["p99", "38ms"],
          ["drop", "0.00%"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-border/70 bg-surface/60 py-2">
            <p className="font-mono text-xs">{v}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SecureChannelGraphic() {
  const nodes = [
    { x: 40, y: 60 },
    { x: 40, y: 140 },
    { x: 200, y: 40 },
    { x: 200, y: 160 },
  ];
  return (
    <svg viewBox="0 0 240 200" className="size-full" role="img" aria-label="Encrypted support channel">
      <defs>
        <radialGradient id="sentinel-core-grad">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="text-primary">
        <circle cx="120" cy="100" r="46" fill="url(#sentinel-core-grad)" />
        <circle cx="120" cy="100" r="26" fill="none" stroke="currentColor" strokeOpacity="0.5" />
        <circle
          cx="120"
          cy="100"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeDasharray="6 10"
          className="animate-sweep"
          style={{ transformOrigin: "120px 100px" }}
        />
        {nodes.map((n, i) => (
          <g key={`${n.x}-${n.y}`}>
            <motion.line
              x1={n.x}
              y1={n.y}
              x2={120}
              y2={100}
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeDasharray="4 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, delay: i * 0.25 }}
            />
            <circle
              cx={n.x}
              cy={n.y}
              r="12"
              fill="currentColor"
              className="animate-radar-ping"
              style={{ transformOrigin: `${n.x}px ${n.y}px`, animationDelay: `${i * 0.5}s` }}
            />
            <circle cx={n.x} cy={n.y} r="4.5" fill="currentColor" />
          </g>
        ))}
        <path
          d="M112 96 v-6 a8 8 0 0 1 16 0 v6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeOpacity="0.9"
        />
        <rect x="108" y="96" width="24" height="18" rx="4" fill="currentColor" fillOpacity="0.9" />
      </g>
    </svg>
  );
}

export function DetectionPanel() {
  const lines = [
    { t: "GET /v2/accounts/8812/invoices", s: "allow" },
    { t: "GET /v2/accounts/8813/invoices", s: "watch" },
    { t: "GET /v2/accounts/8814/invoices", s: "block" },
    { t: "POST /internal/debug/export", s: "shadow" },
  ];
  const tone: Record<string, string> = {
    allow: "text-success",
    watch: "text-warning",
    block: "text-danger",
    shadow: "text-info",
  };
  return (
    <div className="glass-card overflow-hidden p-4 text-left font-mono text-[11px]">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-danger" />
        <span className="size-2 rounded-full bg-warning" />
        <span className="size-2 rounded-full bg-success" />
        <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          live detections
        </span>
      </div>
      <ul className="space-y-2">
        {lines.map((l, i) => (
          <motion.li
            key={l.t}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.25 }}
            className="flex items-center justify-between gap-3"
          >
            <span className="truncate text-muted-foreground">{l.t}</span>
            <span className={`shrink-0 uppercase ${tone[l.s]}`}>{l.s}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
