import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Shield, Users, Eye, EyeOff } from "lucide-react";
import { GearSpinner } from "@/components/gear-loader";
import { SkyRiseLogo } from "@/components/logo";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — SkyRise Future" },
      { name: "description", content: "Sign in to your SkyRise Future account to manage investments, team, ROI, and rewards." },
    ]
  }),
  component: LoginPage,
});

function ForgotPasswordDialog() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    try {
      setIsSending(true);
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
      setIsOpen(false);
      setEmail("");
    } catch (error: any) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button type="button" className="text-primary hover:text-primary/80 font-medium text-sm">Forgot password?</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">Enter your email address and we will send you a link to reset your password securely via Firebase.</p>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email Address</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button className="glass-button-primary" onClick={handleReset} disabled={isSending}>
            {isSending ? <GearSpinner className="mr-2 h-4 w-4" /> : null}
            Send Reset Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { login, isLoading, isAuthenticated, isHydrated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isHydrated, isAuthenticated, navigate]);

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data);
      toast.success("Welcome back! Logged in successfully.");
      router.invalidate();
      navigate({ to: "/dashboard", replace: true });
    } catch (error: any) {
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-liquid-bg">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 md:px-6 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <Link to="/" className="inline-flex items-center gap-2">
            <SkyRiseLogo variant="light" className="h-10 w-auto" />
          </Link>
          <Card className="mt-8">
            <CardContent className="p-8">
              <h1 className="text-3xl font-bold">Welcome back</h1>
              <p className="mt-2 text-sm text-muted-foreground">Sign in to access your dashboard.</p>

              <form className="mt-8 mb-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label className="text-sm block mb-2 font-semibold" htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block mb-2 font-semibold" htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      {...register("password")}
                      aria-invalid={!!errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox /> Remember me
                  </label>
                  <ForgotPasswordDialog />
                </div>

                <Button
                  type="submit"
                  className={`w-full glass-button-primary ${isLoading ? "fluid-loading-btn" : ""}`}
                  disabled={isLoading}
                >
                  {isLoading ? <><GearSpinner className="mr-2 h-4 w-4" /> Logging in...</> : "Login"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account? <Link to="/register" className="text-primary font-semibold hover:text-primary/80">Create one</Link>
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="order-1 lg:order-2 ">
          <Card className="overflow-hidden">
            <div className="bg-primary-gradient p-8 mb-6 text-white overflow-hidden rounded-2xl">
              <h2 className="text-2xl font-bold">One secure dashboard</h2>
              <p className="mt-2 text-white/85 text-sm leading-relaxed">Manage your investments, team, ROI, and rewards — all in one secure place.</p>
            </div>
            <CardContent className="p-6 space-y-5">
              {[
                { icon: TrendingUp, t: "Live ROI tracking", d: "Daily growth at a glance." },
                { icon: Users, t: "Team insights", d: "10-level overview, direct referrals, and more." },
                { icon: Shield, t: "Transparent rules", d: "Bonus, level, and withdrawal rules clearly defined." },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-blue-400 text-white shadow-soft flex-shrink-0"><f.icon size={20} /></div>
                  <div><div className="font-semibold text-sm text-foreground">{f.t}</div><div className="text-xs text-muted-foreground mt-0.5">{f.d}</div></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
