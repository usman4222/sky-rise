import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Users, ArrowLeftRight } from "lucide-react";

export const Route = createFileRoute("/dashboard/wallet")({ component: WalletPage });

const wallets = [
  { icon: Gift, name: "Registration Bonus", bal: "$5.00", color: "gold",
    rules: ["For first investment use only", "Not withdrawable"] },
  { icon: Users, name: "Team Bonus Balance", bal: "$120.00", color: "primary",
    rules: ["50% level activation usage", "50% team transfer usage", "Not withdrawable"] },
  { icon: ArrowLeftRight, name: "Transfer Bonus Balance", bal: "$45.00", color: "profit",
    rules: ["Max 10% of investment usage", "Received from downline team"] },
];

const styles: Record<string, string> = {
  gold: "bg-gold/15 text-gold",
  primary: "bg-primary/10 text-primary",
  profit: "bg-profit/10 text-profit",
};

function WalletPage() {
  return (
    <DashboardLayout title="Bonus Wallet">
      <div className="grid gap-5 lg:grid-cols-3">
        {wallets.map((w) => (
          <Card key={w.name} className="border-soft shadow-card">
            <CardContent className="p-6">
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${styles[w.color]}`}><w.icon size={20} /></div>
              <h3 className="mt-4 text-base font-semibold">{w.name}</h3>
              <div className="mt-2 text-3xl font-bold">{w.bal}</div>
              <div className="mt-4 space-y-1.5">
                {w.rules.map((r) => (
                  <div key={r} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="h-1.5 w-1.5 rounded-full bg-primary p-0 border-0" />{r}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
