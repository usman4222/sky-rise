import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useState } from "react";
import { 
  ArrowLeft, Shield, AlertTriangle, CheckCircle, 
  Calendar, RefreshCw, PlusCircle, CreditCard, User, ShieldAlert 
} from "lucide-react";
import { GearSectionLoader } from "@/components/gear-loader";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard/admin/users/$id/favor")({
  component: AdminUserFavorPage,
});

function AdminUserFavorPage() {
  const { id: userId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [extendDays, setExtendDays] = useState(7);
  const [customTarget, setCustomTarget] = useState("");
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Fetch favor details
  const { data, isLoading, error } = useQuery({
    queryKey: ["userFavor", userId],
    queryFn: () => adminApi.getUserFavorDetails(userId),
    refetchInterval: 10000, // Refresh every 10s
  });

  // Mutate settings
  const updateSettingsMutation = useMutation({
    mutationFn: (payload: any) => adminApi.updateUserFavorSettings(userId, payload),
    onSuccess: (res: any) => {
      toast.success(res.message || "Favor settings updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["userFavor", userId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update Favor settings");
    }
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Admin - Favor Account Configuration">
        <div className="flex items-center justify-center min-h-[500px]">
          <GearSectionLoader text="Fetching Favor Account configuration..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Admin - Favor Account Configuration">
        <div className="p-6 text-center max-w-md mx-auto">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold">Error Loading Details</h2>
          <p className="text-muted-foreground mt-2">Failed to retrieve Favor Account details for this user.</p>
          <Button onClick={() => navigate({ to: "/dashboard/admin/users" })} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const favorData = data.data || data;
  const {
    favorConditionEnabled,
    favorAmount,
    adminAllocatedBalance,
    favorRequiredBusiness,
    achievedBusiness,
    remainingBusiness,
    progressPercent,
    favorWithdrawalStatus,
    favorCycleStartDate,
    favorCycleEndDate,
    favorLastQualificationDate
  } = favorData;

  const handleToggleCondition = (checked: boolean) => {
    updateSettingsMutation.mutate({ favorConditionEnabled: checked });
  };

  const handleToggleWithdrawalStatus = () => {
    const nextStatus = favorWithdrawalStatus === 'blocked' ? 'active' : 'blocked';
    updateSettingsMutation.mutate({ favorWithdrawalStatus: nextStatus });
  };

  const handleResetCycle = () => {
    setIsResetConfirmOpen(true);
  };

  const handleExtendDeadline = () => {
    updateSettingsMutation.mutate({ extendDeadlineDays: extendDays });
  };

  const handleUpdateTarget = () => {
    const val = Number(customTarget);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid target business amount");
      return;
    }
    updateSettingsMutation.mutate({ favorRequiredBusiness: val });
    setCustomTarget("");
  };

  const isBlocked = favorWithdrawalStatus === 'blocked';

  return (
    <DashboardLayout title="Admin - Favor Account Configuration">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/admin/users">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Leader Favor Account Condition
            </h1>
            <p className="text-muted-foreground text-sm">
              Configure 1X business verification cycle and withdrawal controls.
            </p>
          </div>
        </div>

        {/* Status Alert Banner */}
        {favorConditionEnabled && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-lg backdrop-blur-md ${
            isBlocked
              ? "bg-destructive/10 border-destructive/20 text-destructive"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
          }`}>
            <div className="flex items-center gap-3">
              {isBlocked ? (
                <ShieldAlert className="h-6 w-6 stroke-[1.5]" />
              ) : (
                <CheckCircle className="h-6 w-6 stroke-[1.5]" />
              )}
              <div>
                <div className="font-semibold">
                  Withdrawal Status: {isBlocked ? "Blocked (Suspended)" : "Active (Qualified)"}
                </div>
                <p className="text-xs opacity-90 mt-0.5">
                  {isBlocked
                    ? "User has not completed the 1X business requirement. Withdrawals are currently blocked."
                    : "User withdrawal is currently unlocked and working normally."}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleToggleWithdrawalStatus} 
              variant="outline" 
              className={`border-glass-border rounded-xl text-xs h-9 ${
                isBlocked ? "hover:bg-emerald-500/10" : "hover:bg-destructive/10"
              }`}
            >
              {isBlocked ? "Unblock Manually" : "Block Manually"}
            </Button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Metrics Column */}
          <div className="md:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold">Cycle Progress & Stats</CardTitle>
                <Badge variant={favorConditionEnabled ? "default" : "secondary"}>
                  {favorConditionEnabled ? "Condition active" : "Condition off"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-neutral-900/50 border border-glass-border/30">
                    <span className="text-xs text-muted-foreground block">Favor Account Amount</span>
                    <span className="text-2xl font-extrabold text-foreground mt-1 block">${favorAmount.toFixed(2)}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-900/50 border border-glass-border/30">
                    <span className="text-xs text-muted-foreground block">Monthly Target (1X)</span>
                    <span className="text-2xl font-extrabold text-primary mt-1 block">${favorRequiredBusiness.toFixed(2)}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-900/50 border border-glass-border/30">
                    <span className="text-xs text-muted-foreground block">Achieved Business</span>
                    <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">${achievedBusiness.toFixed(2)}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-900/50 border border-glass-border/30">
                    <span className="text-xs text-muted-foreground block">Remaining Business</span>
                    <span className="text-2xl font-extrabold text-destructive mt-1 block">${remainingBusiness.toFixed(2)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                {favorConditionEnabled && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly target progress</span>
                      <span className="font-bold text-foreground">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-3" />
                  </div>
                )}

                {/* Date cycle markers */}
                {favorConditionEnabled && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-3 border-t border-glass-border/30 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground block">Cycle Start Date</span>
                        <span className="font-medium text-foreground">{new Date(favorCycleStartDate).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground block">Cycle End Date</span>
                        <span className="font-medium text-foreground">{new Date(favorCycleEndDate).toLocaleString()}</span>
                      </div>
                    </div>
                    {favorLastQualificationDate && (
                      <div className="flex items-center gap-2 col-span-2 mt-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <div>
                          <span className="text-muted-foreground block">Last Qualification Date</span>
                          <span className="font-medium text-emerald-500">{new Date(favorLastQualificationDate).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick action controls */}
            {favorConditionEnabled && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Manual Adjustments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Extend deadline */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/50 border border-glass-border/20">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Extend Cycle Deadline</h4>
                      <p className="text-xs text-muted-foreground">Add days to the current 30-day requirement window.</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Input
                        type="number"
                        min="1"
                        value={extendDays}
                        onChange={(e) => setExtendDays(Number(e.target.value))}
                        className="w-20 bg-neutral-900/50 border-glass-border"
                      />
                      <Button onClick={handleExtendDeadline} variant="outline" className="h-10 text-xs border-glass-border hover:bg-neutral-800">
                        Extend Deadline
                      </Button>
                    </div>
                  </div>

                  {/* Reset cycle */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/50 border border-glass-border/20">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Reset Current Cycle</h4>
                      <p className="text-xs text-muted-foreground">Resets the start and end dates and starts a fresh 1X challenge.</p>
                    </div>
                    <Button onClick={handleResetCycle} variant="destructive" className="h-10 text-xs gap-2">
                      <RefreshCw size={14} /> Reset Cycle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Settings Column */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Favor Condition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/50 border border-glass-border/20">
                  <div className="space-y-1">
                    <span className="font-semibold text-sm">Apply Monthly 1X?</span>
                    <span className="text-xs text-muted-foreground block">Toggle business rule</span>
                  </div>
                  <Switch
                    checked={favorConditionEnabled}
                    onCheckedChange={handleToggleCondition}
                    disabled={updateSettingsMutation.isPending}
                  />
                </div>

                {favorConditionEnabled && (
                  <div className="space-y-4 p-4 rounded-2xl bg-neutral-900/50 border border-glass-border/20">
                    <Label className="text-sm font-semibold block">Edit Business Target Amount</Label>
                    <p className="text-xs text-muted-foreground">Manually override the 1X target amount for this cycle.</p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={favorRequiredBusiness.toString()}
                        value={customTarget}
                        onChange={(e) => setCustomTarget(e.target.value)}
                        className="h-10 bg-neutral-900/50 border-glass-border"
                      />
                      <Button onClick={handleUpdateTarget} className="h-10 px-4 text-xs font-semibold glass-button-primary">
                        Set Target
                      </Button>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-xs text-muted-foreground space-y-2">
                  <span className="font-bold text-foreground block">Favor Rule Details:</span>
                  <p>1. Target resets automatically if completed early or on time.</p>
                  <p>2. If deadline expires without completion, withdrawals are suspended.</p>
                  <p>3. Upline targets remain completely independent from downline targets (traversal block enabled).</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <AlertDialogContent className="glass-card max-w-sm rounded-3xl border-glass-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-extrabold text-foreground text-sm">Reset Cycle Progress?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to reset the current 30-day business cycle? This resets user's progress back to 0.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="h-9.5 text-xs rounded-xl border-glass-border cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                updateSettingsMutation.mutate({ resetCycle: true });
                setIsResetConfirmOpen(false);
              }}
              className="h-9.5 text-xs rounded-xl bg-destructive hover:bg-destructive/80 text-white font-semibold cursor-pointer border-0"
            >
              Reset Cycle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
