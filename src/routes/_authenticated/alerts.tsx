import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertCard } from "@/components/sentinel/AlertCard";
import {
  EmptyState,
  Modal,
  PageHeader,
  StatusBadge,
} from "@/components/sentinel/primitives";
import { alerts, type Alert } from "@/services/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — API Sentinel" },
      { name: "description", content: "Triage BOLA, shadow API and authorization alerts with OWASP mapping." },
      { property: "og:title", content: "Alerts — API Sentinel" },
      { property: "og:description", content: "Triage runtime API security alerts." },
    ],
  }),
  component: AlertsPage,
});

const FILTERS = ["all", "active", "investigating", "resolved"] as const;

function AlertsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [selected, setSelected] = useState<Alert | null>(null);

  const list = useMemo(
    () => (filter === "all" ? alerts : alerts.filter((a) => a.status === filter)),
    [filter],
  );

  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle="Every detection mapped to the OWASP API Security Top 10."
        actions={
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors",
                  filter === f
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:bg-surface",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      {list.length === 0 ? (
        <EmptyState title="No alerts in this state" description="Nothing to triage right now." />
      ) : (
        <div className="space-y-3">
          {list.map((a, i) => (
            <AlertCard key={a.id} alert={a} index={i} onView={setSelected} />
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.id} · ${selected.type}` : ""}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={selected.severity} />
              <StatusBadge label={selected.status} />
            </div>
            <p className="text-muted-foreground">{selected.description}</p>
            <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4 text-xs">
              <div>
                <dt className="text-muted-foreground">Endpoint</dt>
                <dd className="mt-0.5 font-mono">{selected.endpoint}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source IP</dt>
                <dd className="mt-0.5 font-mono">{selected.sourceIp}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Detected</dt>
                <dd className="mt-0.5">{new Date(selected.detectedAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">OWASP mapping</dt>
                <dd className="mt-0.5">{selected.owaspMapping}</dd>
              </div>
            </dl>
            <button
              onClick={() => setSelected(null)}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}