import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Plus, Edit, ShieldAlert, TrendingUp, Rocket, Coins, X } from "lucide-react";
import { GearSectionLoader, GearSpinner } from "@/components/gear-loader";
import { packagesApi, type PackageData } from "@/lib/api-packages";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { playSound } from "@/lib/sounds";

export const Route = createFileRoute("/dashboard/packages")({ component: PackagesDash });

function PackagesDash() {
  const { user, fetchProfile } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("SUPER_ADMIN");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Refresh profile on page mount to sync real-time wallet balance updates
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Starter" | "Standard" | "Pro" | "VIP">("All");
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<{ pkgName: string; amount: number; totalActive: number; roi: number; isMarketer?: boolean } | null>(null);
  const confettiRef = useRef<HTMLDivElement>(null);

  // Confetti animation — mirrors the registration success animation
  useEffect(() => {
    if (showCelebration && confettiRef.current) {
      const container = confettiRef.current;
      const colors = ['#f3ba2f', '#0e9f6e', '#00e676', '#ffe082', '#ff6f61', '#00C09D', '#2D87B0'];
      const speeds = ['slow', 'medium', 'fast'];
      const inner = document.createElement('div');
      inner.classList.add('confetti-container');
      container.appendChild(inner);

      const interval = setInterval(() => {
        const el = document.createElement('div');
        const size = (Math.floor(Math.random() * 4) + 6) + 'px';
        el.classList.add('confetti', 'confetti--animation-' + speeds[Math.floor(Math.random() * speeds.length)]);
        el.style.left = Math.floor(Math.random() * container.offsetWidth) + 'px';
        el.style.width = size;
        el.style.height = size;
        el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 3000);
        inner.appendChild(el);
      }, 20);

      return () => {
        clearInterval(interval);
        if (inner.parentNode) inner.parentNode.removeChild(inner);
      };
    }
  }, [showCelebration]);



  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["packages", isAdmin],
    queryFn: async () => {
      const res = isAdmin ? await packagesApi.getAdminPackages() : await packagesApi.getPublicPackages();
      return res.packages;
    }
  });

  // Read real balances directly from auth store
  const bonusReceivedBalance = (user?.wallets as any)?.bonusReceived || 0;
  const adminAllocatedBalance = (user?.wallets as any)?.adminAllocated || 0;


  const getPackageTag = (pkg: PackageData) => {
    if (pkg.minAmount >= 5000) return "VIP";
    if (pkg.minAmount >= 1000) return "Pro";
    if (pkg.minAmount >= 100) return "Standard";
    return "Starter";
  };

  const filteredPackages = packages.filter((p) => {
    if (selectedFilter === "All") return true;
    return getPackageTag(p) === selectedFilter;
  });

  const purchaseMutation = useMutation({
    mutationFn: (vars: { id: string; amount: number; autoReinvest: boolean; pkgName: string; roi: number; regBonusApplied: boolean; useAdminAllocated?: boolean }) =>
      packagesApi.purchasePackage(vars.id, vars.amount, !vars.useAdminAllocated, vars.useAdminAllocated, vars.autoReinvest),
    onSuccess: (_, vars) => {
      playSound.playSuccess();
      // Show celebration dialog with purchase summary
      const totalActive = vars.regBonusApplied ? vars.amount + 5 : vars.amount;
      setLastPurchase({ pkgName: vars.pkgName, amount: vars.amount, totalActive, roi: vars.roi, isMarketer: vars.useAdminAllocated });
      setShowCelebration(true);
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["myInvestments"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  const toggleMutation = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) => packagesApi.updatePackage(vars.id, { isActive: vars.isActive }),
    onSuccess: () => {
      toast.success("Package visibility updated.");
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<PackageData>) => packagesApi.createPackage(data),
    onSuccess: () => {
      toast.success("Package created successfully.");
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      setIsCreateModalOpen(false);
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; data: Partial<PackageData> }) => packagesApi.updatePackage(vars.id, vars.data),
    onSuccess: () => {
      toast.success("Package updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  return (
    <>
      {/* ===== Confetti + Congratulations Modal ===== */}
      {showCelebration && lastPurchase && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          {/* Confetti canvas */}
          <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0" />

          {/* Modal card */}
          <div className="relative z-10 bg-[#001e14] border border-emerald-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_20px_60px_rgba(0,230,118,0.15)] animate-in zoom-in-95 duration-500">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => {
                setShowCelebration(false);
                setLastPurchase(null);
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer p-1.5 hover:bg-white/5 rounded-full z-20"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            {/* Animated checkmark */}
            {/* <div className="flex justify-center mb-5">
              <div className="checkmark-circle">
                <div className="background" />
                <div className="checkmark draw" />
              </div>
            </div> */}

            {/* Logo pulse */}
            <img src="/skyrise-logo.png" alt="SkyRise" className="h-20 w-auto mb-3 mx-auto   animate-bounce" />

            <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Congratulations!</h2>
            <p className="text-emerald-300/80 text-sm mb-6 leading-relaxed">
              Your investment in <span className="text-[#f3ba2f] font-bold">{lastPurchase.pkgName}</span> has been confirmed!
            </p>

            {/* Investment summary */}
            <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-4 mb-6 text-left space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-300/70">Amount Invested</span>
                <span className="font-bold text-white">${lastPurchase.amount.toFixed(2)}</span>
              </div>
              {lastPurchase.totalActive > lastPurchase.amount && (
                <div className="flex justify-between text-emerald-400">
                  <span>Registration Bonus Added</span>
                  <span className="font-bold">+$5.00 🎁</span>
                </div>
              )}
              <div className="flex justify-between border-t border-emerald-500/20 pt-2">
                <span className="text-white font-semibold">Total Active Investment</span>
                <span className="font-black text-[#f3ba2f] text-base">${lastPurchase.totalActive.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300/70">Daily ROI</span>
                <span className="font-bold text-emerald-400">{lastPurchase.roi}% / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300/70">Activates</span>
                <span className="font-bold text-white">Instantly</span>
              </div>
            </div>

            <Button
              onClick={() => {
                setShowCelebration(false);
                setLastPurchase(null);
                window.location.href = "/dashboard/investments";
              }}
              className="w-full bg-gradient-to-r from-[#004d33] to-[#0e9f6e] hover:from-[#0c6a46] hover:to-[#10b981] text-white font-black h-12 rounded-2xl shadow-[0_4px_20px_rgba(14,159,110,0.3)] text-sm transition-all hover:scale-[1.02] active:scale-95"
            >
              View My Investments
            </Button>
          </div>
        </div>
      )}

      <DashboardLayout title="Investment Packages">

        {isAdmin && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-semibold text-sm">Admin Controls</h4>
                <p className="text-xs text-muted-foreground">You are viewing all packages, including hidden ones.</p>
              </div>
            </div>

            <PackageFormDialog
              isOpen={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
              trigger={
                <Button size="sm" className="glass-button-primary gap-2"><Plus size={16} /> Create Package</Button>
              }
            />
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          {(["All", "Starter", "Standard", "Pro", "VIP"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                playSound.playClick();
                setSelectedFilter(filter);
              }}
              className={`filter-pill px-5 py-2 rounded-full text-[10px] font-black tracking-wider uppercase border select-none cursor-pointer transition-all ${selectedFilter === filter
                ? "filter-pill-active text-white border-transparent"
                : "bg-white/80 dark:bg-card/85 border-glass-border text-foreground/75 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground"
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {isLoading ? (
          <GearSectionLoader text="Loading Investment Packages..." />
        ) : filteredPackages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-glass-border rounded-3xl bg-white/40 dark:bg-card/40">
            No investment packages found under "{selectedFilter}" tier.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {filteredPackages.map((p) => (
              <div key={`${p._id}-${selectedFilter}`} className="package-card-animate">
                <PackageCard
                  pkg={p}
                  isAdmin={isAdmin}
                  isPurchasing={purchaseMutation.isPending}
                  isToggling={toggleMutation.isPending}
                  walletBonusReceived={bonusReceivedBalance}
                  walletAdminAllocated={adminAllocatedBalance}
                  registrationBonusActive={user?.registrationBonusActive !== false}
                  hasFreeRegBonus={(user?.freeRegBonus || 0) >= 5}
                  onPurchase={(amount, autoReinvest, regBonusApplied, useAdminAllocated, onSuccess) => purchaseMutation.mutate({
                    id: p._id,
                    amount,
                    autoReinvest,
                    pkgName: p.name,
                    roi: p.startRoi,
                    regBonusApplied: regBonusApplied || false,
                    useAdminAllocated: useAdminAllocated || false
                  }, {
                    onSuccess: () => {
                      if (onSuccess) onSuccess();
                    }
                  })}
                  onToggle={(isActive) => toggleMutation.mutate({ id: p._id, isActive })}
                  onUpdate={(data) => updateMutation.mutate({ id: p._id, data })}
                  isUpdating={updateMutation.isPending && updateMutation.variables?.id === p._id}
                />
              </div>
            ))}
          </div>
        )}
      </DashboardLayout>
    </>
  );
}

function PackageCard({ pkg, isAdmin, onPurchase, onToggle, isPurchasing, isToggling, onUpdate, isUpdating, walletBonusReceived, walletAdminAllocated, registrationBonusActive, hasFreeRegBonus }: {
  pkg: PackageData;
  isAdmin?: boolean;
  isPurchasing: boolean;
  isToggling: boolean;
  isUpdating: boolean;
  walletBonusReceived: number;
  walletAdminAllocated: number;
  registrationBonusActive: boolean;
  hasFreeRegBonus: boolean;
  onPurchase: (amt: number, autoReinvest: boolean, regBonusApplied: boolean, useAdminAllocated: boolean, onSuccess: () => void) => void;
  onToggle: (active: boolean) => void;
  onUpdate: (data: Partial<PackageData>) => void;
}) {
  const [amount, setAmount] = useState(pkg.minAmount);
  const [autoReinvest, setAutoReinvest] = useState(true);
  const [useAdminAllocated, setUseAdminAllocated] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInvestDialogOpen, setIsInvestDialogOpen] = useState(false);

  // Reset flag and options when dialog opens
  useEffect(() => {
    if (isInvestDialogOpen) {
      const isMarketer = pkg.packageTarget === "marketer";
      setUseAdminAllocated(isMarketer);
      setAutoReinvest(!isMarketer);
    }
  }, [isInvestDialogOpen, pkg.packageTarget]);

  // Team bonus (10% of investment from bonusReceived wallet) - disable if admin allocated is used
  const maxBonusAllowed = useAdminAllocated ? 0 : amount * 0.1;
  const teamBonus = useAdminAllocated ? 0 : Math.min(maxBonusAllowed, walletBonusReceived);
  const real = amount - teamBonus;

  // Registration bonus state - disable if admin allocated is used
  const regBonusEligible = !useAdminAllocated && registrationBonusActive && hasFreeRegBonus && amount >= 50;
  const regBonusLocked = !useAdminAllocated && registrationBonusActive && hasFreeRegBonus && amount < 50;
  const totalWithRegBonus = regBonusEligible ? real + 5 : real;

  let tag = "Starter";
  if (pkg.minAmount >= 5000) tag = "VIP";
  else if (pkg.minAmount >= 1000) tag = "Pro";
  else if (pkg.minAmount >= 100) tag = "Standard";

  let badgeStyle = "bg-[#0e9f6e]/10 text-[#0e9f6e] border border-[#0e9f6e]/20";
  if (tag === "VIP") {
    badgeStyle = "bg-gradient-to-r from-amber-400 via-[#ffe082] to-amber-500 text-[#002b1c] font-black border border-[#f3ba2f] shadow-sm";
  } else if (tag === "Pro") {
    badgeStyle = "bg-[#004d33] text-[#f3ba2f] font-bold border border-[#004d33]";
  } else if (tag === "Standard") {
    badgeStyle = "bg-[#f3ba2f]/10 text-[#f3ba2f] font-semibold border border-[#f3ba2f]/20";
  } else if (tag === "Starter") {
    badgeStyle = "bg-[#0e9f6e]/10 text-[#0e9f6e] font-semibold border border-[#0e9f6e]/20";
  }

  return (
    <Card className={`glass-card-hover transition-all flex flex-col h-full ${!pkg.isActive ? 'opacity-70 grayscale' : ''} bg-white/90 dark:bg-card/90 border-glass-border shadow-soft`}>
      <CardContent className="p-6 pb-8 flex flex-col flex-1">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            <Badge className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold ${badgeStyle}`}>{tag}</Badge>
            {pkg.packageTarget === "marketer" && (
              <Badge className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-blue-500/15 text-blue-500 border border-blue-500/25">Marketer</Badge>
            )}
          </div>
          {isAdmin && (
            <Switch
              checked={pkg.isActive}
              disabled={isToggling}
              onCheckedChange={(c) => onToggle(c)}
            />
          )}
        </div>

        <h3 className="mt-4 text-base font-extrabold text-foreground tracking-tight">{pkg.name}</h3>
        <div className="mt-1 text-xs font-semibold text-muted-foreground">${pkg.minAmount.toLocaleString()} - ${pkg.maxAmount ? pkg.maxAmount.toLocaleString() : "Unlimited"}</div>
        <div className="my-4 h-px bg-glass-border" />

        <div className="space-y-3 text-xs mb-6 flex-1">
          <div className="flex justify-between"><span className="text-muted-foreground font-medium">Starting ROI</span><span className="font-bold text-foreground">{pkg.startRoi}%</span></div>
          <div className="flex justify-between border-t border-glass-border/30 pt-2"><span className="text-muted-foreground font-medium">Max ROI</span><span className="font-extrabold text-[#0e9f6e]">{pkg.maxRoi}%</span></div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-4"><CheckCircle2 className="h-4 w-4 text-[#0e9f6e] flex-shrink-0" /> <span>Activates Instantly</span></div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-[#0e9f6e] flex-shrink-0" /> <span>ROI grows over {pkg.durationMonths || 12} months</span></div>
        </div>

        {isAdmin ? (
          <PackageFormDialog
            isOpen={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            initialData={pkg}
            onSubmit={(data) => {
              onUpdate(data);
              setIsEditModalOpen(false);
            }}
            isPending={isUpdating}
            trigger={
              <Button variant="outline" className="mt-auto w-full gap-2 border-primary/50 text-primary hover:bg-primary/10 h-10 rounded-xl font-bold cursor-pointer">
                <Edit size={16} /> Edit Package
              </Button>
            }
          />
        ) : (
          <Dialog open={isInvestDialogOpen} onOpenChange={setIsInvestDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => playSound.playClick()}
                className="mt-auto w-full bg-gradient-to-r from-[#004d33] to-[#0e9f6e] hover:from-[#0c6a46] hover:to-[#10b981] text-white font-extrabold shadow-md hover:scale-[1.02] active:scale-95 transition-all h-10 rounded-xl cursor-pointer"
              >
                Invest Now
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invest in {pkg.name}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Please note: This package activates instantly.
                </p>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="block mb-3">
                    Investment Amount (USD)
                  </Label>

                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min={pkg.minAmount}
                    max={pkg.maxAmount}
                  />

                  <div className="text-xs text-muted-foreground">
                    Range: ${pkg.minAmount} - ${pkg.maxAmount || "Unlimited"}
                  </div>
                </div>

                {/* Use Admin Allocated Balance Checkbox / Forced Info */}
                {pkg.packageTarget === "marketer" ? (
                  <div className="space-y-1.5 my-2">
                    <div className="flex items-center space-x-2 border border-emerald-500/30 rounded-xl p-3 bg-emerald-500/5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <Label className="text-xs font-semibold text-emerald-400">
                        Will use Admin Allocated Balance (${walletAdminAllocated.toFixed(2)} available)
                      </Label>
                    </div>
                    {walletAdminAllocated < amount && (
                      <div className="text-[11px] text-red-500 font-bold px-1">
                        ⚠️ Insufficient admin allocated balance. You need ${amount.toFixed(2)} but only have ${walletAdminAllocated.toFixed(2)}.
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Admin Allocated Balance warning warning */}
                {useAdminAllocated && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 my-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs text-amber-600 dark:text-amber-400">
                      <p className="font-bold leading-none">Special Marketer Package Rules Apply</p>
                      <p className="leading-relaxed opacity-90">
                        Marketer packages can only be purchased using admin-allocated funds.
                        Capital exit is permanently locked (no early withdrawal), and it will never generate Direct/Level commissions, Team business volume, Ranks, VIP Salary, or Achievement rewards. Only daily ROI remains active.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {pkg.packageTarget !== "marketer" ? (
                    <>
                      <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 border border-glass-border/30 rounded-2xl p-3.5">
                        <div className="space-y-1 pr-4">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" />
                            Auto-Reinvest Daily ROI
                          </span>
                          <span className="text-[10px] text-muted-foreground block leading-normal">
                            {autoReinvest
                              ? "Daily ROI compounds automatically into your active principal amount."
                              : "Daily ROI accumulates as a claimable balance that must be collected."
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Switch
                            checked={autoReinvest}
                            onCheckedChange={setAutoReinvest}
                          />
                          <span className="text-[10px] font-black uppercase text-muted-foreground w-8 text-center">
                            {autoReinvest ? "ON" : "OFF"}
                          </span>
                        </div>
                      </div>

                      {!autoReinvest && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
                          <Coins className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                            <strong>Manual Collect Policy:</strong> You must manually claim your daily ROI payouts. Payouts are available to claim for a maximum of <strong>6 hours</strong> after each 24-hour cycle completion, otherwise they will expire.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
                      <Coins className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        <p className="font-bold leading-none">Manual Collect & Staking Policy</p>
                        <p className="leading-relaxed opacity-90 mt-1">
                          You will get ROI after each 24h completion. A collection button will show for exactly <strong>6 hours</strong>. After that, the collection button will disappear, you will lose your daily ROI, and you must wait for the next 24h to collect.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Registration Bonus — unlock nudge (amount < $50) */}
                {regBonusLocked && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/50 dark:border-amber-500/30 p-3">
                    <span className="text-amber-500 text-base mt-0.5 flex-shrink-0">🎁</span>
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                      Invest <strong>$50 or more</strong> to unlock and use your <strong>$5 Registration Bonus</strong>.
                    </p>
                  </div>
                )}

                {/* Registration Bonus — eligible (amount ≥ $50) */}
                {regBonusEligible && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-400/50 dark:border-emerald-500/30 p-3">
                    <span className="text-emerald-500 text-base mt-0.5 flex-shrink-0">🎁</span>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
                      Your <strong>$5 Registration Bonus</strong> will be automatically added to this investment!
                    </p>
                  </div>
                )}

                {/* Investment Summary Panel */}
                <div className="rounded-xl glass-panel p-4 space-y-2 text-sm">
                  {/* Team bonus row */}
                  {teamBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">10% Team Bonus Applied</span>
                      <span className="font-semibold text-emerald-600">−${teamBonus.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Registration bonus breakdown rows */}
                  {regBonusEligible && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your Investment</span>
                        <span className="font-semibold">${real.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span className="font-medium">Registration Bonus</span>
                        <span className="font-bold">+$5.00</span>
                      </div>
                      <div className="flex justify-between border-t border-soft pt-2">
                        <span className="font-bold">Total Active Investment</span>
                        <span className="font-black text-primary text-base">${totalWithRegBonus.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {/* Standard row (no reg bonus eligible) */}
                  {!regBonusEligible && (
                    <div className={`flex justify-between ${teamBonus > 0 ? "border-t border-soft pt-2" : ""}`}>
                      <span className="font-semibold">Total Payment Required</span>
                      <span className="font-bold text-primary">${real.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  className="w-full glass-button-primary h-14 text-base rounded-full"
                  onClick={() => onPurchase(amount, autoReinvest, regBonusEligible, useAdminAllocated, () => setIsInvestDialogOpen(false))}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? <GearSpinner className="mr-2 h-5 w-5" /> : null}
                  Confirm & Purchase
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

function PackageFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  isPending,
  trigger
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: PackageData;
  onSubmit: (data: Partial<PackageData>) => void;
  isPending: boolean;
  trigger: React.ReactNode;
}) {
  const [formData, setFormData] = useState<Partial<PackageData>>({
    name: "",
    minAmount: 10,
    maxAmount: 1000,
    startRoi: 0.5,
    maxRoi: 1.5,
    durationMonths: 12,
    earlyWithdrawalPenaltyMonths: 5,
    earlyWithdrawalPenaltyPercent: 15,
    isHidden: false,
    isActive: true,
    packageTarget: "user"
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(initialData);
    } else if (!isOpen && !initialData) {
      setFormData({
        name: "", minAmount: 10, maxAmount: 1000, startRoi: 0.5, maxRoi: 1.5,
        durationMonths: 12, earlyWithdrawalPenaltyMonths: 5, earlyWithdrawalPenaltyPercent: 15,
        isHidden: false, isActive: true, packageTarget: "user"
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Package" : "Create New Package"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="block mb-2">Package Name</Label>
              <Input required name="name" value={formData.name || ""} onChange={handleChange} placeholder="e.g. Package A" />
            </div>
            <div className="space-y-2">
              <Label className="block mb-2">Min Amount ($)</Label>
              <Input required type="number" name="minAmount" value={formData.minAmount || 0} onChange={handleChange} min={1} />
            </div>
            <div className="space-y-2">
              <Label className="block mb-2">Max Amount ($)</Label>
              <Input required type="number" name="maxAmount" value={formData.maxAmount || 0} onChange={handleChange} min={1} />
            </div>
            <div className="space-y-2">
              <Label className="block mb-2">Start ROI (%)</Label>
              <Input required type="number" step="0.1" name="startRoi" value={formData.startRoi || 0} onChange={handleChange} min={0} />
            </div>
            <div className="space-y-2">
              <Label className="block mb-2">Max ROI (%)</Label>
              <Input required type="number" step="0.1" name="maxRoi" value={formData.maxRoi || 0} onChange={handleChange} min={0} />
            </div>
            <div className="space-y-2">
              <Label className="block mb-2">Penalty Free Months</Label>
              <Input required type="number" name="earlyWithdrawalPenaltyMonths" value={formData.earlyWithdrawalPenaltyMonths || 0} onChange={handleChange} min={0} />
            </div>
            <div className="space-y-2">
              <Label className="block mb-2">Early Withdrawal Penalty (%)</Label>
              <Input required type="number" name="earlyWithdrawalPenaltyPercent" value={formData.earlyWithdrawalPenaltyPercent || 0} onChange={handleChange} min={0} />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
            <div>
              <Label className="text-sm font-semibold">Package Target Audience</Label>
              <p className="text-xs text-muted-foreground">Select if this package is for standard Users or Marketers.</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.packageTarget === "user" ? "default" : "outline"}
                className={`h-8 text-xs font-semibold px-4 rounded-xl transition-all ${formData.packageTarget === "user"
                  ? "bg-primary text-white"
                  : "border-glass-border text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                onClick={() => setFormData(p => ({ ...p, packageTarget: "user" }))}
              >
                User
              </Button>
              <Button
                type="button"
                variant={formData.packageTarget === "marketer" ? "default" : "outline"}
                className={`h-8 text-xs font-semibold px-4 rounded-xl transition-all ${formData.packageTarget === "marketer"
                  ? "bg-primary text-white"
                  : "border-glass-border text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                onClick={() => setFormData(p => ({ ...p, packageTarget: "marketer" }))}
              >
                Marketer
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
            <div>
              <Label className="text-sm font-semibold">Hidden Package</Label>
              <p className="text-xs text-muted-foreground">If hidden, only admins can view and purchase.</p>
            </div>
            <Switch checked={formData.isHidden} onCheckedChange={(c) => setFormData(p => ({ ...p, isHidden: c }))} />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="glass-button-primary">
              {isPending && <GearSpinner className="mr-2 h-4 w-4" />}
              {initialData ? "Save Changes" : "Create Package"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
