import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiActivity, FiAlertOctagon, FiBell, FiEye, FiShield, FiUsers } from "react-icons/fi";
import { AlertCard } from "@/components/sentinel/AlertCard";
import {
  MethodBadge,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  StatusCode,
} from "@/components/sentinel/primitives";
import { dashboardData, recentAlerts } from "@/services/api";
import { chartAxis, chartTooltip } from "@/components/sentinel/chart-theme";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — API Sentinel" },
      { name: "description", content: "Runtime API security posture at a glance." },
      { property: "og:title", content: "Dashboard — API Sentinel" },
      { property: "og:description", content: "Runtime API security posture at a glance." },
    ],
  }),
  component: DashboardPage,
});

const fmt = (n: number) => n.toLocaleString();

function DashboardPage() {
  const d = dashboardData;
  return (
    <>
      <PageHeader
        title="Security Overview"
        subtitle="Aggregated runtime signal across all monitored gateways."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard index={0} label="Total requests" value={fmt(d.totalRequests)} trend={d.trends.totalRequests} icon={<FiActivity />} />
        <StatCard index={1} label="Open alerts" value={d.alertsCount} trend={d.trends.alertsCount} icon={<FiBell />} />
        <StatCard index={2} label="Shadow APIs" value={d.shadowApis} trend={d.trends.shadowApis} icon={<FiEye />} />
        <StatCard index={3} label="BOLA attacks" value={d.bolaAttacks} trend={d.trends.bolaAttacks} icon={<FiAlertOctagon />} />
        <StatCard index={4} label="Protected APIs" value={d.protectedApis} trend={d.trends.protectedApis} icon={<FiShield />} />
        <StatCard index={5} label="Active users" value={fmt(d.activeUsers)} trend={d.trends.activeUsers} icon={<FiUsers />} />
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-3">
        <Panel title="Request trend" description="Traffic vs detected attacks (24h)" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.requestTrend}>
                <defs>
                  <linearGradient id="reqFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="time" {...chartAxis} />
                <YAxis {...chartAxis} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="requests" stroke="var(--primary)" fill="url(#reqFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="attacks" stroke="var(--danger)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Recent alerts"
          actions={
            <Link to="/alerts" className="text-xs text-primary hover:underline">
              View all
            </Link>
          }
        >
          <div className="space-y-3">
            {recentAlerts.slice(0, 4).map((a, i) => (
              <AlertCard key={a.id} alert={a} index={i} />
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Recent API activity" className="mt-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Endpoint</th>
                <th className="pb-2 pr-4 font-medium">Method</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Calls</th>
                <th className="pb-2 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {d.apiActivity.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 font-mono text-xs">{row.endpoint}</td>
                  <td className="py-2.5 pr-4">
                    <MethodBadge method={row.method} />
                  </td>
                  <td className="py-2.5 pr-4">
                    <StatusCode code={row.status} />
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums">{fmt(row.calls)}</td>
                  <td className="py-2.5">
                    <StatusBadge label={row.risk} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}