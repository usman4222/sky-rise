import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, TrendingUp, ArrowDownToLine, Users, Gift, Crown,
  Copy, Trophy, Timer, ShieldAlert, FileText, CheckCircle2, DollarSign, Activity, Loader2
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { adminApi } from "@/lib/api-admin";
import { financeApi } from "@/lib/api-finance";
import { investmentsApi } from "@/lib/api-investments";
import { rewardsApi } from "@/lib/api-rewards";

export const Route = createFileRoute("/dashboard/")({ component: DashboardHome });

function DashboardHome() {
  const { user } = useAuthStore();
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

  const { data: investmentsData } = useQuery({
    queryKey: ["myInvestments"],
    queryFn: () => investmentsApi.getMyInvestments(),
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

  const investments = investmentsData?.investments || [];
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

  return (
    <DashboardLayout title="Dashboard">
      {isAdmin && (
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Admin Global Metrics</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <StatCard icon={Users} label="Total Users" value={adminStats?.usersCount || 0} accent="primary" />
            <StatCard icon={DollarSign} label="Total Deposited" value={`$${adminStats?.totalDeposited || 0}`} accent="profit" />
            <StatCard icon={Wallet} label="Total Withdrawn" value={`$${adminStats?.totalWithdrawn || 0}`} accent="profit" />
            <StatCard icon={Activity} label="Pending Deposits" value={adminStats?.pendingDeposits || 0} accent="gold" />
            <StatCard icon={Timer} label="Pending Withdrawals" value={adminStats?.pendingWithdrawals || 0} accent="gold" />
            <StatCard icon={FileText} label="Pending KYC" value={adminStats?.pendingKyc || 0} accent="gold" />
            <StatCard icon={CheckCircle2} label="Active Packages" value={adminStats?.activePackagesCount || 0} accent="primary" />
          </div>
          <div className="mt-6 border-b border-soft"></div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Wallet} label="Total Investment" value={`$${totalInvestmentAmount}`} accent="primary" />
        <StatCard icon={TrendingUp} label="Daily ROI Target" value="Active" accent="profit" />
        <StatCard icon={ArrowDownToLine} label="Withdrawal Balance" value={`$${(walletsData?.withdrawal || 0).toFixed(2)}`} accent="primary" />
        <StatCard icon={Users} label="Referral Wallet" value={`$${(walletsData?.referral || 0).toFixed(2)}`} accent="profit" />
        <StatCard icon={Gift} label="Team Bonus Received" value={`$${(walletsData?.bonusReceived || 0).toFixed(2)}`} accent="gold" />
        <StatCard icon={Crown} label="Account Level" value={accountLevelStr} accent="gold" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Active investment */}
        <Card className="lg:col-span-2 shadow-card border-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Active Investment</CardTitle>
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
                    <div className="font-semibold text-foreground mt-1">${latestInvestment?.amount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Current ROI</div>
                    <div className="font-semibold text-emerald-500 mt-1">{latestInvestment?.currentRoi}% Daily</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Earned So Far</div>
                    <div className="font-semibold text-foreground mt-1">${latestInvestment?.totalRoiEarned?.toFixed(2) || 0}</div>
                  </div>
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
    </DashboardLayout>
  );
}
