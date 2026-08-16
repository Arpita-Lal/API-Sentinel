import { Link, createFileRoute } from "@tanstack/react-router";
import { PublicShell, Section } from "@/components/sentinel/PublicShell";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Runtime BOLA & Shadow API Detection" },
      {
        name: "description",
        content:
          "Kernel-level sensors, BOLA behavioural detection, shadow API discovery, live traffic monitoring and OWASP API Top 10 mapping.",
      },
      { property: "og:title", content: "API Sentinel Features" },
      {
        property: "og:description",
        content: "Everything inside the API Sentinel runtime detection engine.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <PublicShell
      title="Features"
      intro="Everything API Sentinel does between a request hitting your gateway and a finding landing on an owner's desk."
    >
      <Section heading="Runtime BOLA detection">
        <p>
          Per-principal behavioural baselines detect object-ID enumeration, sequential scanning and
          cross-tenant access within a single request window — no signatures to maintain.
        </p>
      </Section>
      <Section heading="Shadow API discovery">
        <p>
          Every route your gateways actually serve is fingerprinted continuously and reconciled
          against your OpenAPI catalogue, surfacing undocumented and deprecated endpoints.
        </p>
      </Section>
      <Section heading="Live traffic monitoring">
        <p>
          A streaming feed with risk scoring, latency and source attribution, refreshed every few
          seconds so incident response starts while the attack is still running.
        </p>
      </Section>
      <Section heading="OWASP API Top 10 mapping">
        <p>
          Findings arrive pre-mapped to API1:2023 through API10:2023 with remediation guidance, so
          engineering owners know exactly what to change.
        </p>
      </Section>
      <Section heading="Kernel-level visibility & scale">
        <p>
          eBPF sensors observe traffic below the application layer with under 5ms overhead, scaling
          horizontally across clusters and regions.
        </p>
      </Section>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/signup"
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--glow)] transition-transform hover:-translate-y-0.5"
        >
          Create free account
        </Link>
        <Link
          to="/contact"
          className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold transition-colors hover:border-primary/50"
        >
          Talk to us
        </Link>
      </div>
    </PublicShell>
  );
}