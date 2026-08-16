import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  EmptyState,
  MethodBadge,
  PageHeader,
  Panel,
  SearchBar,
  StatusBadge,
} from "@/components/sentinel/primitives";
import { inventory } from "@/services/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "API Inventory — API Sentinel" },
      { name: "description", content: "Complete catalogue of official, shadow and deprecated APIs with risk scores." },
      { property: "og:title", content: "API Inventory — API Sentinel" },
      { property: "og:description", content: "Official, shadow and deprecated API catalogue." },
    ],
  }),
  component: InventoryPage,
});

const CATEGORIES = ["all", "official", "shadow", "deprecated"] as const;

function InventoryPage() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return inventory.filter(
      (a) =>
        (category === "all" || a.category === category) &&
        (!q || a.name.toLowerCase().includes(q) || a.endpoint.toLowerCase().includes(q)),
    );
  }, [category, query]);

  return (
    <>
      <PageHeader
        title="API Inventory"
        subtitle={`${inventory.length} discovered APIs across all gateways.`}
        actions={
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors",
                  category === c
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:bg-surface",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        }
      />

      <Panel>
        <SearchBar value={query} onChange={setQuery} placeholder="Search by name or path…" className="mb-4" />
        {rows.length === 0 ? (
          <EmptyState title="Nothing discovered here yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Endpoint</th>
                  <th className="pb-2 pr-4 font-medium">Method</th>
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Risk</th>
                  <th className="pb-2 pr-4 font-medium">Discovered</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{a.name}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{a.endpoint}</td>
                    <td className="py-2.5 pr-4">
                      <MethodBadge method={a.method} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge label={a.category} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge label={a.status} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              a.riskScore > 75
                                ? "bg-danger"
                                : a.riskScore > 50
                                  ? "bg-warning"
                                  : "bg-success",
                            )}
                            style={{ width: `${a.riskScore}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-xs">{a.riskScore}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{a.discoveredAt}</td>
                    <td className="py-2.5">
                      <Link
                        to="/endpoint/$id"
                        params={{ id: a.id }}
                        className="text-xs text-primary hover:underline"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}