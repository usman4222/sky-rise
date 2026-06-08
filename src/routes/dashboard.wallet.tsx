import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Gift, Users, Wallet, ArrowUpRight,
  Shield, TrendingUp, Zap,
  Play, Download, Upload, Target, ChevronRight, Activity, Clock
} from "lucide-react";
import { GearSpinner } from "@/components/gear-loader";
import { financeApi } from "@/lib/api-finance";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
const playSound = { playClick: () => {}, playSuccess: () => {} };

export const Route = createFileRoute("/dashboard/wallet")({ component: WalletPage });

/* ── Smooth Count-up ── */
function CountUpBalance({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const start = prev.current;
    if (start === value) return;
    const dur = 1200;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setDisplay(start + (value - start) * ease);
      if (p < 1) requestAnimationFrame(tick);
      else { setDisplay(value); prev.current = value; }
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>${display.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
}

function WalletPage() {
  const { user } = useAuthStore();
  const [depositAmount, setDepositAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [simIncrease, setSimIncrease] = useState(0.05);
  const [simEarned, setSimEarned] = useState(0.05);
  const [simLogs, setSimLogs] = useState([
    { id: "r4", name: "Daily ROI #4", time: "14:01:33", amount: 0.02 },
    { id: "r3", name: "Daily ROI #3", time: "14:01:21", amount: 0.02 },
    { id: "r2", name: "Daily ROI #2", time: "14:01:10", amount: 0.01 },
    { id: "r1", name: "Daily ROI #1", time: "14:00:15", amount: 0.01 },
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [autoSim, setAutoSim] = useState(false);

  const { data: walletsData, isLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => { const r = await financeApi.getWallets(); return r.wallet; },
  });
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: async () => { const r = await financeApi.getPaymentMethods(); return r.methods || []; },
  });

  const autoMethods = paymentMethods.filter((m: any) => m.gateway === "payfast" || m.gateway === "coinpayments");
  const selectedMethod = autoMethods.find((m: any) => m._id === paymentMethodId);
  const isPkr = selectedMethod?.currency === "PKR";

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethodId: string }) => {
      if (isPkr) return financeApi.createPkrDeposit({ amountPKR: data.amount });
      return financeApi.createUsdtDeposit({ amountUSDT: data.amount });
    },
    onSuccess: (res: any) => {
      if (res?.deposit?.checkoutUrl) {
        toast.success("Redirecting to payment gateway…");
        setTimeout(() => { window.location.href = res.deposit.checkoutUrl; }, 1200);
      } else toast.error("Failed to initiate deposit.");
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err)),
  });

  const handleDeposit = () => {
    if (!depositAmount || !paymentMethodId) { toast.error("Fill all fields."); return; }
    const n = Number(depositAmount);
    if (isNaN(n) || n <= 0) { toast.error("Invalid amount."); return; }
    depositMutation.mutate({ amount: n, paymentMethodId });
  };

  const handleSimulate = () => {
    playSound.playSuccess();
    setIsSimulating(true);
    const amt = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const idx = simLogs.length + 1;
    setTimeout(() => {
      setSimIncrease(p => p + amt);
      setSimEarned(p => p + amt);
      setSimLogs(p => [{ id: `s${idx}`, name: `Daily ROI #${idx}`, time, amount: amt }, ...p.slice(0, 5)]);
      setIsSimulating(false);
      toast.success(`+$${amt.toFixed(2)} ROI simulated!`);
    }, 400);
  };

  useEffect(() => {
    if (!autoSim) return;
    const iv = setInterval(handleSimulate, 3000);
    return () => clearInterval(iv);
  }, [autoSim, simLogs]);

  const depositBal = walletsData?.deposit || 0;
  const bonusBal = walletsData?.freeRegBonus || 0;
  const teamBal = walletsData?.bonusReceived || 0;
  const totalBal = depositBal + bonusBal + teamBal + simIncrease;
  const targetROI = Math.max(0.05, (depositBal + bonusBal + teamBal) * 0.012);
  const targetPct = Math.min(100, (simEarned / targetROI) * 100);

  const userInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : "ZS";

  return (
    <DashboardLayout title="Wallets & Deposits">
      <style>{`
        /* ── WALLET PAGE DARK THEME ── */
        .wp-root {
          background: #0a1a0e;
          min-height: 100vh;
          padding: 0 0 100px 0;
          font-family: 'Inter', system-ui, sans-serif;
          color: #fff;
        }

        /* Header */
        .wp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 18px 12px;
        }
        .wp-header-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .wp-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f3ba2f, #e6a800);
          color: #0a1a0e;
          font-weight: 900;
          font-size: 0.75rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .wp-avatar:hover { transform: scale(1.08); }

        /* Live badge */
        .wp-live-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.3);
          color: #22c55e;
          font-size: 0.6rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 3px 9px; border-radius: 99px;
          margin: 4px 18px 0;
        }
        .wp-live-dot {
          width: 5px; height: 5px;
          background: #22c55e; border-radius: 50%;
          animation: wpPulse 1.4s ease-in-out infinite;
        }
        @keyframes wpPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(1.4); }
        }

        /* Hero balance */
        .wp-hero {
          padding: 14px 18px 20px;
        }
        .wp-hero-label {
          font-size: 0.6rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.15em;
          color: rgba(255,255,255,0.45);
          margin-bottom: 6px;
        }
        .wp-hero-balance {
          font-size: 2.6rem; font-weight: 900;
          letter-spacing: -0.04em; line-height: 1;
          color: #f3ba2f;
          font-variant-numeric: tabular-nums;
        }
        .wp-hero-sub {
          font-size: 0.62rem; color: #22c55e;
          margin-top: 6px; font-weight: 600;
        }

        /* Stats row */
        .wp-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin: 0 18px 18px;
        }
        .wp-stat-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 10px 8px;
          text-align: center;
        }
        .wp-stat-val {
          font-size: 0.8rem; font-weight: 800;
          color: #f3ba2f; font-variant-numeric: tabular-nums;
        }
        .wp-stat-lbl {
          font-size: 0.55rem; font-weight: 700;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-top: 3px;
        }

        /* Action buttons */
        .wp-actions {
          display: flex; gap: 10px;
          margin: 0 18px 22px;
        }
        .wp-btn {
          flex: 1; height: 44px;
          border-radius: 12px;
          font-weight: 700; font-size: 0.85rem;
          display: flex; align-items: center; justify-content: center;
          gap: 7px; cursor: pointer;
          transition: all 0.2s ease;
          border: 1.5px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.06);
          color: #fff;
        }
        .wp-btn:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.35);
          transform: translateY(-1px);
        }
        .wp-btn:active { transform: scale(0.97); }

        /* Section header */
        .wp-section-label {
          font-size: 0.62rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: rgba(255,255,255,0.4);
          padding: 0 18px 10px;
        }

        /* Wallet list items */
        .wp-wallet-list {
          padding: 0 18px;
          display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 22px;
        }
        .wp-wallet-item {
          background: #111f14;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px 14px;
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.2s;
          cursor: default;
        }
        .wp-wallet-item:hover {
          background: #162417;
          border-color: rgba(243,186,47,0.2);
          transform: translateY(-1px);
        }
        .wp-wallet-left { display: flex; align-items: center; gap: 12px; }
        .wp-wallet-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .wp-icon-green { background: linear-gradient(135deg,#1a4d2e,#0d6e40); box-shadow: 0 3px 12px rgba(16,185,129,0.25); }
        .wp-icon-gold  { background: linear-gradient(135deg,#4d3a00,#b8860b); box-shadow: 0 3px 12px rgba(243,186,47,0.25); }
        .wp-icon-blue  { background: linear-gradient(135deg,#0c3050,#1565c0); box-shadow: 0 3px 12px rgba(33,150,243,0.25); }
        .wp-icon-purple{ background: linear-gradient(135deg,#2d1b5e,#6d28d9); box-shadow: 0 3px 12px rgba(109,40,217,0.25); }

        .wp-wallet-name {
          font-size: 0.78rem; font-weight: 700; color: #fff;
          line-height: 1.2;
        }
        .wp-wallet-desc {
          font-size: 0.6rem; color: rgba(255,255,255,0.4);
          margin-top: 2px;
        }
        .wp-wallet-right { text-align: right; }
        .wp-wallet-amount {
          font-size: 0.85rem; font-weight: 800;
          color: #fff; font-variant-numeric: tabular-nums;
        }
        .wp-badge {
          display: inline-block;
          font-size: 0.55rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.08em;
          padding: 2px 7px; border-radius: 99px;
          margin-top: 4px;
        }
        .wp-badge-locked  { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.4); }
        .wp-badge-active  { background: rgba(34,197,94,0.15); color: #22c55e; }
        .wp-badge-pending { background: rgba(243,186,47,0.12); color: #f3ba2f; }

        /* ROI target progress */
        .wp-target-card {
          margin: 0 18px 16px;
          background: #111f14;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px;
        }
        .wp-target-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .wp-target-title {
          font-size: 0.7rem; font-weight: 800;
          color: rgba(255,255,255,0.7);
          text-transform: uppercase; letter-spacing: 0.08em;
          display: flex; align-items: center; gap: 6px;
        }
        .wp-target-pct {
          font-size: 0.9rem; font-weight: 900;
          color: #f3ba2f;
        }
        .wp-progress-track {
          height: 8px; background: rgba(255,255,255,0.08);
          border-radius: 99px; overflow: hidden;
        }
        .wp-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #f3ba2f, #22c55e);
          border-radius: 99px;
          transition: width 0.6s cubic-bezier(0.25,1,0.5,1);
        }
        .wp-target-sub {
          display: flex; justify-content: space-between;
          margin-top: 6px;
          font-size: 0.6rem; color: rgba(255,255,255,0.35); font-weight: 600;
        }

        /* ROI Activity */
        .wp-activity-card {
          margin: 0 18px 16px;
          background: #111f14;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px;
        }
        .wp-activity-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .wp-activity-title {
          font-size: 0.7rem; font-weight: 800;
          color: rgba(255,255,255,0.7);
          display: flex; align-items: center; gap: 6px;
          text-transform: uppercase; letter-spacing: 0.08em;
        }
        .wp-view-all {
          font-size: 0.62rem; color: #f3ba2f; font-weight: 700;
          text-decoration: none;
          display: flex; align-items: center; gap: 2px;
          transition: opacity 0.2s;
        }
        .wp-view-all:hover { opacity: 0.75; }
        .wp-log-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 7px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .wp-log-item:last-child { border-bottom: none; }
        .wp-log-left { display: flex; align-items: center; gap: 8px; }
        .wp-log-icon {
          width: 26px; height: 26px;
          background: rgba(34,197,94,0.12);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #22c55e;
        }
        .wp-log-name {
          font-size: 0.72rem; font-weight: 700; color: #fff;
        }
        .wp-log-time {
          font-size: 0.58rem; color: rgba(255,255,255,0.35);
          display: flex; align-items: center; gap: 3px; margin-top: 2px;
        }
        .wp-log-amount {
          font-size: 0.78rem; font-weight: 800;
          color: #22c55e; font-variant-numeric: tabular-nums;
        }

        /* Simulate button */
        .wp-sim-btn {
          margin: 0 18px 8px;
          width: calc(100% - 36px);
          height: 46px;
          border-radius: 13px;
          background: rgba(243,186,47,0.1);
          border: 1.5px solid rgba(243,186,47,0.3);
          color: #f3ba2f;
          font-weight: 800; font-size: 0.85rem;
          display: flex; align-items: center; justify-content: center;
          gap: 8px; cursor: pointer;
          transition: all 0.2s;
        }
        .wp-sim-btn:hover {
          background: rgba(243,186,47,0.18);
          border-color: rgba(243,186,47,0.6);
          transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(243,186,47,0.2);
        }
        .wp-sim-btn:active { transform: scale(0.97); }
        .wp-sim-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .wp-auto-row {
          display: flex; align-items: center; justify-content: space-between;
          margin: 0 18px;
          font-size: 0.62rem; color: rgba(255,255,255,0.35); font-weight: 600;
        }
        .wp-auto-row input { accent-color: #f3ba2f; cursor: pointer; }
      `}</style>

      <div className="wp-root">
        {/* Header */}
        <div className="wp-header">
          <span className="wp-header-title">Wallets &amp; Deposits</span>
          <div className="wp-avatar">{userInitials}</div>
        </div>

        {/* Live badge */}
        <div className="wp-live-badge">
          <span className="wp-live-dot" />
          Live Account
        </div>

        {/* Hero balance */}
        <div className="wp-hero">
          <div className="wp-hero-label">Total Assets</div>
          <div className="wp-hero-balance">
            {isLoading ? <GearSpinner className="h-8 w-8" /> : <CountUpBalance value={totalBal} />}
          </div>
          <div className="wp-hero-sub">
            Updated just now &nbsp;·&nbsp; +${simIncrease.toFixed(2)} simulated received
          </div>
        </div>

        {/* 3 stat boxes */}
        <div className="wp-stats">
          <div className="wp-stat-box">
            <div className="wp-stat-val">1.20%</div>
            <div className="wp-stat-lbl">Daily ROI</div>
          </div>
          <div className="wp-stat-box">
            <div className="wp-stat-val">${simEarned.toFixed(2)}</div>
            <div className="wp-stat-lbl">Earn Today</div>
          </div>
          <div className="wp-stat-box">
            <div className="wp-stat-val">{targetPct.toFixed(0)}%</div>
            <div className="wp-stat-lbl">Target %</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="wp-actions">
          {/* Deposit dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="wp-btn" onClick={() => playSound.playClick()}>
                <Upload size={15} /> Deposit
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="text-emerald-500" size={18} />
                  Secure Deposit
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-3">
                <div>
                  <Label className="block mb-2 text-sm font-medium">Payment Method</Label>
                  <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Choose a method" /></SelectTrigger>
                    <SelectContent>
                      {autoMethods.map((m: any) => (
                        <SelectItem key={m._id} value={m._id}>{m.name} ({m.currency})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedMethod && (
                    <div className="mt-2 text-[10px] text-emerald-400 font-semibold bg-emerald-400/10 px-3 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-400/25">
                      <Zap size={12} /> Automated — no manual receipt needed
                    </div>
                  )}
                </div>
                <div>
                  <Label className="block mb-2 text-sm font-medium">
                    Amount {selectedMethod ? `(${selectedMethod.currency})` : ""}
                  </Label>
                  <Input type="number" placeholder="100" value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)} className="h-11 text-base" />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full h-11 text-sm font-bold" onClick={handleDeposit}
                  disabled={depositMutation.isPending}>
                  {depositMutation.isPending
                    ? <GearSpinner className="mr-2 h-4 w-4" />
                    : <><ArrowUpRight size={14} className="mr-1" />
                      Pay via {selectedMethod?.gateway === "payfast" ? "PayFast" : "CoinPayments"}</>
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Withdraw */}
          <Link to="/dashboard/withdraw" className="flex-1 block" style={{ flex: 1 }}>
            <button className="wp-btn" style={{ width: "100%" }} onClick={() => playSound.playClick()}>
              <Download size={15} /> Withdraw
            </button>
          </Link>
        </div>

        {/* YOUR WALLETS */}
        <div className="wp-section-label">Your Wallets</div>
        <div className="wp-wallet-list">
          {/* Main Deposit */}
          <div className="wp-wallet-item">
            <div className="wp-wallet-left">
              <div className="wp-wallet-icon wp-icon-green">
                <Wallet size={18} color="#22c55e" />
              </div>
              <div>
                <div className="wp-wallet-name">Main Deposit</div>
                <div className="wp-wallet-desc">Investment capital</div>
              </div>
            </div>
            <div className="wp-wallet-right">
              <div className="wp-wallet-amount">${depositBal.toFixed(2)}</div>
              <span className="wp-badge wp-badge-locked">Locked</span>
            </div>
          </div>

          {/* Registration Bonus */}
          <div className="wp-wallet-item">
            <div className="wp-wallet-left">
              <div className="wp-wallet-icon wp-icon-gold">
                <Gift size={18} color="#f3ba2f" />
              </div>
              <div>
                <div className="wp-wallet-name">Registration Bonus</div>
                <div className="wp-wallet-desc">Merged on first invest</div>
              </div>
            </div>
            <div className="wp-wallet-right">
              <div className="wp-wallet-amount" style={{ color: "#f3ba2f" }}>${bonusBal.toFixed(2)}</div>
              <span className="wp-badge wp-badge-active">Active</span>
            </div>
          </div>

          {/* ROI Earnings */}
          <div className="wp-wallet-item">
            <div className="wp-wallet-left">
              <div className="wp-wallet-icon wp-icon-blue">
                <TrendingUp size={18} color="#60a5fa" />
              </div>
              <div>
                <div className="wp-wallet-name">ROI Earnings</div>
                <div className="wp-wallet-desc">Daily compounding</div>
              </div>
            </div>
            <div className="wp-wallet-right">
              <div className="wp-wallet-amount" style={{ color: "#22c55e" }}>${simIncrease.toFixed(2)}</div>
              <span className="wp-badge wp-badge-active">Active</span>
            </div>
          </div>

          {/* Team Bonus */}
          <div className="wp-wallet-item">
            <div className="wp-wallet-left">
              <div className="wp-wallet-icon wp-icon-purple">
                <Users size={18} color="#a78bfa" />
              </div>
              <div>
                <div className="wp-wallet-name">Team Bonus</div>
                <div className="wp-wallet-desc">Max 10% on packages</div>
              </div>
            </div>
            <div className="wp-wallet-right">
              <div className="wp-wallet-amount">${teamBal.toFixed(2)}</div>
              <span className="wp-badge wp-badge-pending">Pending</span>
            </div>
          </div>
        </div>

        {/* Daily ROI Target */}
        <div className="wp-target-card">
          <div className="wp-target-header">
            <div className="wp-target-title">
              <Target size={13} color="#f3ba2f" /> Daily ROI Target
            </div>
            <span className="wp-target-pct">{targetPct.toFixed(0)}%</span>
          </div>
          <div className="wp-progress-track">
            <div className="wp-progress-fill" style={{ width: `${targetPct}%` }} />
          </div>
          <div className="wp-target-sub">
            <span>${simEarned.toFixed(2)} earned</span>
            <span>Target: ${targetROI.toFixed(2)}</span>
          </div>
        </div>

        {/* ROI Activity */}
        <div className="wp-activity-card">
          <div className="wp-activity-header">
            <div className="wp-activity-title">
              <Activity size={13} color="#22c55e" /> ROI Activity
            </div>
            <Link to="/dashboard/roi" className="wp-view-all">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {simLogs.map(log => (
            <div key={log.id} className="wp-log-item">
              <div className="wp-log-left">
                <div className="wp-log-icon"><TrendingUp size={12} /></div>
                <div>
                  <div className="wp-log-name">{log.name}</div>
                  <div className="wp-log-time"><Clock size={9} />{log.time} · Today</div>
                </div>
              </div>
              <span className="wp-log-amount">+${log.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Simulate ROI */}
        <button className="wp-sim-btn" onClick={handleSimulate} disabled={isSimulating}>
          {isSimulating
            ? <GearSpinner className="h-4 w-4" />
            : <><Play size={14} fill="currentColor" /> Simulate ROI</>
          }
        </button>

        <div className="wp-auto-row">
          <span>Auto-simulate every 3s</span>
          <input type="checkbox" checked={autoSim} onChange={e => setAutoSim(e.target.checked)} />
        </div>
      </div>
    </DashboardLayout>
  );
}
