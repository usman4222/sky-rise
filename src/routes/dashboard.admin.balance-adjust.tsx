import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, Search, User, CheckCircle2, ArrowRight,
  PlusCircle, MinusCircle, AlertTriangle, ShieldAlert, History
} from "lucide-react";
import { GearSectionLoader, GearSpinner } from "@/components/gear-loader";
import { adminApi } from "@/lib/api-admin";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { playSound } from "@/lib/sounds";

export const Route = createFileRoute("/dashboard/admin/balance-adjust")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      userId: (search.userId as string) || undefined,
    };
  },
  component: AdminBalanceAdjustPage,
});

function AdminBalanceAdjustPage() {
  const { userId } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [balanceType, setBalanceType] = useState<"deposit" | "adminAllocated">("adminAllocated");
  const [adjustAction, setAdjustAction] = useState<"add" | "deduct">("add");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustRemarks, setAdjustRemarks] = useState("");

  // Search users query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["userSearch", searchTerm],
    enabled: searchTerm.length >= 2,
    queryFn: () => adminApi.getUsers(searchTerm, 1, 10),
  });

  const suggestions = searchResults?.users || [];

  // Fetch pre-selected user detailed details
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ["adminUserDetail", userId],
    enabled: !!userId,
    queryFn: () => adminApi.getUserDetail(userId!),
    refetchOnWindowFocus: false,
  });

  const selectedUser = detailData?.user;
  const selectedUserWallet = detailData?.wallet;

  const adjustMutation = useMutation({
    mutationFn: (vars: { id: string; balanceType: 'deposit' | 'adminAllocated'; action: 'add' | 'deduct'; amount: number; remarks: string }) =>
      adminApi.adjustUserBalance(vars.id, {
        balanceType: vars.balanceType,
        action: vars.action,
        amount: vars.amount,
        remarks: vars.remarks
      }),
    onSuccess: (res: any) => {
      playSound.playSuccess();
      toast.success(res.message || "Wallet balance adjusted successfully!");
      setAdjustAmount("");
      setAdjustRemarks("");
      queryClient.invalidateQueries({ queryKey: ["adminUserDetail", userId] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err));
    }
  });

  return (
    <DashboardLayout title="Admin Balance Adjustments Controller">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Wallet className="h-5 w-5 text-primary" />
              Adjust Member Balance
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Directly credit or debit customer wallets. Changes are captured under an immutable audit history log.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-primary/20 text-primary hover:bg-primary/10 gap-1.5"
            onClick={() => {
              playSound.playClick();
              navigate({ to: "/dashboard/admin/balance-history" });
            }}
          >
            <History size={13} />
            Adjustment Audit Logs
          </Button>
        </div>

        {/* Layout split */}
        <div className="grid gap-6 md:grid-cols-5">
          {/* User selector column */}
          <div className="md:col-span-2 space-y-4">
            <Card className="border-glass-border/30 bg-white/5 backdrop-blur-md shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">
                  Target Member Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by name, email, code..."
                    className="pl-9 h-10 text-xs"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  {/* Suggestions List */}
                  {showSuggestions && searchTerm.length >= 2 && (
                    <div className="absolute left-0 right-0 mt-1 z-50 bg-[#06140e] border border-glass-border/30 rounded-2xl max-h-48 overflow-y-auto shadow-2xl backdrop-blur-md">
                      {isSearching ? (
                        <div className="p-3 text-center text-[10px] text-muted-foreground flex justify-center items-center gap-1.5">
                          <GearSpinner className="h-3.5 w-3.5" /> Searching members...
                        </div>
                      ) : suggestions.length === 0 ? (
                        <div className="p-3 text-center text-[10px] text-muted-foreground">
                          No matching members found
                        </div>
                      ) : (
                        suggestions.map((u: any) => (
                          <button
                            key={u._id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-primary/10 text-xs text-white border-b border-glass-border/10 last:border-0 flex flex-col cursor-pointer"
                            onClick={() => {
                              playSound.playClick();
                              navigate({ to: "/dashboard/admin/balance-adjust", search: { userId: u._id } });
                              setSearchTerm("");
                              setShowSuggestions(false);
                            }}
                          >
                            <span className="font-bold">{u.name}</span>
                            <span className="text-[10px] text-muted-foreground/80">{u.email}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected user profile overview card */}
                {isDetailLoading ? (
                  <div className="py-6 flex justify-center"><GearSpinner /></div>
                ) : selectedUser ? (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 rounded-2xl bg-[#002619]/40 border border-[#00e676]/20 flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shadow-inner mt-0.5">
                        {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-xs text-foreground block truncate">{selectedUser.name}</span>
                        <span className="text-[10px] text-muted-foreground block truncate">{selectedUser.email}</span>
                        <span className="text-[9px] text-[#f3ba2f] font-extrabold uppercase mt-1 inline-block bg-[#f3ba2f]/10 px-2 py-0.5 rounded-full">
                          VIP {selectedUser.vipRank}
                        </span>
                      </div>
                      <button
                        className="text-[10px] text-muted-foreground hover:text-white underline cursor-pointer"
                        onClick={() => {
                          playSound.playClick();
                          navigate({ to: "/dashboard/admin/balance-adjust", search: { userId: undefined } });
                        }}
                      >
                        Change
                      </button>
                    </div>

                    {/* Balance metrics */}
                    <div className="space-y-2">
                      <div className="p-3 bg-white/5 border border-glass-border/20 rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <PlusCircle size={14} className="text-emerald-500" />
                          <span className="text-xs text-muted-foreground">Deposit Wallet</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-white">
                          ${Number(selectedUserWallet?.deposit || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-3 bg-white/5 border border-glass-border/20 rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <PlusCircle size={14} className="text-[#f3ba2f]" />
                          <span className="text-xs text-muted-foreground">Admin Allocated Balance</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-[#f3ba2f]">
                          ${Number(selectedUserWallet?.adminAllocated || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground bg-white/5 border border-dashed border-glass-border/20 rounded-2xl">
                    Please search and select a platform member to perform adjustments.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form adjustments column */}
          <div className="md:col-span-3">
            <Card className="border-glass-border/30 bg-white/5 backdrop-blur-md shadow-soft h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-glass-border/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" /> Adjust Wallet Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col justify-between">
                {selectedUser ? (
                  <div className="space-y-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Wallet Type */}
                      <div className="space-y-2">
                        <Label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Target Wallet Type</Label>
                        <div className="grid grid-cols-1 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              playSound.playClick();
                              setBalanceType("adminAllocated");
                            }}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer text-center transition-all ${balanceType === "adminAllocated"
                              ? "border-[#f3ba2f] bg-[#f3ba2f]/10 text-white"
                              : "border-glass-border/20 bg-white/5 text-muted-foreground hover:border-glass-border/40"
                              }`}
                          >
                            <span className="text-xs font-bold">Admin Allocated</span>
                            <span className="text-[9px] opacity-75 mt-0.5">Used for locked package activations</span>
                          </button>
                          {/* <button
                            type="button"
                            onClick={() => {
                              playSound.playClick();
                              setBalanceType("deposit");
                            }}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer text-center transition-all ${balanceType === "deposit"
                              ? "border-primary bg-primary/10 text-white"
                              : "border-glass-border/20 bg-white/5 text-muted-foreground hover:border-glass-border/40"
                              }`}
                          >
                            <span className="text-xs font-bold">Deposit Wallet</span>
                            <span className="text-[9px] opacity-75 mt-0.5">Used for standard account deposits</span>
                          </button> */}
                        </div>
                      </div>

                      {/* Adjust Action Type (Credit vs Debit) */}
                      <div className="space-y-2">
                        <Label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Adjustment Action</Label>
                        <div className="grid grid-cols-1 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              playSound.playClick();
                              setAdjustAction("add");
                            }}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-xs transition-all ${adjustAction === "add"
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                              : "border-glass-border/20 bg-white/5 text-muted-foreground hover:border-glass-border/40"
                              }`}
                          >
                            <PlusCircle size={15} /> Add Funds (Credit)
                          </button>
                          {/* <button
                            type="button"
                            onClick={() => {
                              playSound.playClick();
                              setAdjustAction("deduct");
                            }}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-xs transition-all ${adjustAction === "deduct"
                              ? "border-destructive bg-destructive/10 text-destructive"
                              : "border-glass-border/20 bg-white/5 text-muted-foreground hover:border-glass-border/40"
                              }`}
                          >
                            <MinusCircle size={15} /> Deduct Funds (Debit)
                          </button> */}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="space-y-1.5">
                        <Label htmlFor="amount" className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Amount (USD)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">$</span>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            className="pl-8 h-10 font-mono text-sm"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            min="0.01"
                            step="any"
                            required
                          />
                        </div>
                      </div>

                      {/* Remarks */}
                      <div className="space-y-1.5">
                        <Label htmlFor="remarks" className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Remarks / Audit Note</Label>
                        <textarea
                          id="remarks"
                          placeholder="Provide the reason for this manual transaction (mandatory for audit compliance)..."
                          value={adjustRemarks}
                          onChange={(e) => setAdjustRemarks(e.target.value)}
                          rows={3}
                          className="w-full bg-[#ffffff] border border-glass-border/30 rounded-xl p-3 text-xs text-black focus:outline-none focus:border-primary placeholder-muted-foreground/50 resize-none font-medium leading-relaxed"
                          required
                        />
                      </div>
                    </div>

                    {/* Action Alert warnings */}
                    {adjustAction === "deduct" && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-2 items-start text-xs text-destructive/90">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold block">Caution: Debit Action</span>
                          <span>This will remove ${Number(adjustAmount || 0).toFixed(2)} immediately from the user's wallet.</span>
                        </div>
                      </div>
                    )}

                    <Button
                      type="button"
                      className="w-full bg-primary hover:bg-primary/95 text-white font-black h-12 rounded-xl text-xs gap-1.5 shadow-md mt-6 cursor-pointer"
                      onClick={() => {
                        const amt = parseFloat(adjustAmount);
                        if (isNaN(amt) || amt <= 0) {
                          toast.error("Please specify a valid positive amount");
                          return;
                        }
                        if (!adjustRemarks.trim()) {
                          toast.error("Audit remarks are mandatory for administrative adjustments");
                          return;
                        }
                        adjustMutation.mutate({
                          id: selectedUser._id,
                          balanceType,
                          action: adjustAction,
                          amount: amt,
                          remarks: adjustRemarks.trim()
                        });
                      }}
                      disabled={adjustMutation.isPending}
                    >
                      {adjustMutation.isPending ? <GearSpinner className="mr-2 h-4 w-4" /> : null}
                      Apply Account Adjustment
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-12 text-center text-xs text-muted-foreground/60">
                    No active target user loaded. Choose a user from the directory to begin.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
