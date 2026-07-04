import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lock, Unlock, Users, Wallet, DollarSign } from "lucide-react";
import { GearSpinner } from "@/components/gear-loader";
import { useAuthStore } from "@/store/authStore";
import { networkApi } from "@/lib/api-network";
import { StatCard } from "@/components/stat-card";

export const Route = createFileRoute("/dashboard/levels")({ component: LevelsPage });

function LevelsPage() {
  const { user, fetchProfile } = useAuthStore();
  const [openDialogId, setOpenDialogId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const unlockedLevels = user?.unlockedLevels || [1];
  const bonusActivation = user?.wallets?.bonusActivation || 0;
  const depositBalance = user?.wallets?.deposit || 0;

  // Fetch downline stats
  const { data: downlineData } = useQuery({
    queryKey: ["downline"],
    queryFn: () => networkApi.getDownline(),
    refetchOnWindowFocus: false,
  });

  const activeDirectReferralsCount = downlineData?.activeDirectReferralsCount || 0;

  const unlockMutation = useMutation({
    mutationFn: (level: number) => networkApi.unlockLevel({ level }),
    onSuccess: () => {
      toast.success("Level unlocked successfully!");
      setOpenDialogId(null);
      queryClient.invalidateQueries({ queryKey: ["downline"] });
      fetchProfile();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to unlock level");
    }
  });

  const displayLevels = [
    { level: 1, income: 8, requirement: "Automatically open" },
    { level: 2, income: 4, requirement: "1 Direct Active Member" },
    { level: 3, income: 4, requirement: "Another Direct Active Member (Total 2)" },
    { level: 4, income: 3, requirement: "Another Direct Active Member (Total 3)" },
    { level: 5, income: 2, requirement: "Another Direct Active Member (Total 4)" },
    { level: 6, income: 2, requirement: "Another Direct Active Member (Total 5)" },
    { level: 7, income: 2, requirement: "Another Direct Active Member (Total 6)" },
    { level: 8, income: 2, requirement: "Another Direct Active Member (Total 7)" },
    { level: 9, income: 2, requirement: "Another Direct Active Member (Total 8)" },
    { level: 10, income: 2, requirement: "Another Direct Active Member (Total 9)" },
  ].map(l => {
    const isUnlocked = unlockedLevels.includes(l.level);
    const isPrevUnlocked = unlockedLevels.includes(l.level - 1);
    
    const standardFee = 0;
    const maxBonusPaid = 0;
    const realPaid = 0;
    const hasEnoughCash = true;

    const requiredActiveDirects = l.level - 1;
    const hasEnoughReferrals = activeDirectReferralsCount >= requiredActiveDirects;
    const neededReferrals = requiredActiveDirects - activeDirectReferralsCount;

    // Can only unlock if not already unlocked, previous level is unlocked, and has enough direct active members
    const canUnlock = !isUnlocked && isPrevUnlocked && hasEnoughReferrals;

    let buttonText = "Unlock Level";
    if (!isPrevUnlocked) {
      buttonText = `Unlock L${l.level - 1} First`;
    } else if (!hasEnoughReferrals) {
      buttonText = `Sponsor ${neededReferrals} More Active Direct${neededReferrals > 1 ? "s" : ""}`;
    }

    return {
      ...l,
      unlocked: isUnlocked,
      isPrevUnlocked,
      hasEnoughReferrals,
      neededReferrals,
      requiredActiveDirects,
      canUnlock,
      buttonText,
      bonusPaid: maxBonusPaid,
      realPaid,
      hasEnoughCash
    };
  });

  return (
    <DashboardLayout title="Level Income">
      <Card className="border-soft shadow-card bg-primary-gradient text-primary-foreground">
        <CardContent className="p-6">
          <div className="text-xs opacity-85">Total Level Distribution</div>
          <div className="text-3xl font-bold">31% of team ROI earnings</div>
          <p className="mt-1 text-sm opacity-85">Unlock deeper downline levels (up to L10) to expand your referral ROI commission potential.</p>
        </CardContent>
      </Card>

      {/* Top Stat Cards Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard 
          icon={Users} 
          label="Active Direct Referrals" 
          value={activeDirectReferralsCount} 
          subtitle="Counted for Level activations"
          accent="primary" 
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {displayLevels.map((l) => (
          <Card 
            key={l.level} 
            className={`glass-card-hover border-glass-border shadow-soft transition-all duration-300 flex flex-col justify-between ${
              l.unlocked ? "bg-white/95 dark:bg-card/95" : "bg-secondary/40 dark:bg-secondary/10 backdrop-blur-xs"
            }`}
          >
            <CardContent className="p-3.5 sm:p-5 flex flex-col justify-between h-full flex-1">
              <div>
                <div className="flex items-center justify-between gap-1">
                  {l.unlocked ? (
                    <Badge className="px-1.5 py-0.5 rounded-md text-[10px] border-0 font-semibold bg-profit/10 text-profit flex items-center gap-0.5">
                      <Unlock className="h-2.5 w-2.5" />
                      Unlocked
                    </Badge>
                  ) : l.canUnlock ? (
                    <Badge className="px-1.5 py-0.5 rounded-md text-[10px] border border-primary/20 font-semibold bg-primary/15 text-primary flex items-center gap-0.5 animate-pulse">
                      <Lock className="h-2.5 w-2.5" />
                      Ready
                    </Badge>
                  ) : (
                    <Badge className="px-1.5 py-0.5 rounded-md text-[10px] border-0 font-semibold bg-muted text-muted-foreground/85 flex items-center gap-0.5">
                      <Lock className="h-2.5 w-2.5" />
                      Locked
                    </Badge>
                  )}
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider">L{l.level}</div>
                </div>
                
                <div className="mt-2.5 flex flex-col">
                  <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">{l.income}%</div>
                  <div className="text-[9px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">Level Income</div>
                </div>
                
                <p className="mt-2.5 text-[10px] sm:text-xs text-muted-foreground/90 leading-tight min-h-[40px] flex items-center">
                  {l.requirement}
                </p>
              </div>
              
              {!l.unlocked && (
                <Dialog open={openDialogId === l.level} onOpenChange={(open) => setOpenDialogId(open ? l.level : null)}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="mt-3.5 w-full bg-primary-gradient text-primary-foreground text-[10px] sm:text-xs font-bold rounded-xl h-9 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer whitespace-normal py-1"
                      disabled={!l.canUnlock}
                    >
                      {l.buttonText}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Unlock Level {l.level}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2 text-sm text-foreground">
                      <p className="text-muted-foreground text-center">
                        Are you sure you want to unlock Level {l.level}?
                      </p>
                      <div className="rounded-2xl bg-secondary/65 border border-glass-border p-4.5 space-y-2.5 shadow-sm">
                        <div className="flex justify-between items-start text-xs">
                          <span className="text-muted-foreground font-semibold uppercase tracking-wider">Unlock Condition</span>
                          <span className="font-bold text-right text-foreground max-w-[220px]">{l.requirement}</span>
                        </div>
                        <div className="flex justify-between border-t border-glass-border pt-2.5 items-center text-xs">
                          <span className="text-muted-foreground font-semibold uppercase tracking-wider">Cost to Unlock</span>
                          <span className="font-extrabold text-profit uppercase tracking-wider">Free</span>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        className="w-full bg-primary-gradient text-primary-foreground"
                        disabled={unlockMutation.isPending}
                        onClick={() => unlockMutation.mutate(l.level)}
                      >
                        {unlockMutation.isPending && unlockMutation.variables === l.level ? (
                          <>
                            <GearSpinner className="mr-2 h-4 w-4" />
                            Unlocking...
                          </>
                        ) : (
                          "Confirm Unlock"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
