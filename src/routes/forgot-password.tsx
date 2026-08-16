import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field, FormError, SubmitButton } from "@/components/sentinel/AuthShell";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — API Sentinel" },
      { name: "description", content: "Request a password reset link for your API Sentinel account." },
      { property: "og:title", content: "Reset password — API Sentinel" },
      { property: "og:description", content: "Recover access to your detection console." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      setSent(await forgotPassword(email));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll email you a link to set a new one."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {sent}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <FormError message={error} />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
          <SubmitButton loading={loading}>Send Reset Link</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}