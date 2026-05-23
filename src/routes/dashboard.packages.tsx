import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { packages } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/packages")({ component: PackagesDash });

function PackagesDash() {
  const [amount, setAmount] = useState(100);
  const bonus = Math.min(amount * 0.1, 45);
  const real = amount - bonus;
  return (
    <DashboardLayout title="Investment Packages">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {packages.map((p) => (
          <Card key={p.id} className="glass-card-hover transition-all">
            <CardContent className="p-6">
              <Badge className="glass-pill">{p.tag}</Badge>
              <h3 className="mt-3 text-lg font-semibold">{p.name}</h3>
              <div className="mt-1 text-sm text-muted-foreground">{p.range}</div>
              <div className="my-4 h-px bg-border" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Starting ROI</span><span className="font-semibold">{p.startRoi}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Max ROI</span><span className="font-semibold text-profit">{p.maxRoi}%</span></div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-profit" /> ROI grows every 10 days</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-profit" /> Auto reinvest available</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-profit" /> Manual claim available</div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-5 w-full glass-button-primary">Invest Now</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Invest in {p.name}</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Investment Amount (USD)</Label>
                      <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={p.min} max={p.max} />
                      <div className="text-xs text-muted-foreground">Range: {p.range}</div>
                    </div>
                    <div className="rounded-xl glass-panel p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Available Bonus</span><span className="font-semibold">$45.00</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Bonus Used (max 10%)</span><span className="font-semibold">${bonus.toFixed(2)}</span></div>
                      <div className="flex justify-between border-t border-soft pt-2"><span>Real Payment</span><span className="font-bold text-primary">${real.toFixed(2)}</span></div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg p-3 glass-panel">
                      <Label className="text-sm">Auto Reinvest</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button className="w-full glass-button-primary">Confirm Investment</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
