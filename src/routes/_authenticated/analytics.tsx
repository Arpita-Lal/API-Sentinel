import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, Panel } from "@/components/sentinel/primitives";
import { PIE_COLORS, chartAxis, chartTooltip } from "@/components/sentinel/chart-theme";
import { analytics } from "@/services/api";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — API Sentinel" },
      { name: "description", content: "Traffic volume, attack trends and risk distribution analytics." },
      { property: "og:title", content: "Analytics — API Sentinel" },
      { property: "og:description", content: "Traffic and attack analytics for your API estate." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" subtitle="Longer-horizon trends across traffic and detections." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Requests per hour">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.requestsPerHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" {...chartAxis} />
                <YAxis {...chartAxis} />
                <Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="requests" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Attack trends">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.attackTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" {...chartAxis} />
                <YAxis {...chartAxis} />
                <Tooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="bola" name="BOLA" stroke="var(--danger)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="shadow" name="Shadow API" stroke="var(--warning)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="authBypass" name="Auth bypass" stroke="var(--info)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Top targeted endpoints">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topTargeted} layout="vertical" margin={{ left: 60 }}>
                <XAxis type="number" {...chartAxis} />
                <YAxis type="category" dataKey="endpoint" width={200} {...chartAxis} />
                <Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="hits" fill="var(--info)" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Risk distribution">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  cy="42%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {analytics.riskDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--card)" />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip {...chartTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}