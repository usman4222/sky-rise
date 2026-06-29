import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Mail, RefreshCw, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GearSpinner, GearSectionLoader } from "@/components/gear-loader";
import { SkyRiseLogo } from "@/components/logo";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayoutWrapper,
});

function VerifyEmailView() {
  const { user, logout, fetchProfile, resendVerificationEmail } = useAuthStore();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setIsResending(true);
      await resendVerificationEmail();
      toast.success("Verification link sent! Please check your inbox.");
      setCooldown(60);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setIsChecking(true);
      await fetchProfile(true);
      
      const updatedUser = useAuthStore.getState().user;
      if (updatedUser && updatedUser.emailVerified) {
        toast.success("Email verified successfully! Welcome to SkyRise Future.");
      } else {
        toast.error("Email verification pending. Please check your email and click the verification link.");
      }
    } catch (err: any) {
      toast.error("Failed to check status. Make sure you verified the link.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate({ to: "/login", replace: true });
    } catch (err: any) {
      toast.error("Failed to logout.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-liquid-bg p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-background/60 border border-glass-border rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden backdrop-blur-md">
        
        {/* Glow effects */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-center mb-6">
          <SkyRiseLogo variant="light" className="h-10 w-auto" />
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
              <Mail size={38} className="stroke-[1.5]" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white rounded-full p-1 border-2 border-background">
              <ShieldAlert size={16} />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-3 text-foreground tracking-tight">Verify your email</h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          We've sent a secure verification link to your email address:<br />
          <span className="font-bold text-foreground block mt-2 break-all bg-background/50 p-3 rounded-xl border border-glass-border/30">
            {user?.email}
          </span>
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full glass-button-primary h-12 text-base relative z-10"
          >
            {isChecking ? (
              <>
                <GearSpinner className="mr-2 h-4 w-4" /> Checking status...
              </>
            ) : (
              "I have verified my email"
            )}
          </Button>

          <Button
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            variant="outline"
            className="w-full border-glass-border h-12 text-sm bg-background/30 hover:bg-background/50 relative z-10"
          >
            {isResending ? (
              <>
                <GearSpinner className="mr-2 h-4 w-4" /> Sending...
              </>
            ) : cooldown > 0 ? (
              `Resend link in ${cooldown}s`
            ) : (
              <>
                <RefreshCw size={14} className="mr-2 animate-spin-slow" /> Resend Verification Email
              </>
            )}
          </Button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 mt-4 text-xs font-semibold text-destructive/80 hover:text-destructive transition-colors py-2 relative z-10 cursor-pointer"
          >
            <LogOut size={14} /> Log out and use another account
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardLayoutWrapper() {
  const { isAuthenticated, isHydrated, user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isHydrated, isAuthenticated, navigate]);

  if (!isHydrated || !isAuthenticated) {
    return null;
  }

  // If loading and user details are not fully loaded yet, show a clean loader
  if (isLoading && (!user || !user.email)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-liquid-bg p-4 animate-in fade-in duration-300">
        <GearSectionLoader text="Securing session..." />
      </div>
    );
  }

  // Intercept dashboard routes for non-verified users (Admins are bypassed)
  const isUserAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("SUPER_ADMIN") || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  if (user && !user.emailVerified && !isUserAdmin) {
    return <VerifyEmailView />;
  }

  return <Outlet />;
}
