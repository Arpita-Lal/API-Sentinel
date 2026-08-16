import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Brand, ThemeToggle } from "./Layout";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <header className="relative z-10 flex items-center justify-between px-5 py-4">
        <Link to="/">
          <Brand />
        </Link>
        <ThemeToggle />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card w-full max-w-md p-7"
        >
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </motion.div>
      </main>
    </div>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

export function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
      )}
      {children}
    </button>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
      {message}
    </p>
  );
}