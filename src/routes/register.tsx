import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Gift, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [
    { title: "Register — SkyRise Future" },
    { name: "description", content: "Create your free SkyRise Future account and receive a $5 registration bonus." },
  ]}),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { register: registerAction, isLoading, isAuthenticated } = useAuthStore();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get("ref");
    if (referralCode) {
      setValue("sponsorCode", referralCode);
    }
  }, [setValue]);

  useEffect(() => {
    // Only auto-navigate if not currently showing the success modal
    if (isAuthenticated && !showSuccessModal) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isAuthenticated, navigate, showSuccessModal]);

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerAction(data);
      setShowSuccessModal(true);
    } catch (error: any) {
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    router.invalidate();
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-liquid-bg relative">
      
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-background border border-glass-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">Congratulations!</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Your account has been successfully created. We've instantly credited your wallet with a <span className="text-gold font-bold text-base">$5 Welcome Bonus!</span>
            </p>
            <Button onClick={handleGoToDashboard} className="w-full glass-button-primary h-12 text-base">
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary-gradient shadow-soft" />
          <span className="text-lg font-bold">SkyRise <span className="text-primary">Future</span></span>
        </Link>
        <Card className="mt-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-300/20 to-orange-400/20 p-3 border border-amber-300/40">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gold-gradient text-gold-foreground"><Gift size={18} /></div>
              <div>
                <div className="font-semibold text-sm">Get $5 free registration bonus</div>
                <div className="text-xs text-muted-foreground">For your first investment usage.</div>
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-bold">Create your account</h1>
            
            <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-semibold" htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Alex Morgan" {...register("name")} aria-invalid={!!errors.name} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold" htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...register("email")} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold" htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+1 555 0123" {...register("phone")} aria-invalid={!!errors.phone} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold" htmlFor="sponsorCode">Sponsor / Referral ID (Optional)</Label>
                <Input id="sponsorCode" placeholder="SKY-10001" {...register("sponsorCode")} aria-invalid={!!errors.sponsorCode} />
                {errors.sponsorCode && <p className="text-xs text-destructive">{errors.sponsorCode.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold" htmlFor="password">Password</Label>
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
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold" htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pr-10"
                    {...register("confirmPassword")} 
                    aria-invalid={!!errors.confirmPassword} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>
              
              <label className="sm:col-span-2 flex items-start gap-2 text-sm text-muted-foreground mt-2">
                <Checkbox className="mt-0.5" required /> I agree to the Terms, Privacy Policy, and platform rules.
              </label>
              
              <Button 
                type="submit" 
                className={`sm:col-span-2 w-full glass-button-primary mt-2 ${isLoading ? "fluid-loading-btn" : ""}`} 
                disabled={isLoading}
              >
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</> : "Register"}
              </Button>
            </form>
            
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary font-medium hover:text-primary/80">Login</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
