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
import { CheckCircle2, Plus, Edit, ShieldAlert, TrendingUp, Rocket } from "lucide-react";
import { GearSectionLoader, GearSpinner } from "@/components/gear-loader";
import { packagesApi, type PackageData } from "@/lib/api-packages";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { playSound } from "@/lib/sounds";

export const Route = createFileRoute("/dashboard/packages")({ component: PackagesDash });

function PackagesDash() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("SUPER_ADMIN");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Starter" | "Standard" | "Pro" | "VIP">("All");
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<{ pkgName: string; amount: number; totalActive: number; roi: number } | null>(null);
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

  // Read real bonusReceived directly from auth store (already synced via fetchProfile on every page)
  const bonusReceivedBalance = (user?.wallets as any)?.bonusReceived || 0;


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
    mutationFn: (vars: { id: string; amount: number; roiClaimMode: 'auto' | 'manual'; pkgName: string; roi: number; regBonusApplied: boolean }) =>
      packagesApi.purchasePackage(vars.id, vars.amount, true, vars.roiClaimMode),
    onSuccess: (_, vars) => {
      playSound.playSuccess();
      // Show celebration dialog with purchase summary
      const totalActive = vars.regBonusApplied ? vars.amount + 5 : vars.amount;
      setLastPurchase({ pkgName: vars.pkgName, amount: vars.amount, totalActive, roi: vars.roi });
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
                <span className="font-bold text-white">Tonight at Midnight</span>
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
                  registrationBonusActive={user?.registrationBonusActive !== false}
                  hasFreeRegBonus={(user?.freeRegBonus || 0) >= 5}
                  onPurchase={(amount, roiClaimMode, regBonusApplied, onSuccess) => purchaseMutation.mutate({
                    id: p._id,
                    amount,
                    roiClaimMode,
                    pkgName: p.name,
                    roi: p.startRoi,
                    regBonusApplied: regBonusApplied || false
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

function PackageCard({ pkg, isAdmin, onPurchase, onToggle, isPurchasing, isToggling, onUpdate, isUpdating, walletBonusReceived, registrationBonusActive, hasFreeRegBonus }: {
  pkg: PackageData;
  isAdmin?: boolean;
  isPurchasing: boolean;
  isToggling: boolean;
  isUpdating: boolean;
  walletBonusReceived: number;
  registrationBonusActive: boolean;
  hasFreeRegBonus: boolean;
  onPurchase: (amt: number, mode: 'auto' | 'manual', regBonusApplied: boolean, onSuccess: () => void) => void;
  onToggle: (active: boolean) => void;
  onUpdate: (data: Partial<PackageData>) => void;
}) {
  const [amount, setAmount] = useState(pkg.minAmount);
  const [roiClaimMode, setRoiClaimMode] = useState<'auto' | 'manual'>('auto');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInvestDialogOpen, setIsInvestDialogOpen] = useState(false);

  // Team bonus (10% of investment from bonusReceived wallet)
  const maxBonusAllowed = amount * 0.1;
  const teamBonus = Math.min(maxBonusAllowed, walletBonusReceived);
  const real = amount - teamBonus;

  // Registration bonus state
  const regBonusEligible = registrationBonusActive && hasFreeRegBonus && amount >= 50;
  const regBonusLocked = registrationBonusActive && hasFreeRegBonus && amount < 50;
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
          <Badge className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold ${badgeStyle}`}>{tag}</Badge>
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
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-4"><CheckCircle2 className="h-4 w-4 text-[#0e9f6e] flex-shrink-0" /> <span>Activates at End of Day</span></div>
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
                <p className="text-xs text-muted-foreground mt-1">Please note: Investments officially activate at Midnight (End of Day).</p>
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

                <div className="space-y-2">
                  <Label className="block mb-3">ROI Claim Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRoiClaimMode("auto")}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${roiClaimMode === "auto"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                        }`}
                    >
                      <span className="text-xs font-semibold">Auto-Collect</span>
                      <span className="text-[10px] opacity-80 mt-1">ROI is credited directly to your balance every 24h.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoiClaimMode("manual")}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${roiClaimMode === "manual"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                        }`}
                    >
                      <span className="text-xs font-semibold">Manual-Claim</span>
                      <span className="text-[10px] opacity-80 mt-1">Claim manually inside a strict 1-hour window, or lose it.</span>
                    </button>
                  </div>
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
                  onClick={() => onPurchase(amount, roiClaimMode, regBonusEligible, () => setIsInvestDialogOpen(false))}
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
    isActive: true
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(initialData);
    } else if (!isOpen && !initialData) {
      setFormData({
        name: "", minAmount: 10, maxAmount: 1000, startRoi: 0.5, maxRoi: 1.5,
        durationMonths: 12, earlyWithdrawalPenaltyMonths: 5, earlyWithdrawalPenaltyPercent: 15,
        isHidden: false, isActive: true
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
