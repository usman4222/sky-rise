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
import { Loader2, Coins, ArrowRightLeft, Gift, Clock } from "lucide-react";

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

  const { data: investmentsRes, isLoading } = useQuery({
    queryKey: ["myInvestments", page],
    queryFn: async () => {
      const res = await investmentsApi.getMyInvestments(page, 10);
      return res || { investments: [] };
    }
  });

  const investments = investmentsRes?.investments || [];

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
      <Card className="border-soft shadow-card">
        <CardHeader><CardTitle>Active & Past Investments</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Current ROI</TableHead>
                  <TableHead>Claim Mode</TableHead>
                  <TableHead>Auto-Reinvest</TableHead>
                  <TableHead>Pending Claim</TableHead>
                  <TableHead>Next Payout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">No active investments found.</TableCell></TableRow>
                ) : investments.map((inv: any) => (
                  <TableRow key={inv._id}>
                    <TableCell className="font-medium">{inv.package?.name || "Unknown Package"}</TableCell>
                    <TableCell>${Number(inv.amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-profit font-semibold">{inv.currentRoi}%</TableCell>
                    <TableCell>
                      {inv.status === "active" ? (
                        <Badge className={inv.roiClaimMode === "manual" ? "bg-gold/15 text-gold border-0 capitalize" : "bg-primary/10 text-primary border-0 capitalize"}>
                          {inv.roiClaimMode || "auto"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {inv.status === "active" ? (
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={inv.autoReinvest !== false && inv.roiClaimMode !== "manual"} 
                            onCheckedChange={() => toggleReinvestMutation.mutate(inv._id)}
                            disabled={toggleReinvestMutation.isPending || inv.roiClaimMode === "manual"}
                          />
                          <span className="text-xs text-muted-foreground">
                            {inv.roiClaimMode === "manual" ? "N/A" : (inv.autoReinvest !== false ? "ON" : "OFF")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {inv.status === "active" && inv.pendingRoiClaim > 0 ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-semibold text-gold">${inv.pendingRoiClaim.toFixed(2)}</span>
                          <Button 
                            size="sm" 
                            className="h-7 px-2 text-[10px] bg-gold text-gold-foreground hover:bg-gold/90 flex gap-1 items-center"
                            onClick={() => claimRoiMutation.mutate(inv._id)}
                            disabled={claimRoiMutation.isPending}
                          >
                            <Gift className="h-3 w-3" />
                            {claimRoiMutation.isPending ? "Claiming..." : "Claim ROI"}
                          </Button>
                          {inv.claimExpiresAt && (
                            <span className="text-[10px] text-destructive flex items-center gap-1 mt-0.5 font-semibold">
                              <Clock className="h-3 w-3" />
                              Expires in: <RoiCountdown targetDate={inv.claimExpiresAt} />
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {inv.status === "active" && inv.nextRoiPayoutAt ? (
                        <RoiCountdown targetDate={inv.nextRoiPayoutAt} />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={inv.status === "active" ? "bg-profit/10 text-profit border-0" : "bg-muted text-muted-foreground border-0 capitalize"}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status === "active" ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" disabled={withdrawCapitalMutation.isPending}>
                              Withdraw Capital
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Withdraw Capital Early?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Withdrawing your capital early may incur a 15% penalty fee and pause all future ROI earnings. 
                                Are you sure you wish to proceed?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => withdrawCapitalMutation.mutate(inv._id)}
                              >
                                Confirm Withdrawal
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <SimplePagination
            currentPage={page}
            totalPages={investmentsRes?.pagination?.totalPages || 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
