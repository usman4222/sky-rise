import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Eye, Ban, CheckCircle, Search, Wallet, 
  Trophy, ArrowDownToLine, Receipt, UserCheck, AlertCircle, Network
} from "lucide-react";
import { GearSectionLoader } from "@/components/gear-loader";

import { adminApi } from "@/lib/api-admin";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { SimplePagination } from "@/components/simple-pagination";

export const Route = createFileRoute("/dashboard/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch users with search & page
  const { data: usersData, isLoading: isListLoading } = useQuery({
    queryKey: ["adminUsers", search, page],
    queryFn: async () => {
      const res = await adminApi.getUsers(search || undefined, page, 10);
      return res;
    },
    refetchOnWindowFocus: false,
  });

  const users = usersData?.users || [];
  const totalPages = usersData?.pagination?.totalPages || 1;

  // Fetch user detailed profile
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ["adminUserDetail", selectedUserId],
    enabled: !!selectedUserId && isDetailOpen,
    queryFn: async () => {
      const res = await adminApi.getUserDetail(selectedUserId!);
      return res;
    },
    refetchOnWindowFocus: false,
  });

  // Suspend Mutation
  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminApi.suspendUser(id),
    onSuccess: (res: any) => {
      toast.success(res.message || "User account suspended successfully.");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminUserDetail", selectedUserId] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err)),
  });

  // Activate Mutation
  const activateMutation = useMutation({
    mutationFn: (id: string) => adminApi.activateUser(id),
    onSuccess: (res: any) => {
      toast.success(res.message || "User account activated successfully.");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminUserDetail", selectedUserId] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err)),
  });


 
  const handleOpenDetails = (id: string) => {
    setSelectedUserId(id);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === "suspended") {
      return (
        <Badge className="bg-destructive/10 text-destructive border border-destructive/20 text-[10px] font-semibold py-0.5 px-2.5 rounded-full flex items-center gap-1 w-fit">
          <Ban size={10} /> Suspended
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-semibold py-0.5 px-2.5 rounded-full flex items-center gap-1 w-fit">
        <CheckCircle size={10} className="text-emerald-500" /> Active
      </Badge>
    );
  };

  const getVipBadge = (rank: number) => {
    if (rank === 0) {
      return (
        <Badge className="bg-secondary/60 text-muted-foreground border border-soft text-[10px] font-semibold py-0.5 px-2 rounded-full">
          VIP 0
        </Badge>
      );
    }
    return (
      <Badge className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white border-0 text-[10px] font-bold py-0.5 px-2.5 rounded-full shadow-sm">
        VIP {rank} ✦
      </Badge>
    );
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-semibold py-0.5 px-2 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle size={10} className="text-emerald-500" /> Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-semibold py-0.5 px-2 rounded-full flex items-center gap-1 w-fit animate-pulse">
            <AlertCircle size={10} className="text-amber-500" /> Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive/10 text-destructive border border-destructive/20 text-[10px] font-semibold py-0.5 px-2 rounded-full flex items-center gap-1 w-fit">
            <Ban size={10} /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-secondary/40 text-muted-foreground border border-soft text-[10px] font-medium py-0.5 px-2 rounded-full w-fit">
            Unsubmitted
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout title="Users Directory & Network Audit">
      <div className="space-y-6">
        {/* Top Header Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Member Management
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inspect balances, investments, network sponsor connections, downline leg reports, and manage statuses.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input 
                placeholder="Search name, email, ref code..." 
                className="pl-9 h-9 text-xs" 
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); // Reset page on new query
                }}
              />
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <Card className="border-soft shadow-card">
          <CardContent className="p-0">
            {isListLoading ? (
              <GearSectionLoader text="Loading Members..." className="h-48" />
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                No platform members found. Try refining your search.
              </div>
            ) : (
              <div className="overflow-x-auto px-6 pt-3 pb-6">
                <Table>
                  <TableHeader className="bg-secondary/40 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent border-b border-soft">
                      <TableHead className="font-bold text-foreground py-4">User Details</TableHead>
                      <TableHead className="font-bold text-foreground py-4">Phone</TableHead>
                      <TableHead className="font-bold text-foreground py-4">Referral Code</TableHead>
                      <TableHead className="font-bold text-foreground py-4">VIP Rank</TableHead>
                      <TableHead className="font-bold text-foreground py-4">Status</TableHead>
                      <TableHead className="text-right font-bold text-foreground py-4">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u: any) => (
                      <TableRow key={u._id} className="hover:bg-secondary/20 transition-colors duration-150 group/row border-b border-soft/50">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shadow-inner">
                              {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-foreground group-hover/row:text-primary transition-colors">{u.name}</span>
                              <span className="text-[10px] text-muted-foreground">{u.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium py-3">{u.phone}</TableCell>
                        <TableCell className="py-3">
                          <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-secondary/50 border border-soft text-foreground">
                            {u.referralCode}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">{getVipBadge(u.vipRank)}</TableCell>
                        <TableCell className="py-3">{getStatusBadge(u.status)}</TableCell>
                        <TableCell className="text-right py-3">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-xs gap-1.5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-200 shadow-sm"
                              onClick={() => handleOpenDetails(u._id)}
                            >
                              <Eye size={12} />
                              View Audit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-xs gap-1.5 border-[#f3ba2f]/45 text-[#f3ba2f] hover:bg-[#f3ba2f]/10 transition-all duration-200 shadow-sm"
                              onClick={() => {
                                navigate({ to: "/dashboard/admin/balance-adjust", search: { userId: u._id } });
                              }}
                            >
                              <Wallet size={12} />
                              Adjust Balance
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="p-4 border-t border-soft">
                  <SimplePagination 
                    currentPage={page} 
                    totalPages={totalPages} 
                    onPageChange={setPage} 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Detail Modal Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <UserCheck className="h-5 w-5 text-primary" />
              Member Profile & Network Audit
            </h2>
          </DialogHeader>

          {isDetailLoading || !detailData ? (
            <GearSectionLoader text="Loading Member Audit Profile..." className="h-64" />
          ) : (
            <div className="space-y-6 text-xs mt-2">
              {/* Header profile summary card */}
              <div className="flex justify-between items-start flex-wrap gap-4 p-4 rounded-2xl bg-secondary/40 border border-soft shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{detailData.user.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{detailData.user.email}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Phone: {detailData.user.phone}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Registered: {new Date(detailData.user.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(detailData.user.status)}
                    <Badge className="bg-primary/10 text-primary border-0 font-semibold">VIP {detailData.user.vipRank}</Badge>
                  </div>
                  {detailData.user.status === "active" ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 text-xs border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => suspendMutation.mutate(detailData.user._id)}
                      disabled={suspendMutation.isPending}
                    >
                      <Ban size={12} className="mr-1" />
                      Suspend Member
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => activateMutation.mutate(detailData.user._id)}
                      disabled={activateMutation.isPending}
                    >
                      <CheckCircle size={12} className="mr-1" />
                      Unsuspend Member
                    </Button>
                  )}
                </div>
              </div>

              {/* Sponsor Connection */}
              <div className="p-3 bg-secondary/20 rounded-xl border border-soft flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block uppercase">Sponsor / Referrer</span>
                  {detailData.user.sponsor ? (
                    <span className="font-semibold text-foreground">
                      {detailData.user.sponsor.name} ({detailData.user.sponsor.email})
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-medium">None (Direct Registration)</span>
                  )}
                </div>
                {detailData.user.sponsor && (
                  <Badge variant="outline" className="font-mono">{detailData.user.sponsor.referralCode}</Badge>
                )}
              </div>

              {/* Tabs Content */}
              <Tabs defaultValue="wallets" className="w-full">
                <TabsList className="grid grid-cols-3 bg-secondary">
                  <TabsTrigger value="wallets" className="text-xs">Profile & Wallets</TabsTrigger>
                  <TabsTrigger value="mlm" className="text-xs">MLM Business & Legs</TabsTrigger>
                  <TabsTrigger value="financials" className="text-xs">Portfolios & Transactions</TabsTrigger>
                </TabsList>

                {/* Wallets Tab */}
                <TabsContent value="wallets" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Deposit Wallet", val: detailData.wallet?.deposit || 0, icon: Wallet, color: "text-primary" },
                      { label: "Admin Allocated Balance", val: detailData.wallet?.adminAllocated || 0, icon: Wallet, color: "text-[#f3ba2f]" },
                      { label: "ROI Earnings", val: detailData.wallet?.roi || 0, icon: Wallet, color: "text-profit" },
                      { label: "Referral Bonus", val: detailData.wallet?.referral || 0, icon: Users, color: "text-profit" },
                      { label: "Weekly VIP Salary", val: detailData.wallet?.salary || 0, icon: Wallet, color: "text-gold" },
                      { label: "Achievement rewards", val: detailData.wallet?.achievement || 0, icon: Trophy, color: "text-gold" },
                      { label: "Bonus Received", val: detailData.wallet?.bonusReceived || 0, icon: Wallet, color: "text-primary" },
                      { label: "Bonus Transferable", val: detailData.wallet?.bonusTransferable || 0, icon: Wallet, color: "text-muted-foreground" },
                      { label: "Withdrawal hold/total", val: detailData.wallet?.withdrawal || 0, icon: ArrowDownToLine, color: "text-destructive" },
                    ].map((w, i) => {
                      const Icon = w.icon;
                      return (
                        <div key={i} className="p-3 bg-secondary/35 border border-soft rounded-xl flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${w.color}`} />
                          <div>
                            <span className="text-[10px] text-muted-foreground block font-medium leading-none">{w.label}</span>
                            <span className="font-bold text-foreground font-mono text-sm leading-none mt-1 block">
                              ${Number(w.val).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>


                </TabsContent>

                {/* MLM Business & Legs Tab */}
                <TabsContent value="mlm" className="mt-4 space-y-4">
                  {/* Summary Business stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Self Investment", val: detailData.businessReport?.selfInvestment || 0 },
                      { label: "Direct Referrals Business", val: detailData.businessReport?.directBusiness || 0 },
                      { label: "5-Level Downline Business", val: detailData.businessReport?.fiveLevelBusiness || 0 },
                      { label: "Total Network Business", val: detailData.businessReport?.totalTeamBusiness || 0 },
                    ].map((b, i) => (
                      <div key={i} className="p-3 rounded-xl bg-secondary/30 border border-soft text-center">
                        <span className="text-[10px] text-muted-foreground block font-medium leading-tight">{b.label}</span>
                        <span className="text-sm font-extrabold text-foreground font-mono block mt-1">
                          ${Number(b.val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Legs Volume Reports */}
                  <div className="space-y-2 mt-4">
                    <h4 className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                      <Network className="h-4 w-4 text-primary" />
                      Qualifying Leg Volumes (Active downline legs)
                    </h4>
                    {detailData.legs?.length === 0 ? (
                      <div className="text-center py-4 bg-secondary/20 rounded-xl border border-soft text-muted-foreground">
                        No legs registered for this member yet.
                      </div>
                    ) : (
                      <div className="border border-soft rounded-xl overflow-hidden bg-secondary/20">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Leg Referral</TableHead>
                              <TableHead>Leg Ref Code</TableHead>
                              <TableHead>Business Volume</TableHead>
                              <TableHead className="text-right">Leg Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detailData.legs?.map((leg: any, idx: number) => (
                              <TableRow key={leg._id}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-semibold">{leg.legUser?.name || "Deleted User"}</span>
                                    <span className="text-[9px] text-muted-foreground">{leg.legUser?.email || ""}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono">{leg.legUser?.referralCode || "-"}</TableCell>
                                <TableCell className="font-mono font-bold text-primary">
                                  ${Number(leg.legBusinessVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right">
                                  {leg.isActive ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[9px]">Active Leg</Badge>
                                  ) : (
                                    <Badge className="bg-muted text-muted-foreground border-0 text-[9px]">Inactive Leg</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Portfolios & Transactions Tab */}
                <TabsContent value="financials" className="mt-4 space-y-4">
                  {/* Investments list */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs text-foreground">Active Packages Portfolio</h4>
                    {detailData.investments?.length === 0 ? (
                      <div className="text-center py-4 bg-secondary/20 rounded-xl border border-soft text-muted-foreground">
                        No active package investments found.
                      </div>
                    ) : (
                      <div className="border border-soft rounded-xl overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Package Name</TableHead>
                              <TableHead>Principal Investment</TableHead>
                              <TableHead>Current ROI</TableHead>
                              <TableHead>Earned ROI</TableHead>
                              <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detailData.investments?.map((inv: any) => (
                              <TableRow key={inv._id}>
                                <TableCell className="font-semibold">
                                  <div className="flex flex-col items-start gap-1">
                                    <span>{inv.package?.name || "Standard Package"}</span>
                                    {inv.packageType === "Admin Funded Package" && (
                                      <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[8px] uppercase tracking-wider font-extrabold py-0.5 px-1.5">
                                        Admin Funded
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono font-semibold">${Number(inv.amount || 0).toFixed(2)}</TableCell>
                                <TableCell className="font-mono">{inv.currentRoi}% Daily</TableCell>
                                <TableCell className="font-mono text-profit">${Number(inv.totalRoiEarned || 0).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <Badge className={inv.status === "active" ? "bg-emerald-500/10 text-emerald-500 border-0" : "bg-muted text-muted-foreground border-0"}>
                                    {inv.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Deposits */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-xs flex items-center gap-1 text-foreground">
                        <Receipt className="h-3.5 w-3.5 text-primary" />
                        Recent Deposits
                      </h4>
                      {detailData.recentDeposits?.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground p-3 bg-secondary/15 rounded-xl border border-soft text-center">
                          No recent deposit records.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {detailData.recentDeposits?.map((d: any) => (
                            <div key={d._id} className="p-2 border border-soft bg-secondary/10 rounded-lg flex justify-between items-center">
                              <div>
                                <span className="font-semibold block font-mono text-[10px]">${Number(d.amount || 0).toFixed(2)} ({d.currency})</span>
                                <span className="text-[9px] text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</span>
                              </div>
                              <Badge className={d.status === "approved" ? "bg-emerald-500/10 text-emerald-500 border-0 text-[9px]" : "bg-amber-500/10 text-amber-500 border-0 text-[9px]"}>
                                {d.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Withdrawals */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-xs flex items-center gap-1 text-destructive">
                        <ArrowDownToLine className="h-3.5 w-3.5 text-destructive" />
                        Recent Withdrawals
                      </h4>
                      {detailData.recentWithdrawals?.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground p-3 bg-secondary/15 rounded-xl border border-soft text-center">
                          No recent withdrawal records.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {detailData.recentWithdrawals?.map((w: any) => (
                            <div key={w._id} className="p-2 border border-soft bg-secondary/10 rounded-lg flex justify-between items-center">
                              <div>
                                <span className="font-semibold block font-mono text-[10px]">${Number(w.amount || 0).toFixed(2)}</span>
                                <span className="text-[9px] text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</span>
                              </div>
                              <Badge className={w.status === "approved" ? "bg-emerald-500/10 text-emerald-500 border-0 text-[9px]" : "bg-amber-500/10 text-amber-500 border-0 text-[9px]"}>
                                {w.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
