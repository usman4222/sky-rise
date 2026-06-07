import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, TrendingUp, ArrowDownToLine, Users, Gift, Crown,
  Copy, Trophy, Timer, ShieldAlert, FileText, CheckCircle2, DollarSign, Activity, Clock
} from "lucide-react";
import { GearSpinner } from "@/components/gear-loader";
import { useAuthStore } from "@/store/authStore";
import { adminApi } from "@/lib/api-admin";
import { financeApi } from "@/lib/api-finance";
import { investmentsApi } from "@/lib/api-investments";
import { rewardsApi } from "@/lib/api-rewards";
import { useEffect, useState } from "react";

// Define RoiCountdown component for real-time ROI tracking & auto-refresh
function RoiCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - Date.now();

      if (difference <= 0) {
        setTimeLeft("Payout due");
        // Auto-refresh stats when timer expires to show newly distributed ROI immediately
        timer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["myInvestments"] });
          queryClient.invalidateQueries({ queryKey: ["wallets"] });
        }, 2000); // 2 seconds buffer for background job to finish payout
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (hours > 0) {
        parts.push(`${hours.toString().padStart(2, "0")}h`);
      }
      parts.push(`${minutes.toString().padStart(2, "0")}m`);
      parts.push(`${seconds.toString().padStart(2, "0")}s`);

      setTimeLeft(parts.join(" "));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => {
      clearInterval(interval);
      if (timer) clearTimeout(timer);
    };
  }, [targetDate, queryClient]);

  return <span className="font-mono text-profit font-bold animate-pulse">{timeLeft}</span>;
}

export const Route = createFileRoute("/dashboard/")({ component: DashboardHome });

