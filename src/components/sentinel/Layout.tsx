import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  FiActivity,
  FiAlertOctagon,
  FiBarChart2,
  FiBell,
  FiFileText,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiServer,
  FiSettings,
  FiSun,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: FiGrid },
  { to: "/threats", label: "Threat Dashboard", icon: FiAlertOctagon },
  { to: "/logs", label: "API Logs", icon: FiFileText },
  { to: "/alerts", label: "Alerts", icon: FiBell },
  { to: "/inventory", label: "API Inventory", icon: FiServer },
  { to: "/analytics", label: "Analytics", icon: FiBarChart2 },
  { to: "/users", label: "User Activity", icon: FiUsers },
  { to: "/settings", label: "Settings", icon: FiSettings },
] as const;

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl border border-primary/40 bg-primary/15 text-primary">
        <FiActivity className="size-4.5" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight">API Sentinel</span>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Runtime Defense
          </span>
        </span>
      )}
    </span>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      className="rounded-lg border border-border bg-surface p-2 text-muted-foreground transition-colors hover:text-primary"
    >
      {theme === "dark" ? <FiSun className="size-4" /> : <FiMoon className="size-4" />}
    </button>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 px-1">
        <Brand />
      </div>
      {NAV.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "border border-primary/40 bg-primary/12 font-medium text-primary"
                : "border border-transparent text-muted-foreground hover:bg-surface hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto rounded-xl border border-border bg-surface p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Sensor status</p>
        <p className="mt-1 flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-success" />
          12 gateways streaming
        </p>
      </div>
    </nav>
  );
}

function Navbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md lg:px-6">
      <button
        onClick={onMenu}
        aria-label="Open navigation"
        className="rounded-lg border border-border p-2 text-muted-foreground lg:hidden"
      >
        <FiMenu className="size-4" />
      </button>
      <div className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground sm:flex">
        <span className="size-2 animate-pulse rounded-full bg-success" />
        Live monitoring active
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <div className="hidden text-right sm:block">
          <p className="text-xs font-medium leading-tight">{user?.name}</p>
          <p className="text-[11px] text-muted-foreground">{user?.email}</p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate({ to: "/login", replace: true });
          }}
          className="rounded-lg border border-border bg-surface p-2 text-muted-foreground transition-colors hover:text-danger"
          aria-label="Sign out"
        >
          <FiLogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
      © {new Date().getFullYear()} API Sentinel — Runtime BOLA & Shadow API Detection Engine.
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-surface/60 lg:block">
        <Sidebar />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 border-r border-border bg-card">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground"
            >
              <FiX className="size-4" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenu={() => setOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}