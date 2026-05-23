import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { vipRanks } from "@/lib/mock-data";

export const Route = createFileRoute("/vip")({
  head: () => ({ meta: [
    { title: "VIP Salary Program — SkyRise Future" },
    { name: "description", content: "Qualify for VIP ranks and earn weekly salary rewards up to $800 per week." },
    { property: "og:title", content: "VIP Salary Program — SkyRise Future" },
    { property: "og:description", content: "Weekly salary rewards for active team builders." },
  ]}),
  component: VipPage,
});

function VipPage() {
  return (
    <PublicLayout>
      <section className="bg-sky-gradient py-16">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
          <Badge className="bg-gold/15 text-gold border-0">VIP Salary</Badge>
          <h1 className="mt-4 text-4xl md:text-5xl">Weekly salary for top performers</h1>
          <p className="mt-4 text-muted-foreground">Users must maintain 5 active legs to qualify for VIP salary rewards.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {vipRanks.map((v) => (
            <Card key={v.rank} className="border-soft shadow-card hover:shadow-elevated transition-all">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-gold" /><span className="font-bold">{v.rank}</span>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Business / Leg</div>
                <div className="text-lg font-bold">${v.leg.toLocaleString()}</div>
                <div className="mt-3 text-xs text-muted-foreground">Weekly Salary</div>
                <div className="text-lg font-bold text-profit">${v.weekly}</div>
                <div className="mt-3 text-xs text-muted-foreground">Monthly Approx</div>
                <div className="text-base font-semibold">${v.monthly}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
