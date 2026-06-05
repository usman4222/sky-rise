import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Check, CreditCard, Landmark, Phone, Key, HelpCircle } from "lucide-react";
import { GearSectionLoader, GearSpinner } from "@/components/gear-loader";

import { newFlowsApi } from "@/lib/api-new-flows";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

export const Route = createFileRoute("/dashboard/payment-methods")({
  component: PaymentMethodsPage,
});

const METHOD_TYPES = [
  { value: "bank", label: "Bank Account", icon: Landmark },
  { value: "raast", label: "Raast Instant Account", icon: Key },
  { value: "jazzcash", label: "JazzCash", icon: Phone },
  { value: "easypaisa", label: "Easypaisa", icon: Phone },
  { value: "usdt_trc20", label: "USDT TRC20 Wallet", icon: Landmark },
];

function PaymentMethodsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [methodType, setMethodType] = useState<string>("bank");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const { data: methodsRes, isLoading } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => newFlowsApi.getMyPaymentMethods(),
  });

  const paymentMethods = methodsRes?.paymentMethods || [];

  const resetForm = () => {
    setMethodType("bank");
    setAccountTitle("");
    setAccountNumber("");
    setBankName("");
    setIban("");
    setPhoneNumber("");
    setIsDefault(false);
  };

  const addMutation = useMutation({
    mutationFn: newFlowsApi.addPaymentMethod,
    onSuccess: () => {
      toast.success("Payment method added successfully!");
      setIsOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: newFlowsApi.deletePaymentMethod,
    onSuccess: () => {
      toast.success("Payment method deactivated.");
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err));
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: newFlowsApi.setDefaultPaymentMethod,
    onSuccess: () => {
      toast.success("Default payment method updated.");
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountTitle.trim()) {
      toast.error("Account title is required");
      return;
    }
    if (!accountNumber.trim()) {
      toast.error("Account/Wallet number is required");
      return;
    }
    if (methodType === "bank" && !bankName.trim()) {
      toast.error("Bank name is required");
      return;
    }
    if (methodType === "usdt_trc20" && !accountNumber.startsWith("T")) {
      toast.warning("TRC20 addresses usually start with T. Please double check.");
    }

    addMutation.mutate({
      methodType,
      accountTitle,
      accountNumber,
      walletAddress: accountNumber, // For backward compatibility
      bankName: methodType === "bank" ? bankName : undefined,
      iban: methodType === "bank" ? iban : undefined,
      phoneNumber: ["jazzcash", "easypaisa", "raast"].includes(methodType) ? phoneNumber || accountNumber : undefined,
      isDefault,
    });
  };

  const getMethodBadge = (type: string) => {
    switch (type) {
      case "bank":
        return <Badge variant="outline">Bank</Badge>;
      case "raast":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-0">Raast</Badge>;
      case "jazzcash":
        return <Badge className="bg-amber-500/10 text-amber-500 border-0">JazzCash</Badge>;
      case "easypaisa":
        return <Badge className="bg-green-500/10 text-green-500 border-0">Easypaisa</Badge>;
      case "usdt_trc20":
        return <Badge className="bg-sky-500/10 text-sky-500 border-0">USDT TRC20</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <DashboardLayout title="Withdrawal Payment Methods">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Saved Payment Methods
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage accounts where your platform withdrawals will be deposited.</p>
          </div>
          <Button onClick={() => setIsOpen(true)} className="glass-button-primary text-xs gap-1.5 h-9">
            <Plus size={16} />
            Add Payment Method
          </Button>
        </div>

        {/* Saved Methods List */}
        <Card className="border-soft shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Registered Accounts</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Default payment methods are pre-selected during withdrawal requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <GearSectionLoader text="Loading Payment Methods..." />
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                <Landmark size={36} className="text-muted-foreground/45" />
                No payment methods saved yet. Add one to request withdrawals.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((pm: any) => (
                  <div key={pm._id} className="relative p-4 border border-primary/20 dark:border-white/10 bg-glass-surface rounded-2xl flex flex-col justify-between hover:border-primary/50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        {getMethodBadge(pm.methodType)}
                        {pm.isDefault && (
                          <Badge className="bg-primary-gradient text-white border-0 text-[10px] py-0.5 px-2 flex items-center gap-1">
                            <Check size={10} /> Default
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Account Holder / Title</div>
                        <div className="font-bold text-sm text-foreground">{pm.accountTitle}</div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          {pm.methodType === "usdt_trc20" ? "TRC20 Wallet Address" : "Account / Phone Number"}
                        </div>
                        <div className="font-mono text-xs bg-secondary/40 px-2 py-1 rounded w-fit select-all">
                          {pm.accountNumber}
                        </div>
                      </div>

                      {pm.methodType === "bank" && (
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-glass-border-soft text-xs">
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase">Bank Name</span>
                            <span className="font-semibold">{pm.bankName}</span>
                          </div>
                          {pm.iban && (
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase">IBAN</span>
                              <span className="font-mono text-[11px] block truncate" title={pm.iban}>{pm.iban}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-glass-border-soft justify-end">
                      {!pm.isDefault && (
                        <Button
                          onClick={() => setDefaultMutation.mutate(pm._id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[11px] hover:bg-primary/10 text-primary font-semibold"
                          disabled={setDefaultMutation.isPending}
                        >
                          Make Default
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          if (confirm("Deactivate this payment method?")) {
                            deleteMutation.mutate(pm._id);
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[11px] text-destructive hover:bg-destructive/10 font-medium"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={13} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Payment Method Dialog */}
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>Save your banking or crypto details for fast withdrawal payouts.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs my-2">
              <div className="space-y-1.5">
                <Label className="block mb-3" htmlFor="method-type">Payment Channel Type</Label>
                <Select value={methodType} onValueChange={setMethodType}>
                  <SelectTrigger id="method-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_TYPES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="block mb-3" htmlFor="account-title">Account Holder Title (Full Name)</Label>
                <Input
                  id="account-title"
                  placeholder="e.g. John Doe"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                />
              </div>

              {methodType === "bank" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="block mb-3" htmlFor="bank-name">Bank Name</Label>
                    <Input
                      id="bank-name"
                      placeholder="e.g. Habib Bank Limited"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="block mb-3" htmlFor="iban">IBAN (International Bank Account Number)</Label>
                    <Input
                      id="iban"
                      placeholder="e.g. PK00HABB0000001234567890"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                    />
                  </div>
                </>
              )}

              {methodType === "usdt_trc20" && (
                <div className="space-y-1.5">
                  <Label className="block mb-3" htmlFor="wallet-address">USDT TRC20 Wallet Address</Label>
                  <Input
                    id="wallet-address"
                    placeholder="TRC20 Wallet Address starting with 'T'"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                  <span className="text-[10px] text-muted-foreground block mt-0.5">Please verify carefully. Payouts sent to wrong wallets cannot be recovered.</span>
                </div>
              )}

              {methodType !== "bank" && methodType !== "usdt_trc20" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="block mb-3" htmlFor="account-num">{methodType === "raast" ? "Raast ID / IBAN" : "Mobile Account Number"}</Label>
                    <Input
                      id="account-num"
                      placeholder="e.g. 03001234567"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="block mb-3" htmlFor="phone-num">Mobile Number linked to account</Label>
                    <Input
                      id="phone-num"
                      placeholder="e.g. 03001234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </>
              )}

              {methodType === "bank" && (
                <div className="space-y-1.5">
                  <Label className="block mb-3" htmlFor="account-num-bank">Account Number</Label>
                  <Input
                    id="account-num-bank"
                    placeholder="e.g. 1234567890123"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 mt-4 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-glass-border text-primary focus:ring-primary h-4 w-4"
                />
                Set as default payout account
              </label>

              <DialogFooter className="pt-4 flex gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" className="glass-button-primary" disabled={addMutation.isPending}>
                  {addMutation.isPending ? <GearSpinner className="mr-2 h-4 w-4" /> : null}
                  Save Account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
