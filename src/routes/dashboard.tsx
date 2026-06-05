import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayoutWrapper,
});

function DashboardLayoutWrapper() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isHydrated, isAuthenticated, navigate]);

  if (!isHydrated || !isAuthenticated) {
    return null;
  }

  return <Outlet />;
}
