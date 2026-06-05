import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownToLine, Eye, Check, X, AlertCircle, ShieldAlert, CreditCard } from "lucide-react";
import { GearSectionLoader } from "@/components/gear-loader";

import { newFlowsApi } from "@/lib/api-new-flows";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { SimplePagination } from "@/components/simple-pagination";

export const Route = createFileRoute("/dashboard/admin/withdrawals")({
  component: AdminWithdrawalsPage,
});

function AdminWithdrawalsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [adminNote, setAdminNote] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isRejectOpen, setIsRejectOpen] = useState<boolean>(false);
  const [page, setPage] = useState(1);

  const { data: withdrawalsRes, isLoading } = useQuery({
    queryKey: ["adminWithdrawals", statusFilter, page],
    queryFn: () => newFlowsApi.getAdminWithdrawals(statusFilter === "all" ? undefined : statusFilter, page, 10),
  });

  const withdrawals = withdrawalsRes?.withdrawals || [];

  const approveMutation = useMutation({
    mutationFn: (vars: { id: string; adminNote?: string }) => 
      newFlowsApi.approveWithdrawal(vars.id, { adminNote: vars.adminNote }),
    onSuccess: () => {
      toast.success("Withdrawal request approved successfully!");
      setIsDialogOpen(false);
      setSelectedWithdrawal(null);
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  const rejectMutation = useMutation({
    mutationFn: (vars: { id: string; rejectionReason: string; adminNote?: string }) => 
      newFlowsApi.rejectWithdrawal(vars.id, { rejectionReason: vars.rejectionReason, adminNote: vars.adminNote }),
    onSuccess: () => {
      toast.success("Withdrawal request rejected and balance refunded.");
      setIsRejectOpen(false);
      setIsDialogOpen(false);
      setSelectedWithdrawal(null);
      setRejectionReason("");
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  const markPaidMutation = useMutation({
    mutationFn: (vars: { id: string; transactionId: string; adminNote?: string }) => 
      newFlowsApi.markPaidWithdrawal(vars.id, { transactionId: vars.transactionId, adminNote: vars.adminNote }),
    onSuccess: () => {
      toast.success("Withdrawal request marked as Paid / Completed.");
      setIsDialogOpen(false);
      setSelectedWithdrawal(null);
      setTransactionId("");
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-500 border-0 capitalize">Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-500/10 text-blue-500 border-0 capitalize">Approved</Badge>;
      case "paid":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-0 capitalize">Paid</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive border-0 capitalize">Rejected / Refunded</Badge>;
      case "cancelled":
        return <Badge className="bg-muted text-muted-foreground border-0 capitalize">Cancelled</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0 capitalize">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout title="Withdrawal processing Center">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-primary" />
              Withdrawals processing Queue
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Disburse pending payouts and log transaction reference IDs.</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold">Status Filter:</Label>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Withdrawals</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-soft shadow-card">
          <CardHeader><CardTitle className="text-sm font-bold">Withdrawal Requests</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <GearSectionLoader text="Loading Payout Queue..." className="h-40" />
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                No withdrawals found for filter status "{statusFilter}".
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Wallet Type</TableHead>
                    <TableHead>Requested USD</TableHead>
                    <TableHead>Fee (5%)</TableHead>
                    <TableHead>Net Payable</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w: any) => {
                    const amount = w.amountRequested || 0;
                    const fee = w.withdrawalFee || 0;
                    const netPayable = w.netAmount || 0;
                    return (
                      <TableRow key={w._id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-foreground">{w.user?.name || "Deleted User"}</span>
                            <span className="text-[10px] text-muted-foreground">{w.user?.email || ""}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize text-xs font-semibold uppercase">
                          {w.walletType}
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-destructive">
                          -${amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          ${fee.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-foreground">
                          ${netPayable.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs">{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(w.status)}</TableCell>
                        <TableCell className="text-right">
                          <Dialog open={isDialogOpen && selectedWithdrawal?._id === w._id} onOpenChange={(o) => {
                            if (o) {
                              setSelectedWithdrawal(w);
                              setAdminNote(w.adminNote || "");
                              setTransactionId(w.transactionId || "");
                              setIsDialogOpen(true);
                            } else {
                              setIsDialogOpen(false);
                              setSelectedWithdrawal(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
                                <Eye size={12} />
                                Process Payout
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md md:max-w-xl">
                              <DialogHeader>
                                <DialogTitle>Process Withdrawal Request</DialogTitle>
                                <DialogDescription>Review details and perform approvals, rejections (with wallet refund), or mark as paid.</DialogDescription>
                              </DialogHeader>
                              {selectedWithdrawal && (
                                <div className="space-y-4 my-2 text-xs">
                                  <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/50 rounded-xl">
                                    <div>
                                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Customer Name</span>
                                      <span className="font-semibold text-foreground">{selectedWithdrawal.user?.name}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Email</span>
                                      <span>{selectedWithdrawal.user?.email}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Requested Gross</span>
                                      <span className="font-semibold text-destructive">${selectedWithdrawal.amountRequested.toFixed(2)}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Net Payout (Minus 5% Fee)</span>
                                      <span className="font-bold text-profit">
                                        ${selectedWithdrawal.netAmount.toFixed(2)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Wallet Source</span>
                                      <span className="uppercase font-semibold">{selectedWithdrawal.walletType}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Payout Channel</span>
                                      <span className="capitalize">{selectedWithdrawal.paymentMethodSnapshot?.methodType || "Crypto"}</span>
                                    </div>
                                  </div>

                                  <div className="space-y-2 p-3 bg-gold/10 border border-gold/20 rounded-xl">
                                    <div className="flex items-center gap-1.5 text-gold text-[10px] uppercase font-bold">
                                      <ShieldAlert size={14} />
                                      Destination Payout Details (Snapshot)
                                    </div>
                                    <div className="space-y-1.5 text-xs text-foreground mt-1">
                                      {selectedWithdrawal.paymentMethodSnapshot?.accountTitle && (
                                        <div>
                                          <span className="text-muted-foreground">Account Title: </span>
                                          <span className="font-semibold">{selectedWithdrawal.paymentMethodSnapshot.accountTitle}</span>
                                        </div>
                                      )}
                                      {selectedWithdrawal.paymentMethodSnapshot?.accountNumber && (
                                        <div>
                                          <span className="text-muted-foreground">Account/Wallet Number: </span>
                                          <span className="font-mono bg-secondary px-1.5 py-0.5 rounded">{selectedWithdrawal.paymentMethodSnapshot.accountNumber}</span>
                                        </div>
                                      )}
                                      {selectedWithdrawal.paymentMethodSnapshot?.bankName && (
                                        <div>
                                          <span className="text-muted-foreground">Bank Name: </span>
                                          <span className="font-semibold">{selectedWithdrawal.paymentMethodSnapshot.bankName}</span>
                                        </div>
                                      )}
                                      {selectedWithdrawal.paymentMethodSnapshot?.iban && (
                                        <div>
                                          <span className="text-muted-foreground">IBAN: </span>
                                          <span className="font-mono">{selectedWithdrawal.paymentMethodSnapshot.iban}</span>
                                        </div>
                                      )}
                                      {selectedWithdrawal.paymentMethodSnapshot?.phoneNumber && (
                                        <div>
                                          <span className="text-muted-foreground">Phone Number: </span>
                                          <span>{selectedWithdrawal.paymentMethodSnapshot.phoneNumber}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {selectedWithdrawal.status === "rejected" && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
                                      <span className="block text-[10px] uppercase font-bold">Rejection Reason</span>
                                      <p className="font-semibold mt-0.5">{selectedWithdrawal.rejectionReason}</p>
                                    </div>
                                  )}

                                  {selectedWithdrawal.status === "paid" && (
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600">
                                      <span className="block text-[10px] uppercase font-bold">Transaction Reference ID</span>
                                      <p className="font-mono font-bold mt-0.5">{selectedWithdrawal.transactionId}</p>
                                    </div>
                                  )}

                                  {["pending", "approved"].includes(selectedWithdrawal.status) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Transaction/Bank Reference ID</Label>
                                        <Input 
                                          placeholder="TXID or Bank Reference ID..." 
                                          value={transactionId} 
                                          onChange={(e) => setTransactionId(e.target.value)} 
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Admin Processing Note</Label>
                                        <Input 
                                          placeholder="Internal comments..." 
                                          value={adminNote} 
                                          onChange={(e) => setAdminNote(e.target.value)} 
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              <DialogFooter className="flex gap-2 sm:justify-end">
                                {selectedWithdrawal && selectedWithdrawal.status === "pending" && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      className="h-8 text-xs border-destructive text-destructive hover:bg-destructive/10"
                                      onClick={() => setIsRejectOpen(true)}
                                    >
                                      <X size={14} className="mr-1" />
                                      Reject & Refund
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      className="h-8 text-xs border-blue-500 text-blue-500 hover:bg-blue-500/10"
                                      onClick={() => approveMutation.mutate({ id: selectedWithdrawal._id, adminNote })}
                                      disabled={approveMutation.isPending}
                                    >
                                      <Check size={14} className="mr-1" />
                                      Approve Request
                                    </Button>
                                  </>
                                )}
                                {selectedWithdrawal && ["pending", "approved"].includes(selectedWithdrawal.status) && (
                                  <Button 
                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => {
                                      if (!transactionId.trim()) {
                                        toast.error("Transaction Reference ID is required to mark paid");
                                        return;
                                      }
                                      markPaidMutation.mutate({ id: selectedWithdrawal._id, transactionId, adminNote });
                                    }}
                                    disabled={markPaidMutation.isPending}
                                  >
                                    <CreditCard size={14} className="mr-1" />
                                    Mark as Paid
                                  </Button>
                                )}
                                {selectedWithdrawal && !["pending", "approved"].includes(selectedWithdrawal.status) && (
                                  <Button variant="outline" className="h-8 text-xs" onClick={() => setIsDialogOpen(false)}>Close</Button>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            <SimplePagination
              currentPage={page}
              totalPages={withdrawalsRes?.pagination?.totalPages || 1}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>

        {/* Reject Dialog */}
        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Reject Withdrawal Request</DialogTitle>
              <DialogDescription>Enter the reason why this withdrawal is rejected. Held balance will be refunded immediately.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-2 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="withdrawal-reject-reason">Rejection Reason</Label>
                <Input 
                  id="withdrawal-reject-reason" 
                  placeholder="e.g. Invalid account details or title mismatch" 
                  value={rejectionReason} 
                  onChange={(e) => setRejectionReason(e.target.value)} 
                />
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                <Button 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      toast.error("Rejection reason is required");
                      return;
                    }
                    rejectMutation.mutate({ id: selectedWithdrawal._id, rejectionReason, adminNote });
                  }}
                  disabled={rejectMutation.isPending}
                >
                  Reject & Refund
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
