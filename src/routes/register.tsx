import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Gift, CheckCircle, Eye, EyeOff, Smartphone, ShieldCheck, ArrowLeft, KeyRound } from "lucide-react";
import { GearSpinner } from "@/components/gear-loader";

import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { api } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — SkyRise Future" },
      { name: "description", content: "Create your free SkyRise Future account and receive a $5 registration bonus." },
    ]
  }),
  component: RegisterPage,
});

const COUNTRIES = [
  { name: "Pakistan", code: "+92", flag: "🇵🇰" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
];

function RegisterPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { register: registerAction, isLoading, isAuthenticated, isHydrated } = useAuthStore();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification states
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingData, setPendingData] = useState<RegisterInput | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Country code selector states
  const [selectedCountry, setSelectedCountry] = useState("+92");
  const [phoneBody, setPhoneBody] = useState("");

  const confettiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    register("phone");
  }, [register]);

  useEffect(() => {
    // Strip leading 0 from phone body if user enters it (e.g. 03001234567 -> 3001234567)
    const formattedBody = phoneBody.startsWith("0") ? phoneBody.slice(1) : phoneBody;
    const combined = formattedBody ? `${selectedCountry}${formattedBody}` : "";
    setValue("phone", combined);
  }, [selectedCountry, phoneBody, setValue]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (showSuccessModal && confettiContainerRef.current) {
      const container = confettiContainerRef.current;
      const confettiColors = ['#EF2964', '#00C09D', '#2D87B0', '#48485E', '#EFFF1D'];
      const confettiAnimations = ['slow', 'medium', 'fast'];

      const innerContainer = document.createElement('div');
      innerContainer.classList.add('confetti-container');
      container.appendChild(innerContainer);

      const interval = setInterval(() => {
        const confettiEl = document.createElement('div');
        const confettiSize = (Math.floor(Math.random() * 3) + 7) + 'px';
        const confettiBackground = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        const confettiLeft = (Math.floor(Math.random() * container.offsetWidth)) + 'px';
        const confettiAnimation = confettiAnimations[Math.floor(Math.random() * confettiAnimations.length)];

        confettiEl.classList.add('confetti', 'confetti--animation-' + confettiAnimation);
        confettiEl.style.left = confettiLeft;
        confettiEl.style.width = confettiSize;
        confettiEl.style.height = confettiSize;
        confettiEl.style.backgroundColor = confettiBackground;

        const removeTimeout = setTimeout(() => {
          if (confettiEl.parentNode) {
            confettiEl.parentNode.removeChild(confettiEl);
          }
        }, 3000);

        innerContainer.appendChild(confettiEl);
      }, 25);

      return () => {
        clearInterval(interval);
        if (innerContainer.parentNode) {
          innerContainer.parentNode.removeChild(innerContainer);
        }
      };
    }
  }, [showSuccessModal]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get("ref");
    if (referralCode) {
      setValue("sponsorCode", referralCode);
    }
  }, [setValue]);

  useEffect(() => {
    // Only auto-navigate if not currently showing the success modal, state has hydrated, and not just registered
    if (isHydrated && isAuthenticated && !showSuccessModal && !justRegistered && !showOtpScreen) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isHydrated, isAuthenticated, navigate, showSuccessModal, justRegistered, showOtpScreen]);

  const handleSendOtp = async (phone: string, email: string) => {
    try {
      setOtpLoading(true);
      const res = await api.post<{ devOtp?: string }>("/firebase-auth/send-otp", { phone, email });
      setResendCountdown(60);
      toast.success("Verification code sent to your phone!");

      // In development mode, mock OTP is printed and returned in response
      if (res && res.devOtp) {
        toast.info(`[Dev Mode] Verification Code: ${res.devOtp}`, { duration: 10000 });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code");
      throw err;
    } finally {
      setOtpLoading(false);
    }
  };

  const onSubmit = async (data: RegisterInput) => {
    try {
      await handleSendOtp(data.phone, data.email);
      setPendingData(data);
      setOtpCode("");
      setShowOtpScreen(true);
    } catch (error: any) {
      // Error handled in handleSendOtp
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }
    if (!pendingData) return;

    try {
      setOtpLoading(true);
      // 1. Verify OTP and fetch token
      const res = await api.post<{ phoneVerificationToken: string }>("/firebase-auth/verify-otp", {
        phone: pendingData.phone,
        code: otpCode
      });

      // 2. Perform register
      setJustRegistered(true);
      await registerAction(pendingData, res.phoneVerificationToken);
      setShowOtpScreen(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      setJustRegistered(false);
      toast.error(err.message || "Verification or registration failed");
    } finally {
      setOtpLoading(false);
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
          <div ref={confettiContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0" />

          <div className="relative z-10 bg-background border border-glass-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="flex justify-center mb-6">
              <div className="checkmark-circle">
                <div className="background"></div>
                <div className="checkmark draw"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">Congratulations!</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Your account has been successfully created. We've instantly credited your wallet with a <span className="text-gold font-bold text-base">$5 Welcome Bonus!</span>
            </p>
            <Button onClick={handleGoToDashboard} className="w-full glass-button-primary h-12 text-base relative z-20">
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-20 w-20 flex items-center justify-center rounded-full bg-primary-gradient shadow-soft" >
            <img src="/skyrise-logo.png" alt="Logo" className="h-15" />
          </div>
        </Link>
        <Card className="mt-8">
          <CardContent className="p-8">
            {showOtpScreen ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <button
                  type="button"
                  onClick={() => setShowOtpScreen(false)}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft size={16} /> Back to edit details
                </button>

                <div className="flex justify-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                    <ShieldCheck size={32} />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-2">Verify your phone</h2>
                <p className="text-sm text-muted-foreground text-center mb-8">
                  We've sent a 6-digit verification code to <span className="font-semibold text-foreground">{pendingData?.phone}</span>. Please enter it below.
                </p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold block text-center" htmlFor="otpCode">
                      Verification Code
                    </Label>
                    <Input
                      id="otpCode"
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="text-center tracking-[0.5em] text-2xl font-mono h-14"
                      disabled={otpLoading}
                    />
                  </div>

                  <Button
                    onClick={handleVerifyAndRegister}
                    className="w-full glass-button-primary h-12 text-base mt-2"
                    disabled={otpLoading || otpCode.length !== 6}
                  >
                    {otpLoading ? (
                      <>
                        <GearSpinner className="mr-2 h-4 w-4" /> Verifying...
                      </>
                    ) : (
                      "Verify & Complete Registration"
                    )}
                  </Button>

                  <div className="text-center text-sm mt-4">
                    {resendCountdown > 0 ? (
                      <span className="text-muted-foreground">
                        Resend code in <span className="font-semibold text-primary">{resendCountdown}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => pendingData && handleSendOtp(pendingData.phone, pendingData.email)}
                        className="text-primary font-medium hover:text-primary/80 transition-colors"
                        disabled={otpLoading}
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3 rounded-2xl bg-gradient-to-r from-amber-300/20 to-orange-400/20 p-3 border border-amber-300/40">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gold-gradient text-gold-foreground"><Gift size={18} /></div>
                  <div>
                    <div className="font-semibold text-sm">Get $5 free registration bonus</div>
                    <div className="text-xs text-muted-foreground">For your first investment usage.</div>
                  </div>
                </div>
                <h1 className="mt-6 text-3xl font-bold">Create your account</h1>

                <form className="mt-6 mb-3 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm block mb-2 font-semibold" htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Alex Morgan" {...register("name")} aria-invalid={!!errors.name} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm block mb-2 font-semibold" htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" {...register("email")} aria-invalid={!!errors.email} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm block mb-2 font-semibold" htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2">
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="flex h-10 rounded-md border border-glass-border bg-background/50 hover:bg-background/80 transition-colors px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background w-[110px] text-foreground font-medium cursor-pointer"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code} className="bg-background text-foreground">
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      <Input
                        id="phone"
                        type="text"
                        placeholder="300 1234567"
                        value={phoneBody}
                        onChange={(e) => setPhoneBody(e.target.value.replace(/\D/g, ""))}
                        className="flex-1"
                        aria-invalid={!!errors.phone}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm block mb-2 font-semibold" htmlFor="sponsorCode">Sponsor / Referral ID (Optional)</Label>
                    <Input id="sponsorCode" placeholder="SKY-10001" {...register("sponsorCode")} aria-invalid={!!errors.sponsorCode} />
                    {errors.sponsorCode && <p className="text-xs text-destructive">{errors.sponsorCode.message}</p>}
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

                  <div className="space-y-2">
                    <Label className="text-sm block mb-2 font-semibold" htmlFor="confirmPassword">Confirm Password</Label>
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
                    {isLoading ? <><GearSpinner className="mr-2 h-4 w-4" /> Registering...</> : "Register"}
                  </Button>
                </form>

                <p className="mt-5 text-center text-sm text-muted-foreground">
                  Already have an account? <Link to="/login" className="text-primary font-medium hover:text-primary/80">Login</Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
