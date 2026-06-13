import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Award, CheckCircle2, Lock, XCircle, RefreshCw, AlertCircle, 
  HelpCircle, Sparkles, TrendingUp, Users, ArrowUpRight 
} from "lucide-react";
import { GearSectionLoader, GearSpinner } from "@/components/gear-loader";
import { rewardsApi } from "@/lib/api-rewards";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { playSound } from "@/lib/sounds";

export const Route = createFileRoute("/dashboard/upline-rewards")({ component: UplineRewardsPage });

const TIERS_CONFIG = [
  {
    tier: 1,
    name: "Starter Leadership Reward",
    range: "$1 – $10",
    investment: "$500 – $1,000",
    directs: 3,
    vip: "None",
    achievement: "None"
  },
  {
    tier: 2,
    name: "Growth Leadership Reward",
    range: "$10 – $20",
    investment: "$1,000 – $2,000",
    directs: 6,
    vip: "VIP 1",
    achievement: "None"
  },
  {
    tier: 3,
    name: "Achievement Leadership Reward",
    range: "$20 – $30",
    investment: "$3,000 – $4,000",
    directs: 10,
    vip: "VIP 2",
    achievement: "Rank 1"
  },
  {
    tier: 4,
    name: "Elite Leadership Reward",
    range: "$30 – $40",
    investment: "$3,000 – $4,000",
    directs: 15,
    vip: "VIP 2",
    achievement: "Rank 2"
  },
  {
    tier: 5,
    name: "Global Investor Reward",
    range: "$40 – $50",
    investment: "$4,000 – $5,000",
    directs: 20,
    vip: "VIP 3",
    achievement: "Rank 2"
  }
];

