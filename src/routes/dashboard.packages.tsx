import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
import { CheckCircle2, Loader2, Plus, Edit, ShieldAlert } from "lucide-react";

import { packagesApi, type PackageData } from "@/lib/api-packages";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

export const Route = createFileRoute("/dashboard/packages")({ component: PackagesDash });

function PackagesDash() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("SUPER_ADMIN");
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["packages", isAdmin],
    queryFn: async () => {
      const res = isAdmin ? await packagesApi.getAdminPackages() : await packagesApi.getPublicPackages();
      return res.packages;
    }
  });

  const purchaseMutation = useMutation({
    mutationFn: (vars: { id: string; amount: number; roiClaimMode: 'auto' | 'manual' }) => 
      packagesApi.purchasePackage(vars.id, vars.amount, true, vars.roiClaimMode),
    onSuccess: () => {
      toast.success("Investment confirmed! It will automatically activate at the end of the day.");
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
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {packages.map((p) => (
            <PackageCard 
              key={p._id} 
              pkg={p} 
              isAdmin={isAdmin}
              isPurchasing={purchaseMutation.isPending}
              isToggling={toggleMutation.isPending}
              onPurchase={(amount, roiClaimMode) => purchaseMutation.mutate({ id: p._id, amount, roiClaimMode })}
              onToggle={(isActive) => toggleMutation.mutate({ id: p._id, isActive })}
              onUpdate={(data) => updateMutation.mutate({ id: p._id, data })}
              isUpdating={updateMutation.isPending && updateMutation.variables?.id === p._id}
            />
          ))}
        </div>
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
  onPurchase: (amt: number, mode: 'auto' | 'manual') => void;
  onToggle: (active: boolean) => void;
  onUpdate: (data: Partial<PackageData>) => void;
}) {
  const [amount, setAmount] = useState(pkg.minAmount);
  const [roiClaimMode, setRoiClaimMode] = useState<'auto' | 'manual'>('auto');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const bonus = Math.min(amount * 0.1, 45); // Mock logic for display
  const real = amount - bonus;

  let tag = "Starter";
  if (pkg.minAmount >= 5000) tag = "VIP";
  else if (pkg.minAmount >= 1000) tag = "Pro";
  else if (pkg.minAmount >= 100) tag = "Standard";

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
          <Dialog>
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
                  <Label>Investment Amount (USD)</Label>
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Number(e.target.value))} 
                    min={pkg.minAmount} 
                    max={pkg.maxAmount} 
                  />
                  <div className="text-xs text-muted-foreground">Range: ${pkg.minAmount} - ${pkg.maxAmount || "Unlimited"}</div>
                </div>

                <div className="space-y-2">
                  <Label>ROI Claim Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRoiClaimMode("auto")}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        roiClaimMode === "auto"
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
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        roiClaimMode === "manual"
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
                  className="w-full glass-button-primary" 
                  onClick={() => onPurchase(amount, roiClaimMode)}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
              <Label>Package Name</Label>
              <Input required name="name" value={formData.name || ""} onChange={handleChange} placeholder="e.g. Package A" />
            </div>
            <div className="space-y-2">
              <Label>Min Amount ($)</Label>
              <Input required type="number" name="minAmount" value={formData.minAmount || 0} onChange={handleChange} min={1} />
            </div>
            <div className="space-y-2">
              <Label>Max Amount ($)</Label>
              <Input required type="number" name="maxAmount" value={formData.maxAmount || 0} onChange={handleChange} min={1} />
            </div>
            <div className="space-y-2">
              <Label>Start ROI (%)</Label>
              <Input required type="number" step="0.1" name="startRoi" value={formData.startRoi || 0} onChange={handleChange} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Max ROI (%)</Label>
              <Input required type="number" step="0.1" name="maxRoi" value={formData.maxRoi || 0} onChange={handleChange} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Penalty Free Months</Label>
              <Input required type="number" name="earlyWithdrawalPenaltyMonths" value={formData.earlyWithdrawalPenaltyMonths || 0} onChange={handleChange} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Early Withdrawal Penalty (%)</Label>
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
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create Package"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
