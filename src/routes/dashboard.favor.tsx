import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Award, Timer, Calendar, ShieldAlert, CheckCircle, 
  HelpCircle, RefreshCw, AlertCircle, Sparkles, BookOpen 
} from "lucide-react";
import { playSound } from "@/lib/sounds";

export const Route = createFileRoute("/dashboard/favor")({
  component: UserFavorPage,
});

function UserFavorPage() {
  const { user, fetchProfile } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  useEffect(() => {
    if (!user || !user.favorCycleEndDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(user.favorCycleEndDate || "").getTime() - Date.now();

      if (difference <= 0) {
        setTimeLeft("Cycle Expired");
        setIsUrgent(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(" "));
      const isTestMode = difference < 24 * 60 * 60 * 1000;
      setIsUrgent(isTestMode ? difference < 45 * 1000 : days < 3);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = async () => {
    playSound.playChime();
    setIsRefetching(true);
    try {
      await fetchProfile();
      toast.success("Progress synchronized successfully!");
    } catch (error) {
      toast.error("Failed to sync progress. Please try again.");
    } finally {
      setIsRefetching(false);
    }
  };

  if (!user || !user.favorConditionEnabled) {
    return (
      <DashboardLayout title="Leader Condition">
        <Card className="max-w-md mx-auto border-soft shadow-card p-6 text-center mt-12 bg-glass-surface backdrop-blur-md">
          <Award className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
          <h2 className="text-lg font-bold">No Active Condition</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Your account does not have a 1X business verification condition enabled. You can receive withdrawals normally.
          </p>
          <Link to="/dashboard">
            <Button className="mt-6 glass-button-primary">Back to Dashboard</Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  const isBlocked = user.favorWithdrawalStatus === "blocked";
  const progressPercent = user.favorProgressPercent || 0;
  const favorAmount = user.favorAmount || 0;
  const requiredBusiness = user.favorRequiredBusiness || 0;
  const achievedBusiness = user.favorAchievedBusiness || 0;
  const remainingBusiness = user.favorRemainingBusiness || 0;

  return (
    <DashboardLayout title="Leader Business Requirement">
      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* Status Alert Banner */}
        <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
          isBlocked
            ? "bg-destructive/10 border-destructive/20 text-destructive"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
        }`}>
          <div className="flex items-start gap-3">
            {isBlocked ? (
              <ShieldAlert className="h-6 w-6 stroke-[1.5] mt-0.5 shrink-0 animate-pulse" />
            ) : (
              <CheckCircle className="h-6 w-6 stroke-[1.5] mt-0.5 shrink-0" />
            )}
            <div>
              <div className="font-extrabold text-sm flex items-center gap-2">
                Withdrawals: {isBlocked ? "Suspended" : "Active & Qualified"}
                {isBlocked && (
                  <Badge variant="destructive" className="text-[9px] uppercase px-2 font-bold py-0.5 animate-pulse">
                    Hold Active
                  </Badge>
                )}
              </div>
              <p className="text-xs opacity-90 mt-1 max-w-2xl font-medium">
                {isBlocked
                  ? "Your ROI profit withdrawals are temporarily locked because your 30-day 1X business requirement has expired. Complete the target volume to unlock ROI withdrawals automatically. (Note: Referral, Salary, and Achievement wallet withdrawals are NOT affected and remain active.)"
                  : "Your profit withdrawals are unlocked and working normally. Complete the requirement before the cycle ends to maintain ROI withdrawal access. (Note: Referral, Salary, and Achievement wallets can be withdrawn at any time.)"}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefetching}
            variant="outline" 
            className={`border-glass-border rounded-xl text-xs h-9.5 gap-1.5 shrink-0 cursor-pointer ${
              isBlocked ? "hover:bg-destructive/10" : "hover:bg-emerald-500/10"
            }`}
          >
            <RefreshCw size={12} className={isRefetching ? "animate-spin" : ""} />
            Sync Progress
          </Button>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Progress & Stat Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-glass-border shadow-2xl relative overflow-hidden bg-glass-surface backdrop-blur-md rounded-3xl p-6">
              
              <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-glass-border/30">
                <div>
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                    Requirement Progress
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Qualified business volume generated by your direct & indirect downlines.
                  </p>
                </div>
                <Badge className={`text-[10px] font-extrabold rounded-full px-3 py-1 ${
                  isBlocked
                    ? "bg-destructive/15 text-destructive border border-destructive/25"
                    : progressPercent >= 100
                      ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25"
                      : "bg-amber-500/15 text-amber-500 border border-amber-500/25"
                }`}>
                  {isBlocked ? "Not Completed" : progressPercent >= 100 ? "Completed" : "In Progress"}
                </Badge>
              </div>

              <div className="space-y-6 pt-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-2xl bg-neutral-900/35 border border-glass-border/20">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Favor Balance</span>
                    <span className="text-base sm:text-lg font-black text-foreground mt-1 block">${favorAmount.toFixed(2)}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-neutral-900/35 border border-glass-border/20">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Target Target</span>
                    <span className="text-base sm:text-lg font-black text-primary mt-1 block">${requiredBusiness.toFixed(2)}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-neutral-900/35 border border-glass-border/20">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Achieved Vol</span>
                    <span className="text-base sm:text-lg font-black text-emerald-400 mt-1 block">${achievedBusiness.toFixed(2)}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-neutral-900/35 border border-glass-border/20">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Remaining</span>
                    <span className="text-base sm:text-lg font-black text-destructive mt-1 block">${remainingBusiness.toFixed(2)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Cycle Progress ({achievedBusiness.toFixed(0)} / {requiredBusiness.toFixed(0)} USD)</span>
                    <span className="text-foreground">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>

                {/* Dates & Timers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-glass-border/20 text-xs">
                  <div className="flex items-center gap-3">
                    <Timer className={`h-4.5 w-4.5 shrink-0 ${isUrgent ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
                    <div>
                      <span className="text-muted-foreground block font-medium">Time Remaining</span>
                      <span className={`font-black tracking-tight text-sm ${isBlocked || isUrgent ? "text-destructive" : "text-foreground"}`}>
                        {timeLeft}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground block font-medium">Deadline Date</span>
                      <span className="font-semibold text-foreground">
                        {new Date(user.favorCycleEndDate || "").toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground block font-medium">Cycle Start Date</span>
                      <span className="font-semibold text-foreground">
                        {new Date(user.favorCycleStartDate || "").toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {user.favorLastQualificationDate && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
                      <div>
                        <span className="text-muted-foreground block font-medium">Last Qualification</span>
                        <span className="font-semibold text-emerald-500">
                          {new Date(user.favorLastQualificationDate || "").toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </Card>
          </div>

          {/* Rules & Policy Panel */}
          <div className="space-y-6">
            <Card className="border-glass-border shadow-2xl relative overflow-hidden bg-glass-surface backdrop-blur-md rounded-3xl p-6 h-full">
              <div className="pb-3 border-b border-glass-border/30">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-primary" />
                  Condition Rules
                </h3>
              </div>
              <ul className="space-y-4 pt-4 text-xs text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>
                    <strong>1X Volume:</strong> You must generate downline investment volume equal to your Favor Account size every 30 days.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>
                    <strong>Independent Target:</strong> Downline leaders who also have Favor Accounts qualify for their own targets. Their volume is excluded from your calculation to prevent double counting.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>
                    <strong>Early Completion:</strong> If you hit your target early, the cycle resets immediately, starting the next 30-day window to continue withdrawal eligibility.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>
                    <strong>Suspension Hold:</strong> Failing to complete the target before the deadline automatically freezes **ROI Wallet** withdrawals. Other wallets (Referral, Salary, and Achievement) are never locked and can always be withdrawn.
                  </span>
                </li>
              </ul>
            </Card>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
