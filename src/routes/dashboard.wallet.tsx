import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift, Users, Upload, Loader2, Wallet, ShieldAlert, Check, X } from "lucide-react";

import { financeApi } from "@/lib/api-finance";
import { adminApi } from "@/lib/api-admin";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

export const Route = createFileRoute("/dashboard/wallet")({ component: WalletPage });

function WalletPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [depositAmount, setDepositAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");

  const { data: walletsData, isLoading: loadingWallets } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await financeApi.getWallets();
      return res.wallet;
    }
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      const res = await financeApi.getPaymentMethods();
      return res.methods || [];
    }
  });

  // Filter out any manual methods - deposits must be automatic only
  const automatedMethods = paymentMethods.filter(
    (m: any) => m.gateway === "payfast" || m.gateway === "coinpayments"
  );

  const selectedMethod = automatedMethods.find((m: any) => m._id === paymentMethodId);
  const isPkr = selectedMethod?.currency === "PKR";

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethodId: string }) => {
      if (isPkr) {
        return financeApi.createPkrDeposit({ amountPKR: data.amount });
      } else {
        return financeApi.createUsdtDeposit({ amountUSDT: data.amount });
      }
    },
    onSuccess: (res: any) => {
      if (res?.deposit?.checkoutUrl) {
        toast.success("Redirecting to payment gateway...");
        setTimeout(() => {
          window.location.href = res.deposit.checkoutUrl;
        }, 1200);
      } else {
        toast.error("Failed to initiate deposit checkout link.");
      }
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  const handleDepositSubmit = () => {
    if (!depositAmount || !paymentMethodId) {
      toast.error("Please fill in all deposit fields.");
      return;
    }
    const numAmount = Number(depositAmount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }
    depositMutation.mutate({
      amount: numAmount,
      paymentMethodId
    });
  };

  const walletCards = [
    { 
      icon: Wallet, name: "Main Deposit Wallet", 
      bal: walletsData?.deposit || 0, color: "emerald",
      rules: ["Used to purchase investment packages"] 
    },
    { 
      icon: Gift, name: "Registration Bonus", 
      bal: walletsData?.freeRegBonus || 0, color: "gold",
      rules: ["Merged with your first investment"] 
    },
    { 
      icon: Users, name: "Team Bonus Received", 
      bal: walletsData?.bonusReceived || 0, color: "primary",
      rules: ["Use max 10% on package purchases"] 
    },
  ];

  const styles: Record<string, string> = {
    gold: "bg-gold/15 text-gold",
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-500",
  };

  return (
    <DashboardLayout title="Wallets & Deposits">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Assets</h2>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="glass-button-primary gap-2"><Upload size={16} /> Deposit Funds</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Initiate Secure Deposit</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the deposit amount and proceed to the secure checkout page to finalize your payment.
              </p>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label>Select Payment Method</Label>
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger><SelectValue placeholder="Choose a payment method" /></SelectTrigger>
                  <SelectContent>
                    {automatedMethods.map((m: any) => (
                      <SelectItem key={m._id} value={m._id}>{m.name} ({m.currency})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {paymentMethodId && selectedMethod && (
                  <div className="rounded-lg bg-muted/50 p-3 mt-2 text-xs font-mono break-all border border-border">
                    <span className="text-emerald-500 font-semibold">Automated Gateway: No manual receipt upload required.</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1.5">
                <Label>Amount to Deposit {selectedMethod ? `(${selectedMethod.currency})` : ""}</Label>
                <Input type="number" placeholder="100" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button 
                className="w-full glass-button-primary" 
                onClick={handleDepositSubmit}
                disabled={depositMutation.isPending}
              >
                {depositMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  `Pay with ${selectedMethod?.gateway === "payfast" ? "PayFast" : "CoinPayments"}`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {walletCards.map((w) => (
          <Card key={w.name} className="border-soft shadow-card glass-card-hover transition-all">
            <CardContent className="p-6">
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${styles[w.color]}`}><w.icon size={20} /></div>
              <h3 className="mt-4 text-base font-semibold">{w.name}</h3>
              <div className="mt-2 text-3xl font-bold">
                {loadingWallets ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : `$${Number(w.bal).toFixed(2)}`}
              </div>
              <div className="mt-4 space-y-1.5">
                {w.rules.map((r) => (
                  <div key={r} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="h-1.5 w-1.5 rounded-full bg-primary p-0 border-0" />{r}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
