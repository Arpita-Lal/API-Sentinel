import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { useToast } from "@/components/sentinel/Toast";
import {
  EmptyState,
  MethodBadge,
  PageHeader,
  Pagination,
  Panel,
  SearchBar,
  StatusBadge,
  StatusCode,
} from "@/components/sentinel/primitives";
import { logs, type Risk } from "@/services/api";

export const Route = createFileRoute("/_authenticated/logs")({
  head: () => ({
    meta: [
      { title: "API Logs — API Sentinel" },
      { name: "description", content: "Search and filter runtime API request logs with risk scoring." },
      { property: "og:title", content: "API Logs — API Sentinel" },
      { property: "og:description", content: "Searchable runtime API request logs." },
    ],
  }),
  component: LogsPage,
});

const PAGE_SIZE = 10;

function LogsPage() {
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<Risk | "all">("all");
  const [method, setMethod] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return logs.filter(
      (l) =>
        (risk === "all" || l.risk === risk) &&
        (method === "all" || l.method === method) &&
        (!q ||
          l.endpoint.toLowerCase().includes(q) ||
          l.user.toLowerCase().includes(q) ||
          l.ip.includes(q)),
    );
  }, [query, risk, method]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const selectClass =
    "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60";

  return (
    <>
      <PageHeader
        title="API Logs"
        subtitle={`${filtered.length} matching requests`}
        actions={
          <button
            onClick={() => notify("Export queued — logs.csv will download shortly.", "info")}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <FiDownload className="size-4" /> Export
          </button>
        }
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SearchBar
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Search endpoint, user or IP…"
          />
          <select
            value={risk}
            onChange={(e) => {
              setRisk(e.target.value as Risk | "all");
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="all">All risk</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="all">All methods</option>
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No logs match those filters" description="Try widening the search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Timestamp</th>
                  <th className="pb-2 pr-4 font-medium">User</th>
                  <th className="pb-2 pr-4 font-medium">Endpoint</th>
                  <th className="pb-2 pr-4 font-medium">Method</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">IP</th>
                  <th className="pb-2 pr-4 font-medium">Latency</th>
                  <th className="pb-2 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} className="border-b border-border/60 last:border-0">
                    <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4">{l.user}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{l.endpoint}</td>
                    <td className="py-2.5 pr-4">
                      <MethodBadge method={l.method} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusCode code={l.status} />
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{l.ip}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{l.responseTime}ms</td>
                    <td className="py-2.5">
                      <StatusBadge label={l.risk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={current} pageCount={pageCount} onPageChange={setPage} />
      </Panel>
    </>
  );
}