import { createFileRoute, Link } from "@tanstack/react-router";
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
import { CheckCircle2, Plus, Edit, ShieldAlert } from "lucide-react";
import { GearSectionLoader, GearSpinner } from "@/components/gear-loader";

import { packagesApi, type PackageData } from "@/lib/api-packages";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

export const Route = createFileRoute("/dashboard/packages")({ component: PackagesDash });

/** Derives a display tag from the package's minAmount — keep in sync with PackageCard */
function getTag(minAmount: number): string {
  if (minAmount >= 5000) return "VIP";
  if (minAmount >= 1000) return "Pro";
  if (minAmount >= 100) return "Standard";
  return "Starter";
}

const FILTER_OPTIONS = ["All", "Starter", "Standard", "Pro", "VIP"] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

function PackagesDash() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("SUPER_ADMIN");
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");

  // Purchase success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedInfo, setPurchasedInfo] = useState<{ name: string; amount: number } | null>(null);
  const confettiContainerRef = useRef<HTMLDivElement>(null);

  // Confetti effect — identical to registration page
  useEffect(() => {
    if (showSuccessModal && confettiContainerRef.current) {
      const container = confettiContainerRef.current;
      const confettiColors = ['#EF2964', '#00C09D', '#2D87B0', '#48485E', '#EFFF1D'];
      const confettiAnimations = ['slow', 'medium', 'fast'];

      const innerContainer = document.createElement('div');
      innerContainer.classList.add('confetti-container');
      container.appendChild(innerContainer);

      const interval = setInterval(() => {
        const confettiEl = document.createElement('div');
        const confettiSize = (Math.floor(Math.random() * 3) + 7) + 'px';
        const confettiBackground = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        const confettiLeft = (Math.floor(Math.random() * container.offsetWidth)) + 'px';
        const confettiAnimation = confettiAnimations[Math.floor(Math.random() * confettiAnimations.length)];
        confettiEl.classList.add('confetti', 'confetti--animation-' + confettiAnimation);
        confettiEl.style.left = confettiLeft;
        confettiEl.style.width = confettiSize;
        confettiEl.style.height = confettiSize;
        confettiEl.style.backgroundColor = confettiBackground;
        const removeTimeout = setTimeout(() => {
          if (confettiEl.parentNode) confettiEl.parentNode.removeChild(confettiEl);
        }, 3000);
        innerContainer.appendChild(confettiEl);
      }, 25);

      return () => {
        clearInterval(interval);
        if (innerContainer.parentNode) innerContainer.parentNode.removeChild(innerContainer);
      };
    }
  }, [showSuccessModal]);


  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["packages", isAdmin],
    queryFn: async () => {
      const res = isAdmin ? await packagesApi.getAdminPackages() : await packagesApi.getPublicPackages();
      return res.packages;
    }
  });

  const purchaseMutation = useMutation({
    mutationFn: (vars: { id: string; amount: number; roiClaimMode: 'auto' | 'manual'; name: string; closeDialog: () => void }) =>
      packagesApi.purchasePackage(vars.id, vars.amount, true, vars.roiClaimMode),
    onSuccess: (_, vars) => {
      // Close the invest dialog first, then show the celebration after the close animation
      vars.closeDialog();
      setTimeout(() => {
        setPurchasedInfo({ name: vars.name, amount: vars.amount });
        setShowSuccessModal(true);
      }, 320);
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
    <DashboardLayout title="Investment Packages">

      {/* ── Purchase Success Modal ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 success-backdrop-in">
          <div ref={confettiContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0" />
          <div className="success-modal-pop relative z-10 bg-background border border-glass-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="checkmark-circle">
                <div className="background" />
                <div className="checkmark draw" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">Investment Confirmed!</h2>
            {purchasedInfo && (
              <p className="text-muted-foreground text-sm mb-1 leading-relaxed">
                You've invested{" "}
                <span className="text-primary font-bold">${purchasedInfo.amount.toFixed(2)}</span>{" "}
                in <span className="text-foreground font-semibold">{purchasedInfo.name}</span>.
              </p>
            )}
            <p className="text-muted-foreground text-xs mb-6 leading-relaxed">
              Your investment will activate at end of day and start earning daily ROI automatically.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/dashboard/investments"
                onClick={() => setShowSuccessModal(false)}
                className="w-full glass-button-primary h-12 text-base flex items-center justify-center rounded-full font-bold"
              >
                View My Investments
              </Link>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Stay on Packages
              </button>
            </div>
          </div>
        </div>
      )}

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

      {isLoading ? (
        <GearSectionLoader text="Loading Investment Packages..." />
      ) : (
        <>
          {/* ── Filter Pills ── */}
          <div className="mb-5 flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  activeFilter === f
                    ? "bg-primary-gradient text-white border-transparent shadow-[0_4px_14px_rgba(123,92,255,0.35)] scale-[1.04]"
                    : "bg-white border-[#d0d0d8] text-foreground/75 hover:text-primary hover:border-primary/60 hover:bg-primary/5"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* ── Package Grid ── */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {packages
              .filter((p) => activeFilter === "All" || getTag(p.minAmount) === activeFilter)
              .map((p) => (
                <PackageCard
                  key={p._id}
                  pkg={p}
                  isAdmin={isAdmin}
                  isPurchasing={purchaseMutation.isPending}
                  isToggling={toggleMutation.isPending}
                  onPurchase={(amount, roiClaimMode, closeDialog) => purchaseMutation.mutate({ id: p._id, amount, roiClaimMode, name: p.name, closeDialog })}
                  onToggle={(isActive) => toggleMutation.mutate({ id: p._id, isActive })}
                  onUpdate={(data) => updateMutation.mutate({ id: p._id, data })}
                  isUpdating={updateMutation.isPending && updateMutation.variables?.id === p._id}
                />
              ))}

            {/* Empty state when filter has no results */}
            {packages.filter((p) => activeFilter === "All" || getTag(p.minAmount) === activeFilter).length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <span className="text-4xl">📦</span>
                <p className="text-sm font-medium">No <span className="text-primary">{activeFilter}</span> packages available right now.</p>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

function PackageCard({ pkg, isAdmin, onPurchase, onToggle, isPurchasing, isToggling, onUpdate, isUpdating }: {
  pkg: PackageData;
  isAdmin?: boolean;
  isPurchasing: boolean;
  isToggling: boolean;
  isUpdating: boolean;
  onPurchase: (amt: number, mode: 'auto' | 'manual', closeDialog: () => void) => void;
  onToggle: (active: boolean) => void;
  onUpdate: (data: Partial<PackageData>) => void;
}) {
  const [amount, setAmount] = useState(pkg.minAmount);
  const [roiClaimMode, setRoiClaimMode] = useState<'auto' | 'manual'>('auto');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const bonus = Math.min(amount * 0.1, 45); // Mock logic for display
  const real = amount - bonus;

  let tag = getTag(pkg.minAmount);

  return (
    <Card className={`glass-card-hover transition-all flex flex-col h-full ${!pkg.isActive ? 'opacity-70 grayscale' : ''}`}>
      <CardContent className="p-6 pb-8 flex flex-col flex-1">
        <div className="flex items-center justify-between">
          <Badge className="glass-pill">{tag}</Badge>
          {isAdmin && (
            <Switch
              checked={pkg.isActive}
              disabled={isToggling}
              onCheckedChange={(c) => onToggle(c)}
            />
          )}
        </div>

        <h3 className="mt-3 text-lg font-semibold">{pkg.name}</h3>
        <div className="mt-1 text-sm text-muted-foreground">${pkg.minAmount} - ${pkg.maxAmount || "Unlimited"}</div>
        <div className="my-4 h-px bg-border" />

        <div className="space-y-2 text-sm mb-5">
          <div className="flex justify-between"><span className="text-muted-foreground">Starting ROI</span><span className="font-semibold">{pkg.startRoi}%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Max ROI</span><span className="font-semibold text-profit">{pkg.maxRoi}%</span></div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-profit" /> Activates at End of Day</div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-profit" /> ROI grows over {pkg.durationMonths || 12} months</div>
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
              <Button variant="outline" className="mt-auto w-full gap-2 border-primary/50 text-primary hover:bg-primary/10">
                <Edit size={16} /> Edit Package
              </Button>
            }
          />
        ) : (
          <Dialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-auto w-full glass-button-primary">Invest Now</Button>
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

                <div className="rounded-xl glass-panel p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">10% Bonus Applicable</span><span className="font-semibold">${bonus.toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-soft pt-2"><span>Real Payment Required</span><span className="font-bold text-primary">${real.toFixed(2)}</span></div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  className="w-full glass-button-primary h-14 text-base rounded-full"
                  onClick={() => onPurchase(amount, roiClaimMode, () => setInvestDialogOpen(false))}
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
