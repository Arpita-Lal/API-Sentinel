import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader, Panel, SearchBar, StatusBadge } from "@/components/sentinel/primitives";
import { userActivity } from "@/services/api";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "User Activity — API Sentinel" },
      { name: "description", content: "Per-principal request volume, suspicious behaviour and risk scoring." },
      { property: "og:title", content: "User Activity — API Sentinel" },
      { property: "og:description", content: "Principal-level API behaviour analytics." },
    ],
  }),
  component: UsersPage,
});

function riskTone(score: number) {
  return score > 75 ? "critical" : score > 50 ? "high" : score > 30 ? "medium" : "low";
}

function UsersPage() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return userActivity.filter(
      (u) =>
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <>
      <PageHeader title="User Activity" subtitle="Behavioural risk across human and service principals." />
      <Panel>
        <SearchBar value={query} onChange={setQuery} placeholder="Search user, email or role…" className="mb-4" />
        {rows.length === 0 ? (
          <EmptyState title="No users match that search" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Username</th>
                  <th className="pb-2 pr-4 font-medium">Requests</th>
                  <th className="pb-2 pr-4 font-medium">Last login</th>
                  <th className="pb-2 pr-4 font-medium">Role</th>
                  <th className="pb-2 pr-4 font-medium">Suspicious</th>
                  <th className="pb-2 font-medium">Risk score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium">{u.username}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">{u.requests.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{u.lastLogin}</td>
                    <td className="py-2.5 pr-4">{u.role}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{u.suspiciousActivities}</td>
                    <td className="py-2.5">
                      <StatusBadge label={`${u.riskScore}`} tone={riskTone(u.riskScore)} />
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