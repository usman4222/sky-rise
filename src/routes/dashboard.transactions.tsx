import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { transactions } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/transactions")({ component: TxPage });

const filters = ["All", "ROI", "Referral", "Bonus", "Transfer", "VIP Salary", "Achievement Reward", "Withdrawal", "Investment"];

function TxPage() {
  const [filter, setFilter] = useState("All");
  const rows = filter === "All" ? transactions : transactions.filter((t) => t.type === filter);
  return (
    <DashboardLayout title="Transactions">
      <Card className="border-soft shadow-card">
        <CardContent className="p-5">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="flex w-full flex-wrap h-auto justify-start gap-1 bg-secondary">
              {filters.map((f) => <TabsTrigger key={f} value={f} className="text-xs">{f}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead>
                <TableHead>Wallet</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell>{t.date}</TableCell>
                    <TableCell><Badge className="bg-primary/10 text-primary border-0">{t.type}</Badge></TableCell>
                    <TableCell className={t.amount >= 0 ? "text-profit font-semibold" : "text-destructive font-semibold"}>
                      {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount)}
                    </TableCell>
                    <TableCell>{t.wallet}</TableCell>
                    <TableCell><Badge className="bg-secondary text-foreground border-0">{t.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
