import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Eye, Check, X, AlertCircle } from "lucide-react";
import { GearSectionLoader } from "@/components/gear-loader";

import { adminApi } from "@/lib/api-admin";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { SimplePagination } from "@/components/simple-pagination";

export const Route = createFileRoute("/dashboard/admin/kyc")({ component: AdminKycPage });

function AdminKycPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [page, setPage] = useState<number>(1);
  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const { data, isLoading } = useQuery({
    queryKey: ["adminKyc", statusFilter, page],
    queryFn: async () => {
      const res = await adminApi.getKyc(
        statusFilter === "all" ? undefined : statusFilter,
        page,
        10
      );
      return {
        kycRecords: res.kycRecords || [],
        pagination: res.pagination
      };
    }
  });

  const kycRecords = data?.kycRecords || [];

  const processMutation = useMutation({
    mutationFn: (vars: { id: string; action: "approve" | "reject"; adminNotes?: string }) => 
      adminApi.processKyc(vars.id, { action: vars.action, adminNotes: vars.adminNotes }),
    onSuccess: () => {
      toast.success("KYC request processed successfully!");
      setIsDialogOpen(false);
      setSelectedKyc(null);
      setAdminNotes("");
      queryClient.invalidateQueries({ queryKey: ["adminKyc"] });
    },
    onError: (err) => toast.error(getFirebaseErrorMessage(err))
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-500 border-0 capitalize">Pending</Badge>;
      case "approved":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-0 capitalize">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive border-0 capitalize">Rejected</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0 capitalize">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout title="KYC Verification Queue">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              KYC Compliance Review
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Approve or reject customer identity submissions.</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold">Status Filter:</Label>
            <Select 
              value={statusFilter} 
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-soft shadow-card">
          <CardHeader><CardTitle>KYC Application Queue</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <GearSectionLoader text="Loading KYC Applications..." className="h-40" />
            ) : kycRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                No KYC verification records found for filter status "{statusFilter}".
              </div>
            ) : (
              <>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Document Number</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kycRecords.map((kyc: any) => (
                    <TableRow key={kyc._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">{kyc.user?.name || "Deleted User"}</span>
                          <span className="text-[10px] text-muted-foreground">{kyc.user?.email || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-xs font-medium">{kyc.documentType}</TableCell>
                      <TableCell className="font-mono text-xs">{kyc.documentNumber}</TableCell>
                      <TableCell className="text-xs">{new Date(kyc.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(kyc.status)}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isDialogOpen && selectedKyc?._id === kyc._id} onOpenChange={(o) => {
                          if (o) {
                            setSelectedKyc(kyc);
                            setAdminNotes(kyc.remarks || "");
                            setIsDialogOpen(true);
                          } else {
                            setIsDialogOpen(false);
                            setSelectedKyc(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
                              <Eye size={12} />
                              Review Documents
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md md:max-w-xl">
                            <DialogHeader>
                              <DialogTitle>Review KYC Application</DialogTitle>
                            </DialogHeader>
                            {selectedKyc && (
                              <div className="space-y-4 my-2 text-xs">
                                <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/50 rounded-xl">
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Customer Name</span>
                                    <span className="font-semibold text-foreground">{selectedKyc.user?.name}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Email</span>
                                    <span>{selectedKyc.user?.email}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Document Type</span>
                                    <span className="capitalize">{selectedKyc.documentType}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Document Number</span>
                                    <span className="font-mono">{selectedKyc.documentNumber}</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Uploaded Document Images</span>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="border border-soft rounded-xl overflow-hidden bg-secondary/30 p-2 text-center">
                                      <span className="block text-[10px] text-muted-foreground mb-1">Front Image</span>
                                      {selectedKyc.documentFrontUrl ? (
                                        <img src={selectedKyc.documentFrontUrl} alt="Doc Front" className="max-h-[140px] mx-auto rounded-lg object-contain bg-black/5" />
                                      ) : (
                                        <div className="h-[140px] flex items-center justify-center text-muted-foreground/60 text-[10px]">No image uploaded</div>
                                      )}
                                    </div>
                                    <div className="border border-soft rounded-xl overflow-hidden bg-secondary/30 p-2 text-center">
                                      <span className="block text-[10px] text-muted-foreground mb-1">Back Image (Optional)</span>
                                      {selectedKyc.documentBackUrl ? (
                                        <img src={selectedKyc.documentBackUrl} alt="Doc Back" className="max-h-[140px] mx-auto rounded-lg object-contain bg-black/5" />
                                      ) : (
                                        <div className="h-[140px] flex items-center justify-center text-muted-foreground/60 text-[10px]">No image uploaded</div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Admin Decision Notes / Remarks</Label>
                                  <Input 
                                    placeholder="Enter reason for approval or rejection notes..." 
                                    value={adminNotes} 
                                    onChange={(e) => setAdminNotes(e.target.value)} 
                                  />
                                </div>
                              </div>
                            )}
                            <DialogFooter className="flex gap-2 sm:justify-end">
                              {selectedKyc && selectedKyc.status === "pending" && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    className="h-8 text-xs border-destructive text-destructive hover:bg-destructive/10"
                                    onClick={() => processMutation.mutate({ id: selectedKyc._id, action: "reject", adminNotes })}
                                    disabled={processMutation.isPending}
                                  >
                                    <X size={14} className="mr-1" />
                                    Reject Application
                                  </Button>
                                  <Button 
                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => processMutation.mutate({ id: selectedKyc._id, action: "approve", adminNotes })}
                                    disabled={processMutation.isPending}
                                  >
                                    <Check size={14} className="mr-1" />
                                    Approve Identity
                                  </Button>
                                </>
                              )}
                              {selectedKyc && selectedKyc.status !== "pending" && (
                                <Button variant="outline" className="h-8 text-xs" onClick={() => setIsDialogOpen(false)}>Close Review</Button>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <SimplePagination
                currentPage={page}
                totalPages={data?.pagination?.totalPages || 1}
                onPageChange={setPage}
              />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
