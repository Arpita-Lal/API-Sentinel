import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field, FormError, SubmitButton } from "@/components/sentinel/AuthShell";
import { useToast } from "@/components/sentinel/Toast";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — API Sentinel" },
      {
        name: "description",
        content: "Create a free API Sentinel account and start detecting BOLA and shadow APIs.",
      },
      { property: "og:title", content: "Create account — API Sentinel" },
      { property: "og:description", content: "Start monitoring your API estate in minutes." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.confirm);
      notify("Account created — welcome to API Sentinel.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free during the detection trial. No agent installs required."
      footer={
        <span className="text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <Field label="Full name" value={form.name} onChange={set("name")} placeholder="Ada Mercer" />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="you@company.com"
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={set("password")}
          placeholder="At least 8 characters"
        />
        <Field
          label="Confirm password"
          type="password"
          value={form.confirm}
          onChange={set("confirm")}
          placeholder="Repeat your password"
        />
        <SubmitButton loading={loading}>Create Account</SubmitButton>
      </form>
    </AuthShell>
  );
}