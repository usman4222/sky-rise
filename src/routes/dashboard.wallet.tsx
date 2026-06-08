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
        /* ── WALLET PAGE LIGHT THEME (matching Dashboard) ── */
        .wp-root {
          background: #f3f6f5;
          min-height: 100vh;
          padding: 0 0 100px 0;
          font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
          color: #081a12;
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
          color: #081a12;
          letter-spacing: -0.02em;
        }
        .wp-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f3ba2f, #e6a800);
          color: #002b1c;
          font-weight: 900;
          font-size: 0.75rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
          box-shadow: 0 3px 10px rgba(243,186,47,0.35);
        }
        .wp-avatar:hover { transform: scale(1.08); }

        /* Live badge */
        .wp-live-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(14,159,110,0.1);
          border: 1px solid rgba(14,159,110,0.25);
          color: #0e9f6e;
          font-size: 0.6rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 3px 9px; border-radius: 99px;
          margin: 4px 18px 0;
        }
        .wp-live-dot {
          width: 5px; height: 5px;
          background: #0e9f6e; border-radius: 50%;
          animation: wpPulse 1.4s ease-in-out infinite;
        }
        @keyframes wpPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(1.5); }
        }

        /* Hero balance — golden card */
        .wp-hero {
          margin: 14px 18px 0;
          background: linear-gradient(135deg, #004d33 0%, #0c6a46 55%, #f3ba2f 100%);
          border-radius: 20px;
          padding: 20px 18px 18px;
          box-shadow: 0 8px 28px rgba(0,77,51,0.22);
        }
        .wp-hero-label {
          font-size: 0.6rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.15em;
          color: rgba(255,255,255,0.6);
          margin-bottom: 6px;
        }
        .wp-hero-balance {
          font-size: 2.6rem; font-weight: 900;
          letter-spacing: -0.04em; line-height: 1;
          color: #ffffff;
          font-variant-numeric: tabular-nums;
        }
        .wp-hero-sub {
          font-size: 0.62rem; color: #a7f3d0;
          margin-top: 8px; font-weight: 600;
        }

        /* Stats row */
        .wp-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 14px 18px 18px;
        }
        .wp-stat-box {
          background: #ffffff;
          border: 1px solid rgba(0,77,51,0.08);
          border-radius: 14px;
          padding: 12px 8px;
          text-align: center;
          box-shadow: 0 2px 10px rgba(8,26,18,0.05);
        }
        .wp-stat-val {
          font-size: 0.85rem; font-weight: 800;
          color: #f3ba2f; font-variant-numeric: tabular-nums;
        }
        .wp-stat-lbl {
          font-size: 0.55rem; font-weight: 700;
          color: #4b6b5d;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-top: 3px;
        }

        /* Action buttons */
        .wp-actions {
          display: flex; gap: 10px;
          margin: 0 18px 22px;
        }
        .wp-btn {
          flex: 1; height: 46px;
          border-radius: 13px;
          font-weight: 700; font-size: 0.85rem;
          display: flex; align-items: center; justify-content: center;
          gap: 7px; cursor: pointer;
          transition: all 0.2s ease;
          border: 1.5px solid rgba(0,77,51,0.15);
          background: #ffffff;
          color: #004d33;
          box-shadow: 0 2px 8px rgba(8,26,18,0.06);
        }
        .wp-btn:hover {
          background: #f3f6f5;
          border-color: #f3ba2f;
          color: #002b1c;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(243,186,47,0.2);
        }
        .wp-btn:active { transform: scale(0.97); }

        /* Section header */
        .wp-section-label {
          font-size: 0.62rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: #4b6b5d;
          padding: 0 18px 10px;
        }

        /* Wallet list items */
        .wp-wallet-list {
          padding: 0 18px;
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 22px;
        }
        .wp-wallet-item {
          background: #ffffff;
          border: 1px solid rgba(0,77,51,0.08);
          border-radius: 16px;
          padding: 14px;
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.2s;
          cursor: default;
          box-shadow: 0 2px 10px rgba(8,26,18,0.04);
        }
        .wp-wallet-item:hover {
          border-color: rgba(243,186,47,0.35);
          box-shadow: 0 4px 18px rgba(243,186,47,0.12);
          transform: translateY(-1px);
        }
        .wp-wallet-left { display: flex; align-items: center; gap: 12px; }
        .wp-wallet-icon {
          width: 42px; height: 42px;
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .wp-icon-green  { background: linear-gradient(135deg,#0e9f6e,#34d399); box-shadow: 0 3px 12px rgba(14,159,110,0.25); }
        .wp-icon-gold   { background: linear-gradient(135deg,#f3ba2f,#ffe082); box-shadow: 0 3px 12px rgba(243,186,47,0.30); }
        .wp-icon-blue   { background: linear-gradient(135deg,#3b82f6,#60a5fa); box-shadow: 0 3px 12px rgba(59,130,246,0.25); }
        .wp-icon-purple { background: linear-gradient(135deg,#8b5cf6,#a78bfa); box-shadow: 0 3px 12px rgba(139,92,246,0.25); }

        .wp-wallet-name {
          font-size: 0.8rem; font-weight: 700; color: #081a12;
          line-height: 1.2;
        }
        .wp-wallet-desc {
          font-size: 0.6rem; color: #4b6b5d;
          margin-top: 2px;
        }
        .wp-wallet-right { text-align: right; }
        .wp-wallet-amount {
          font-size: 0.88rem; font-weight: 800;
          color: #081a12; font-variant-numeric: tabular-nums;
        }
        .wp-badge {
          display: inline-block;
          font-size: 0.55rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.08em;
          padding: 2px 8px; border-radius: 99px;
          margin-top: 4px;
        }
        .wp-badge-locked  { background: rgba(75,107,93,0.1); color: #4b6b5d; }
        .wp-badge-active  { background: rgba(14,159,110,0.12); color: #0e9f6e; }
        .wp-badge-pending { background: rgba(243,186,47,0.15); color: #b8860b; }

        /* ROI target progress */
        .wp-target-card {
          margin: 0 18px 14px;
          background: #ffffff;
          border: 1px solid rgba(0,77,51,0.08);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 10px rgba(8,26,18,0.04);
        }
        .wp-target-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .wp-target-title {
          font-size: 0.7rem; font-weight: 800;
          color: #4b6b5d;
          text-transform: uppercase; letter-spacing: 0.08em;
          display: flex; align-items: center; gap: 6px;
        }
        .wp-target-pct {
          font-size: 0.95rem; font-weight: 900;
          color: #f3ba2f;
        }
        .wp-progress-track {
          height: 8px; background: rgba(0,77,51,0.08);
          border-radius: 99px; overflow: hidden;
        }
        .wp-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #f3ba2f, #0e9f6e);
          border-radius: 99px;
          transition: width 0.6s cubic-bezier(0.25,1,0.5,1);
        }
        .wp-target-sub {
          display: flex; justify-content: space-between;
          margin-top: 6px;
          font-size: 0.6rem; color: #4b6b5d; font-weight: 600;
        }

        /* ROI Activity */
        .wp-activity-card {
          margin: 0 18px 14px;
          background: #ffffff;
          border: 1px solid rgba(0,77,51,0.08);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 10px rgba(8,26,18,0.04);
        }
        .wp-activity-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .wp-activity-title {
          font-size: 0.7rem; font-weight: 800;
          color: #4b6b5d;
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
          padding: 8px 0;
          border-bottom: 1px solid rgba(0,77,51,0.06);
        }
        .wp-log-item:last-child { border-bottom: none; }
        .wp-log-left { display: flex; align-items: center; gap: 8px; }
        .wp-log-icon {
          width: 28px; height: 28px;
          background: rgba(14,159,110,0.1);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: #0e9f6e;
        }
        .wp-log-name {
          font-size: 0.72rem; font-weight: 700; color: #081a12;
        }
        .wp-log-time {
          font-size: 0.58rem; color: #4b6b5d;
          display: flex; align-items: center; gap: 3px; margin-top: 2px;
        }
        .wp-log-amount {
          font-size: 0.78rem; font-weight: 800;
          color: #0e9f6e; font-variant-numeric: tabular-nums;
        }

        /* Simulate button */
        .wp-sim-btn {
          margin: 0 18px 8px;
          width: calc(100% - 36px);
          height: 48px;
          border-radius: 14px;
          background: #f3ba2f;
          border: none;
          color: #002b1c;
          font-weight: 900; font-size: 0.88rem;
          display: flex; align-items: center; justify-content: center;
          gap: 8px; cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 18px rgba(243,186,47,0.35);
        }
        .wp-sim-btn:hover {
          background: #ffe082;
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(243,186,47,0.45);
        }
        .wp-sim-btn:active { transform: scale(0.97); }
        .wp-sim-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .wp-auto-row {
          display: flex; align-items: center; justify-content: space-between;
          margin: 0 18px;
          font-size: 0.62rem; color: #4b6b5d; font-weight: 600;
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
