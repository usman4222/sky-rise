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
  Copy, Trophy, Timer, ShieldAlert, FileText, CheckCircle2, DollarSign, Activity, Clock, Percent, ArrowUpRight, ChevronRight, TrendingDown
} from "lucide-react";
import { GearSpinner } from "@/components/gear-loader";
import { useAuthStore } from "@/store/authStore";
import { adminApi } from "@/lib/api-admin";
import { financeApi } from "@/lib/api-finance";
import { investmentsApi } from "@/lib/api-investments";
import { rewardsApi } from "@/lib/api-rewards";
import { announcementsApi } from "@/lib/api-announcements";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";
import stockMarketGrowth from "@/assets/stock_market_growth.png";
import { playSound } from "@/lib/sounds";

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

  const { data: ledgerData } = useQuery({
    queryKey: ["ledgerHistory", 1],
    queryFn: () => financeApi.getLedgerHistory(1, 5),
    refetchOnWindowFocus: false,
    enabled: !isAdmin,
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

  // Dynamic tickers mock data with sparkline points
  const tickers = [
    { name: "KSE 100", value: "76,298.50", change: "+1.35%", positive: true, sparkline: [10, 14, 8, 12, 18, 15, 19] },
    { name: "S&P 500", value: "5,321.41", change: "+0.85%", positive: true, sparkline: [5, 9, 7, 11, 14, 13, 16] },
    { name: "NASDAQ", value: "16,801.54", change: "+1.27%", positive: true, sparkline: [12, 10, 14, 13, 19, 16, 21] },
    { name: "GOLD", value: "2,427.90", change: "+0.45%", positive: true, sparkline: [8, 10, 9, 11, 10, 12, 13] },
    { name: "USD/PKR", value: "278.42", change: "-0.10%", positive: false, sparkline: [15, 14, 14.5, 13.8, 13.5, 14.2, 13] }
  ];

  // Dynamic wallet balance for stat card
  const w = walletsData;
  const walletBalance = w
    ? (w.deposit || 0) + (w.roi || 0) + (w.referral || 0) + (w.bonusReceived || 0) + (w.salary || 0) + (w.achievement || 0) - (w.withdrawal || 0)
    : 0;

  // Total earnings summation
  const totalEarnings = w
    ? (w.roi || 0) + (w.referral || 0) + (w.bonusReceived || 0) + (w.salary || 0) + (w.achievement || 0)
    : 0;

  // Dynamic estimation of today's ROI profit
  const todayProfit = activeInvestments.reduce((sum: number, inv: any) => sum + (inv.amount * (inv.currentRoi || 1.2) / 100), 0);

  // Growth graph values matching the total balance scale
  const baseChartVal = totalEarnings > 0 ? totalEarnings : 2680.50;
  const earningsHistory = [
    { date: "May 01", amount: baseChartVal * 0.15 },
    { date: "May 05", amount: baseChartVal * 0.35 },
    { date: "May 10", amount: baseChartVal * 0.28 },
    { date: "May 15", amount: baseChartVal * 0.55 },
    { date: "May 20", amount: baseChartVal * 0.78 },
    { date: "May 25", amount: baseChartVal * 0.65 },
    { date: "May 30", amount: baseChartVal },
  ];

  // Pie chart categories distribution
  const distributionData = [
    { name: "Stock Market", value: 60, color: "#004d33" },
    { name: "Mutual Funds", value: 20, color: "#0e9f6e" },
    { name: "Forex Trading", value: 10, color: "#f3ba2f" },
    { name: "Commodities", value: 10, color: "#ffe082" },
  ];

  // Retrieve ledger records or fallback
  const rawLogs = ledgerData?.history || [];
  const recentTx = rawLogs.slice(0, 5).map((item: any) => {
    let typeLabel = "System";
    const category = item.category || "";
    const wType = item.walletType || "";
    if (wType === "roi") typeLabel = "Daily Profit";
    else if (wType === "referral") typeLabel = "Referral Profit";
    else if (wType === "salary") typeLabel = "VIP Salary";
    else if (wType === "achievement") typeLabel = "Achievement";
    else if (wType === "withdrawal") typeLabel = "Withdrawal";
    else if (category.toLowerCase().includes("transfer")) typeLabel = "Transfer";
    else if (wType.toLowerCase().includes("bonus")) typeLabel = "Bonus";

    const isDebit = item.type === "debit";
    const signedAmount = isDebit ? -item.amount : item.amount;

    return {
      id: item._id,
      date: new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: typeLabel,
      amount: signedAmount,
      status: "Completed",
    };
  });

  const defaultTx = [
    { id: "1", type: "Daily Profit", amount: 86.50, date: "May 23, 2024 09:15 AM", status: "Completed" },
    { id: "2", type: "Daily Profit", amount: 84.20, date: "May 22, 2024 09:15 AM", status: "Completed" },
    { id: "3", type: "Investment", amount: -1000.00, date: "May 21, 2024 02:35 PM", status: "Completed" },
    { id: "4", type: "Withdrawal", amount: -500.00, date: "May 20, 2024 11:20 AM", status: "Completed" },
    { id: "5", type: "Daily Profit", amount: 82.10, date: "May 20, 2024 09:15 AM", status: "Completed" },
  ];
  const displayTx = recentTx.length > 0 ? recentTx : defaultTx;

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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

          {/* Premium Market Ticker Row */}
          <div className="overflow-x-auto no-scrollbar mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 min-w-max pb-1">
              {tickers.map((t) => (
                <Card 
                  key={t.name} 
                  className="flex items-center gap-3 p-3 bg-white/80 dark:bg-card/80 border-glass-border shadow-soft rounded-2xl min-w-[190px] cursor-pointer hover:bg-white dark:hover:bg-card transition-all active:scale-98"
                  onClick={() => playSound.playClick()}
                >
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">{t.name}</div>
                    <div className="text-sm font-extrabold text-foreground mt-0.5">{t.value}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.positive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {t.change}
                    </span>
                    <div className="mt-1 flex justify-end">
                      <svg className="w-12 h-6" viewBox="0 0 50 20">
                        <polyline
                          fill="none"
                          stroke={t.positive ? "#0e9f6e" : "#e02424"}
                          strokeWidth="1.5"
                          points={t.sparkline.map((val, idx) => `${(idx * 50) / 6},${20 - val}`).join(" ")}
                        />
                      </svg>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Top Stat Cards Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard icon={Wallet} label="Total Balance" value={`$${walletBalance.toFixed(2)}`} accent="green" />
            <StatCard icon={TrendingUp} label="Total Investment" value={`$${totalInvestmentAmount.toFixed(2)}`} accent="gold" />
            <StatCard icon={Activity} label="Total Earnings" value={`$${totalEarnings.toFixed(2)}`} accent="green" />
            <StatCard icon={DollarSign} label="Today's Profit" value={`$${todayProfit.toFixed(2)}`} accent="yellow" />
            <StatCard icon={Percent} label="ROI (Daily)" value={latestInvestment ? `${latestInvestment.currentRoi}%` : "1.20%"} subtitle="Every 24 Hours" accent="green" />
          </div>

          {/* Middle Charts & Promo Row */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Earnings Overview Area Chart */}
            <Card className="shadow-card border-soft bg-white/80 dark:bg-card/80 glass-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-extrabold text-foreground uppercase tracking-wider">Earnings Overview</CardTitle>
                  <div className="text-2xl font-black text-foreground mt-1.5">${baseChartVal.toFixed(2)}</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Total Earnings</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge className="bg-[#0e9f6e]/10 text-[#0e9f6e] border-0 text-[10px] font-bold">This Month</Badge>
                  <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> +18.42% vs last month
                  </span>
                </div>
              </CardHeader>
              <CardContent className="h-[200px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earningsHistory} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0e9f6e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0e9f6e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="amount" stroke="#0e9f6e" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Investment Distribution Donut Chart */}
            <Card className="shadow-card border-soft bg-white/80 dark:bg-card/80 glass-blur-md">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-extrabold text-foreground uppercase tracking-wider">Investment Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-between h-[230px] pt-2 pb-4">
                <div className="relative w-full h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={58}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text inside Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Total</span>
                    <span className="text-sm font-extrabold text-foreground">${totalInvestmentAmount.toLocaleString()}</span>
                  </div>
                </div>
                {/* Categories Legend Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full text-xs mt-2 px-2">
                  {distributionData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-[10px] text-muted-foreground truncate">{d.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-foreground">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Invest in Stock Market Promo Banner */}
            <Card className="shadow-card border-soft bg-[#002b1c] text-white relative group min-h-[280px] flex flex-col justify-between !overflow-hidden">
              {/* Background Image & Overlay */}
              <img
                src={stockMarketGrowth}
                alt="Stock Market Growth Visual"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-30 mix-blend-overlay transition-transform duration-500 group-hover:scale-105 rounded-2xl z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#002b1c] via-[#002b1c]/90 to-transparent z-10 pointer-events-none rounded-2xl" />

              <CardContent className="p-5 relative z-20 flex flex-col justify-between h-full flex-1">
                <div className="space-y-2.5">
                  <Badge className="bg-[#f3ba2f] text-[#002b1c] font-black border-0 text-[9px] uppercase tracking-wider px-2 py-0.5">Hot Offer</Badge>
                  <h3 className="text-base font-black tracking-tight leading-tight text-white">
                    Invest in Stock Market <br />
                    <span className="text-[#f3ba2f] text-lg">Earn Daily ROI</span>
                  </h3>
                  <p className="text-[10px] text-emerald-100/80 leading-normal max-w-[170px]">
                    Your money is in safe hands and working in the stock market for stable daily yields.
                  </p>
                </div>

                <Link to="/dashboard/packages" className="block w-full mt-4" onClick={() => playSound.playClick()}>
                  <Button className="w-full bg-[#f3ba2f] hover:bg-[#ffe082] text-[#002b1c] font-black text-[11px] h-9 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer">
                    Make Investment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Data Grid */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Recent Transactions List */}
            <Card className="shadow-card border-soft bg-white/80 dark:bg-card/80 glass-blur-md flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-extrabold text-foreground uppercase tracking-wider">Recent Transactions</CardTitle>
                <Link 
                  to="/dashboard/transactions" 
                  className="text-[11px] text-[#f3ba2f] hover:underline font-bold flex items-center gap-0.5"
                  onClick={() => playSound.playClick()}
                >
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="pt-1 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  {displayTx.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary/40 transition-colors border border-glass-border-soft">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${tx.amount >= 0 ? 'bg-[#0e9f6e]/10 text-[#0e9f6e]' : 'bg-rose-500/10 text-rose-500'}`}>
                          {tx.amount >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-foreground">{tx.type}</div>
                          <div className="text-[8px] text-muted-foreground mt-0.5">{tx.date}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-extrabold font-mono ${tx.amount >= 0 ? 'text-[#0e9f6e]' : 'text-rose-500'}`}>
                        {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* My Investment Plan Details */}
            <Card className="shadow-card border-soft bg-white/80 dark:bg-card/80 glass-blur-md flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-extrabold text-foreground uppercase tracking-wider">My Investment Plan</CardTitle>
                <Link 
                  to="/dashboard/investments" 
                  className="text-[11px] text-[#f3ba2f] hover:underline font-bold flex items-center gap-0.5"
                  onClick={() => playSound.playClick()}
                >
                  View Plan <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block font-medium">Plan Name</span>
                    <span className="font-extrabold text-foreground mt-0.5 block">{latestInvestment?.package?.name || "Premium Plan"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Daily ROI</span>
                    <span className="font-extrabold text-[#0e9f6e] mt-0.5 block">{latestInvestment?.currentRoi || 1.20}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Total Investment</span>
                    <span className="font-extrabold text-foreground mt-0.5 block">${(latestInvestment?.amount || 10000).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Plan Duration</span>
                    <span className="font-extrabold text-foreground mt-0.5 block">Lifetime</span>
                  </div>
                </div>
                
                {latestInvestment && latestInvestment.pendingRoiClaim > 0 && (
                  <div className="pt-2">
                    <Button
                      onClick={() => {
                        playSound.playSuccess();
                        claimRoiMutation.mutate(latestInvestment._id);
                      }}
                      disabled={claimRoiMutation.isPending}
                      className="w-full bg-[#004d33] hover:bg-[#0c6a46] text-[#f3ba2f] font-bold text-[10px] h-8 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {claimRoiMutation.isPending ? <GearSpinner className="h-3 w-3" /> : <Gift className="h-3 w-3" />}
                      Claim ROI (${latestInvestment.pendingRoiClaim.toFixed(2)})
                    </Button>
                  </div>
                )}

                <div className="pt-2 border-t border-glass-border">
                  <div className="flex justify-between text-[9px] text-muted-foreground uppercase font-bold">
                    <span>Capital in Use</span>
                    <span className="text-[#0e9f6e]">100%</span>
                  </div>
                  <Progress value={100} className="mt-1 h-1.5 bg-secondary" />
                </div>
              </CardContent>
            </Card>

            {/* Referral Program Info */}
            <Card className="shadow-card border-soft bg-white/80 dark:bg-card/80 glass-blur-md flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-1">
                <CardTitle className="text-xs font-extrabold text-foreground uppercase tracking-wider">Referral Program</CardTitle>
                <Link 
                  to="/dashboard/team" 
                  className="text-[11px] text-[#f3ba2f] hover:underline font-bold flex items-center gap-0.5"
                  onClick={() => playSound.playClick()}
                >
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-secondary/30 rounded-xl text-center border border-glass-border-soft">
                    <div className="text-[8px] text-muted-foreground font-bold uppercase truncate">Total</div>
                    <div className="text-sm font-extrabold text-foreground mt-1 flex items-center justify-center gap-1">
                      <Users className="h-3 w-3 text-primary" /> 32
                    </div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded-xl text-center border border-glass-border-soft">
                    <div className="text-[8px] text-muted-foreground font-bold uppercase truncate">Active</div>
                    <div className="text-sm font-extrabold text-[#0e9f6e] mt-1 flex items-center justify-center gap-1">
                      <Users className="h-3 w-3 text-[#0e9f6e]" /> 28
                    </div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded-xl text-center border border-glass-border-soft">
                    <div className="text-[8px] text-muted-foreground font-bold uppercase truncate">Earnings</div>
                    <div className="text-[11px] font-extrabold text-foreground mt-1.5 truncate">
                      ${(walletsData?.referral || 1280.50).toFixed(0)}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[9px] text-muted-foreground font-bold uppercase">Your Referral Link</div>
                  <div className="flex items-center gap-2 rounded-xl bg-secondary/40 border border-glass-border p-2">
                    <input readOnly value={referralLink} className="flex-1 bg-transparent text-[10px] outline-none text-foreground truncate" />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 hover:bg-secondary cursor-pointer flex-shrink-0" 
                      onClick={() => {
                        playSound.playChime();
                        navigator.clipboard.writeText(referralLink);
                        toast.success("Referral link copied!");
                      }}
                    >
                      <Copy size={11} />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    playSound.playChime();
                    navigator.clipboard.writeText(referralLink);
                    toast.success("Referral link copied! Share it to invite team members.");
                  }}
                  className="w-full bg-[#f3ba2f] hover:bg-[#ffe082] text-[#002b1c] font-black text-[11px] h-9 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer mt-1"
                >
                  Invite & Earn More
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Security & Features Bar */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-[#002b1c] p-6 rounded-3xl text-white border border-[#004d33] shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-[#f3ba2f] flex-shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider leading-none text-white">100% Secure</h4>
                <p className="text-[9px] text-emerald-200/80 mt-1 leading-tight">Your funds are safe with advanced security</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-[#f3ba2f] flex-shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider leading-none text-white">Daily Profits</h4>
                <p className="text-[9px] text-emerald-200/80 mt-1 leading-tight">Earn fixed daily ROI on your investment</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-[#f3ba2f] flex-shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider leading-none text-white">Expert Management</h4>
                <p className="text-[9px] text-emerald-200/80 mt-1 leading-tight">Professional team managing your investments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-[#f3ba2f] flex-shrink-0">
                <ArrowDownToLine className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider leading-none text-white">Instant Withdrawals</h4>
                <p className="text-[9px] text-emerald-200/80 mt-1 leading-tight">Quick & easy withdrawals anytime</p>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
