import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { AlertTriangle, Wallet, Clock, CheckCheck, Coins } from "lucide-react";

export const Route = createFileRoute("/dashboard/withdrawals")({ component: WithdrawPage });

const history = [
  { date: "2025-05-18", amt: 120, method: "USDT (TRC20)", status: "Pending", tx: "0xabc123…" },
  { date: "2025-05-10", amt: 200, method: "USDT (TRC20)", status: "Completed", tx: "0x9f81b…" },
  { date: "2025-04-28", amt: 50, method: "Bank Transfer", status: "Completed", tx: "BT-4488" },
];

function WithdrawPage() {
  return (
    <DashboardLayout title="Withdrawals">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Withdrawal Balance" value="$245.80" accent="profit" />
        <StatCard icon={Clock} label="Pending Withdrawal" value="$120.00" accent="gold" />
        <StatCard icon={CheckCheck} label="Total Withdrawn" value="$1,420.00" accent="primary" />
        <StatCard icon={Coins} label="Capital Available" value="$1,250.00" accent="primary" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-soft shadow-card">
          <CardHeader><CardTitle>Withdrawal Request</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-1.5">
                <Label>Select Wallet</Label>
                <Select defaultValue="withdrawal">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="withdrawal">Withdrawal Balance</SelectItem>
                    <SelectItem value="capital">Capital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Amount</Label><Input type="number" placeholder="0.00" /></div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select defaultValue="usdt">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usdt">USDT (TRC20)</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Wallet Address / Account</Label><Input placeholder="TXxxxxxxxxxxxxxxxx" /></div>
              <Button className="w-full bg-primary-gradient text-primary-foreground">Submit Request</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-soft shadow-card">
          <CardHeader><CardTitle>Capital Withdrawal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertTitle>Early withdrawal warning</AlertTitle>
              <AlertDescription className="text-xs">Capital withdrawal may include 15% deduction and ROI reset depending on holding period.</AlertDescription>
            </Alert>
            <div className="rounded-xl bg-secondary p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Available Capital</span><span className="font-semibold">$1,250.00</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Estimated Deduction</span><span className="font-semibold text-destructive">- $187.50</span></div>
              <div className="flex justify-between border-t border-soft pt-2"><span>Estimated Payout</span><span className="font-bold text-primary">$1,062.50</span></div>
            </div>
            <Button variant="outline" className="w-full">Request Capital Withdrawal</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-soft shadow-card">
        <CardHeader><CardTitle>Withdrawal History</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead>
              <TableHead>Status</TableHead><TableHead>Transaction ID</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {history.map((h, i) => (
                <TableRow key={i}>
                  <TableCell>{h.date}</TableCell>
                  <TableCell className="font-semibold">${h.amt}</TableCell>
                  <TableCell>{h.method}</TableCell>
                  <TableCell><Badge className={h.status === "Pending" ? "bg-gold/15 text-gold border-0" : "bg-profit/10 text-profit border-0"}>{h.status}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{h.tx}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
