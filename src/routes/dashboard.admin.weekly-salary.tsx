import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, Loader2, Check, X, ShieldAlert, AlertCircle, Eye } from "lucide-react";

import { newFlowsApi } from "@/lib/api-new-flows";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { SimplePagination } from "@/components/simple-pagination";

export const Route = createFileRoute("/dashboard/admin/weekly-salary")({
  component: AdminWeeklySalaryPage,
});

function AdminWeeklySalaryPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState<boolean>(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState<boolean>(false);
  const [page, setPage] = useState(1);

  const { data: requestsRes, isLoading } = useQuery({
    queryKey: ["adminSalaryRequests", statusFilter, page],
    queryFn: () => newFlowsApi.getAdminSalaryRequests(statusFilter === "all" ? undefined : statusFilter, page, 10),
  });

  const requests = requestsRes?.requests || [];

  const approveMutation = useMutation({
    mutationFn: newFlowsApi.approveSalaryRequest,
    onSuccess: () => {
      toast.success("Salary request approved and credited successfully!");
      setIsDetailsDialogOpen(false);
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ["adminSalaryRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (vars: { id: string; reason: string }) => 
      newFlowsApi.rejectSalaryRequest(vars.id, vars.reason),
    onSuccess: () => {
      toast.success("Salary request rejected.");
      setIsRejectDialogOpen(false);
      setIsDetailsDialogOpen(false);
      setRejectionReason("");
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ["adminSalaryRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err));
    },
  });

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

  return (
    <DashboardLayout title="Weekly Salary Approvals">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Weekly Salary Requests
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Audit user VIP qualifications and approve or reject weekly fixed salary claims.</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold">Status Filter:</Label>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-soft shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Salary Claims Queue</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <div className="flex h-36 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                No salary requests found for status "{statusFilter}".
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Rank Level</TableHead>
                    <TableHead>Claim Amount</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r: any) => (
                    <TableRow key={r._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">{r.user?.name || "Deleted User"}</span>
                          <span className="text-[10px] text-muted-foreground">{r.user?.email || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">VIP Rank {r.vipRank}</TableCell>
                      <TableCell className="font-bold text-xs text-profit">${r.salaryAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[10px] gap-1"
                          onClick={() => {
                            setSelectedRequest(r);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye size={12} />
                          Audit & Action
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <SimplePagination
              currentPage={page}
              totalPages={requestsRes?.pagination?.totalPages || 1}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>

        {/* Audit Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-md md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Audit Weekly Salary Claim</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4 my-2 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/50 rounded-xl">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">User Name</span>
                    <span className="font-semibold text-foreground">{selectedRequest.user?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Email</span>
                    <span>{selectedRequest.user?.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Claiming Rank Level</span>
                    <span className="font-bold text-primary">VIP Rank {selectedRequest.vipRank}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Claim Amount</span>
                    <span className="font-bold text-profit">${selectedRequest.salaryAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Qualification snapshot section */}
                <div className="space-y-2 p-3 border border-glass-border bg-glass-surface rounded-xl">
                  <div className="flex items-center gap-1 text-primary text-[10px] uppercase font-bold">
                    <ShieldAlert size={14} />
                    Qualification Snapshotted Leg Volumes
                  </div>
                  <div className="space-y-1.5 text-xs mt-1.5">
                    <div className="flex justify-between font-semibold border-b border-glass-border-soft pb-1 mb-1">
                      <span>Leg Referrals</span>
                      <span>Vol generated</span>
                    </div>
                    {selectedRequest.qualificationSnapshot?.qualifiedLegsDetails?.length > 0 ? (
                      selectedRequest.qualificationSnapshot.qualifiedLegsDetails.map((leg: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-muted-foreground">Leg #{idx + 1} (User: {leg.legUser || "Referral"})</span>
                          <span className="font-bold text-foreground">${(leg.volume || 0).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-2 text-muted-foreground text-[11px]">No snapshot leg data recorded.</div>
                    )}
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div className="p-3 bg-secondary/35 rounded-xl">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">User Notes</span>
                    <p className="text-foreground italic mt-0.5">{selectedRequest.notes}</p>
                  </div>
                )}

                {selectedRequest.status === "rejected" && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
                    <span className="block text-[10px] uppercase font-bold">Rejection Reason</span>
                    <p className="font-semibold mt-0.5">{selectedRequest.rejectionReason}</p>
                  </div>
                )}

                {selectedRequest.status === "pending" && (
                  <div className="flex gap-2 justify-end pt-2">
                    <Button 
                      variant="outline" 
                      className="h-9 text-xs border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => setIsRejectDialogOpen(true)}
                    >
                      <X size={14} className="mr-1" />
                      Reject Request
                    </Button>
                    <Button 
                      className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        if (confirm("Approve salary and credit user's wallet?")) {
                          approveMutation.mutate(selectedRequest._id);
                        }
                      }}
                      disabled={approveMutation.isPending}
                    >
                      <Check size={14} className="mr-1" />
                      Approve & Credit Salary
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Rejection Dialogue */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Reject Salary Claim</DialogTitle>
              <DialogDescription>Input the reason why this claim is rejected. This will be visible to the user.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-2 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="reject-reason">Rejection Reason</Label>
                <Input 
                  id="reject-reason" 
                  placeholder="e.g. Failed to maintain active leg requirements" 
                  value={rejectionReason} 
                  onChange={(e) => setRejectionReason(e.target.value)} 
                />
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                <Button 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      toast.error("Rejection reason is required");
                      return;
                    }
                    rejectMutation.mutate({ id: selectedRequest._id, reason: rejectionReason });
                  }}
                  disabled={rejectMutation.isPending}
                >
                  Confirm Rejection
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
