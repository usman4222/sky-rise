import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lock, Unlock } from "lucide-react";
import { levels } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/levels")({ component: LevelsPage });

function LevelsPage() {
  return (
    <DashboardLayout title="Level Income">
      <Card className="border-soft shadow-card bg-primary-gradient text-primary-foreground">
        <CardContent className="p-6">
          <div className="text-xs opacity-85">Total Level Distribution</div>
          <div className="text-3xl font-bold">31% of team ROI earnings</div>
          <p className="mt-1 text-sm opacity-85">Unlock additional levels to expand your earning potential.</p>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {levels.map((l) => (
          <Card key={l.level} className={`border-soft shadow-card ${l.unlocked ? "bg-white" : "bg-secondary"}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <Badge className={l.unlocked ? "bg-profit/10 text-profit border-0" : "bg-muted text-muted-foreground border-0"}>
                  {l.unlocked ? <Unlock className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
                  {l.unlocked ? "Unlocked" : "Locked"}
                </Badge>
                <div className="text-xs text-muted-foreground">L{l.level}</div>
              </div>
              <div className="mt-3 text-2xl font-bold">{l.income}%</div>
              <div className="text-xs text-muted-foreground">Level Income</div>
              <p className="mt-3 text-xs text-muted-foreground">{l.requirement}</p>
              {!l.unlocked && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="mt-4 w-full bg-primary-gradient text-primary-foreground">Unlock Level</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Unlock Level {l.level}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2 text-sm">
                      <div className="rounded-xl bg-secondary p-4 space-y-2">
                        <div className="flex justify-between"><span className="text-muted-foreground">Requirement</span><span>{l.requirement}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Activation Fee</span><span className="font-semibold">$5.00</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Team Bonus Used (50%)</span><span className="font-semibold">$2.50</span></div>
                        <div className="flex justify-between border-t border-soft pt-2"><span>Real Payment</span><span className="font-bold text-primary">$2.50</span></div>
                      </div>
                    </div>
                    <DialogFooter><Button className="w-full bg-primary-gradient text-primary-foreground">Confirm Unlock</Button></DialogFooter>
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
