import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Award, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Calendar, HelpCircle, ArrowRight } from "lucide-react";
import { GearSectionLoader, GearSpinner } from "@/components/gear-loader";

import { newFlowsApi } from "@/lib/api-new-flows";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { SimplePagination } from "@/components/simple-pagination";

export const Route = createFileRoute("/dashboard/weekly-salary")({
  component: WeeklySalaryPage,
});

function WeeklySalaryPage() {
  const queryClient = useQueryClient();
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [claimNotes, setClaimNotes] = useState("");
  const [page, setPage] = useState(1);

  const { data: eligibilityRes, isLoading: isEligibleLoading } = useQuery({
    queryKey: ["salaryEligibility"],
    queryFn: () => newFlowsApi.getSalaryEligibility(),
  });

  const { data: historyRes, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["salaryRequests", page],
    queryFn: () => newFlowsApi.getMySalaryRequests(page, 10),
  });

  const eligibility = eligibilityRes?.eligibility;
  const requests = historyRes?.requests || [];

  const claimMutation = useMutation({
    mutationFn: newFlowsApi.requestWeeklySalary,
    onSuccess: () => {
      toast.success("Weekly salary claim submitted successfully!");
      setIsClaimOpen(false);
      setClaimNotes("");
      queryClient.invalidateQueries({ queryKey: ["salaryEligibility"] });
      queryClient.invalidateQueries({ queryKey: ["salaryRequests"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err));
    },
  });

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    claimMutation.mutate({ notes: claimNotes });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-500 border-0 capitalize">Pending Review</Badge>;
      case "approved":
      case "credited":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-0 capitalize">Approved & Paid</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive border-0 capitalize">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
  };

  const getVipRankName = (rank: number) => {
    if (rank === 0) return "Not Ranked";
    return `VIP Rank ${rank}`;
  };

  const legs = eligibility?.qualification?.qualifiedLegsDetails || [];

  return (
    <DashboardLayout title="Weekly Fixed Salary">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-soft shadow-card overflow-hidden">
            <div className="bg-primary-gradient p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-white/20 uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">Leadership Reward Program</span>
                <h2 className="text-2xl font-black mt-1.5 flex items-center gap-1.5">
                  <Award size={26} />
                  VIP Fixed Weekly Salary
                </h2>
                <p className="text-white/80 text-xs mt-1 max-w-md">Generate qualifying business across 5 independent sponsor lines to secure a regular weekly salary payout from the platform.</p>
              </div>
            </div>
            <CardContent className="p-6">
              {isEligibleLoading ? (
                <GearSectionLoader text="Checking VIP Eligibility..." className="min-h-[144px]" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Current Rank Status</span>
                        <span className="font-bold text-sm text-foreground">{getVipRankName(eligibility?.currentRank)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                        <Award size={24} />
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Eligible Weekly Payout</span>
                        <span className="font-bold text-sm text-foreground">${eligibility?.eligibleAmount || 0} / week</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary/50 rounded-2xl border border-glass-border flex flex-col justify-between h-full space-y-4">
                    <div className="text-xs">
                      <span className="font-semibold block mb-1">Status Report:</span>
                      {eligibility?.canRequest ? (
                        <span className="text-emerald-500 font-medium flex items-center gap-1">
                          <CheckCircle2 size={15} /> Qualified to claim weekly salary!
                        </span>
                      ) : (
                        <span className="text-amber-500 font-medium flex items-start gap-1">
                          <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                          <span>{eligibility?.restrictionReason || "You do not satisfy VIP salary qualifications for the current week."}</span>
                        </span>
                      )}
                    </div>

                    <Dialog open={isClaimOpen} onOpenChange={setIsClaimOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full glass-button-primary h-10 text-xs font-bold"
                          disabled={!eligibility?.canRequest}
                        >
                          Request Weekly Salary
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Claim Weekly VIP Salary</DialogTitle>
                          <DialogDescription>Submit your weekly leadership salary claim based on your qualifying VIP rank.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleClaim} className="space-y-4 text-xs my-2">
                          <div className="p-3 bg-secondary/50 rounded-xl space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Current Qualified Rank:</span>
                              <span className="font-bold text-foreground">{getVipRankName(eligibility?.currentRank)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Salary Payout:</span>
                              <span className="font-bold text-profit">${eligibility?.eligibleAmount} USD</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="claim-notes">Claim Remarks / Notes (Optional)</Label>
                            <Input 
                              id="claim-notes" 
                              placeholder="Add any processing reference notes..." 
                              value={claimNotes} 
                              onChange={(e) => setClaimNotes(e.target.value)} 
                            />
                          </div>

                          <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsClaimOpen(false)}>Cancel</Button>
                             <Button type="submit" className="glass-button-primary" disabled={claimMutation.isPending}>
                              {claimMutation.isPending ? <GearSpinner className="mr-2 h-4 w-4" /> : null}
                              Submit Request
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guidelines info card */}
          <Card className="border-soft shadow-card bg-glass-surface">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1">
                <HelpCircle size={16} className="text-primary" />
                VIP Salary Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>Weekly VIP salaries are distributed based on maintaining at least <strong>5 active downline sponsor legs</strong>. Each leg requires a minimum sales volume to qualify:</p>
              <ul className="space-y-1 pt-1 border-t border-glass-border-soft">
                <li className="flex justify-between"><span>VIP 1: $1,000 / leg</span> <span className="font-semibold text-foreground">$50/wk</span></li>
                <li className="flex justify-between"><span>VIP 2: $2,000 / leg</span> <span className="font-semibold text-foreground">$100/wk</span></li>
                <li className="flex justify-between"><span>VIP 3: $4,000 / leg</span> <span className="font-semibold text-foreground">$200/wk</span></li>
                <li className="flex justify-between"><span>VIP 4: $8,000 / leg</span> <span className="font-semibold text-foreground">$400/wk</span></li>
                <li className="flex justify-between"><span>VIP 5: $16,000 / leg</span> <span className="font-semibold text-foreground">$800/wk</span></li>
              </ul>
              <p className="pt-2 border-t border-glass-border-soft text-[10px] text-amber-500 flex items-start gap-1 font-medium">
                <Calendar size={13} className="flex-shrink-0 mt-0.5" />
                <span>Salaries must be claimed manually each week. Multiple approved payouts in the same cycle are prohibited.</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 5 Legs Volume Qualifications */}
        <Card className="border-soft shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Active Downline Leg Report</CardTitle>
            <CardDescription className="text-xs">Business volume generated by your 5 deepest direct downline legs.</CardDescription>
          </CardHeader>
          <CardContent>
            {isEligibleLoading ? (
              <GearSectionLoader text="Loading Downline Legs..." className="min-h-[120px] py-4" />
            ) : legs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                <AlertTriangle size={24} className="text-muted-foreground/50" />
                You do not have 5 direct legs representing referrals. Share your referral code to unlock VIP salaries.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {legs.map((leg: any, i: number) => {
                  // Determine qualification criteria per rank to show progress
                  const volume = leg.volume || 0;
                  return (
                    <div key={leg._id || i} className="p-4 border border-glass-border bg-glass-surface rounded-2xl text-center space-y-2">
                      <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Leg #{i + 1}</Badge>
                      <div className="text-xs text-muted-foreground block truncate">Member: {leg.legUser?.name || `User ${i+1}`}</div>
                      <div className="text-lg font-black text-foreground">${volume.toLocaleString()}</div>
                      <span className="text-[10px] block text-muted-foreground">Volume generated</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Claim History */}
        <Card className="border-soft shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Salary Claims Ledger</CardTitle>
            <CardDescription className="text-xs">Logs and status history of your weekly salary submissions.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isHistoryLoading ? (
              <GearSectionLoader text="Loading Salary History..." />
            ) : requests.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center justify-center gap-1">
                <CheckCircle2 size={24} className="text-muted-foreground/55" />
                No weekly salary claims logged.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>VIP Rank Level</TableHead>
                    <TableHead>Claim Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Review Date</TableHead>
                    <TableHead>Remarks / Rejection Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r: any) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium text-xs">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs font-semibold">{getVipRankName(r.vipRank)}</TableCell>
                      <TableCell className="text-xs font-bold text-profit">+${r.salaryAmount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : "Pending Admin Review"}
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate text-muted-foreground" title={r.rejectionReason || r.notes}>
                        {r.status === "rejected" ? (
                          <span className="text-destructive font-medium flex items-center gap-1"><XCircle size={12} /> {r.rejectionReason}</span>
                        ) : r.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <SimplePagination
              currentPage={page}
              totalPages={historyRes?.pagination?.totalPages || 1}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
