import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkyRiseLogo } from "@/components/logo";
import {
  Gift, Users, Upload, Download, ArrowLeftRight, RefreshCw,
  Shield, Crown, ChevronRight, Eye, EyeOff, Info, ArrowUpRight, TrendingUp, TrendingDown, Wallet,
  Copy, Check, AlertTriangle, Clock, Layers
} from "lucide-react";
import { GearSpinner } from "@/components/gear-loader";

import { financeApi } from "@/lib/api-finance";
import { investmentsApi } from "@/lib/api-investments";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { playSound } from "@/lib/sounds";
import walletIllustration from "@/assets/wallet_illustration.png";

export const Route = createFileRoute("/dashboard/wallet")({ component: WalletPage });

interface CoinData {
  price: number;
  change: number;
}

interface RatesData {
  BTC: CoinData;
  ETH: CoinData;
  SOL: CoinData;
  BNB: CoinData;
}

// Sparkline SVG renderer
function Sparkline({ change }: { change: number }) {
  const points = change >= 0
    ? "0,16 8,14 16,15 24,10 32,12 40,6 48,2"
    : "0,2 8,6 16,4 24,12 32,10 40,15 48,18";
  return (
    <svg className="w-8 h-4 sm:w-14 sm:h-6 opacity-90" viewBox="0 0 48 20">
      <polyline
        fill="none"
        stroke={change >= 0 ? "#10b981" : "#f43f5e"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function WalletPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [depositAmount, setDepositAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);


  const comingSoonCurrencies = [
    { code: "INR", name: "Indian Rupee", flag: "🇮🇳" },
    { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳" },
    { code: "AED", name: "UAE Dirham", flag: "🇦🇪" },
    { code: "SAR", name: "Saudi Riyal", flag: "🇸🇦" },
  ];

  // 1. Fetch live coin prices from Binance API with automatic fallback
  const { data: rates } = useQuery<RatesData>({
    queryKey: ["liveCryptoRates"],
    queryFn: async () => {
      try {
        const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
        const promises = symbols.map(s =>
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}`)
            .then(res => {
              if (!res.ok) throw new Error("Binance API error");
              return res.json();
            })
        );
        const results = await Promise.all(promises);
        return {
          BTC: { price: parseFloat(results[0].lastPrice), change: parseFloat(results[0].priceChangePercent) },
          ETH: { price: parseFloat(results[1].lastPrice), change: parseFloat(results[1].priceChangePercent) },
          SOL: { price: parseFloat(results[2].lastPrice), change: parseFloat(results[2].priceChangePercent) },
          BNB: { price: parseFloat(results[3].lastPrice), change: parseFloat(results[3].priceChangePercent) }
        };
      } catch (error) {
        console.warn("Using fallback live crypto rates:", error);
        return {
          BTC: { price: 68745.32, change: 2.35 },
          ETH: { price: 3785.61, change: 1.85 },
          SOL: { price: 175.36, change: 3.12 },
          BNB: { price: 572.72, change: 1.37 }
        };
      }
    },
    refetchInterval: 12000,
  });

  // 2. Fetch User synchronized Firebase wallets
  const { data: walletsData } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await financeApi.getWallets();
      return res.wallet;
    }
  });

  // 5. Fetch user investments for dynamic stats
  const { data: investments = [] } = useQuery({
    queryKey: ["myInvestments"],
    queryFn: async () => {
      const res = await investmentsApi.getMyInvestments();
      return res.investments || [];
    }
  });

  // 3. Fetch automated payment gateways for deposits
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["depositPaymentMethods"],
    queryFn: async () => {
      const res = await financeApi.getPaymentMethods();
      return res.methods || [];
    }
  });

  const automatedMethods = paymentMethods.filter(
    (m: any) => m.gateway === "payfast" || m.gateway === "coinpayments"
  );

  const selectedMethod = automatedMethods.find((m: any) => m._id === paymentMethodId);
  const isPkr = selectedMethod?.currency === "PKR";

  // 4. Deposit checkout link generation mutation
  const depositMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethodId: string }) => {
      if (isPkr) {
        return financeApi.createPkrDeposit({ amountPKR: data.amount });
      } else {
        return financeApi.createUsdtDeposit({ amountUSDT: data.amount });
      }
    },
    onSuccess: (res: any) => {
      if (res?.deposit?.checkoutUrl) {
        playSound.playSuccess();
        if (isPkr) {
          toast.success("Redirecting to PayFast payment gateway...");
          setTimeout(() => {
            window.location.href = res.deposit.checkoutUrl;
          }, 1200);
        } else {
          // Redirect to the dedicated checkout page
          setIsDepositModalOpen(false);
          navigate({ to: "/dashboard/checkout/$depositId", params: { depositId: res.deposit.id } });
        }
      } else {
        toast.error("Failed to initiate deposit checkout link.");
      }
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  const handleDepositSubmit = () => {
    if (!depositAmount || !paymentMethodId) {
      toast.error("Please fill in all deposit fields.");
      return;
    }
    const numAmount = Number(depositAmount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }
    playSound.playClick();
    depositMutation.mutate({
      amount: numAmount,
      paymentMethodId
    });
  };



  // Wallet balances breakdown
  const depositBal = walletsData?.deposit || 0;
  const bonusBal = walletsData?.bonusReceived || 0;
  const roiBal = walletsData?.roi || 0;
  const referralBal = walletsData?.referral || 0;
  const salaryBal = walletsData?.salary || 0;
  const achievementBal = walletsData?.achievement || 0;
  const withdrawalDeducted = walletsData?.withdrawal || 0;

  // Withdrawal Balance: Available ROI and referral/salary earnings minus already withdrawn
  const withdrawableBal = Math.max(0, (roiBal + referralBal + salaryBal + achievementBal) - withdrawalDeducted);
  const freeBonusBal = walletsData?.freeRegBonus || 0;
  const bonusActivationBal = walletsData?.bonusActivation || 0;
  const bonusTransferableBal = walletsData?.bonusTransferable || 0;

  // Total assets balance
  const totalBalance = depositBal + bonusBal + withdrawableBal + freeBonusBal + bonusActivationBal + bonusTransferableBal;
  const formattedBalance = totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Dynamic estimation of today's ROI profit and change percentage
  const activeInvestments = investments.filter((i: any) => i.status === "active");
  const todayProfit = activeInvestments.reduce((sum: number, inv: any) => sum + (inv.amount * (inv.currentRoi || 1.2) / 100), 0);
  const changePercent = totalBalance > 0 ? (todayProfit / totalBalance) * 100 : 0;

  // Tickers list configuration with live values matching reference screenshot style
  const coinTickers = [
    { name: "Bitcoin", symbol: "BTC/USDT", logoBg: "bg-[#FF9500] shadow-[0_4px_12px_rgba(255,149,0,0.25)]", tag: "BTC", initial: 68745.32, logo: "₿" },
    { name: "Ethereum", symbol: "ETH/USDT", logoBg: "bg-[#6366F1] shadow-[0_4px_12px_rgba(99,102,241,0.25)]", tag: "ETH", initial: 3785.61, logo: "Ξ" },
    { name: "Solana", symbol: "SOL/USDT", logoBg: "bg-[#8B5CF6] shadow-[0_4px_12px_rgba(139,92,246,0.25)]", tag: "SOL", initial: 175.36, logo: "◎" },
    { name: "BNB", symbol: "BNB/USDT", logoBg: "bg-[#F2B824] shadow-[0_4px_12px_rgba(242,184,36,0.25)]", tag: "BNB", initial: 572.72, logo: "❖" }
  ];

  return (
    <DashboardLayout title="Wallets & Assets">
      <div className="space-y-6">

        {/* Live Coin Prices Grid (Responsive matching card design) */}
        {/* <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar flex-nowrap lg:grid lg:grid-cols-4 gap-3 sm:gap-4 w-full pb-3 lg:pb-0 scroll-smooth">
          {coinTickers.map((t) => {
            const liveRate = rates ? rates[t.tag as keyof RatesData] : { price: t.initial, change: 1.5 };
            const isPositive = liveRate.change >= 0;
            return (
              <div
                key={t.symbol}
                className="snap-start flex-shrink-0 w-[47%] sm:w-[31%] lg:w-auto glass-card-hover bg-white/95 dark:bg-[#0c1b15]/95 border border-[#e2f0eb] dark:border-emerald-950/40 rounded-[28px] shadow-[0_8px_24px_rgba(8,26,18,0.02)] transition-all duration-300 hover:shadow-[0_12px_28px_rgba(8,26,18,0.04)] lg:hover:-translate-y-0.5"
              >
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-extrabold text-[#2E6F52] dark:text-emerald-400/80 uppercase tracking-widest leading-none truncate">
                      {t.name} ({t.tag})
                    </p>
                    <p className="text-base sm:text-lg md:text-xl font-black tracking-tight text-[#0E1B15] dark:text-[#E8F5E9] break-all leading-none mt-2 font-sans">
                      ${liveRate.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 leading-none flex-wrap">
                      <span className={`text-[8.5px] sm:text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-[6px] ${isPositive ? 'bg-[#EBF7F2] text-[#10b981]' : 'bg-rose-500/10 text-rose-500'}`}>
                        {isPositive ? "+" : ""}{liveRate.change.toFixed(2)}%
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-[#668C7A] dark:text-[#8ca99e]">
                        ≈ PKR {Math.round(liveRate.price * 278.42).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center font-black text-sm sm:text-base flex-shrink-0 text-white ${t.logoBg}`}>
                    {t.logo}
                  </div>
                </div>
              </div>
            );
          })}
        </div> */}

        {/* Layout Grid: 3 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left/Center Section: Banner, Actions and Assets List */}
          <div className="lg:col-span-2 space-y-6">

            {/* Total Balance Card (USDT Styled Banner) */}
            <div
              style={{ backgroundImage: `url(${walletIllustration})` }}
              className="relative overflow-hidden rounded-[32px] bg-[#001e14] bg-contain bg-no-repeat bg-right border border-emerald-500/20 shadow-elevated p-6 sm:p-7 text-white flex justify-between items-center group min-h-[160px] sm:min-h-[180px]"
            >
              {/* Overlay gradient to fade the image on the left for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#001e14] via-[#001e14]/85 to-transparent pointer-events-none z-0" />

              {/* Overlay grid lines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(14,159,110,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(14,159,110,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-0" />

              <div className="relative z-10 space-y-4 max-w-[65%]">
                <div className="flex items-center gap-2 text-emerald-100/70">
                  <span className="text-[10px] font-black uppercase tracking-wider">Total Wallet Balance</span>
                  <button
                    onClick={() => {
                      playSound.playClick();
                      setShowBalance(!showBalance);
                    }}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title={showBalance ? "Hide Balance" : "Show Balance"}
                  >
                    {showBalance ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black tracking-tight font-mono">
                    {showBalance ? `$ ${formattedBalance}` : "••••••"}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-200/60 font-mono">
                    ≈ {showBalance ? `${formattedBalance} USDT` : "••••••"}
                  </div>
                </div>

                <Badge className={`bg-emerald-500/20 hover:bg-emerald-500/20 text-[#10b981] font-black border border-emerald-500/30 text-[9px] uppercase tracking-wider py-0.5 px-2 flex items-center gap-1 w-fit`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}% (24h)
                </Badge>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <Card className="border-glass-border shadow-soft bg-white/90 dark:bg-card/90">
              <CardContent className="p-4 flex justify-around items-center gap-2">

                {/* Deposit action trigger */}
                <button
                  onClick={() => {
                    playSound.playChime();
                    setIsDepositModalOpen(true);
                  }}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div className="h-11 w-11 rounded-full flex items-center justify-center bg-[#0e9f6e] text-white shadow-[0_4px_12px_rgba(14,159,110,0.25)] transition-all active:scale-95 hover:scale-105 group-hover:-translate-y-0.5">
                    <Download size={18} className="stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-bold mt-2 text-foreground group-hover:text-[#0e9f6e] transition-colors">
                    Deposit
                  </span>
                </button>

                {/* Withdrawal Link */}
                <Link
                  to="/dashboard/withdraw"
                  onClick={() => playSound.playClick()}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="h-11 w-11 rounded-full flex items-center justify-center bg-[#f3ba2f] text-white shadow-[0_4px_12px_rgba(243,186,47,0.25)] transition-all active:scale-95 hover:scale-105 group-hover:-translate-y-0.5">
                    <Upload size={18} className="stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-bold mt-2 text-foreground group-hover:text-[#f3ba2f] transition-colors">
                    Withdrawal
                  </span>
                </Link>

                {/* Transfer Link */}
                <Link
                  to="/dashboard/transfer"
                  onClick={() => playSound.playClick()}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="h-11 w-11 rounded-full flex items-center justify-center bg-[#0e9f6e] text-white shadow-[0_4px_12px_rgba(14,159,110,0.25)] transition-all active:scale-95 hover:scale-105 group-hover:-translate-y-0.5">
                    <ArrowLeftRight size={18} className="stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-bold mt-2 text-foreground group-hover:text-[#0e9f6e] transition-colors">
                    Transfer
                  </span>
                </Link>

              </CardContent>
            </Card>

            {/* Assets List Card */}
            <Card className="border-glass-border shadow-soft overflow-hidden bg-white/90 dark:bg-card/90">
              <div className="bg-muted/35 px-4 py-3 border-b border-glass-border flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[#0e9f6e] text-white shadow-[0_3px_8px_rgba(14,159,110,0.2)] flex-shrink-0">
                    <Wallet size={14} className="stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-black uppercase text-foreground tracking-wider">Asset Breakdown</span>
                </div>
                <span className="text-[9px] font-extrabold text-[#0e9f6e] uppercase tracking-wider bg-[#0e9f6e]/10 px-2 py-0.5 rounded-full">Secure Cold Storage</span>
              </div>
              <CardContent className="p-0 divide-y divide-glass-border/40">

                {/* 1. USDT Deposit Balance */}
                <Dialog>
                  <DialogTrigger asChild>
                    <div onClick={() => playSound.playClick()} className="flex items-center justify-between p-4 hover:bg-secondary/25 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[#0e9f6e] text-white">
                          <Wallet size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">USDT (BEP20)</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">Main Deposit Wallet</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <div className="text-xs font-black text-foreground font-mono">
                            {showBalance ? `${depositBal.toFixed(2)} USDT` : "••••••"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium font-mono mt-0.5">
                            {showBalance ? `≈ $${depositBal.toFixed(2)}` : "••••••"}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  </DialogTrigger>
                  {/* Reuse modal for direct asset deposit trigger */}
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Deposit into USDT Wallet</DialogTitle>
                      <p className="text-xs text-muted-foreground mt-1">Enter your amount below to checkout with PKR/USDT.</p>
                    </DialogHeader>
                    <div className="space-y-4 py-3 text-xs">
                      <div className="space-y-1.5">
                        <Label>Select Deposit Gateway</Label>
                        <Select
                          value={paymentMethodId}
                          onValueChange={(val) => {
                            if (["INR", "CNY", "AED", "SAR"].includes(val)) {
                              playSound.playChime();
                              setIsComingSoonOpen(true);
                              return;
                            }
                            setPaymentMethodId(val);
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Choose gateway..." /></SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            {automatedMethods.map((m: any) => (
                              <SelectItem key={m._id} value={m._id}>
                                {m.currency === "PKR" ? "🇵🇰 Deposit in PKR" : "💵 Deposit in USDT"}
                              </SelectItem>
                            ))}
                            {comingSoonCurrencies.map((c) => (
                              <SelectItem key={c.code} value={c.code} className="text-xs opacity-75">
                                {c.flag} Deposit in {c.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Deposit Amount</Label>
                        <Input type="number" placeholder="100" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button className="w-full glass-button-primary" onClick={handleDepositSubmit} disabled={depositMutation.isPending}>
                        {depositMutation.isPending ? <GearSpinner className="mr-2 h-4 w-4" /> : `Initiate Deposit`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* 2. Bonus Balance */}
                <Link to="/dashboard/packages" onClick={() => playSound.playClick()} className="flex items-center justify-between p-4 hover:bg-secondary/25 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[#f3ba2f] text-white">
                      <Gift size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Bonus Balance</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">Earned MLM & referral incentives</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-xs font-black text-foreground font-mono">
                        {showBalance ? `${bonusBal.toFixed(2)} USDT` : "••••••"}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium font-mono mt-0.5">
                        {showBalance ? `≈ $${bonusBal.toFixed(2)}` : "••••••"}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>

                {/* 3. Withdrawal Balance */}
                <Link to="/dashboard/withdraw" onClick={() => playSound.playClick()} className="flex items-center justify-between p-4 hover:bg-secondary/25 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-500 text-white">
                      <Upload size={16} className="rotate-45" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Withdrawal Balance</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">Withdrawable ROI & Profit</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-xs font-black text-foreground font-mono">
                        {showBalance ? `${withdrawableBal.toFixed(2)} USDT` : "••••••"}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium font-mono mt-0.5">
                        {showBalance ? `≈ $${withdrawableBal.toFixed(2)}` : "••••••"}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>

                {/* 4. Free Team Bonus */}
                <Link to="/dashboard/transfer" onClick={() => playSound.playClick()} className="flex items-center justify-between p-4 hover:bg-secondary/25 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-purple-500 text-white">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Free Team Bonus</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">Free synced registration incentives</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-xs font-black text-foreground font-mono">
                        {showBalance ? `${freeBonusBal.toFixed(2)} USDT` : "••••••"}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium font-mono mt-0.5">
                        {showBalance ? `≈ $${freeBonusBal.toFixed(2)}` : "••••••"}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>

                {/* 5. Transferable Team Bonus */}
                <Link to="/dashboard/transfer" onClick={() => playSound.playClick()} className="flex items-center justify-between p-4 hover:bg-secondary/25 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[#0e9f6e] text-white">
                      <ArrowLeftRight size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Transferable Team Bonus</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium flex flex-wrap items-center gap-1.5">
                        <span>50% registration rewards for downline transfer</span>
                        {user?.teamBonusDeadline && (
                          <span className={`text-[8.5px] px-1.5 py-0.25 rounded font-black tracking-wider uppercase leading-none ${new Date(user.teamBonusDeadline) > new Date()
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-muted text-muted-foreground border border-glass-border-soft"
                            }`}>
                            {new Date(user.teamBonusDeadline) > new Date() ? "Active" : "Ended"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-xs font-black text-foreground font-mono">
                        {showBalance ? `${bonusTransferableBal.toFixed(2)} USDT` : "••••••"}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium font-mono mt-0.5">
                        {showBalance ? `≈ $${bonusTransferableBal.toFixed(2)}` : "••••••"}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>

                {/* 6. Level Activation Bonus */}
                <Link to="/dashboard/levels" onClick={() => playSound.playClick()} className="flex items-center justify-between p-4 hover:bg-secondary/25 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-indigo-600 text-white">
                      <Layers size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Level Activation Bonus</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium flex flex-wrap items-center gap-1.5">
                        <span>50% registration rewards for levels usage</span>
                        {user?.teamBonusDeadline && (
                          <span className={`text-[8.5px] px-1.5 py-0.25 rounded font-black tracking-wider uppercase leading-none ${new Date(user.teamBonusDeadline) > new Date()
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-muted text-muted-foreground border border-glass-border-soft"
                            }`}>
                            {new Date(user.teamBonusDeadline) > new Date() ? "Active" : "Ended"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-xs font-black text-foreground font-mono">
                        {showBalance ? `${bonusActivationBal.toFixed(2)} USDT` : "••••••"}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium font-mono mt-0.5">
                        {showBalance ? `≈ $${bonusActivationBal.toFixed(2)}` : "••••••"}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>

              </CardContent>
            </Card>

          </div>

          {/* Right Section: Desktop-Friendly Embedded Deposit Panel */}
          <div className="space-y-6">

            {/* Desktop Embedded Deposit Card */}
            <Card className="border-glass-border shadow-soft bg-white/90 dark:bg-card/90 flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-glass-border/30">
                <CardTitle className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-3 text-foreground">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[#0e9f6e] text-white shadow-[0_3px_8px_rgba(14,159,110,0.2)] flex-shrink-0">
                    <Download size={14} className="stroke-[2.5]" />
                  </div>
                  <span>Initiate Deposit</span>
                </CardTitle>
                <CardDescription className="text-[11px] leading-relaxed">
                  Fast automatic checkout. No manual transaction slips or receipt uploads required.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4 text-xs">

                {automatedMethods.length === 0 ? (
                  <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                    <Info className="h-7 w-7 text-amber-500" />
                    <span className="font-bold text-foreground block text-[11px]">Gateways Unavailable</span>
                    <span className="text-muted-foreground block text-[10px]">Automated deposit checkout is currently locked. Check back in a few minutes.</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label className="font-bold block mb-2 text-foreground">Select Payment Method</Label>
                      <Select
                        value={paymentMethodId}
                        onValueChange={(val) => {
                          if (["INR", "CNY", "AED", "SAR"].includes(val)) {
                            playSound.playChime();
                            setIsComingSoonOpen(true);
                            return;
                          }
                          setPaymentMethodId(val);
                        }}
                      >
                        <SelectTrigger className="h-9.5 text-xs"><SelectValue placeholder="Choose a payment gateway" /></SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {automatedMethods.map((m: any) => (
                            <SelectItem key={m._id} value={m._id} className="text-xs">
                              {m.currency === "PKR" ? "🇵🇰 Deposit in PKR" : "Deposit in USDT"}
                            </SelectItem>
                          ))}
                          {comingSoonCurrencies.map((c) => (
                            <SelectItem key={c.code} value={c.code} className="text-xs opacity-75">
                              {c.flag} Deposit in {c.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold block mb-2 text-foreground">Amount to Deposit {selectedMethod ? `(${selectedMethod.currency})` : ""}</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="100"
                          className="h-9.5 pl-3 pr-12 text-xs"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                        <span className="absolute right-3 top-2.5 font-bold text-muted-foreground font-mono text-[10px]">
                          {selectedMethod ? selectedMethod.currency : "USD"}
                        </span>
                      </div>
                    </div>

                    {selectedMethod && (
                      <div className="rounded-xl bg-secondary/50 border border-glass-border-soft p-3 text-[10px] font-mono leading-relaxed space-y-1.5">
                        <div className="flex justify-between">
                          <span>Gateway:</span>
                          <span className="font-bold text-foreground uppercase">
                            {selectedMethod.currency === "PKR" ? "PKR Checkout" : "USDT Checkout"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Currency:</span>
                          <span className="font-bold text-foreground">{selectedMethod.currency}</span>
                        </div>
                        <div className="flex justify-between border-t border-glass-border-soft pt-1.5">
                          <span className="text-emerald-500 font-bold">Checkout is Instant:</span>
                          <span className="text-emerald-500 font-bold">Auto-Credit</span>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleDepositSubmit}
                      disabled={depositMutation.isPending}
                      className="w-full bg-gradient-to-r from-[#004d33] to-[#0e9f6e] hover:from-[#0c6a46] hover:to-[#10b981] text-white font-extrabold h-9.5 rounded-xl shadow-md transition-all cursor-pointer text-xs"
                    >
                      {depositMutation.isPending ? (
                        <GearSpinner className="mr-2 h-4 w-4" />
                      ) : (
                        `Deposit in ${selectedMethod?.currency === "PKR" ? "PKR" : "USDT"}`
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Security Rules Card */}
            <Card className="border-glass-border shadow-soft bg-glass-surface">
              <CardHeader className="pb-3 border-b border-glass-border/30">
                <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-3 text-foreground">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[#f3ba2f] text-white shadow-[0_3px_8px_rgba(243,186,47,0.2)] flex-shrink-0">
                    <Shield size={14} className="stroke-[2.5]" />
                  </div>
                  <span>Asset Safeguard Policy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-[11px] text-muted-foreground leading-relaxed space-y-2.5">
                <p>We implement bank-level encryption standards to secure transactions and hold asset values in localized reserve funds:</p>
                <ul className="space-y-1.5 pt-2 border-t border-glass-border/30">
                  <li>• <strong>No Manual Slip uploads:</strong> All deposits are fully automated; do not trust offline agent invoices.</li>
                  <li>• <strong>Verification times:</strong> Blockchain deposits require 3 network confirmations.</li>
                  <li>• <strong>Sweep Limits:</strong> Free Team bonuses must be swept before package purchases.</li>
                </ul>
              </CardContent>
            </Card>

          </div>

        </div>

        {/* Assets Summary Footer Strip */}
        <div className="rounded-2xl p-3 bg-white/80 dark:bg-card/85 border border-glass-border shadow-card flex flex-wrap items-center justify-around gap-4 text-xs">

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg"><Shield size={15} /></div>
            <div>
              <span className="text-[9px] text-muted-foreground block uppercase font-bold">Total Assets</span>
              <span className="font-extrabold text-foreground mt-0.5 block font-mono">
                {showBalance ? `$${formattedBalance}` : "••••••"}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-glass-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#f3ba2f]/10 text-[#f3ba2f] rounded-lg"><TrendingUp size={15} /></div>
            <div>
              <span className="text-[9px] text-muted-foreground block uppercase font-bold">24h Change</span>
              <span className={`font-extrabold mt-0.5 block ${changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-glass-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg"><RefreshCw size={15} /></div>
            <div>
              <span className="text-[9px] text-muted-foreground block uppercase font-bold">Today Profit</span>
              <span className="font-extrabold text-emerald-500 mt-0.5 block font-mono">
                {todayProfit >= 0 ? "+" : ""}${todayProfit.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-glass-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg"><Crown size={15} /></div>
            <div>
              <span className="text-[9px] text-muted-foreground block uppercase font-bold">Your Level</span>
              <span className="font-extrabold text-[#f3ba2f] mt-0.5 block">
                VIP {user?.vipRank || 1} Tier
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Hidden Dialog for Mobile Trigger deposit */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Secure Deposit</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Enter your amount below to checkout with PKR/USDT.</p>
          </DialogHeader>
          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1.5">
              <Label className="mb-2 block font-bold">Select Deposit Gateway</Label>
              <Select
                value={paymentMethodId}
                onValueChange={(val) => {
                  if (["INR", "CNY", "AED", "SAR"].includes(val)) {
                    playSound.playChime();
                    setIsComingSoonOpen(true);
                    return;
                  }
                  setPaymentMethodId(val);
                }}
              >
                <SelectTrigger className="h-9.5 text-xs"><SelectValue placeholder="Choose gateway..." /></SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {automatedMethods.map((m: any) => (
                    <SelectItem key={m._id} value={m._id} className="text-xs">
                      {m.currency === "PKR" ? "🇵🇰 Deposit in PKR" : "💵 Deposit in USDT"}
                    </SelectItem>
                  ))}
                  {comingSoonCurrencies.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="text-xs opacity-75">
                      {c.flag} Deposit in {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="mb-2 block">Deposit Amount</Label>
              <Input
                type="number"
                placeholder="100"
                className="h-9.5 text-xs"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full glass-button-primary" onClick={handleDepositSubmit} disabled={depositMutation.isPending}>
              {depositMutation.isPending ? <GearSpinner className="mr-2 h-4 w-4" /> : `Initiate Deposit`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coming Soon Dialog for select currencies */}
      <Dialog open={isComingSoonOpen} onOpenChange={setIsComingSoonOpen}>
        <DialogContent className="max-w-sm rounded-[28px] p-6 text-center space-y-4">
          <DialogHeader className="flex flex-col items-center">
            <div className="animate-bounce mr-3 mt-5">
              <SkyRiseLogo variant="light" className="h-12 w-auto" />
            </div>
            <DialogTitle className="text-lg font-black text-foreground mt-4">
              Currency Coming Soon!
            </DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground leading-relaxed">
            We are working hard to integrate local payment gateways for this region. Automatic deposits and withdrawals in this currency will be available soon!
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setIsComingSoonOpen(false)} className="w-full bg-[#0e9f6e] hover:bg-[#0c6a46] text-white font-extrabold h-10 rounded-xl cursor-pointer shadow-md">
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



    </DashboardLayout>
  );
}
