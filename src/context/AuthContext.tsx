import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export interface SentinelUser {
  name: string;
  email: string;
}

interface AuthContextValue {
  user: SentinelUser | null;
  isAuthenticated: boolean;
  ready: boolean;
  login: (email: string, password: string) => Promise<SentinelUser>;
  signup: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) => Promise<SentinelUser>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "sentinel.user";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SentinelUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as SentinelUser);
    } catch {
      /* ignore malformed storage */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: SentinelUser | null) => {
    setUser(next);
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!email.trim() || !password.trim()) throw new Error("Email and password are required.");
      await wait(1000);
      const next: SentinelUser = {
        name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
      };
      persist(next);
      return next;
    },
    [persist],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string, confirmPassword: string) => {
      if (!name.trim() || !email.trim() || !password || !confirmPassword)
        throw new Error("All fields are required.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");
      await wait(1000);
      const next: SentinelUser = { name: name.trim(), email: email.trim() };
      persist(next);
      return next;
    },
    [persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const forgotPassword = useCallback(async (email: string) => {
    if (!email.trim()) throw new Error("Enter the email tied to your account.");
    await wait(1000);
    return "If an account with that email exists, a reset link has been sent.";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, ready, login, signup, logout, forgotPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}