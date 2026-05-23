import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { achievements } from "@/lib/mock-data";

export const Route = createFileRoute("/achievements")({
  head: () => ({ meta: [
    { title: "Achievement Rewards — SkyRise Future" },
    { name: "description", content: "Climb spark ranks from Bronze to Supreme and unlock milestone rewards up to $38,400." },
    { property: "og:title", content: "Achievement Rewards — SkyRise Future" },
    { property: "og:description", content: "Milestone rewards based on 5-level team business." },
  ]}),
  component: AchievementsPage,
});

function AchievementsPage() {
  return (
    <PublicLayout>
      <section className="bg-sky-gradient py-16">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
          <Badge className="bg-primary/10 text-primary border-0">Achievements</Badge>
          <h1 className="mt-4 text-4xl md:text-5xl">Climb the spark ranks</h1>
          <p className="mt-4 text-muted-foreground">Rewards are based on 5-level team business volume. Platform rules apply.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {achievements.map((a, i) => (
            <Card key={a.name} className="border-soft shadow-card">
              <CardContent className="p-5">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold-gradient text-gold-foreground"><Trophy size={18} /></div>
                <h3 className="mt-3 text-base font-semibold">{a.name}</h3>
                <div className="mt-2 text-xs text-muted-foreground">Rank {i + 1}</div>
                <div className="mt-2 text-xs text-muted-foreground">Business</div>
                <div className="text-sm font-bold">${a.business.toLocaleString()}</div>
                <div className="mt-2 text-xs text-muted-foreground">Reward</div>
                <div className="text-base font-bold text-profit">${a.reward.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
