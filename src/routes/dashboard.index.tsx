import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Wallet, TrendingUp, ArrowDownToLine, Users, Gift, Crown,
  Copy, Trophy, Timer
} from "lucide-react";
import { stats, user, vipLegs, roiHistory } from "@/lib/mock-data";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard/")({ component: DashboardHome });

function DashboardHome() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Wallet} label="Total Investment" value={`$${stats.totalInvestment.toLocaleString()}`} accent="primary" />
        <StatCard icon={TrendingUp} label="Today's ROI" value={`$${stats.todayRoi}`} trend="+1.2% today" accent="profit" />
        <StatCard icon={ArrowDownToLine} label="Withdrawal Balance" value={`$${stats.withdrawalBalance}`} accent="primary" />
        <StatCard icon={Users} label="Direct Referral" value={`$${stats.directReferralIncome}`} accent="profit" />
        <StatCard icon={Gift} label="Team Bonus" value={`$${stats.teamBonus}`} accent="gold" />
        <StatCard icon={Crown} label="VIP Rank" value={stats.vipRank} accent="gold" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Active investment */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Investment</CardTitle>
            <Badge>Active</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Package</div><div className="font-semibold text-foreground mt-1">Premium Share Investment</div></div>
              <div><div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Investment Amount</div><div className="font-semibold text-foreground mt-1">$1,250</div></div>
              <div><div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Current ROI</div><div className="font-semibold text-emerald-500 mt-1">1.2% Daily</div></div>
              <div><div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Next ROI Increase</div><div className="font-semibold text-foreground mt-1">In 4 Days</div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Progress to Max ROI (2.0%)</span><span>60%</span></div>
              <Progress value={60} className="mt-2 h-2" />
            </div>
            <div className="flex items-center justify-between rounded-full glass-pill px-4 py-3">
              <div className="text-sm font-medium">Auto Reinvest</div>
              <Switch defaultChecked />
            </div>
            <Button asChild className="glass-button-primary w-full"><Link to="/dashboard/investments">Manage Investment</Link></Button>
          </CardContent>
        </Card>

        {/* Daily ROI claim */}
        <Card>
          <CardHeader><CardTitle>Daily ROI Claim</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 p-6 text-white shadow-soft">
              <div className="text-xs opacity-85 font-medium">Today's ROI</div>
              <div className="text-3xl font-bold mt-1">$18.50</div>
              <div className="mt-2 flex items-center gap-1 text-xs opacity-85"><Timer size={14} /> 18h 24m remaining</div>
            </div>
            <Button className="w-full glass-button-primary">Claim Daily ROI</Button>
            <p className="text-xs text-muted-foreground">Auto reinvest is ON — your daily ROI is being automatically reinvested.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* ROI chart */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>ROI History (14 days)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={roiHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: 16, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.5)", backdropFilter: "blur(10px)" }} />
                  <Line type="monotone" dataKey="amount" stroke="#7b5cff" strokeWidth={3} dot={{ r: 4, fill: "#7b5cff" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Referral link */}
        <Card>
          <CardHeader><CardTitle>Referral Link</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-full glass-pill px-4 py-2.5 border border-glass-border">
              <input readOnly value={user.referralLink} className="flex-1 bg-transparent text-xs outline-none text-foreground" />
              <Button size="icon" variant="ghost" className="rounded-full h-8 w-8"><Copy size={14} /></Button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl glass-pill px-3 py-3"><div className="text-xs text-muted-foreground font-medium">Direct</div><div className="font-bold text-foreground mt-1">12</div></div>
              <div className="rounded-xl glass-pill px-3 py-3"><div className="text-xs text-muted-foreground font-medium">Active</div><div className="font-bold text-foreground mt-1">9</div></div>
              <div className="rounded-xl glass-pill px-3 py-3"><div className="text-xs text-muted-foreground font-medium">Income</div><div className="font-bold text-emerald-500 mt-1">$96</div></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* VIP Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>VIP Progress</CardTitle>
            <Badge><Crown className="mr-1 h-3 w-3" /> VIP 2 → VIP 3</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Requirement: 5 legs with $4,000 business each.</p>
            {vipLegs.map((l) => {
              const pct = Math.min(100, (l.current / l.target) * 100);
              const done = l.current >= l.target;
              return (
                <div key={l.leg}>
                  <div className="flex justify-between text-xs"><span className="font-medium">Leg {l.leg}</span><span className={done ? "text-emerald-500 font-semibold" : "text-muted-foreground"}>${l.current.toLocaleString()} / ${l.target.toLocaleString()}{done && " ✓"}</span></div>
                  <Progress value={pct} className="mt-2 h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Achievement */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Achievement Progress</CardTitle>
            <Badge><Trophy className="mr-1 h-3 w-3" /> Golden Spark</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Current 5-Level Business</div>
              <div className="text-2xl font-bold mt-1">$13,600</div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Next: Platinum Spark — $20,000</span><span className="font-medium">68%</span></div>
              <Progress value={68} className="mt-2 h-2" />
            </div>
            <div className="rounded-xl glass-pill p-4 bg-gradient-to-r from-amber-300/30 to-orange-400/30 border border-amber-300/50">
              <div className="text-xs text-muted-foreground font-medium">Upcoming Reward</div>
              <div className="text-lg font-bold text-amber-600 mt-1">$600</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
