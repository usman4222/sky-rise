import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { Crown, Trophy, Target, Layers, Loader2 } from "lucide-react";
import { rewardsApi } from "@/lib/api-rewards";

export const Route = createFileRoute("/dashboard/vip")({ component: VipDash });

function VipDash() {
  const { data: vipData, isLoading, error } = useQuery({
    queryKey: ["vipStatus"],
    queryFn: () => rewardsApi.getVipStatus(),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <DashboardLayout title="VIP Salary">
        <div className="flex h-[350px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="VIP Salary">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
          Failed to load VIP Rank & Qualification progress. Please try again.
        </div>
      </DashboardLayout>
    );
  }

  const currentVipRank = vipData?.currentVipRank || 0;
  const weeklySalary = vipData?.weeklySalary || 0;
  const activeLegsCount = vipData?.activeLegsCount || 0;
  const legs = vipData?.legs || [];
  const vipRanks = vipData?.vipRanks || [];
  const salaryHistory = vipData?.salaryHistory || [];
  const nextRankTarget = vipData?.nextRankTarget || null;

  // Next target calculations
  const nextTargetName = nextRankTarget ? nextRankTarget.name : "Max VIP 5 Reached";
  const targetVolume = nextRankTarget ? nextRankTarget.requiredBusinessPerLeg : 16000;

  // Determine how many legs qualify for the next target
  const qualifiedLegsForNext = legs.filter(l => l.volume >= targetVolume).length;
  
  // Format top 5 legs progress. If there are less than 5 legs, fill with placeholders
  const displayLegs = [...legs];
  while (displayLegs.length < 5) {
    displayLegs.push({
      leg: displayLegs.length + 1,
      legUser: {
        id: `empty-${displayLegs.length}`,
        name: "Empty Leg (No sponsor yet)",
        email: ""
      },
      volume: 0
    });
  }
  const topFiveLegs = displayLegs.slice(0, 5);

  return (
    <DashboardLayout title="VIP Salary">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={Crown} 
          label="Current VIP Rank" 
          value={currentVipRank > 0 ? `VIP ${currentVipRank}` : "None"} 
          accent="gold" 
        />
        <StatCard 
          icon={Trophy} 
          label="Weekly Salary" 
          value={`$${weeklySalary}`} 
          accent="profit" 
        />
        <StatCard 
          icon={Target} 
          label="Next Target" 
          value={nextTargetName} 
          accent="primary" 
        />
        <StatCard 
          icon={Layers} 
          label="Qualified Legs" 
          value={nextRankTarget ? `${qualifiedLegsForNext} / 5` : `${activeLegsCount} Legs`} 
          accent="gold" 
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-soft shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle>5-Leg Progress (Target: ${targetVolume.toLocaleString()} per leg)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topFiveLegs.map((l, index) => {
              const pct = Math.min(100, (l.volume / targetVolume) * 100);
              const done = l.volume >= targetVolume;
              const isPlaceholder = l.legUser.id.startsWith("empty-");
              return (
                <div key={l.legUser.id || index}>
                  <div className="flex justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">Leg {index + 1}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {isPlaceholder ? l.legUser.name : `${l.legUser.name} (${l.legUser.email})`}
                      </span>
                    </div>
                    <span className={done ? "text-profit font-semibold align-bottom self-end text-xs" : "text-muted-foreground align-bottom self-end text-xs"}>
                      ${l.volume.toLocaleString()} / ${targetVolume.toLocaleString()}{done && " ✓"}
                    </span>
                  </div>
                  <Progress value={pct} className="mt-1 h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-soft shadow-card">
          <CardHeader><CardTitle>Weekly Salary History</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {salaryHistory.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No salary payouts received yet. Meet rank targets to unlock!
              </div>
            ) : (
              salaryHistory.map((s) => (
                <div key={s.week + s.date} className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">{s.week}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {s.rank} • {new Date(s.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-profit">${s.amount}</div>
                    <Badge className="bg-profit/10 text-profit border-0 text-[10px]">{s.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-soft shadow-card">
        <CardHeader><CardTitle>VIP Rank Table</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Business / Leg (Requires 5 Legs)</TableHead>
                <TableHead>Weekly Salary</TableHead>
                <TableHead>Monthly Approx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vipRanks.map((v) => {
                const isActiveRank = currentVipRank === v.level;
                return (
                  <TableRow key={v.rank} className={isActiveRank ? "bg-primary/5 font-semibold" : ""}>
                    <TableCell className="font-semibold flex items-center gap-1.5">
                      {v.rank} 
                      {isActiveRank && <Badge className="bg-gold-gradient text-gold-foreground border-0 text-[9px] py-0">Active</Badge>}
                    </TableCell>
                    <TableCell>${v.leg.toLocaleString()}</TableCell>
                    <TableCell className="text-profit font-semibold">${v.weekly}</TableCell>
                    <TableCell>${v.monthly.toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
