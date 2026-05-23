import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { incomeModules } from "@/lib/mock-data";

export const Route = createFileRoute("/income-plan")({
  head: () => ({ meta: [
    { title: "Income Plan — SkyRise Future" },
    { name: "description", content: "Explore the eight income modules of SkyRise Future, from daily ROI to VIP weekly salary." },
    { property: "og:title", content: "Income Plan — SkyRise Future" },
    { property: "og:description", content: "Eight ways to grow with SkyRise Future." },
  ]}),
  component: IncomePlanPage,
});

function IncomePlanPage() {
  return (
    <PublicLayout>
      <section className="bg-sky-gradient py-16">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
          <Badge className="bg-profit/10 text-profit border-0">Income Plan</Badge>
          <h1 className="mt-4 text-4xl md:text-5xl">Eight income modules built to grow with you</h1>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {incomeModules.map((m, i) => (
            <Card key={m.title} className="border-soft shadow-card">
              <CardContent className="p-6">
                <div className="text-xs font-bold text-primary">0{i + 1}</div>
                <h3 className="mt-2 text-lg">{m.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