function DashboardHome() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("SUPER_ADMIN");
  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`;

  // Fetch admin dashboard stats if user is admin
  const { data: adminStats } = useQuery({
    queryKey: ["adminDashboard"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const res = await adminApi.getAdminDashboard();
      return res.stats;
    }
  });

  // Regular user data
  const { data: walletsData } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await financeApi.getWallets();
      return res.wallet;
    }
  });

  const { data: investments = [] } = useQuery({
    queryKey: ["myInvestments"],
    queryFn: async () => {
      const res = await investmentsApi.getMyInvestments();
      return res.investments || [];
    }
  });

  const claimRoiMutation = useMutation({
    mutationFn: (id: string) => investmentsApi.claimRoi(id),
    onSuccess: (res: any) => {
      toast.success(res.message || "ROI claimed successfully! Balance credited to ROI wallet.");
      queryClient.invalidateQueries({ queryKey: ["myInvestments"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  const { data: vipData } = useQuery({
    queryKey: ["vipStatus"],
    queryFn: () => rewardsApi.getVipStatus(),
    refetchOnWindowFocus: false,
  });

  const { data: achData } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => rewardsApi.getAchievements(),
    refetchOnWindowFocus: false,
  });

  const activeInvestments = investments.filter((i: any) => i.status === "active");
  const totalInvestmentAmount = activeInvestments.reduce((acc: number, cur: any) => acc + cur.amount, 0);

  // Dynamic Level string
  const unlockedLevels = user?.unlockedLevels || [1];
  const maxUnlockedLevel = Math.max(...unlockedLevels);
  const accountLevelStr = `Level ${maxUnlockedLevel}`;

  // Latest investment progress calculations
  const latestInvestment = activeInvestments[0] || null;
  const startRoi = latestInvestment?.package?.startRoi || 0;
  const maxRoi = latestInvestment?.package?.maxRoi || 0;
  const currentRoi = latestInvestment?.currentRoi || 0;
  const roiProgressPercent = maxRoi > startRoi ? Math.min(100, ((currentRoi - startRoi) / (maxRoi - startRoi)) * 100) : 0;

  // VIP Legs progress
  const vipRank = vipData?.currentVipRank || 0;
  const rankBadgeStr = vipRank > 0 ? `VIP ${vipRank}` : "Starter";
  const targetLegVolume = vipData?.nextRankTarget?.requiredBusinessPerLeg || 1000;
  const legs = vipData?.legs || [];

  const displayIndexLegs = [...legs];
  while (displayIndexLegs.length < 3) {
    displayIndexLegs.push({
      leg: displayIndexLegs.length + 1,
      legUser: {
        id: `empty-idx-${displayIndexLegs.length}`,
        name: "Empty Leg",
        email: ""
      },
      volume: 0
    });
  }
  const topThreeLegs = displayIndexLegs.slice(0, 3);

  // Achievements progress details
  const currentBusiness = achData?.currentBusiness || 0;
  const nextTarget = achData?.nextTarget || null;
  const nextTargetBusiness = nextTarget ? nextTarget.business : 10000;
  const nextTargetName = nextTarget ? nextTarget.name : "Max Rank Achieved";
  const nextTargetReward = nextTarget ? nextTarget.reward : 0;
  const achievementProgressPercent = nextTarget ? Math.min(100, (currentBusiness / nextTarget.business) * 100) : 100;

  const hasPendingClaims = activeInvestments.some((inv: any) => inv.pendingRoiClaim > 0);
  const pendingClaimsTotal = activeInvestments.reduce((sum: number, inv: any) => sum + (inv.pendingRoiClaim || 0), 0);

  return (
    <DashboardLayout title={isAdmin ? "Administration Console" : "Dashboard"}>
      {isAdmin ? (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="rounded-2xl p-6 bg-gradient-to-r from-primary-gradient/10 via-primary-gradient/5 to-transparent border border-soft shadow-card backdrop-blur-md">
            <h2 className="text-xl font-bold text-foreground">Welcome to the Administration Portal</h2>
            <p className="text-xs text-muted-foreground mt-1">
              You are logged in with Administrative permissions. Use the shortcuts below or the sidebar links to review compliance files, track financial queues, and manage platform members.
            </p>
          </div>

          {/* Admin Metrics */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Global Platform Metrics</h2>
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Link to="/dashboard/admin/users" className="block transition-all hover:scale-[1.02] cursor-pointer">
                <StatCard icon={Users} label="Total Users" value={adminStats?.usersCount || 0} accent="primary" />
              </Link>
              <StatCard icon={DollarSign} label="Total Deposited" value={`$${Number(adminStats?.totalDeposited || 0).toFixed(2)}`} accent="profit" />
              <Link to="/dashboard/admin/withdrawals" className="block transition-all hover:scale-[1.02] cursor-pointer">
                <StatCard icon={Wallet} label="Total Withdrawn" value={`$${Number(adminStats?.totalWithdrawn || 0).toFixed(2)}`} accent="profit" />
              </Link>
              <Link to="/dashboard/admin/withdrawals" className="block transition-all hover:scale-[1.02] cursor-pointer">
                <StatCard icon={Timer} label="Pending Withdrawals" value={adminStats?.pendingWithdrawals || 0} accent="gold" />
              </Link>
              <Link to="/dashboard/packages" className="block transition-all hover:scale-[1.02] cursor-pointer">
                <StatCard icon={CheckCircle2} label="Active Packages" value={adminStats?.activePackagesCount || 0} accent="primary" />
              </Link>
            </div>
          </div>

          {/* Quick Tasks */}
          <div className="grid gap-6 md:grid-cols-2">

            <Card className="border-soft shadow-card flex flex-col h-full">
              <CardHeader><CardTitle className="text-sm font-semibold">Financial Approvals</CardTitle></CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Audit and approve withdrawal requests and review manual weekly salary claims.
                  </p>
                  <div className="p-3 rounded-xl bg-secondary/30 border border-soft text-center">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Pending Withdrawals</div>
                    <div className="text-base font-bold text-foreground font-mono mt-1">{adminStats?.pendingWithdrawals || 0}</div>
                  </div>
                </div>
                <Button asChild className="w-full bg-primary-gradient text-white text-xs h-9">
                  <Link to="/dashboard/admin/withdrawals">Withdrawals Queue</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-soft shadow-card flex flex-col h-full">
              <CardHeader><CardTitle className="text-sm font-semibold">Investment Packages</CardTitle></CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Create new investment packages, adjust starting/maximum ROI rates, or toggle package visibilities.
                  </p>
                  <div className="p-3 rounded-xl bg-secondary/30 border border-soft text-center">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Active Investment Packages</div>
                    <div className="text-base font-bold text-foreground font-mono mt-1">{adminStats?.activePackagesCount || 0}</div>
                  </div>
                </div>
                <Button asChild className="w-full bg-primary-gradient text-white text-xs h-9">
                  <Link to="/dashboard/packages">Manage Investment Packages</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* User Management Hub Card */}
          <Card className="border-soft shadow-card">
            <CardHeader><CardTitle className="text-sm font-semibold">Member Management & Network Reports</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                View all registered platform members, inspect their wallets, query their active investment portfolios, review downline legs volumes (generated MLM business), and suspend or activate accounts.
              </p>
              <Button asChild className="w-full bg-primary-gradient text-white text-xs h-9">
                <Link to="/dashboard/admin/users">Open User Directory & Network Audit</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {hasPendingClaims && (
            <div className="mb-6 rounded-xl p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex items-center justify-between shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/15 rounded-lg text-amber-500">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">You Have Unclaimed ROI Earnings!</div>
                  <div className="text-xs text-muted-foreground">You must claim your daily ROI manually before they expire within the required window.</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase font-medium">Unclaimed Total</div>
                  <div className="text-lg font-bold text-amber-500 font-mono mt-0.5">${pendingClaimsTotal.toFixed(2)}</div>
                </div>
                <Link to="/dashboard/investments">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-amber-foreground font-semibold">
                    Go to Claims
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {latestInvestment?.nextRoiPayoutAt && (
            <div className="mb-6 rounded-xl p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/15 rounded-lg text-emerald-500">
                  <Timer className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Active Investment Earning ROI</div>
                  <div className="text-xs text-muted-foreground">Your ROI payout is automated. Keep this page open to watch it grow.</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase font-medium">Next Payout In</div>
                <div className="text-lg font-bold text-emerald-500 font-mono mt-0.5">
                  <RoiCountdown targetDate={latestInvestment.nextRoiPayoutAt} />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard icon={Wallet} label="Total Investment" value={`$${totalInvestmentAmount.toFixed(2)}`} accent="primary" />
            <StatCard icon={TrendingUp} label="Daily ROI Target" value="Active" accent="profit" />
            <StatCard icon={ArrowDownToLine} label="Withdrawal Balance" value={`$${(walletsData?.withdrawal || 0).toFixed(2)}`} accent="primary" />
            <StatCard icon={Users} label="Referral Wallet" value={`$${(walletsData?.referral || 0).toFixed(2)}`} accent="profit" />
            <StatCard icon={Gift} label="Team Bonus Received" value={`$${(walletsData?.bonusReceived || 0).toFixed(2)}`} accent="gold" />
            <StatCard icon={Crown} label="Account Level" value={accountLevelStr} accent="gold" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-card border-soft">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Latest Active Investment</CardTitle>
                  {latestInvestment && (
                    <Badge className={latestInvestment.roiClaimMode === 'manual' ? "bg-gold/15 text-gold border-0 capitalize" : "bg-primary/10 text-primary border-0 capitalize"}>
                      {latestInvestment.roiClaimMode || 'auto'} Mode
                    </Badge>
                  )}
                </div>
                <Badge className="bg-profit/10 text-profit border-0">Active</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestInvestment ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Package</div>
                        <div className="font-semibold text-foreground mt-1">{latestInvestment?.package?.name || "Premium Share"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Investment Amount</div>
                        <div className="font-semibold text-foreground mt-1">${(latestInvestment?.amount || 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Current ROI</div>
                        <div className="font-semibold text-emerald-500 mt-1">{latestInvestment?.currentRoi}% Daily</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Earned So Far</div>
                        <div className="font-semibold text-foreground mt-1">${latestInvestment?.totalRoiEarned?.toFixed(2) || 0}</div>
                      </div>
                      {latestInvestment.pendingRoiClaim > 0 ? (
                        <div className="col-span-2 rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-xs text-gold uppercase tracking-wide font-semibold flex items-center gap-1.5">
                                <Gift className="h-3.5 w-3.5" /> Pending ROI Claim
                              </div>
                              <div className="text-lg font-bold text-gold mt-1">${latestInvestment.pendingRoiClaim.toFixed(2)}</div>
                            </div>
                            {latestInvestment.claimExpiresAt && (
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Expires In</div>
                                <div className="text-sm font-semibold text-destructive mt-1 flex items-center gap-1 justify-end">
                                  <Clock className="h-3.5 w-3.5 animate-pulse" />
                                  <RoiCountdown targetDate={latestInvestment.claimExpiresAt} />
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => claimRoiMutation.mutate(latestInvestment._id)}
                            disabled={claimRoiMutation.isPending}
                            className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-semibold text-xs h-9 flex gap-2 items-center justify-center"
                          >
                            {claimRoiMutation.isPending ? <GearSpinner className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                            {claimRoiMutation.isPending ? "Claiming..." : "Collect ROI"}
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Next ROI Payout</div>
                          <div className="font-semibold text-foreground mt-1">
                            {latestInvestment?.nextRoiPayoutAt ? (
                              <RoiCountdown targetDate={latestInvestment.nextRoiPayoutAt} />
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress to Max ROI ({maxRoi}%)</span>
                        <span>{roiProgressPercent.toFixed(0)}%</span>
                      </div>
                      <Progress value={roiProgressPercent} className="mt-2 h-2" />
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    No active investments found. Buy a package to start earning daily ROI!
                  </div>
                )}
                <Button asChild className="w-full bg-primary-gradient text-primary-foreground">
                  <Link to="/dashboard/packages">View Investment Packages</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Link Card */}
            <Card className="shadow-card border-soft">
              <CardHeader><CardTitle>Referral Link</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Share your referral link to build your 5-level downline team and unlock direct income bonuses!
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
                  <input readOnly value={referralLink} className="flex-1 bg-transparent text-xs outline-none text-foreground" />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      navigator.clipboard.writeText(referralLink);
                    }}
                  >
                    <Copy size={14} />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button variant="outline" asChild><Link to="/dashboard/team">My Team</Link></Button>
                  <Button variant="outline" asChild><Link to="/dashboard/transfer">Transfer Bonus</Link></Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* VIP Progress */}
            <Card className="shadow-card border-soft">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Rank Progress (VIP)</CardTitle>
                <Badge className="bg-gold/15 text-gold border-0">
                  <Crown className="mr-1 h-3 w-3" /> {rankBadgeStr}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  VIP and Achievement Ranks are unlocked by building your downline business and completing network targets.
                </p>
                {topThreeLegs.map((l, index) => {
                  const pct = Math.min(100, (l.volume / targetLegVolume) * 100);
                  const done = l.volume >= targetLegVolume;
                  const isPlaceholder = l.legUser.id.startsWith("empty-idx-");
                  return (
                    <div key={l.legUser.id || index}>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-foreground">Leg {index + 1} {isPlaceholder ? "" : `(${l.legUser.name})`}</span>
                        <span className={done ? "text-emerald-500 font-semibold" : "text-muted-foreground"}>
                          ${l.volume.toLocaleString()} / ${targetLegVolume.toLocaleString()}{done && " ✓"}
                        </span>
                      </div>
                      <Progress value={pct} className="mt-2 h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Achievement */}
            <Card className="shadow-card border-soft">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Team Business</CardTitle>
                <Badge className="bg-primary/10 text-primary border-0">
                  <Trophy className="mr-1 h-3 w-3" /> Goals
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Network Volume (5-Level)</div>
                  <div className="text-2xl font-bold mt-1">${currentBusiness.toLocaleString()}</div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Next Target: {nextTargetName}</span>
                    <span className="font-medium">{achievementProgressPercent.toFixed(0)}%</span>
                  </div>
                  <Progress value={achievementProgressPercent} className="mt-2 h-2" />
                </div>
                {nextTarget && (
                  <div className="rounded-xl p-4 bg-gradient-to-r from-amber-300/10 to-orange-400/10 border border-amber-300/30">
                    <div className="text-xs text-muted-foreground font-medium">Next Stage Rank Reward</div>
                    <div className="text-lg font-bold text-amber-600 mt-1">${nextTargetReward} Cash Bonus</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
