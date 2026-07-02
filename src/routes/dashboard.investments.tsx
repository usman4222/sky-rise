import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Coins, ArrowRightLeft, Gift, Clock, LayoutGrid, List } from "lucide-react";
import { GearSectionLoader } from "@/components/gear-loader";

import { investmentsApi } from "@/lib/api-investments";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { SimplePagination } from "@/components/simple-pagination";

import { useEffect, useState } from "react";

function RoiCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - Date.now();
      
      if (difference <= 0) {
        setTimeLeft("Payout due");
        // Auto-refresh when payout is due to fetch updated investment details and wallets
        timer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["myInvestments"] });
          queryClient.invalidateQueries({ queryKey: ["wallets"] });
        }, 2000);
        return;
      }

      // Format as HH:MM:SS
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

  return <span className="font-mono text-xs text-gold font-semibold">{timeLeft}</span>;
}

export const Route = createFileRoute("/dashboard/investments")({ component: Investments });

function Investments() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  const { data: investmentsRes, isLoading } = useQuery({
    queryKey: ["myInvestments", page],
    queryFn: async () => {
      const res = await investmentsApi.getMyInvestments(page, 10);
      return res || { investments: [] };
    }
  });

  const investments = investmentsRes?.investments || [];
  const activeInvestments = investments.filter((inv: any) => inv.status === "active");
  const pastInvestments = investments.filter((inv: any) => inv.status !== "active");

  const withdrawCapitalMutation = useMutation({
    mutationFn: (id: string) => investmentsApi.withdrawCapital({ investmentId: id }),
    onSuccess: () => {
      toast.success("Capital withdrawal submitted successfully. Funds moved to withdrawal wallet.");
      queryClient.invalidateQueries({ queryKey: ["myInvestments"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  const toggleReinvestMutation = useMutation({
    mutationFn: (id: string) => investmentsApi.toggleAutoReinvest(id),
    onSuccess: (res: any) => {
      toast.success(res.message || "Auto-reinvest setting updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["myInvestments"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
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

  return (
    <DashboardLayout title="My Investments">
      <div className="space-y-8">
        
        {/* ================= ACTIVE INVESTMENTS SECTION ================= */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Active Contracts
            </h2>
            {activeInvestments.length > 0 && (
              <div className="flex bg-black/10 dark:bg-white/5 p-1 rounded-xl border border-glass-border/30">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === "table"
                      ? "bg-primary text-[#00281b] shadow-sm font-black"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-3.5 w-3.5" />
                  Table
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === "card"
                      ? "bg-primary text-[#00281b] shadow-sm font-black"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                  onClick={() => setViewMode("card")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Grid
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <GearSectionLoader text="Loading investments..." />
          ) : activeInvestments.length === 0 ? (
            <Card className="border-soft bg-glass-surface/50 p-8 text-center rounded-3xl space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Coins size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-foreground">No Active Investments</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Grow your wealth by selecting one of our premium investment tiers. Activates daily return percentages.
                </p>
              </div>
              <Button onClick={() => window.location.href = "/dashboard/packages"} className="glass-button-primary h-9 text-xs">
                Browse Packages
              </Button>
            </Card>
          ) : viewMode === "table" ? (
            <Card className="border-soft shadow-card overflow-hidden">
              <CardContent className="overflow-x-auto p-0">
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6 py-4">Contract / Package</TableHead>
                      <TableHead className="px-4 py-4">Principal</TableHead>
                      <TableHead className="px-4 py-4">Daily ROI</TableHead>
                      <TableHead className="px-4 py-4">Total Earned</TableHead>
                      <TableHead className="px-4 py-4">Auto-Reinvest</TableHead>
                      <TableHead className="px-4 py-4">Payout / Collect</TableHead>
                      <TableHead className="pr-6 py-4 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeInvestments.map((inv: any) => {
                      const isReinvest = inv.autoReinvest !== false;
                      const isPendingClaim = inv.pendingRoiClaim > 0;
                      
                      // Color tags based on package tier limits
                      let tierBadge = "bg-[#0e9f6e]/10 text-[#0e9f6e] border border-[#0e9f6e]/20";
                      if (inv.package?.minAmount >= 5000) {
                        tierBadge = "bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-500 border border-amber-500/30";
                      } else if (inv.package?.minAmount >= 1000) {
                        tierBadge = "bg-[#004d33] text-[#f3ba2f] border border-[#004d33]";
                      } else if (inv.package?.minAmount >= 100) {
                        tierBadge = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                      }

                      return (
                        <TableRow key={inv._id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="align-middle pl-6 py-4">
                            <div className="space-y-1 py-1">
                              <div className="font-extrabold text-sm text-foreground tracking-tight">
                                {inv.package?.name || "Premium Contract"}
                              </div>
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <Badge className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold ${tierBadge}`}>
                                  {inv.package?.minAmount >= 5000 ? "VIP" : inv.package?.minAmount >= 1000 ? "PRO" : inv.package?.minAmount >= 100 ? "STANDARD" : "STARTER"}
                                </Badge>
                                {inv.packageType === "Admin Funded Package" && (
                                  <Badge className="bg-amber-500/15 text-amber-500 border-0 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
                                    Admin Funded
                                  </Badge>
                                )}
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-bold tracking-wider flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  Active
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="align-middle px-4 py-4 font-bold text-sm text-foreground">
                            ${Number(inv.amount || 0).toFixed(2)}
                          </TableCell>
                          
                          <TableCell className="align-middle px-4 py-4 font-extrabold text-profit text-sm">
                            {Number(inv.currentRoi || 0).toFixed(2)}%
                          </TableCell>
                          
                          <TableCell className="align-middle px-4 py-4 font-extrabold text-foreground text-sm">
                            ${Number(inv.totalRoiEarned || 0).toFixed(2)}
                          </TableCell>
                          
                          <TableCell className="align-middle px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={isReinvest} 
                                onCheckedChange={() => toggleReinvestMutation.mutate(inv._id)}
                                disabled={toggleReinvestMutation.isPending}
                              />
                              <span className="text-[10px] font-black uppercase text-muted-foreground w-8">
                                {isReinvest ? "ON" : "OFF"}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="align-middle px-4 py-4">
                            {isPendingClaim ? (
                              <div className="flex flex-col gap-1 my-1 max-w-[200px]">
                                <Button 
                                  className="h-8 bg-gradient-to-r from-amber-400 to-[#f3ba2f] hover:from-amber-500 hover:to-amber-600 text-[#00281b] font-black rounded-lg text-xs flex gap-1.5 justify-center items-center shadow-md animate-pulse cursor-pointer px-3"
                                  onClick={() => claimRoiMutation.mutate(inv._id)}
                                  disabled={claimRoiMutation.isPending}
                                >
                                  <Gift className="h-3.5 w-3.5" />
                                  Claim ${inv.pendingRoiClaim.toFixed(2)}
                                </Button>
                                {inv.claimExpiresAt && (
                                  <div className="text-[9px] text-destructive flex items-center gap-1 font-bold whitespace-nowrap">
                                    <Clock className="h-3 w-3" />
                                    Expires in: <RoiCountdown targetDate={inv.claimExpiresAt} />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5 text-[#f3ba2f]" />
                                {inv.nextRoiPayoutAt ? (
                                  <RoiCountdown targetDate={inv.nextRoiPayoutAt} />
                                ) : (
                                  <span>-</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell className="align-middle pr-6 py-4 text-right">
                            {inv.packageType === "Admin Funded Package" ? (
                              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/5 border border-amber-500/20 py-1.5 px-2.5 rounded-lg inline-block">
                                Capital Locked 🔒
                              </span>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" className="h-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs font-bold transition-all border border-glass-border">
                                    Exit Early
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Exit Investment Contract Early?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-xs leading-relaxed space-y-2.5">
                                      <p>You are requesting to exit this investment package before maturity. Please note the early exit policy terms:</p>
                                      <ul className="list-disc pl-4 space-y-1 mt-2 font-medium">
                                        <li className="text-destructive">An early exit penalty of <strong>15%</strong> will be deducted from your deposit capital.</li>
                                        <li className="text-destructive"><strong>All ROI earnings</strong> accumulated from this contract to date (${Number(inv.totalRoiEarned || 0).toFixed(2)}) will be completely clawed back.</li>
                                        <li>The remaining payable principal will be instantly credited to your deposit wallet.</li>
                                      </ul>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/95 font-bold"
                                      onClick={() => withdrawCapitalMutation.mutate(inv._id)}
                                    >
                                      Confirm Early Exit
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeInvestments.map((inv: any) => {
                const isReinvest = inv.autoReinvest !== false;
                const isPendingClaim = inv.pendingRoiClaim > 0;
                
                // Color tags based on package tier limits
                let tierBadge = "bg-[#0e9f6e]/10 text-[#0e9f6e] border border-[#0e9f6e]/20";
                if (inv.package?.minAmount >= 5000) {
                  tierBadge = "bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-500 border border-amber-500/30";
                } else if (inv.package?.minAmount >= 1000) {
                  tierBadge = "bg-[#004d33] text-[#f3ba2f] border border-[#004d33]";
                } else if (inv.package?.minAmount >= 100) {
                  tierBadge = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                }

                return (
                  <Card key={inv._id} className="relative overflow-hidden border-soft bg-glass-surface shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
                    <CardContent className="p-6 space-y-5 flex flex-col h-full justify-between">
                      
                      {/* Top Header */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="text-base font-extrabold text-foreground tracking-tight">{inv.package?.name || "Premium Contract"}</h3>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <Badge className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold ${tierBadge}`}>
                              {inv.package?.minAmount >= 5000 ? "VIP" : inv.package?.minAmount >= 1000 ? "PRO" : inv.package?.minAmount >= 100 ? "STANDARD" : "STARTER"}
                            </Badge>
                            {inv.packageType === "Admin Funded Package" && (
                              <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/20 border-0 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
                                Admin Funded
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-bold tracking-wider flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Active
                        </Badge>
                      </div>

                      {/* Principal Amount */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Principal</span>
                        <div className="text-3xl font-black text-foreground">${Number(inv.amount || 0).toFixed(2)}</div>
                      </div>

                      {/* Daily ROI Metrics */}
                      <div className="grid grid-cols-2 gap-4 border-t border-b border-glass-border/30 py-3">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold">Daily Return</span>
                          <span className="text-sm font-extrabold text-profit block">{Number(inv.currentRoi || 0).toFixed(2)}%</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold">Total Earned</span>
                          <span className="text-sm font-extrabold text-foreground block">${Number(inv.totalRoiEarned || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Auto-Reinvest Toggle Switch */}
                      <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 border border-glass-border/30 rounded-2xl p-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1">
                            <ArrowRightLeft className="h-3.5 w-3.5 text-primary" /> Auto-Reinvest ROI
                          </span>
                          <span className="text-[10px] text-muted-foreground block">Compound payouts directly</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={isReinvest} 
                            onCheckedChange={() => toggleReinvestMutation.mutate(inv._id)}
                            disabled={toggleReinvestMutation.isPending}
                          />
                          <span className="text-[10px] font-black uppercase text-muted-foreground w-8">
                            {isReinvest ? "ON" : "OFF"}
                          </span>
                        </div>
                      </div>

                      {/* Payout & Timer Actions */}
                      <div className="bg-secondary/40 border border-glass-border-soft rounded-2xl p-4 flex flex-col justify-center min-h-[90px]">
                        {isPendingClaim ? (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground font-semibold">Claimable Balance:</span>
                              <span className="font-extrabold text-[#f3ba2f] text-sm">${inv.pendingRoiClaim.toFixed(2)}</span>
                            </div>
                            
                            <Button 
                              className="w-full h-10 bg-gradient-to-r from-amber-400 to-[#f3ba2f] hover:from-amber-500 hover:to-amber-600 text-[#00281b] font-black rounded-xl text-xs flex gap-1.5 justify-center items-center shadow-md animate-pulse cursor-pointer"
                              onClick={() => claimRoiMutation.mutate(inv._id)}
                              disabled={claimRoiMutation.isPending}
                            >
                              <Gift className="h-4 w-4" />
                              {claimRoiMutation.isPending ? "Claiming..." : "Collect Daily ROI"}
                            </Button>

                            {inv.claimExpiresAt && (
                              <div className="text-[10px] text-destructive flex items-center justify-center gap-1.5 font-bold">
                                <Clock className="h-3.5 w-3.5" />
                                Claim window expires in: <RoiCountdown targetDate={inv.claimExpiresAt} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-1.5 space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                              {isReinvest ? "Next Compound Payout In" : "Next ROI Release In"}
                            </span>
                            {inv.nextRoiPayoutAt ? (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-[#f3ba2f] animate-pulse" />
                                <RoiCountdown targetDate={inv.nextRoiPayoutAt} />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Capital Exit Button */}
                      <div className="mt-2">
                        {inv.packageType === "Admin Funded Package" ? (
                          <div className="w-full flex items-center justify-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/5 border border-amber-500/20 py-2.5 rounded-xl">
                            Capital Locked 🔒 (No Early Exit)
                          </div>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" className="w-full h-9 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs font-bold transition-all border border-glass-border">
                                Exit Contract & Withdraw Capital
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Exit Investment Contract Early?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs leading-relaxed space-y-2.5">
                                  <p>You are requesting to exit this investment package before maturity. Please note the early exit policy terms:</p>
                                  <ul className="list-disc pl-4 space-y-1 mt-2 font-medium">
                                    <li className="text-destructive">An early exit penalty of <strong>15%</strong> will be deducted from your deposit capital.</li>
                                    <li className="text-destructive"><strong>All ROI earnings</strong> accumulated from this contract to date (${Number(inv.totalRoiEarned || 0).toFixed(2)}) will be completely clawed back.</li>
                                    <li>The remaining payable principal will be instantly credited to your deposit wallet.</li>
                                  </ul>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/95 font-bold"
                                  onClick={() => withdrawCapitalMutation.mutate(inv._id)}
                                >
                                  Confirm Early Exit
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= HISTORICAL INVESTMENTS LOG SECTION ================= */}
        <div className="pt-4">
          <h2 className="text-lg font-extrabold text-foreground mb-4">Contract Logs & History</h2>
          
          <Card className="border-soft shadow-card">
            <CardContent className="overflow-x-auto p-0">
              {isLoading ? (
                <GearSectionLoader text="Loading log history..." />
              ) : pastInvestments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs font-medium">
                  No completed or withdrawn investments found in logs.
                </div>
              ) : (
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6 py-4">Package Name</TableHead>
                      <TableHead className="px-4 py-4">Principal Size</TableHead>
                      <TableHead className="px-4 py-4">Daily ROI Rate</TableHead>
                      <TableHead className="px-4 py-4">Lifetime Earned</TableHead>
                      <TableHead className="px-4 py-4">Contract Type</TableHead>
                      <TableHead className="px-4 py-4">Close Date</TableHead>
                      <TableHead className="pr-6 py-4">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastInvestments.map((inv: any) => (
                      <TableRow key={inv._id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-semibold text-xs pl-6 py-4">{inv.package?.name || "Completed Package"}</TableCell>
                        <TableCell className="text-xs px-4 py-4">${Number(inv.amount || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-xs px-4 py-4">{Number(inv.currentRoi || 0).toFixed(2)}%</TableCell>
                        <TableCell className="text-xs text-profit font-semibold px-4 py-4">${Number(inv.totalRoiEarned || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-xs px-4 py-4">{inv.packageType || "Standard"}</TableCell>
                        <TableCell className="text-xs px-4 py-4">{inv.closeDate ? new Date(inv.closeDate).toLocaleDateString() : new Date(inv.updatedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="pr-6 py-4">
                          <Badge className={inv.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-0" : "bg-muted text-muted-foreground border-0 capitalize"}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          <SimplePagination
            currentPage={page}
            totalPages={investmentsRes?.pagination?.totalPages || 1}
            onPageChange={setPage}
          />
        </div>

      </div>
    </DashboardLayout>
  );
}

