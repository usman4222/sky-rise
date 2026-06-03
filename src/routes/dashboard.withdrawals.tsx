import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Wallet, Clock, CheckCheck, Coins, Plus, Loader2, ShieldAlert, Check, X } from "lucide-react";

import { financeApi } from "@/lib/api-finance";
import { adminApi } from "@/lib/api-admin";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

export const Route = createFileRoute("/dashboard/withdrawals")({ component: WithdrawPage });

function WithdrawPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [walletType, setWalletType] = useState("withdrawal");
  const [accountId, setAccountId] = useState("");
  
  // State variables for adding a new payout account
  const [newAccName, setNewAccName] = useState("");
  const [newAccChannel, setNewAccChannel] = useState("usdt_trc20");
  const [newAccTitle, setNewAccTitle] = useState("");
  const [newAccNumber, setNewAccNumber] = useState("");
  const [newBankName, setNewBankName] = useState("");

  const { data: walletsData } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await financeApi.getWallets();
      return res.wallet;
    }
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["withdrawalAccounts"],
    queryFn: async () => {
      const res = await financeApi.getWithdrawalAccounts();
      return res.accounts || [];
    }
  });

  const { data: history = [] } = useQuery({
    queryKey: ["ledgerHistory"],
    queryFn: async () => {
      const res = await financeApi.getLedgerHistory();
      return (res.history || []).filter((h: any) => h.category === "withdrawal" || h.category === "capital_withdrawal");
    }
  });

  const addAccountMutation = useMutation({
    mutationFn: () => {
      const bankDetails = newAccChannel === "bank" ? { bankName: newBankName } : null;
      return financeApi.addWithdrawalAccount({
        name: newAccName || `${newAccChannel.toUpperCase()} Account`,
        channel: newAccChannel,
        accountTitle: newAccTitle,
        accountNumber: newAccNumber,
        bankDetails,
        walletAddress: (newAccChannel === "usdt_trc20" || newAccChannel === "coinpayments") ? newAccNumber : undefined
      });
    },
    onSuccess: () => {
      toast.success("Withdrawal account added successfully!");
      setNewAccName("");
      setNewAccTitle("");
      setNewAccNumber("");
      setNewBankName("");
      queryClient.invalidateQueries({ queryKey: ["withdrawalAccounts"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  const selectedAccount = accounts.find((a: any) => a._id === accountId);
  const isCryptoWithdraw = selectedAccount?.channel === "usdt_trc20" || selectedAccount?.channel === "coinpayments";

  const withdrawMutation = useMutation({
    mutationFn: () => {
      const data = {
        amountUSDT: Number(withdrawAmount),
        sourceWallet: walletType,
        withdrawalAccountId: accountId
      };
      if (isCryptoWithdraw) {
        return financeApi.withdrawUsdt(data);
      } else {
        return financeApi.withdrawPkr(data);
      }
    },
    onSuccess: () => {
      toast.success("Payout processed successfully!");
      setWithdrawAmount("");
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["ledgerHistory"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  return (
    <DashboardLayout title="Withdrawals">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Withdrawal Balance" value={`$${(walletsData?.withdrawal || 0).toFixed(2)}`} accent="profit" />
        <StatCard icon={Coins} label="ROI Wallet" value={`$${(walletsData?.roi || 0).toFixed(2)}`} accent="primary" />
        <StatCard icon={Coins} label="Referral Wallet" value={`$${(walletsData?.referral || 0).toFixed(2)}`} accent="primary" />
        <StatCard icon={Clock} label="Pending Withdrawals" value="View History" accent="gold" />
      </div>
 
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-soft shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Withdrawal Request</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1"><Plus size={14} /> Add Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Withdrawal Account</DialogTitle></DialogHeader>
                <div className="space-y-4 py-3">
                  <div className="space-y-1.5">
                    <Label>Account Label / Nickname</Label>
                    <Input value={newAccName} onChange={(e) => setNewAccName(e.target.value)} placeholder="e.g. My HBL, Personal Wallet" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Payout Method / Channel</Label>
                    <Select value={newAccChannel} onValueChange={setNewAccChannel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usdt_trc20">USDT (TRC20)</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="raast">Raast ID</SelectItem>
                        <SelectItem value="jazzcash">JazzCash</SelectItem>
                        <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Account Title / Holder Name</Label>
                    <Input value={newAccTitle} onChange={(e) => setNewAccTitle(e.target.value)} placeholder="Name of the account holder" />
                  </div>
                  {newAccChannel === "bank" && (
                    <div className="space-y-1.5">
                      <Label>Bank Name</Label>
                      <Input value={newBankName} onChange={(e) => setNewBankName(e.target.value)} placeholder="e.g. Habib Bank Limited" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>
                      {newAccChannel === "usdt_trc20" ? "USDT TRC20 Wallet Address" : "IBAN / Mobile Number / Account Number"}
                    </Label>
                    <Input value={newAccNumber} onChange={(e) => setNewAccNumber(e.target.value)} placeholder="Enter payout address or number" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => addAccountMutation.mutate()} disabled={addAccountMutation.isPending || !newAccTitle || !newAccNumber} className="w-full glass-button-primary">
                    {addAccountMutation.isPending ? <Loader2 className="animate-spin" /> : "Save Account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Select Wallet to Withdraw From</Label>
                <Select value={walletType} onValueChange={setWalletType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="withdrawal">Main Withdrawal Wallet (${(walletsData?.withdrawal || 0).toFixed(2)})</SelectItem>
                    <SelectItem value="roi">ROI Wallet (${(walletsData?.roi || 0).toFixed(2)})</SelectItem>
                    <SelectItem value="referral">Referral Wallet (${(walletsData?.referral || 0).toFixed(2)})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Select Payout Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue placeholder="Choose a saved account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc: any) => (
                      <SelectItem key={acc._id} value={acc._id}>{acc.name} ({acc.channel?.toUpperCase()})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (USD)</Label>
                <Input type="number" placeholder="0.00" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
              </div>
              <Button 
                className="w-full bg-primary-gradient text-primary-foreground" 
                onClick={() => withdrawMutation.mutate()}
                disabled={withdrawMutation.isPending || !accountId || !withdrawAmount}
              >
                {withdrawMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Automatic Payout"}
              </Button>
            </div>
          </CardContent>
        </Card>
 
        <Card className="border-soft shadow-card">
          <CardHeader><CardTitle>Capital Withdrawal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertTitle>Early withdrawal warning</AlertTitle>
              <AlertDescription className="text-xs">
                Withdrawing your active capital investments carries a penalty if done before the contract maturity. Head over to the Investments tab to manage capital withdrawals.
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full" disabled>Managed in Investments Tab</Button>
          </CardContent>
        </Card>
      </div>
 
      <Card className="mt-6 border-soft shadow-card">
        <CardHeader><CardTitle>Withdrawal Ledger History</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead>
              <TableHead>Description</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No withdrawal history found.</TableCell></TableRow>
              ) : history.map((h: any) => (
                <TableRow key={h._id}>
                  <TableCell>{new Date(h.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{h.walletType}</Badge></TableCell>
                  <TableCell className="font-semibold text-destructive">-${h.amount}</TableCell>
                  <TableCell className="text-xs">{h.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
