import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Share2 } from "lucide-react";
import { directReferrals, user } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/team")({ component: TeamPage });

function TeamPage() {
  return (
    <DashboardLayout title="Referral Team">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-soft shadow-card lg:col-span-2">
          <CardHeader><CardTitle>Your Referral Link</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-soft bg-secondary p-2.5">
              <input readOnly value={user.referralLink} className="flex-1 bg-transparent text-sm outline-none" />
              <Button size="sm" variant="ghost"><Copy size={14} /></Button>
              <Button size="sm" className="bg-primary-gradient text-primary-foreground"><Share2 size={14} className="mr-1" /> Share</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { l: "Direct Referrals", v: "12" },
                { l: "Active Referrals", v: "9" },
                { l: "Total Team", v: "184" },
                { l: "Direct Income", v: "$96.00", profit: true },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-soft bg-white p-4">
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                  <div className={`text-lg font-bold ${s.profit ? "text-profit" : ""}`}>{s.v}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-soft shadow-card">
          <CardHeader><CardTitle>5-Level Team</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { l: 1, m: 12 }, { l: 2, m: 34 }, { l: 3, m: 56 },
              { l: 4, m: 48 }, { l: 5, m: 34 },
            ].map((x) => (
              <div key={x.l} className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
                <span className="text-sm">Level {x.l} Members</span>
                <Badge className="bg-primary/10 text-primary border-0">{x.m}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-soft shadow-card">
        <CardHeader><CardTitle>Direct Referrals</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>User ID</TableHead><TableHead>Name</TableHead><TableHead>Join Date</TableHead>
              <TableHead>Status</TableHead><TableHead>Total Investment</TableHead><TableHead>Income Generated</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {directReferrals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.join}</TableCell>
                  <TableCell><Badge className={r.status === "Active" ? "bg-profit/10 text-profit border-0" : "bg-muted text-muted-foreground border-0"}>{r.status}</Badge></TableCell>
                  <TableCell>${r.invested}</TableCell>
                  <TableCell className="text-profit font-semibold">${r.income}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
