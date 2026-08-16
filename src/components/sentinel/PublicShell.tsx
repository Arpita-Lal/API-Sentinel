import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Brand, ThemeToggle } from "./Layout";
import { PublicFooter } from "./PublicFooter";

export function PublicShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/">
            <Brand />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/login"
              className="rounded-lg border border-border px-3.5 py-2 text-sm transition-colors hover:bg-surface"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-muted-foreground">{intro}</p>
        <div className="mt-10 space-y-8">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="glass-card p-6">
      <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}