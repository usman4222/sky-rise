import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, Users, ArrowLeftRight, Layers, Clock, ShieldCheck, 
  Info, AlertTriangle, ChevronRight, HelpCircle
} from "lucide-react";
import { GearSectionLoader } from "@/components/gear-loader";
import { financeApi } from "@/lib/api-finance";
import { networkApi } from "@/lib/api-network";
import { useAuthStore } from "@/store/authStore";
import { playSound } from "@/lib/sounds";

export const Route = createFileRoute("/dashboard/team-bonus")({
  component: TeamBonusPage,
});

function TeamBonusPage() {
  const { user } = useAuthStore();
  
  // 1. Fetch Wallets info
  const { data: walletsData, isLoading: isWalletsLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await financeApi.getWallets();
      return res.wallet;
    }
  });

  // 2. Fetch Downline info to calculate team size within 5 levels
  const { data: downlineData, isLoading: isDownlineLoading } = useQuery({
    queryKey: ["downline"],
    queryFn: async () => {
      return networkApi.getDownline();
    }
  });

  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  // 3. Countdown timer logic
  useEffect(() => {
    if (!user?.teamBonusDeadline) {
      setTimeLeft("Not Started");
      return;
    }

    const interval = setInterval(() => {
      const difference = new Date(user.teamBonusDeadline!).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
        clearInterval(interval);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        const dStr = days > 0 ? `${days}d ` : "";
        const hStr = hours.toString().padStart(2, "0");
        const mStr = minutes.toString().padStart(2, "0");
        const sStr = seconds.toString().padStart(2, "0");
        
        setTimeLeft(`${dStr}${hStr}h ${mStr}m ${sStr}s`);
        setIsExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.teamBonusDeadline]);

  // Compute team size within exactly 5 levels
  const levelDataMap = downlineData?.levelTeamData || {};
  const teamSize5Levels = [1, 2, 3, 4, 5].reduce(
    (sum, lvl) => sum + (levelDataMap[lvl] || []).length,
    0
  );

  const bonusActivationBal = walletsData?.bonusActivation || 0;
  const bonusTransferableBal = walletsData?.bonusTransferable || 0;
  const totalEarned = (bonusActivationBal + bonusTransferableBal);

  const isLoading = isWalletsLoading || isDownlineLoading;

  return (
    <DashboardLayout title="Team Building Bonus">
      <div className="space-y-6">

        {/* Dynamic Timer Banner */}
        <Card className={`relative overflow-hidden border ${
          isExpired 
            ? "border-rose-500/20 bg-rose-500/5" 
            : "border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent"
        } rounded-[32px] p-6 shadow-soft`}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <Badge className={`px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider font-extrabold ${
                isExpired ? "bg-rose-500/20 text-rose-500" : "bg-amber-500/20 text-amber-500 animate-pulse"
              }`}>
                {isExpired ? "Campaign Ended" : "Promo Period Active"}
              </Badge>
              <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                10-Day Team Building Registration Bonus
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Every new member who joins within 5 levels of your downline team during your first 10 days credits you with a **$1.00 Team Bonus**. No self-investment or downline package purchase required!
              </p>
            </div>

            <div className="flex flex-col items-center justify-center bg-[#001e14]/5 dark:bg-black/40 border border-glass-border/30 rounded-2xl p-4 min-w-[200px] flex-shrink-0 text-center font-mono">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1.5 justify-center mb-1">
                <Clock size={12} className={isExpired ? "text-rose-500" : "text-amber-500 animate-spin-slow"} />
                {isExpired ? "Time Expired" : "Time Remaining"}
              </span>
              <span className={`text-xl sm:text-2xl font-black tracking-tight ${isExpired ? "text-rose-500" : "text-amber-500"}`}>
                {timeLeft || "Loading..."}
              </span>
            </div>
          </div>
          {/* Neon orbs for aesthetic */}
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-amber-500/5 to-transparent blur-xl pointer-events-none" />
        </Card>

        {/* Stats Grid */}
        {isLoading ? (
          <GearSectionLoader text="Loading Team Bonus Summary..." className="min-h-[150px]" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            
            {/* Total Earnings */}
            <Card className="border-glass-border shadow-soft bg-white/90 dark:bg-card/90 flex flex-col justify-between p-5 rounded-[24px]">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider leading-none">Total Promo Rewards</span>
                <h3 className="text-2xl font-black text-foreground font-mono mt-2">${totalEarned.toFixed(2)}</h3>
              </div>
              <div className="text-[10.5px] text-muted-foreground mt-4 leading-normal">
                Accumulated registration rewards earned within levels 1–5.
              </div>
            </Card>

            {/* Level Activation Share */}
            <Card className="border-glass-border shadow-soft bg-white/90 dark:bg-card/90 flex flex-col justify-between p-5 rounded-[24px] group">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider leading-none">🔓 Level Activation (50%)</span>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-500 font-extrabold uppercase px-1.5 py-0.5 rounded">Inside Levels</span>
                </div>
                <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-2">${bonusActivationBal.toFixed(2)}</h3>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10.5px] text-muted-foreground">Used for level unlock costs</span>
                <Link to="/dashboard/levels" onClick={() => playSound.playClick()}>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] font-black rounded-lg gap-1 cursor-pointer">
                    View Levels <ChevronRight size={10} />
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Transferable Share */}
            <Card className="border-glass-border shadow-soft bg-white/90 dark:bg-card/90 flex flex-col justify-between p-5 rounded-[24px] group">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider leading-none">💸 Transferable Share (50%)</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-extrabold uppercase px-1.5 py-0.5 rounded">Team Sendable</span>
                </div>
                <h3 className="text-2xl font-black text-emerald-500 font-mono mt-2">${bonusTransferableBal.toFixed(2)}</h3>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10.5px] text-muted-foreground">Sendable to downlines</span>
                <Link to="/dashboard/transfer" onClick={() => playSound.playClick()}>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] font-black rounded-lg gap-1 cursor-pointer">
                    Transfer Bonus <ChevronRight size={10} />
                  </Button>
                </Link>
              </div>
            </Card>

          </div>
        )}

        {/* Detailed Guidelines Card Grid */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Guidelines */}
          <Card className="border-glass-border shadow-soft bg-white/90 dark:bg-card/90 rounded-[28px]">
            <CardHeader>
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck size={14} />
                </div>
                <span>Promotion Rules & Limits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground">
              <div className="flex gap-2.5 items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <p>
                  <strong>No Investment Needed:</strong> Downline members are <u>not required</u> to make an investment or buy packages for you to earn the $1.00 team reward. Payouts trigger immediately on registration.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <p>
                  <strong>First 10 Days Only:</strong> Downlines must register within **10 days (240 hours)** from your own registration date. Once your timer reaches zero, new joins will not credit any promo bonus.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <p>
                  <strong>5-Level Downline Limit:</strong> Rewards are paid only for members joining between Level 1 and Level 5. Downlines at Level 6 or deeper do not generate bonuses.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <p>
                  <strong>Utility Wallet:</strong> These promotional rewards are utility-based. They are non-withdrawable and cannot be directly invested. They can only be spent inside the Level Activation or Team Transfer systems.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Investment Split Explanation */}
          <Card className="border-glass-border shadow-soft bg-white/90 dark:bg-card/90 rounded-[28px]">
            <CardHeader>
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Info size={14} />
                </div>
                <span>Investment Usage Rule (10% Max)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground">
              <p>
                When downline members receive transferred bonus balances, they can apply them directly to help fund package purchases.
              </p>
              <div className="rounded-2xl border border-glass-border-soft bg-secondary/50 p-4 font-mono space-y-2">
                <div className="font-bold text-foreground text-[11px] mb-2 flex items-center gap-1.5">
                  <HelpCircle size={12} className="text-indigo-500" />
                  Example: Buying a $100 Package
                </div>
                <div className="flex justify-between border-b border-glass-border-soft pb-1">
                  <span>Investment cost:</span>
                  <span className="font-black text-foreground">$100.00</span>
                </div>
                <div className="flex justify-between text-emerald-500 font-bold">
                  <span>- Bonus Wallet (Max 10%):</span>
                  <span>$10.00</span>
                </div>
                <div className="flex justify-between text-indigo-500 font-bold">
                  <span>- Real Deposit Wallet (90%):</span>
                  <span>$90.00</span>
                </div>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 flex gap-2.5 items-start text-rose-400">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 animate-pulse" />
                <p className="text-[10px]">
                  <strong>Warning:</strong> The remaining 90% must always be paid with real funds from your main deposit wallet. If your deposit wallet has less than 90% of the cost, the purchase will be rejected.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </DashboardLayout>
  );
}
