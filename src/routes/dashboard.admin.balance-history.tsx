import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Receipt, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { GearSectionLoader } from "@/components/gear-loader";
import { adminApi } from "@/lib/api-admin";
import { SimplePagination } from "@/components/simple-pagination";

export const Route = createFileRoute("/dashboard/admin/balance-history")({
  component: AdminBalanceHistoryPage,
});

function AdminBalanceHistoryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: historyData, isLoading } = useQuery({
    queryKey: ["adminBalanceHistory", search, page],
    queryFn: async () => {
      const res = await adminApi.getBalanceHistory(search || undefined, page, 10);
      return res;
    },
    refetchOnWindowFocus: false,
  });

  const history = historyData?.history || [];
  const totalPages = historyData?.pagination?.totalPages || 1;

  const formatAmount = (h: any) => {
    if (h.amountAdded > 0) {
      return (
        <span className="font-mono text-emerald-500 font-bold flex items-center gap-0.5">
          <ArrowUpRight size={12} /> +${h.amountAdded.toFixed(2)}
        </span>
      );
    }
    return (
      <span className="font-mono text-destructive font-bold flex items-center gap-0.5">
        <ArrowDownRight size={12} /> -${h.amountDeducted.toFixed(2)}
      </span>
    );
  };

  const getWalletBadge = (type: string) => {
    if (type === "adminAllocated") {
      return (
        <Badge className="bg-[#1e1b00] text-amber-500 border border-amber-500/20 text-[10px] font-bold">
          Admin Allocated
        </Badge>
      );
    }
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
        Deposit Wallet
      </Badge>
    );
  };

  return (
    <DashboardLayout title="Admin Balance Adjustments History">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Receipt className="h-5 w-5 text-primary" />
              Admin Balance History
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete audit log of all balance additions and deductions pushed by administrative users.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search reference, email, name..."
                className="pl-9 h-9 text-xs"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <Card className="border-soft shadow-card">
          <CardHeader>
            <CardTitle>Adjustment Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <GearSectionLoader text="Loading Adjustments Log..." className="h-40" />
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                No balance adjustments found.
              </div>
            ) : (
              <div className="px-6 pb-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-soft">
                      <TableHead>Reference / Date</TableHead>
                      <TableHead>User Account</TableHead>
                      <TableHead>Adjustment</TableHead>
                      <TableHead>Wallet Type</TableHead>
                      <TableHead>Balance Flow</TableHead>
                      <TableHead>Processed By</TableHead>
                      <TableHead>Remarks / Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h: any) => (
                      <TableRow key={h._id} className="border-b border-soft/50 hover:bg-secondary/15 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-semibold text-foreground">{h.referenceNumber}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(h.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-foreground">{h.fullName}</span>
                            <span className="text-[10px] text-muted-foreground">{h.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatAmount(h)}</TableCell>
                        <TableCell>{getWalletBadge(h.balanceType)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-[10px] font-mono">
                            <span className="text-muted-foreground">Before: ${h.balanceBefore.toFixed(2)}</span>
                            <span className="font-bold text-foreground">After: ${h.balanceAfter.toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-foreground">{h.adminName}</span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground font-medium">
                          {h.remarks || "No remarks"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="pt-4">
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
    </DashboardLayout>
  );
}
