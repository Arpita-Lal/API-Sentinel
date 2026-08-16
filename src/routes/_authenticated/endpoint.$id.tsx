import { Link, createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiActivity, FiAlertOctagon, FiClock, FiShield } from "react-icons/fi";
import {
  MethodBadge,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
} from "@/components/sentinel/primitives";
import { chartAxis, chartTooltip } from "@/components/sentinel/chart-theme";
import { getEndpointDetail } from "@/services/api";

export const Route = createFileRoute("/_authenticated/endpoint/$id")({
  head: () => ({
    meta: [
      { title: "Endpoint Details — API Sentinel" },
      { name: "description", content: "Per-endpoint traffic, attack volume and hardening recommendations." },
      { property: "og:title", content: "Endpoint Details — API Sentinel" },
      { property: "og:description", content: "Per-endpoint runtime security detail." },
    ],
  }),
  component: EndpointDetailPage,
});

function EndpointDetailPage() {
  const { id } = Route.useParams();
  const d = getEndpointDetail(id);

  return (
    <>
      <PageHeader
        title={d.asset.name}
        subtitle={`${d.asset.endpoint} · owned by ${d.asset.owner}`}
        actions={
          <div className="flex items-center gap-2">
            <MethodBadge method={d.asset.method} />
            <StatusBadge label={d.asset.category} />
            <StatusBadge label={d.asset.status} />
            <Link to="/inventory" className="text-xs text-primary hover:underline">
              Back to inventory
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Requests (7d)" value={d.requestCount.toLocaleString()} icon={<FiActivity />} />
        <StatCard index={1} label="Attacks detected" value={d.attackCount} icon={<FiAlertOctagon />} />
        <StatCard index={2} label="Avg response" value={`${d.avgResponseTime}ms`} icon={<FiClock />} />
        <StatCard index={3} label="Risk score" value={d.riskScore} icon={<FiShield />} />
      </div>

      <Panel title="Request timeline" className="mt-5">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" {...chartAxis} />
              <YAxis {...chartAxis} />
              <Tooltip {...chartTooltip} />
              <Line type="monotone" dataKey="requests" stroke="var(--primary)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="attacks" stroke="var(--danger)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Security recommendations" className="mt-5">
        <ol className="space-y-3">
          {d.recommendations.map((r, i) => (
            <li key={r} className="flex gap-3 text-sm">
              <span className="grid size-6 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{r}</span>
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}