import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { packages } from "@/lib/mock-data";
import { packagesApi } from "@/lib/api-packages";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/packages")({
  head: () => ({ meta: [
    { title: "Investment Packages — SkyRise Future" },
    { name: "description", content: "Explore SkyRise Future investment packages from $10 with daily ROI from 0.7% up to 2.5%." },
    { property: "og:title", content: "Investment Packages — SkyRise Future" },
    { property: "og:description", content: "Choose a package and start tracking daily ROI." },
  ]}),
  component: PackagesPage,
});

function PackagesPage() {
  const { isAuthenticated } = useAuthStore();

  const { data: apiPackages = [] } = useQuery({
    queryKey: ["packages", "public"],
    queryFn: async () => {
      try {
        const res = await packagesApi.getPublicPackages();
        return res.packages || [];
      } catch (err) {
        console.error("Failed to fetch public packages:", err);
        return [];
      }
    }
  });

  const displayPackages = (apiPackages.length > 0 ? apiPackages : packages).map((p: any) => {
    if (p._id) {
      const minStr = p.minAmount;
      const maxStr = p.maxAmount ? `${p.maxAmount}` : "Max";
      let tag = "Starter";
      if (p.minAmount >= 5000) tag = "VIP";
      else if (p.minAmount >= 1000) tag = "Pro";
      else if (p.minAmount >= 100) tag = "Standard";

      return {
        id: p._id,
        name: p.name,
        tag: tag,
        range: `$${minStr} - $${maxStr}`,
        startRoi: p.startRoi,
        maxRoi: p.maxRoi,
      };
    }
    return p;
  });

  return (
    <PublicLayout>
      <section className="bg-sky-gradient py-16">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
          <Badge className="bg-primary/10 text-primary border-0">Packages</Badge>
          <h1 className="mt-4 text-4xl md:text-5xl">Choose your investment package</h1>
          <p className="mt-4 text-muted-foreground">Every package supports auto reinvest and manual ROI claim. ROI increases over time based on package rules.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {displayPackages.map((p) => (
            <Card key={p.id} className="border-soft shadow-card hover:shadow-elevated transition-all">
              <CardContent className="p-6">
                <Badge className="bg-gold/15 text-gold border-0">{p.tag}</Badge>
                <h3 className="mt-3 text-lg">{p.name}</h3>
                <div className="mt-1 text-sm text-muted-foreground">{p.range}</div>
                <div className="my-5 h-px bg-border" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Starting ROI</span><span className="font-semibold">{p.startRoi}% / day</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Max ROI</span><span className="font-semibold text-profit">{p.maxRoi}% / day</span></div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-profit" /> Auto reinvest supported</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-profit" /> Manual claim supported</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-profit" /> ROI growth every 10 days</div>
                </div>
                <Button asChild className="mt-6 w-full bg-primary-gradient text-primary-foreground">
                  <Link to={isAuthenticated ? "/dashboard/packages" : "/register"}>Select Package</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

