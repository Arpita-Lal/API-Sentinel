export const chartAxis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const chartTooltip = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    fontSize: 12,
    color: "var(--foreground)",
  },
  labelStyle: { color: "var(--muted-foreground)" },
  itemStyle: { color: "var(--foreground)" },
} as const;

export const PIE_COLORS = [
  "var(--primary)",
  "var(--info)",
  "var(--warning)",
  "var(--danger)",
  "var(--success)",
];