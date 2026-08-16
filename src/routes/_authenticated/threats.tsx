import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { MethodBadge, PageHeader, Panel, StatusBadge, StatusCode } from "@/components/sentinel/primitives";
import { PIE_COLORS, chartAxis, chartTooltip } from "@/components/sentinel/chart-theme";
import { generateTrafficItem, threatData, type LogEntry } from "@/services/api";

export const Route = createFileRoute("/_authenticated/threats")({
  head: () => ({
    meta: [
      { title: "Threat Dashboard — API Sentinel" },
      { name: "description", content: "Live API traffic feed, attack distribution and vulnerable endpoints." },
      { property: "og:title", content: "Threat Dashboard — API Sentinel" },
      { property: "og:description", content: "Live attack telemetry across your API estate." },
    ],
  }),
  component: ThreatDashboard,
});

function ThreatDashboard() {
  const [traffic, setTraffic] = useState<LogEntry[]>(threatData.liveTraffic);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const schedule = () => {
      timer.current = setTimeout(
        () => {
          if (cancelled) return;
          setTraffic((prev) => [generateTrafficItem(), ...prev].slice(0, 20));
          schedule();
        },
        2000 + Math.random() * 1000,
      );
    };
    schedule();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Threat Dashboard"
        subtitle="Streaming detections from the runtime engine."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning">
            <span className="size-2 animate-pulse rounded-full bg-warning" />
            Risk level: {threatData.riskLevel}
          </span>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-3">
        <Panel title="Live traffic feed" description="Updating every 2–3 seconds" className="xl:col-span-2">
          <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {traffic.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3 overflow-hidden whitespace-nowrap rounded-lg border border-border bg-surface/70 px-3 py-2 text-xs"
                >
                  <span className="font-mono text-muted-foreground">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </span>
                  <MethodBadge method={t.method} />
                  <span className="truncate font-mono">{t.endpoint}</span>
                  <StatusCode code={t.status} />
                  <span className="hidden text-muted-foreground sm:inline">{t.ip}</span>
                  <span className="hidden text-muted-foreground md:inline">{t.responseTime}ms</span>
                  <span className="ml-auto shrink-0">
                    <StatusBadge label={t.risk} />
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Panel>

        <Panel title="Attack type distribution">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={threatData.attackTypes}
                  dataKey="value"
                  nameKey="name"
                  cy="42%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {threatData.attackTypes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--card)" />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip {...chartTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Most attacked endpoints" className="mt-5">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={threatData.vulnerableApis} layout="vertical" margin={{ left: 60 }}>
              <XAxis type="number" {...chartAxis} />
              <YAxis type="category" dataKey="endpoint" width={200} {...chartAxis} />
              <Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="attacks" fill="var(--danger)" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}