import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, CheckCircle2, Lock } from "lucide-react";
import { achievements } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/achievements")({ component: AchPage });

function AchPage() {
  const currentBusiness = 13600;
  return (
    <DashboardLayout title="Achievement Rewards">
      <Card className="border-soft shadow-card overflow-hidden">
        <div className="bg-primary-gradient p-6 text-primary-foreground">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs opacity-85">Current Rank</div>
              <div className="text-2xl font-bold">Golden Spark</div>
              <div className="mt-2 text-xs opacity-85">Current Business: ${currentBusiness.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-85">Next Target</div>
              <div className="text-lg font-semibold">Platinum Spark — $20,000</div>
              <div className="mt-1 text-xs opacity-85">Reward: $600</div>
            </div>
          </div>
          <Progress value={68} className="mt-4 h-2 bg-white/20" />
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {achievements.map((a, i) => {
          const status = a.business <= currentBusiness ? "achieved" : a.business <= 20000 ? "progress" : "locked";
          return (
            <Card key={a.name} className="border-soft shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold-gradient text-gold-foreground"><Trophy size={18} /></div>
                  {status === "achieved" && <Badge className="bg-profit/10 text-profit border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Achieved</Badge>}
                  {status === "progress" && <Badge className="bg-gold/15 text-gold border-0">In Progress</Badge>}
                  {status === "locked" && <Badge className="bg-muted text-muted-foreground border-0"><Lock className="h-3 w-3 mr-1" />Locked</Badge>}
                </div>
                <h3 className="mt-3 text-base font-semibold">{a.name}</h3>
                <div className="mt-2 text-xs text-muted-foreground">Business</div>
                <div className="text-sm font-bold">${a.business.toLocaleString()}</div>
                <div className="mt-2 text-xs text-muted-foreground">Reward</div>
                <div className="text-base font-bold text-profit">${a.reward.toLocaleString()}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
