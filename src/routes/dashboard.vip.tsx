import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { Crown, Trophy, Target, Layers } from "lucide-react";
import { vipRanks, vipLegs } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/vip")({ component: VipDash });

const salaryHistory = [
  { week: "Week 21", rank: "VIP 2", amount: 100, status: "Paid" },
  { week: "Week 20", rank: "VIP 2", amount: 100, status: "Paid" },
  { week: "Week 19", rank: "VIP 1", amount: 50, status: "Paid" },
];

function VipDash() {
  return (
    <DashboardLayout title="VIP Salary">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Crown} label="Current VIP Rank" value="VIP 2" accent="gold" />
        <StatCard icon={Trophy} label="Weekly Salary" value="$100" accent="profit" />
        <StatCard icon={Target} label="Next Target" value="VIP 3" accent="primary" />
        <StatCard icon={Layers} label="Active Legs" value="2 / 5" accent="gold" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-soft shadow-card lg:col-span-2">
          <CardHeader><CardTitle>5-Leg Progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {vipLegs.map((l) => {
              const pct = Math.min(100, (l.current / l.target) * 100);
              const done = l.current >= l.target;
              return (
                <div key={l.leg}>
                  <div className="flex justify-between text-sm"><span>Leg {l.leg}</span><span className={done ? "text-profit font-semibold" : "text-muted-foreground"}>${l.current.toLocaleString()} / ${l.target.toLocaleString()}{done && " ✓"}</span></div>
                  <Progress value={pct} className="mt-1 h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-soft shadow-card">
          <CardHeader><CardTitle>Weekly Salary History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {salaryHistory.map((s) => (
              <div key={s.week} className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3 text-sm">
                <div><div className="font-medium">{s.week}</div><div className="text-xs text-muted-foreground">{s.rank}</div></div>
                <div className="text-right"><div className="font-semibold text-profit">${s.amount}</div><Badge className="bg-profit/10 text-profit border-0 text-[10px]">{s.status}</Badge></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-soft shadow-card">
        <CardHeader><CardTitle>VIP Rank Table</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Rank</TableHead><TableHead>Business / Leg</TableHead><TableHead>Weekly Salary</TableHead><TableHead>Monthly Approx</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {vipRanks.map((v) => (
                <TableRow key={v.rank}>
                  <TableCell className="font-semibold">{v.rank}</TableCell>
                  <TableCell>${v.leg.toLocaleString()}</TableCell>
                  <TableCell className="text-profit font-semibold">${v.weekly}</TableCell>
                  <TableCell>${v.monthly}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
