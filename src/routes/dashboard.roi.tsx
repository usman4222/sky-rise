import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Timer } from "lucide-react";
import { roiHistory } from "@/lib/mock-data";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard/roi")({ component: RoiPage });

const rows = roiHistory.slice().reverse().map((r, i) => ({
  date: `2025-05-${22 - i}`,
  pkg: "Premium Share",
  pct: "1.2%",
  amt: r.amount,
  status: i === 0 ? "Pending" : "Claimed",
  time: i === 0 ? "—" : "Auto-reinvested",
}));

function RoiPage() {
  return (
    <DashboardLayout title="Daily ROI">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-soft shadow-card lg:col-span-1">
          <CardContent className="p-6">
            <div className="rounded-xl bg-profit-gradient p-5 text-white">
              <div className="text-xs opacity-85">Today's ROI</div>
              <div className="text-3xl font-bold">$18.50</div>
              <div className="mt-2 text-xs opacity-85">Current ROI: 1.2%</div>
              <div className="mt-1 flex items-center gap-1 text-xs opacity-85"><Timer size={12} /> 18h 24m remaining</div>
            </div>
            <Button className="mt-4 w-full bg-primary-gradient text-primary-foreground">Claim Daily ROI</Button>
            <Alert className="mt-4 border-gold/30 bg-gold/10">
              <AlertTriangle className="h-4 w-4 text-gold" />
              <AlertTitle>Manual claim window</AlertTitle>
              <AlertDescription className="text-xs">Manual ROI must be claimed within 24 hours or it may expire.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="border-soft shadow-card lg:col-span-2">
          <CardHeader><CardTitle>ROI History</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={roiHistory}>
                  <defs>
                    <linearGradient id="r" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAF1FB" />
                  <XAxis dataKey="day" fontSize={11} stroke="#64748B" />
                  <YAxis fontSize={11} stroke="#64748B" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DDE8F5" }} />
                  <Area type="monotone" dataKey="amount" stroke="#2563EB" fill="url(#r)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-soft shadow-card">
        <CardHeader><CardTitle>ROI Transactions</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Package</TableHead><TableHead>ROI %</TableHead>
              <TableHead>ROI Amount</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.pkg}</TableCell>
                  <TableCell>{r.pct}</TableCell>
                  <TableCell className="font-semibold text-profit">${r.amt}</TableCell>
                  <TableCell><Badge className={r.status === "Pending" ? "bg-gold/15 text-gold border-0" : "bg-profit/10 text-profit border-0"}>{r.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