function UplineRewardsPage() {
  const queryClient = useQueryClient();

  const { data: statusData, isLoading, error } = useQuery({
    queryKey: ["leadershipStatus"],
    queryFn: () => rewardsApi.getLeadershipStatus(),
    refetchOnWindowFocus: false,
  });

  const recoverMutation = useMutation({
    mutationFn: () => rewardsApi.recoverLeadershipRewards(),
    onSuccess: (res) => {
      playSound.playSuccess();
      toast.success(res.message || "Missed rewards successfully recovered!");
      queryClient.invalidateQueries({ queryKey: ["leadershipStatus"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err));
    }
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Upline Team Rewards">
        <GearSectionLoader text="Loading Upline Rewards Status..." className="h-[350px]" />
      </DashboardLayout>
    );
  }

  if (error || !statusData) {
    return (
      <DashboardLayout title="Upline Team Rewards">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
          Failed to load Leadership rewards status. Please try again.
        </div>
      </DashboardLayout>
    );
  }

  const {
    qualifiedTier,
    autoReinvestOn,
    totalSelfInvestment,
    activeDirectsCount,
    vipRank,
    achievementRank,
    history,
    pendingRecoveryTotal
  } = statusData;

  const currentTierConfig = TIERS_CONFIG.find(t => t.tier === qualifiedTier) || null;

  return (
    <DashboardLayout title="Upline Team Rewards">
      {/* ===== HEADER ROW: CURRENT STATUS ===== */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-soft shadow-card md:col-span-2 overflow-hidden bg-primary-gradient text-primary-foreground relative">
          <CardContent className="p-6 sm:p-8 space-y-4 relative z-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                <Sparkles size={14} className="animate-pulse text-[#f3ba2f]" /> Leadership Rank status
              </div>
              <h2 className="text-3xl font-black tracking-tight mt-1">
                {qualifiedTier > 0 ? `Tier ${qualifiedTier}: ${currentTierConfig?.name}` : "Unqualified (Tier 0)"}
              </h2>
              <p className="text-sm opacity-80 mt-1 max-w-[500px]">
                Earn rewards from downline investments. Unqualified rewards become "missed" but can be recovered as soon as you meet the eligibility criteria.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 min-w-[120px]">
                <div className="text-[10px] uppercase font-bold opacity-70">Qualified Tier</div>
                <div className="text-xl font-extrabold">{qualifiedTier > 0 ? `Tier ${qualifiedTier}` : "None"}</div>
              </div>
              <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 min-w-[120px]">
                <div className="text-[10px] uppercase font-bold opacity-70">Access Range</div>
                <div className="text-xl font-extrabold">{qualifiedTier > 0 ? currentTierConfig?.range : "$0.00"}</div>
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-tr from-[#00693e]/10 via-transparent to-[#f3ba2f]/10 opacity-60" />
        </Card>

        {/* METRICS QUICK VIEW */}
        <Card className="border-soft shadow-card flex flex-col justify-between bg-white dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">My Qualification Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col justify-center text-sm">
            <div className="flex justify-between items-center border-b border-soft pb-2">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <RefreshCw size={14} className={autoReinvestOn ? "text-emerald-500 animate-spin-slow" : "text-muted-foreground"} /> Auto Reinvest
              </span>
              <Badge className={autoReinvestOn ? "bg-emerald-500/10 text-emerald-500 border-0" : "bg-destructive/10 text-destructive border-0"}>
                {autoReinvestOn ? "ON" : "OFF"}
              </Badge>
            </div>
            <div className="flex justify-between items-center border-b border-soft pb-2">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-500" /> Self Investment
              </span>
              <span className="font-bold text-foreground">${totalSelfInvestment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b border-soft pb-2">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Users size={14} className="text-amber-500" /> Active Directs
              </span>
              <span className="font-bold text-foreground">{activeDirectsCount} / 20+</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Award size={14} className="text-sky-500" /> Ranks Status
              </span>
              <span className="font-bold text-foreground">
                VIP {vipRank} / Rank {achievementRank}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== RECOVERY HERO BANNER ===== */}
      {pendingRecoveryTotal > 0 && (
        <Card className="mt-6 border border-amber-300/40 dark:border-amber-500/20 bg-amber-500/5 shadow-[0_8px_32px_rgba(243,186,47,0.08)] overflow-hidden">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/15 text-amber-500 rounded-2xl flex-shrink-0 animate-pulse">
                <Award size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-amber-500 tracking-tight">Recoverable Leadership Rewards Available!</h3>
                <p className="text-xs text-muted-foreground max-w-[550px] leading-relaxed">
                  You have qualified for a higher leadership level! You can now claim all missed rewards that match your current qualified tier. They will be immediately credited to your Referral Wallet.
                </p>
              </div>
            </div>
            <div className="text-center md:text-right w-full md:w-auto">
              <div className="text-xs font-bold uppercase text-muted-foreground">Recoverable Total</div>
              <div className="text-3xl font-black text-amber-500 font-sans tracking-tight mb-2.5">${pendingRecoveryTotal.toFixed(2)}</div>
              <Button 
                onClick={() => recoverMutation.mutate()}
                disabled={recoverMutation.isPending}
                className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-black px-6 h-12 rounded-xl shadow-[0_4px_16px_rgba(243,186,47,0.3)] hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
              >
                {recoverMutation.isPending ? (
                  <>
                    <GearSpinner className="mr-2 h-4 w-4" />
                    Claiming...
                  </>
                ) : (
                  <>
                    Recover Missed Rewards <ArrowUpRight size={16} className="ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== TIERS CONFIGURATION REFERENCE GRID ===== */}
      <h3 className="mt-8 text-base font-extrabold text-foreground tracking-tight mb-4 flex items-center gap-2">
        <HelpCircle size={18} className="text-primary" /> Leadership Reward Tiers
      </h3>
      <div className="grid gap-4 md:grid-cols-5">
        {TIERS_CONFIG.map((t) => {
          const isUnlocked = qualifiedTier >= t.tier;
          return (
            <Card key={t.tier} className={`border-soft shadow-soft relative overflow-hidden transition-all duration-300 ${isUnlocked ? 'bg-white border-[#0e9f6e]/30' : 'bg-secondary/40'}`}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`px-2 py-0.5 rounded-md border-0 font-extrabold text-[10px] ${isUnlocked ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                    Tier {t.tier}
                  </Badge>
                  {isUnlocked ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <Lock size={14} className="text-muted-foreground/60" />
                  )}
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-foreground tracking-tight leading-snug">{t.name}</h4>
                  <div className="text-xs text-muted-foreground font-semibold mt-1">Reward: {t.range}</div>
                </div>

                <div className="my-2 h-px bg-glass-border/30" />

                <div className="space-y-2 text-[10px] text-muted-foreground font-medium">
                  <div className="flex justify-between">
                    <span>Min Investment:</span>
                    <span className="font-semibold text-foreground">{t.investment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Directs:</span>
                    <span className="font-semibold text-foreground">{t.directs} directs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rank Required:</span>
                    <span className="font-semibold text-foreground">{t.vip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Achievement:</span>
                    <span className="font-semibold text-foreground">{t.achievement}</span>
                  </div>
                </div>
              </CardContent>
              {isUnlocked && <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500" />}
            </Card>
          );
        })}
      </div>

      {/* ===== DETAILED HISTORY LEDGER ===== */}
      <Card className="mt-8 border-soft shadow-card">
        <CardHeader><CardTitle>Leadership Reward Payout & Recovery Logs</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Generated</TableHead>
                <TableHead>Reward Name</TableHead>
                <TableHead>Target Tier</TableHead>
                <TableHead>Source Downline</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Recovered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground font-medium">
                    No leadership rewards logs generated yet.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((h) => {
                  let badgeVariant = "secondary";
                  let badgeClass = "bg-muted text-muted-foreground border-0";
                  if (h.status === "paid") {
                    badgeClass = "bg-emerald-500/10 text-emerald-500 border-0";
                  } else if (h.status === "recovered") {
                    badgeClass = "bg-sky-500/10 text-sky-500 border-0";
                  } else if (h.status === "missed") {
                    badgeClass = "bg-amber-500/10 text-amber-500 border-0";
                  }

                  return (
                    <TableRow key={h._id}>
                      <TableCell>{new Date(h.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-semibold text-foreground">{h.rewardName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold">Tier {h.targetTier}</Badge>
                      </TableCell>
                      <TableCell>
                        {h.downlineUser ? (
                          <div>
                            <div className="font-semibold text-foreground">{h.downlineUser.name}</div>
                            <div className="text-[10px] text-muted-foreground">{h.downlineUser.email}</div>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="font-extrabold text-foreground">${h.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant as any} className={`${badgeClass} capitalize px-2.5 py-0.5 rounded-full font-bold text-[10px]`}>
                          {h.status === "missed" && h.targetTier <= qualifiedTier ? "Recoverable 🎁" : h.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {h.recoveredAt ? new Date(h.recoveredAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
