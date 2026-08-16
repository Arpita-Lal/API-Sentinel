import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FiDownload, FiLogOut, FiTrash2 } from "react-icons/fi";
import { useToast } from "@/components/sentinel/Toast";
import { PageHeader, Panel } from "@/components/sentinel/primitives";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — API Sentinel" },
      { name: "description", content: "Configure monitoring, refresh cadence, theme and notifications." },
      { property: "og:title", content: "Settings — API Sentinel" },
      { property: "og:description", content: "Configure your API Sentinel workspace." },
    ],
  }),
  component: SettingsPage,
});

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked ? "border-primary/50 bg-primary/70" : "border-border bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4.5 rounded-full bg-background transition-transform",
            checked ? "translate-x-5.5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [monitoring, setMonitoring] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [interval, setIntervalValue] = useState("30");
  const [pw, setPw] = useState({ current: "", next: "" });

  const btn =
    "inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm transition-colors hover:border-primary/50";

  return (
    <>
      <PageHeader title="Settings" subtitle={`Signed in as ${user?.email ?? "—"}`} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Monitoring">
          <div className="divide-y divide-border">
            <Toggle
              checked={monitoring}
              onChange={(v) => {
                setMonitoring(v);
                notify(v ? "Runtime monitoring enabled." : "Runtime monitoring paused.", "info");
              }}
              label="Runtime monitoring"
              description="Stream and score traffic from all connected gateways."
            />
            <div className="flex items-center justify-between gap-6 py-3">
              <div>
                <p className="text-sm font-medium">Auto-refresh interval</p>
                <p className="text-xs text-muted-foreground">How often dashboards re-query.</p>
              </div>
              <select
                value={interval}
                onChange={(e) => setIntervalValue(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60"
              >
                {["10", "30", "60", "300"].map((s) => (
                  <option key={s} value={s}>
                    {Number(s) >= 60 ? `${Number(s) / 60} min` : `${s} sec`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Panel>

        <Panel title="Appearance & notifications">
          <div className="divide-y divide-border">
            <Toggle
              checked={theme === "dark"}
              onChange={toggleTheme}
              label="Dark theme"
              description="Persisted to this browser."
            />
            <Toggle
              checked={notifications}
              onChange={setNotifications}
              label="Alert notifications"
              description="Notify on critical and high severity detections."
            />
          </div>
        </Panel>

        <Panel title="Data">
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={() => notify("Export started — logs.csv", "info")}>
              <FiDownload className="size-4" /> Export logs
            </button>
            <button className={btn} onClick={() => notify("Report generated — report.pdf", "info")}>
              <FiDownload className="size-4" /> Export report
            </button>
            <button
              className={cn(btn, "text-danger hover:border-danger/50")}
              onClick={() => notify("Local log cache cleared.", "success")}
            >
              <FiTrash2 className="size-4" /> Clear logs
            </button>
          </div>
        </Panel>

        <Panel title="Account">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!pw.current || !pw.next) return notify("Fill both password fields.", "error");
              setPw({ current: "", next: "" });
              notify("Password updated.");
            }}
          >
            <input
              type="password"
              placeholder="Current password"
              value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
            <input
              type="password"
              placeholder="New password"
              value={pw.next}
              onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Change password
            </button>
          </form>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login", replace: true });
            }}
            className={cn(btn, "mt-4 text-danger hover:border-danger/50")}
          >
            <FiLogOut className="size-4" /> Log out
          </button>
        </Panel>
      </div>
    </>
  );
}