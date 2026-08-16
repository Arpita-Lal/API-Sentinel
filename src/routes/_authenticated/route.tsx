import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Layout } from "@/components/sentinel/Layout";
import { LoadingSpinner } from "@/components/sentinel/primitives";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !isAuthenticated) navigate({ to: "/login", replace: true });
  }, [ready, isAuthenticated, navigate]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <LoadingSpinner label="Verifying session…" />
      </div>
    );
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}