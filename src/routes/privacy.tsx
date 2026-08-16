import { createFileRoute } from "@tanstack/react-router";
import { PublicShell, Section } from "@/components/sentinel/PublicShell";
import { CONTACT_EMAIL } from "@/components/sentinel/PublicFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — API Sentinel" },
      {
        name: "description",
        content:
          "How API Sentinel collects, processes and retains API telemetry, and the rights you have over that data.",
      },
      { property: "og:title", content: "Privacy Policy — API Sentinel" },
      {
        property: "og:description",
        content: "Data collection, retention, security controls and your privacy rights.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PublicShell
      title="Privacy Policy"
      intro="Last updated 31 July 2026. This policy explains what API Sentinel observes, what it stores, and how long it keeps it."
    >
      <Section heading="What we collect">
        <p>
          Account data: your name, work email and authentication metadata. Telemetry data: request
          method, path, response status, latency, source IP, and derived risk scores emitted by the
          eBPF sensor.
        </p>
        <p>
          We do not capture request or response bodies. Object identifiers used for BOLA analysis
          are hashed before leaving your environment.
        </p>
      </Section>
      <Section heading="How we use it">
        <p>
          Telemetry is used solely to detect broken object level authorization, discover
          undocumented (shadow) endpoints, and produce the analytics shown in your console. We never
          sell data or use it to train shared models.
        </p>
      </Section>
      <Section heading="Retention">
        <p>
          Raw logs are retained for 30 days, aggregated analytics for 13 months. Deleting your
          workspace purges both within 7 days.
        </p>
      </Section>
      <Section heading="Security">
        <p>
          Data is encrypted in transit (TLS 1.3) and at rest (AES-256). Access is role-scoped and
          every administrative action is audit logged.
        </p>
      </Section>
      <Section heading="Your rights">
        <p>
          You may request access, correction, export or deletion of your personal data at any time.
          Email{" "}
          <a className="text-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          and we will respond within 30 days.
        </p>
      </Section>
    </PublicShell>
  );
}