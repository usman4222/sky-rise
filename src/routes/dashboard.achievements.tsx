import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, CheckCircle2, Lock } from "lucide-react";
import { GearSectionLoader } from "@/components/gear-loader";
import { rewardsApi } from "@/lib/api-rewards";

export const Route = createFileRoute("/dashboard/achievements")({ component: AchPage });

function AchPage() {
  const { data: achData, isLoading, error } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => rewardsApi.getAchievements(),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Achievement Rewards">
        <GearSectionLoader text="Loading Achievements..." className="h-[350px]" />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Achievement Rewards">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
          Failed to load Achievement rewards progress. Please try again.
        </div>
      </DashboardLayout>
    );
  }

  const currentBusiness = achData?.currentBusiness || 0;
  const currentRank = achData?.currentRank || "None";
  const achievements = achData?.achievements || [];
  const nextTarget = achData?.nextTarget || null;

  // Next target configurations
  const nextTargetName = nextTarget ? `${nextTarget.name} — $${nextTarget.business.toLocaleString()}` : "Max Rank Achieved";
  const nextTargetReward = nextTarget ? `$${nextTarget.reward.toLocaleString()}` : "-";
  const progressPercent = nextTarget ? Math.min(100, (currentBusiness / nextTarget.business) * 100) : 100;

  return (
    <DashboardLayout title="Achievement Rewards">
      <Card className="border-soft shadow-card overflow-hidden">
        <div className="bg-primary-gradient p-6 text-primary-foreground rounded-2xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs opacity-85">Current Rank</div>
              <div className="text-2xl font-bold">{currentRank}</div>
              <div className="mt-2 text-xs opacity-85">5-Level Business: ${currentBusiness.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-85">Next Target</div>
              <div className="text-lg font-semibold">{nextTargetName}</div>
              <div className="mt-1 text-xs opacity-85">Reward: {nextTargetReward}</div>
            </div>
          </div>
          <Progress value={progressPercent} className="mt-4 h-2 bg-white/20" />
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {achievements.map((a) => {
          const status = a.status;
          return (
            <Card key={a.name} className={`border-soft shadow-card ${status === 'achieved' ? 'bg-white' : 'bg-secondary'}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold-gradient text-gold-foreground">
                    <Trophy size={18} />
                  </div>
                  {status === "achieved" && (
                    <Badge className="bg-profit/10 text-profit border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Achieved
                    </Badge>
                  )}
                  {status === "progress" && (
                    <Badge className="bg-gold/15 text-gold border-0">
                      In Progress
                    </Badge>
                  )}
                  {status === "locked" && (
                    <Badge className="bg-muted text-muted-foreground border-0">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold">{a.name}</h3>
                <div className="mt-2 text-xs text-muted-foreground">Required Business</div>
                <div className="text-sm font-bold">${a.business.toLocaleString()}</div>
                <div className="mt-2 text-xs text-muted-foreground">Reward Bonus</div>
                <div className="text-base font-bold text-profit">${a.reward.toLocaleString()}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
