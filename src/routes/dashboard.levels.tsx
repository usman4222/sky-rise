import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lock, Unlock } from "lucide-react";
import { GearSpinner } from "@/components/gear-loader";
import { useAuthStore } from "@/store/authStore";
import { networkApi } from "@/lib/api-network";

export const Route = createFileRoute("/dashboard/levels")({ component: LevelsPage });

function LevelsPage() {
  const { user, fetchProfile } = useAuthStore();
  const [openDialogId, setOpenDialogId] = useState<number | null>(null);

  const unlockedLevels = user?.unlockedLevels || [1];
  const bonusActivation = user?.wallets?.bonusActivation || 0;
  const depositBalance = user?.wallets?.deposit || 0;

  const unlockMutation = useMutation({
    mutationFn: (level: number) => networkApi.unlockLevel({ level }),
    onSuccess: () => {
      toast.success("Level unlocked successfully!");
      setOpenDialogId(null);
      fetchProfile();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to unlock level");
    }
  });

  const displayLevels = [
    { level: 1, income: 8, requirement: "Automatically open" },
    { level: 2, income: 4, requirement: "1 direct active member + $5 activation fee" },
    { level: 3, income: 4, requirement: "1 additional direct active member + $5 activation fee" },
    { level: 4, income: 3, requirement: "2 direct active members + $5 fee" },
    { level: 5, income: 2, requirement: "3 direct active members + $5 fee" },
    { level: 6, income: 2, requirement: "3 direct active members + $5 fee" },
    { level: 7, income: 2, requirement: "4 direct active members + $5 fee" },
    { level: 8, income: 2, requirement: "4 direct active members + $5 fee" },
    { level: 9, income: 2, requirement: "5 direct active members + $5 fee" },
    { level: 10, income: 2, requirement: "5 direct active members + $5 fee" },
  ].map(l => {
    const isUnlocked = unlockedLevels.includes(l.level);
    const isPrevUnlocked = unlockedLevels.includes(l.level - 1);

    // Split pay calculations: $5 fee. Up to 50% paid via bonusActivation wallet.
    const standardFee = 5.0;
    const maxBonusPaid = Math.min(bonusActivation, standardFee * 0.5);
    const realPaid = standardFee - maxBonusPaid;
    const hasEnoughCash = depositBalance >= realPaid;

    return {
      ...l,
      unlocked: isUnlocked,
      canUnlock: !isUnlocked && isPrevUnlocked,
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {displayLevels.map((l) => (
          <Card key={l.level} className={`border-soft shadow-card ${l.unlocked ? "bg-white" : "bg-secondary"}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <Badge className={l.unlocked ? "bg-profit/10 text-profit border-0" : "bg-muted text-muted-foreground border-0"}>
                  {l.unlocked ? <Unlock className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
                  {l.unlocked ? "Unlocked" : "Locked"}
                </Badge>
                <div className="text-xs text-muted-foreground font-semibold">L{l.level}</div>
              </div>
              <div className="mt-3 text-2xl font-bold">{l.income}%</div>
              <div className="text-xs text-muted-foreground">Level Income</div>
              <p className="mt-3 text-xs text-muted-foreground min-h-[32px]">{l.requirement}</p>

              {!l.unlocked && (
                <Dialog open={openDialogId === l.level} onOpenChange={(open) => setOpenDialogId(open ? l.level : null)}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="mt-4 w-full bg-primary-gradient text-primary-foreground"
                      disabled={!l.canUnlock}
                    >
                      {l.canUnlock ? "Unlock Level" : `Locked (Unlock L${l.level - 1} first)`}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Unlock Level {l.level}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2 text-sm text-foreground">
                      <div className="rounded-xl bg-secondary p-4 space-y-2">
                        <div className="flex justify-between border-b border-glass-border pb-2">
                          <span className="text-muted-foreground">Requirement</span>
                          <span className="font-medium text-right max-w-[200px]">{l.requirement}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-muted-foreground">Activation Fee</span>
                          <span className="font-semibold">$5.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Activation Discount (50% max)</span>
                          <span className="font-semibold text-profit">-${l.bonusPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-soft pt-2">
                          <span className="font-semibold">Cash Fee (Deposit Wallet)</span>
                          <span className="font-bold text-primary">${l.realPaid.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground px-1">
                        * Your Deposit Wallet Balance: ${depositBalance.toFixed(2)} {!l.hasEnoughCash && <span className="text-destructive font-semibold">(Insufficient Cash)</span>}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        className="w-full bg-primary-gradient text-primary-foreground"
                        disabled={unlockMutation.isPending || !l.hasEnoughCash}
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
