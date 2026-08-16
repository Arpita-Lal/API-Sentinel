import { createFileRoute } from "@tanstack/react-router";
import { FiClock, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { PublicShell, Section } from "@/components/sentinel/PublicShell";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/components/sentinel/PublicFooter";
import { SecureChannelGraphic } from "@/components/sentinel/HeroGraphics";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact API Sentinel — Sales & Support" },
      {
        name: "description",
        content:
          "Reach the API Sentinel team for demos, deployment help, security disclosures or billing questions.",
      },
      { property: "og:title", content: "Contact API Sentinel" },
      {
        property: "og:description",
        content: "Talk to our team about runtime API security, demos and support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const CHANNELS = [
  { icon: FiMail, label: "Email", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { icon: FiPhone, label: "Phone", value: `+91 ${CONTACT_PHONE}`, href: `tel:+91${CONTACT_PHONE}` },
  { icon: FiClock, label: "Response time", value: "Within 1 business day" },
  { icon: FiMapPin, label: "Coverage", value: "Remote-first · 24/7 on-call for critical incidents" },
];

function ContactPage() {
  return (
    <PublicShell
      title="Contact us"
      intro="Questions about deployment, pricing or a security disclosure? We read every message."
    >
      <div className="relative mx-auto -mt-2 mb-2 aspect-[6/5] w-full max-w-xs">
        <SecureChannelGraphic />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((c) => (
          <div key={c.label} className="glass-card p-5">
            <span className="inline-grid size-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <c.icon className="size-4.5" />
            </span>
            <p className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
              {c.label}
            </p>
            {c.href ? (
              <a href={c.href} className="mt-1 block break-all text-sm text-primary hover:underline">
                {c.value}
              </a>
            ) : (
              <p className="mt-1 text-sm">{c.value}</p>
            )}
          </div>
        ))}
      </div>
      <Section heading="What to include">
        <p>
          For fastest triage, tell us your gateway type, approximate daily request volume, and
          whether you need self-hosted or managed collection.
        </p>
        <p>
          Security disclosures: email{" "}
          <a className="text-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          with the subject line “Security”. We acknowledge within 24 hours.
        </p>
      </Section>
      <div className="flex justify-center">
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=API%20Sentinel%20enquiry`}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--glow)] transition-transform hover:-translate-y-0.5"
        >
          Email {CONTACT_EMAIL}
        </a>
      </div>
    </PublicShell>
  );
}