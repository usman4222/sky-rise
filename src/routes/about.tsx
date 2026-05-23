import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Globe2, Sparkles, Target } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About — SkyRise Future" },
    { name: "description", content: "Learn how SkyRise Future helps users grow through transparent investment packages and clear platform rules." },
    { property: "og:title", content: "About — SkyRise Future" },
    { property: "og:description", content: "A premium platform for transparent, package-based investment growth." },
  ]}),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicLayout>
      <section className="bg-sky-gradient py-20">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
          <Badge className="bg-primary/10 text-primary border-0">About</Badge>
          <h1 className="mt-4 text-4xl md:text-5xl">A modern platform for confident investors</h1>
          <p className="mt-5 text-muted-foreground">SkyRise Future combines transparent investment packages, clear platform rules, and a premium dashboard experience to help users track ROI, grow their team, and unlock rewards — all in one place.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:grid-cols-2 md:px-6">
        {[
          { icon: Shield, title: "Transparent rules", desc: "Every package, bonus, and reward is clearly defined upfront — no surprises." },
          { icon: Globe2, title: "Built for global users", desc: "A clean, fast UI that works on any device, anywhere in the world." },
          { icon: Sparkles, title: "Premium experience", desc: "A fintech-grade dashboard designed to make managing investments effortless." },
          { icon: Target, title: "Aligned with your goals", desc: "Multiple income modules let you choose how you want to grow." },
        ].map((c) => (
          <Card key={c.title} className="border-soft shadow-card">
            <CardContent className="p-6 flex gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><c.icon size={22} /></div>
              <div>
                <h3 className="text-lg">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </PublicLayout>
  );
}
