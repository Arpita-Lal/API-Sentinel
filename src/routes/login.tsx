import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell, Field, FormError, SubmitButton } from "@/components/sentinel/AuthShell";
import { useToast } from "@/components/sentinel/Toast";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — API Sentinel" },
      { name: "description", content: "Sign in to your API Sentinel runtime security console." },
      { property: "og:title", content: "Sign in — API Sentinel" },
      { property: "og:description", content: "Access the API Sentinel detection console." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      notify("Welcome back to API Sentinel.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your runtime detection console."
      footer={
        <span className="text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-3.5 accent-[var(--primary)]"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <SubmitButton loading={loading}>Sign In</SubmitButton>
      </form>
    </AuthShell>
  );
}