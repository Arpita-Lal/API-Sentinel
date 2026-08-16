import { motion } from "framer-motion";
import { FiShield } from "react-icons/fi";
import type { Alert } from "@/services/api";
import { StatusBadge } from "./primitives";

export function AlertCard({
  alert,
  onView,
  index = 0,
}: {
  alert: Alert;
  onView?: (a: Alert) => void;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="glass-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg border border-border bg-primary/10 p-2 text-primary">
            <FiShield className="size-4" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{alert.type}</h3>
              <StatusBadge label={alert.severity} />
              <StatusBadge label={alert.status} />
            </div>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{alert.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="font-mono">{alert.endpoint}</span>
              <span>{alert.owaspMapping}</span>
              <span>{new Date(alert.detectedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
        {onView && (
          <button
            onClick={() => onView(alert)}
            className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            View
          </button>
        )}
      </div>
    </motion.article>
  );
}