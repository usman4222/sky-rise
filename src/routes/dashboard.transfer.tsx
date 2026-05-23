import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/transfer")({ component: TransferPage });

const history = [
  { date: "2025-05-20", to: "SKY-49810", amt: 10, status: "Completed" },
  { date: "2025-05-12", to: "SKY-49911", amt: 5, status: "Completed" },
];

function TransferPage() {
  return (
    <DashboardLayout title="Transfer Bonus">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-soft shadow-card">
          <CardHeader><CardTitle>Transfer Bonus</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-1.5"><Label>Receiver User ID</Label><Input placeholder="SKY-XXXXX" /></div>
              <div className="space-y-1.5"><Label>Amount (USD)</Label><Input type="number" placeholder="0.00" /></div>
              <div className="space-y-1.5"><Label>Note (optional)</Label><Textarea placeholder="Add a note…" /></div>
              <Button className="w-full bg-primary-gradient text-primary-foreground">Send Transfer</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-soft shadow-card bg-gold/10 border-gold/30">
          <CardHeader><CardTitle>Transfer Rules</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Transfer allowed only within 5-level downline team.</p>
            <p>• Bonus balance cannot be withdrawn.</p>
            <p>• Received transfer balance can cover up to 10% of investment.</p>
            <p>• Platform rules apply.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-soft shadow-card">
        <CardHeader><CardTitle>Transfer History</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Receiver ID</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {history.map((h, i) => (
                <TableRow key={i}>
                  <TableCell>{h.date}</TableCell>
                  <TableCell className="font-mono text-xs">{h.to}</TableCell>
                  <TableCell>${h.amt}</TableCell>
                  <TableCell><Badge className="bg-profit/10 text-profit border-0">{h.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
