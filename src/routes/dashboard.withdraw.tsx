import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, ArrowUpRight, HelpCircle, RefreshCw, PlusCircle, AlertCircle, XCircle } from "lucide-react";
import { GearSectionLoader, GearSpinner } from "@/components/gear-loader";
import { useAuthStore } from "@/store/authStore";

import { newFlowsApi } from "@/lib/api-new-flows";
import { financeApi } from "@/lib/api-finance";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { SimplePagination } from "@/components/simple-pagination";
import { playSound } from "@/lib/sounds";

export const Route = createFileRoute("/dashboard/withdraw")({
  component: WithdrawPage,
});

const WALLET_TYPES = [
  { value: "roi", label: "ROI Wallet" },
  { value: "referral", label: "Referral Wallet" },
  { value: "salary", label: "Salary Wallet" },
  { value: "achievement", label: "Achievement Wallet" },
];

function WithdrawPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Form State
  const [walletType, setWalletType] = useState<string>("all");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [cancelWithdrawalId, setCancelWithdrawalId] = useState<string | null>(null);

  // Queries
  const { data: walletsRes, isLoading: isWalletsLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => financeApi.getWallets(),
  });

  const { data: methodsRes, isLoading: isMethodsLoading } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => newFlowsApi.getMyPaymentMethods(),
  });

  const { data: withdrawalsRes, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["withdrawals", page],
    queryFn: () => newFlowsApi.getMyWithdrawals(page, 10),
  });

  const wallets = walletsRes?.wallets || {};
  const paymentMethods = methodsRes?.paymentMethods || [];
  const withdrawals = withdrawalsRes?.withdrawals || [];

  // Automatically select default payment method when loaded
  useEffect(() => {
    if (paymentMethods.length > 0) {
      const defaultPm = paymentMethods.find((pm: any) => pm.isDefault);
      if (defaultPm) {
        setPaymentMethodId(defaultPm._id);
      } else {
        setPaymentMethodId(paymentMethods[0]._id);
      }
    }
  }, [paymentMethods]);

  const requestMutation = useMutation({
    mutationFn: newFlowsApi.requestWithdrawal,
    onSuccess: () => {
      playSound.playSuccess();
      toast.success("Withdrawal request submitted successfully!");
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: newFlowsApi.cancelWithdrawal,
    onSuccess: () => {
      playSound.playChime();
      toast.success("Withdrawal request cancelled and refunded.");
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmt = parseFloat(amount);

    if (isNaN(withdrawAmt) || withdrawAmt < 10) {
      toast.error("Minimum withdrawal amount is $10");
      return;
    }

    const currentBalance = walletType === "all" ? totalWithdrawable : (wallets[walletType] || 0);
    if (currentBalance < withdrawAmt) {
      toast.error(
        walletType === "all"
          ? `Insufficient total withdrawable balance. You have $${totalWithdrawable.toFixed(2)}.`
          : `Insufficient balance in your ${walletType} wallet.`
      );
      return;
    }

    if (!paymentMethodId) {
      toast.error("Please add and select a saved payment method first.");
      return;
    }

    requestMutation.mutate({
      amount: withdrawAmt,
      walletType,
      paymentMethodId,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-500 border-0 capitalize">Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-500/10 text-blue-500 border-0 capitalize">Approved</Badge>;
      case "paid":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-0 capitalize">Paid / Completed</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive border-0 capitalize">Rejected</Badge>;
      case "cancelled":
        return <Badge className="bg-muted text-muted-foreground border-0 capitalize">Cancelled</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
  };

  const totalWithdrawable = (wallets.roi || 0) + (wallets.referral || 0) + (wallets.salary || 0) + (wallets.achievement || 0);
  const currentBal = walletType === "all" ? totalWithdrawable : (wallets[walletType] || 0);
  const numAmount = parseFloat(amount) || 0;
  const fee = numAmount * 0.05;
  const netAmount = numAmount > 0 ? Math.max(0, numAmount - fee) : 0;

  return (
    <DashboardLayout title="Withdraw Available Funds">
      <div className="space-y-6">
        {/* Balances summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {WALLET_TYPES.map((w) => {
            const bal = wallets[w.value] || 0;
            return (
              <Card key={w.value} className="border-soft shadow-card bg-glass-surface">
                <CardContent className="p-4 space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">{w.label}</span>
                  <div className="text-xl font-black text-foreground">${bal.toFixed(2)}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Withdrawal request form */}
          <Card className="lg:col-span-2 border-soft shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                <ArrowUpRight className="text-primary h-5 w-5" />
                Submit Withdrawal Request
              </CardTitle>
              <CardDescription className="text-xs">Deduct funds from available withdrawable wallets and route to your saved account.</CardDescription>
            </CardHeader>
            <CardContent>
              {user?.favorConditionEnabled && user?.favorWithdrawalStatus === 'blocked' && (
                <div className="p-4 mb-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-2xl flex items-start gap-3 animate-pulse">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs font-semibold">
                    <span className="font-bold block text-sm">Withdrawal Suspended</span>
                    <span className="block opacity-90 font-medium text-xs">
                      Monthly 1X business target not completed. Your profit withdrawal has been temporarily suspended.
                    </span>
                  </div>
                </div>
              )}

              {paymentMethods.length === 0 && !isMethodsLoading ? (
                <div className="p-6 border border-amber-500/20 bg-amber-500/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                  <AlertCircle className="h-9 w-9 text-amber-500" />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-foreground block">No Saved Payment Methods Found</span>
                    <span className="text-muted-foreground block max-w-sm">To secure withdrawal disbursements, you must first register your JazzCash, Easypaisa, Raast or bank details.</span>
                  </div>
                  <Link to="/dashboard/payment-methods">
                    <Button className="glass-button-primary h-9 text-xs gap-1">
                      <PlusCircle size={15} />
                      Set Up Payment Methods
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="block mb-2">Available Withdrawable Funds (Total)</Label>
                      <div className="rounded-xl border border-glass-border bg-[#00a86b]/10 p-3 flex justify-between items-center h-10.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Pooled Balance</span>
                        <span className="font-extrabold text-[#00a86b] text-sm">${totalWithdrawable.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center mb-1">
                        <Label htmlFor="pm-select" className="block mb-2">Select Receiving Account</Label>
                        <Link
                          to="/dashboard/payment-methods"
                          onClick={() => playSound.playClick()}
                          className="text-xs text-primary font-bold hover:underline cursor-pointer"
                        >
                          + Add New Account
                        </Link>
                      </div>
                      <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                        <SelectTrigger id="pm-select">
                          <SelectValue placeholder="Choose payment method..." />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((pm: any) => (
                            <SelectItem key={pm._id} value={pm._id}>
                              {pm.accountTitle} ({pm.methodType.toUpperCase()} - {pm.accountNumber.substring(0, 10)}...)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="withdraw-amt" className="block">Amount to Withdraw (USD)</Label>
                      <button
                        type="button"
                        onClick={() => setAmount(currentBal.toString())}
                        className="text-xs text-primary font-bold hover:underline cursor-pointer"
                      >
                        Use Max
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="withdraw-amt"
                        type="number"
                        min="10"
                        step="any"
                        placeholder="e.g. 50"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <span className="absolute right-3 top-2.5 font-semibold text-muted-foreground">USD</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Available: ${currentBal.toFixed(2)} | Minimum Withdrawal limit: $10</span>
                  </div>

                  {/* Calculations Preview */}
                  {numAmount >= 10 && (
                    <div className="p-3 bg-secondary/50 rounded-xl space-y-2 border border-glass-border-soft">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Withdrawal Processing Fee (5%):</span>
                        <span className="font-semibold text-destructive">-${fee.toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between border-t border-glass-border-soft pt-2">
                        <span className="text-foreground font-bold">Net Disbursed Amount:</span>
                        <span className="font-black text-profit">${netAmount.toFixed(2)} USD</span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full glass-button-primary h-10 font-bold"
                    disabled={
                      requestMutation.isPending || 
                      numAmount < 10 || 
                      currentBal < numAmount || 
                      (user?.favorConditionEnabled && user?.favorWithdrawalStatus === 'blocked')
                    }
                  >
                    {requestMutation.isPending ? <GearSpinner className="mr-2 h-4 w-4" /> : null}
                    Confirm Withdrawal Request
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Rules and processing details */}
          <Card className="border-soft shadow-card bg-glass-surface">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <HelpCircle size={16} className="text-primary" />
                Withdrawal Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
              <p>Please review our compliance standards before requesting a disbursement:</p>
              <ul className="space-y-2 pt-2 border-t border-glass-border-soft">
                <li className="flex items-start gap-1">
                  <span className="text-foreground font-semibold">•</span>
                  <span><strong>Minimum Amount:</strong> Withdrawals must be $10 USD or above.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-foreground font-semibold">•</span>
                  <span><strong>Withdrawal Fee:</strong> A flat 5% processing fee is deducted automatically on every payout request.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-foreground font-semibold">•</span>
                  <span><strong>Processing Window:</strong> Payout requests are verified manually and disbursed in **1 to 12 hours**.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-foreground font-semibold">•</span>
                  <span><strong>Deposit Wallet:</strong> Direct withdrawal of deposit balances is blocked. Deposit funds must be utilized inside active investment packages.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal requests history table */}
        <Card className="border-soft shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Withdrawal Log history</CardTitle>
            <CardDescription className="text-xs">Monitor review status, payouts disbursed, and blockchain references.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isHistoryLoading ? (
              <GearSectionLoader text="Loading Withdrawal History..." />
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center justify-center gap-1">
                <RefreshCw size={24} className="text-muted-foreground/50 animate-pulse mb-1" />
                No withdrawals requested yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Source Wallet</TableHead>
                    <TableHead>Amount (USD)</TableHead>
                    <TableHead>Fee (5%)</TableHead>
                    <TableHead>Net Payout</TableHead>
                    <TableHead>Payout Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference / Rejection Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w: any) => (
                    <TableRow key={w._id}>
                      <TableCell className="text-xs">{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="uppercase text-xs font-semibold">{w.walletType}</TableCell>
                      <TableCell className="font-bold text-xs text-destructive">-${w.amountRequested.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">${w.withdrawalFee.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-xs text-foreground">${w.netAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-xs capitalize">
                        {w.paymentMethodSnapshot?.methodType || "Crypto Wallet"} (
                        {w.paymentMethodSnapshot?.accountNumber?.substring(0, 10)}...)
                      </TableCell>
                      <TableCell>{getStatusBadge(w.status)}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate text-muted-foreground" title={w.transactionId || w.rejectionReason}>
                        {w.status === "paid" && (
                          <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[10px] text-emerald-500">TXID: {w.transactionId}</span>
                        )}
                        {w.status === "rejected" && (
                          <span className="text-destructive font-medium flex items-center gap-1"><XCircle size={12} /> {w.rejectionReason}</span>
                        )}
                        {w.status === "pending" && "Under Review"}
                        {w.status === "cancelled" && "Cancelled by User"}
                      </TableCell>
                      <TableCell className="text-right">
                        {w.status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setCancelWithdrawalId(w._id);
                            }}
                            disabled={cancelMutation.isPending}
                          >
                            Cancel Request
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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
      </div>

      <AlertDialog open={!!cancelWithdrawalId} onOpenChange={(open) => !open && setCancelWithdrawalId(null)}>
        <AlertDialogContent className="glass-card max-w-sm rounded-3xl border-glass-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-extrabold text-foreground text-sm">Cancel Withdrawal Request?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to cancel this withdrawal request? The funds will be refunded back to your withdrawable wallet balance immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="h-9.5 text-xs rounded-xl border-glass-border cursor-pointer">No, Keep It</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (cancelWithdrawalId) {
                  cancelMutation.mutate(cancelWithdrawalId);
                  setCancelWithdrawalId(null);
                }
              }}
              className="h-9.5 text-xs rounded-xl bg-destructive hover:bg-destructive/80 text-white font-semibold cursor-pointer border-0"
            >
              Yes, Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
