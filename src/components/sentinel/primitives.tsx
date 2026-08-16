import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { FiArrowDownRight, FiArrowUpRight, FiSearch, FiInbox, FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

/* ------------------------------- StatusBadge ------------------------------ */

type Tone = "low" | "medium" | "high" | "critical" | "neutral" | "success" | "info";

const toneMap: Record<string, string> = {
  low: "bg-success/15 text-success border-success/30",
  success: "bg-success/15 text-success border-success/30",
  healthy: "bg-success/15 text-success border-success/30",
  resolved: "bg-success/15 text-success border-success/30",
  official: "bg-success/15 text-success border-success/30",
  medium: "bg-warning/15 text-warning border-warning/30",
  investigating: "bg-warning/15 text-warning border-warning/30",
  "at-risk": "bg-warning/15 text-warning border-warning/30",
  deprecated: "bg-warning/15 text-warning border-warning/30",
  high: "bg-danger/15 text-danger border-danger/30",
  critical: "bg-danger/20 text-danger border-danger/40",
  active: "bg-danger/15 text-danger border-danger/30",
  shadow: "bg-danger/15 text-danger border-danger/30",
  unmonitored: "bg-danger/15 text-danger border-danger/30",
  info: "bg-info/15 text-info border-info/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone?: Tone | string;
  className?: string;
}) {
  const key = (tone ?? label).toString().toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize tracking-wide",
        toneMap[key] ?? toneMap.neutral,
        className,
      )}
    >
      {label}
    </span>
  );
}

export function MethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    GET: "bg-info/15 text-info border-info/30",
    POST: "bg-success/15 text-success border-success/30",
    PUT: "bg-warning/15 text-warning border-warning/30",
    PATCH: "bg-warning/15 text-warning border-warning/30",
    DELETE: "bg-danger/15 text-danger border-danger/30",
  };
  return (
    <span
      className={cn(
        "inline-flex w-16 justify-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold",
        map[method] ?? toneMap.neutral,
      )}
    >
      {method}
    </span>
  );
}

export function StatusCode({ code }: { code: number }) {
  const tone =
    code >= 500 ? "text-danger" : code >= 400 ? "text-warning" : "text-success";
  return <span className={cn("font-mono text-xs font-semibold", tone)}>{code}</span>;
}

/* --------------------------------- StatCard ------------------------------- */

export function StatCard({
  label,
  value,
  trend,
  icon,
  index = 0,
}: {
  label: string;
  value: string | number;
  trend?: number;
  icon?: ReactNode;
  index?: number;
}) {
  const up = (trend ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      className="glass-card group relative overflow-hidden p-5"
    >
      <div className="absolute -right-8 -top-8 size-24 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-80" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        {icon && (
          <span className="rounded-lg border border-border bg-primary/10 p-2 text-primary">
            {icon}
          </span>
        )}
      </div>
      {trend !== undefined && (
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            up ? "text-success" : "text-danger",
          )}
        >
          {up ? <FiArrowUpRight /> : <FiArrowDownRight />}
          {Math.abs(trend)}% <span className="text-muted-foreground">vs last week</span>
        </p>
      )}
    </motion.div>
  );
}

/* ------------------------------ LoadingSpinner ---------------------------- */

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <span className="size-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

/* -------------------------------- EmptyState ------------------------------ */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <span className="rounded-xl border border-border bg-surface p-3 text-muted-foreground">
        <FiInbox className="size-5" />
      </span>
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

/* --------------------------------- SearchBar ------------------------------ */

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

/* -------------------------------- Pagination ------------------------------ */

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );
  return (
    <div className="flex items-center justify-end gap-1.5 pt-4">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-40"
      >
        Prev
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1] > 1 && (
            <span className="text-xs text-muted-foreground">…</span>
          )}
          <button
            onClick={() => onPageChange(p)}
            className={cn(
              "min-w-8 rounded-md border px-2 py-1.5 text-xs transition-colors",
              p === page
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border hover:bg-surface",
            )}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

/* ---------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto p-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <FiX className="size-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

/* -------------------------------- PageHeader ------------------------------ */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("glass-card p-5", className)}>
      {(title || actions) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-wide">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}