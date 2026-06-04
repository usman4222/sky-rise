import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { financeApi } from "@/lib/api-finance";
import { SimplePagination } from "@/components/simple-pagination";

export const Route = createFileRoute("/dashboard/transactions")({ component: TxPage });

const filters = ["All", "ROI", "Referral", "Bonus", "Transfer", "VIP Salary", "Achievement Reward", "Withdrawal"];

function TxPage() {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);

  const { data: ledgerData, isLoading, error } = useQuery({
    queryKey: ["ledgerHistory", page],
    queryFn: () => financeApi.getLedgerHistory(page, 10),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Transactions">
        <div className="flex h-[350px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Transactions">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
          Failed to load transaction ledger history. Please try again.
        </div>
      </DashboardLayout>
    );
  }

  const rawLogs = ledgerData?.history || [];

  // Map backend model to UI structure
  const formattedLogs = rawLogs.map((item: any) => {
    let typeLabel = "System";
    const category = item.category || "";
    const wType = item.walletType || "";

    // Type classification
    if (wType === "roi") {
      typeLabel = "ROI";
    } else if (wType === "referral") {
      typeLabel = "Referral";
    } else if (wType === "salary") {
      typeLabel = "VIP Salary";
    } else if (wType === "achievement") {
      typeLabel = "Achievement Reward";
    } else if (wType === "withdrawal") {
      typeLabel = "Withdrawal";
    } else if (category.toLowerCase().includes("transfer")) {
      typeLabel = "Transfer";
    } else if (wType.toLowerCase().includes("bonus") || wType === "freeRegBonus") {
      typeLabel = "Bonus";
    }

    const isDebit = item.type === "debit";
    const signedAmount = isDebit ? -item.amount : item.amount;

    return {
      id: item._id,
      date: new Date(item.createdAt).toLocaleDateString(),
      time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: typeLabel,
      amount: signedAmount,
      wallet: wType.charAt(0).toUpperCase() + wType.slice(1),
      status: "Completed",
      notes: item.description
    };
  });

  // Filter logs based on selection
  const rows = filter === "All" 
    ? formattedLogs 
    : formattedLogs.filter((t: any) => t.type === filter);

  return (
    <DashboardLayout title="Transactions">
      <Card className="border-soft shadow-card">
        <CardContent className="p-5">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="flex w-full flex-wrap h-auto justify-start gap-1 bg-secondary">
              {filters.map((f) => (
                <TabsTrigger key={f} value={f} className="text-xs">
                  {f}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                      No matching transaction records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{t.date}</div>
                        <div className="text-[10px] text-muted-foreground">{t.time}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary/10 text-primary border-0 font-medium">
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={t.amount >= 0 ? "text-profit font-semibold" : "text-destructive font-semibold"}>
                        {t.amount >= 0 ? "+" : ""}${t.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="capitalize text-xs font-medium text-muted-foreground">
                        {t.wallet}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-profit/10 text-profit border-0 text-[10px]">
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-sm whitespace-normal">
                        {t.notes}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <SimplePagination
            currentPage={page}
            totalPages={ledgerData?.pagination?.totalPages || 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
