import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet, TrendingUp, Users, Layers, Crown, Trophy,
  ArrowRight, CheckCircle2, Sparkles, BarChart3, Gift, Coins
} from "lucide-react";
import { packages, incomeModules, vipRanks, achievements, faqs } from "@/lib/mock-data";
import { packagesApi } from "@/lib/api-packages";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/")({ component: HomePage });

function LandingCard({
  children,
  className = "",
  blobColor = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  blobColor?: "primary" | "gold" | "profit" | "red";
}) {
  const blobClasses = {
    primary: "blob-primary",
    gold: "blob-gold",
    profit: "blob-profit",
    red: "blob-red"
  };

  return (
    <div className={`landing-card-container hover:scale-[1.015] hover:shadow-lg transition-all duration-300 ${className}`}>
      <div className={`landing-card-blob ${blobClasses[blobColor]}`} />
      <div className="landing-card-glass" />
      <div className="landing-card-content p-6">
        {children}
      </div>
    </div>
  );
}

function HomePage() {
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
      {/* HERO */}
      <section className="relative overflow-hidden bg-sky-gradient">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2">
          <div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-0">
              <Sparkles className="mr-1.5 h-3 w-3" /> Premium Fintech Experience
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Start Your <span className="text-primary">Global Investment</span> Journey with SkyRise Future
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Invest from just $10, track daily growth, build your referral network, and unlock multiple earning opportunities through one smart dashboard.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Button asChild size="lg" className="bg-primary-gradient text-primary-foreground shadow-elevated hover:opacity-95 always-glow">
                  <Link to="/dashboard">Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-primary-gradient text-primary-foreground shadow-elevated hover:opacity-95 always-glow">
                    <Link to="/register">Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-soft bg-white always-glow">
                    <Link to="/packages">View Packages</Link>
                  </Button>
                </>
              )}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              {[
                { label: "Min Invest", value: "$10" },
                { label: "Daily ROI", value: "1 – 2.5%" },
                { label: "VIP Salary", value: "$800/wk" },
              ].map((s) => (
                <div key={s.label} className="glass-card glass-blur-md rounded-2xl p-4 text-center">
                  <div className="text-lg font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview mock */}
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-primary/5 blur-2xl rounded-3xl" />
            <Card className="overflow-hidden glass-hero">
              <div className="bg-primary-gradient p-5 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs opacity-80">Total Investment</div>
                    <div className="text-3xl font-bold">$1,250.00</div>
                  </div>
                  <Badge className="bg-white/20 text-white border-0">VIP 2</Badge>
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <div><span className="opacity-70">Today's ROI</span><div className="font-semibold">$18.50</div></div>
                  <div><span className="opacity-70">Referral</span><div className="font-semibold">$96.00</div></div>
                  <div><span className="opacity-70">Wallet</span><div className="font-semibold">$245.80</div></div>
                </div>
              </div>
              <CardContent className="p-5 grid grid-cols-2 gap-3">
                {[
                  { icon: Gift, label: "Reg Bonus", v: "$5", c: "bg-gold/15 text-gold" },
                  { icon: Users, label: "Direct Ref", v: "8%", c: "bg-primary/10 text-primary" },
                  { icon: TrendingUp, label: "Daily ROI", v: "1.2%", c: "bg-profit/10 text-profit" },
                  { icon: Crown, label: "VIP Salary", v: "$800/wk", c: "bg-primary/10 text-primary" },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-soft p-3">
                    <div className={`grid h-9 w-9 place-items-center rounded-lg ${c.c}`}><c.icon size={16} /></div>
                    <div className="mt-2 text-xs text-muted-foreground">{c.label}</div>
                    <div className="text-base font-bold">{c.v}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
            {/* <div className="absolute -bottom-4 -left-4 hidden sm:block">
              <Card className="border-soft shadow-elevated">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-profit/10 text-profit"><BarChart3 size={16} /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">Achievement</div>
                    <div className="text-sm font-bold">Golden Spark</div>
                  </div>
                </CardContent>
              </Card>
            </div> */}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-primary/10 text-primary border-0">Platform Overview</Badge>
          <h2 className="mt-3 text-3xl md:text-4xl">Everything you need in one smart dashboard</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Coins, title: "Start from $10", desc: "Low minimum entry lets anyone begin their investment journey." },
            { icon: TrendingUp, title: "Daily ROI Tracking", desc: "Watch package-based daily returns grow over time." },
            { icon: Users, title: "Direct Referral Income", desc: "Earn 8% from your direct referral investments." },
            { icon: Layers, title: "10-Level Income System", desc: "Unlock up to 10 levels of team ROI distribution." },
            { icon: Crown, title: "VIP Weekly Salary", desc: "Qualify for VIP ranks and receive weekly salary rewards." },
            { icon: Trophy, title: "Achievement Rewards", desc: "Unlock rank rewards based on 5-level team business." },
          ].map((f) => (
            <LandingCard key={f.title} blobColor="primary">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-blue-400 text-white shadow-soft">
                <f.icon size={24} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </LandingCard>
          ))}
        </div>
      </section>

      {/* PACKAGES */}
      <section className="bg-sky-gradient py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <Badge className="bg-gold/15 text-gold border-0">Investment Packages</Badge>
            <h2 className="mt-3 text-3xl md:text-4xl">Pick a plan that fits your goals</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {displayPackages.map((p) => (
              <LandingCard key={p.id} blobColor={p.tag === "VIP" ? "gold" : p.tag === "Standard" ? "profit" : "primary"}>
                <Badge className="bg-gradient-to-r from-violet-400 to-blue-400 text-white border-0 w-fit">{p.tag}</Badge>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{p.name}</h3>
                <div className="mt-1 text-sm text-muted-foreground">{p.range}</div>
                <div className="mt-5 space-y-2 text-sm flex-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Starting ROI</span><span className="font-semibold">{p.startRoi}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Max ROI</span><span className="font-semibold text-emerald-500">{p.maxRoi}%</span></div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Auto reinvest</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Manual claim</div>
                </div>
                <Button asChild className="mt-5 w-full glass-button-primary always-glow">
                  <Link to={isAuthenticated ? "/dashboard/packages" : "/register"}>Select Package</Link>
                </Button>
              </LandingCard>
            ))}
          </div>
        </div>
      </section>

      {/* INCOME MODULES */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-profit/10 text-profit border-0">Income Modules</Badge>
          <h2 className="mt-3 text-3xl md:text-4xl">Eight ways to grow</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {incomeModules.map((m, i) => (
            <LandingCard key={m.title} blobColor="primary">
              <div className="text-sm font-bold text-primary bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">0{i + 1}</div>
              <h3 className="mt-3 text-base font-semibold text-foreground">{m.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
            </LandingCard>
          ))}
        </div>
      </section>

      {/* VIP */}
      <section className="bg-sky-gradient py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <Badge className="bg-gold/15 text-gold border-0">VIP Salary Program</Badge>
            <h2 className="mt-3 text-3xl md:text-4xl">Weekly salary rewards for top performers</h2>
            <p className="mt-3 text-sm text-muted-foreground">Users must maintain 5 active legs to qualify for VIP salary rewards.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {vipRanks.map((v) => (
              <LandingCard key={v.rank} blobColor="gold">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-gold" />
                  <span className="font-bold text-foreground">{v.rank}</span>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Business / Leg</div>
                <div className="text-base font-bold">${v.leg.toLocaleString()}</div>
                <div className="mt-3 text-xs text-muted-foreground">Weekly Salary</div>
                <div className="text-base font-bold text-profit">${v.weekly}</div>
                <div className="mt-3 text-xs text-muted-foreground">~ Monthly</div>
                <div className="text-sm font-semibold">${v.monthly}</div>
              </LandingCard>
            ))}
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-primary/10 text-primary border-0">Achievement Rewards</Badge>
          <h2 className="mt-3 text-3xl md:text-4xl">Climb the spark ranks</h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {achievements.map((a, i) => (
            <LandingCard key={a.name} blobColor="gold">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-soft"><Trophy size={18} /></div>
                <span className="text-xs font-medium text-muted-foreground">Rank {i + 1}</span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-foreground">{a.name}</h3>
              <div className="mt-2 text-xs text-muted-foreground">Business</div>
              <div className="text-sm font-bold">${a.business.toLocaleString()}</div>
              <div className="mt-2 text-xs text-muted-foreground">Reward</div>
              <div className="text-base font-bold text-emerald-500">${a.reward.toLocaleString()}</div>
              <Progress value={(i + 1) * 10} className="mt-3 h-1.5" />
            </LandingCard>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-sky-gradient py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <div className="text-center">
            <Badge className="bg-primary/10 text-primary border-0">FAQ</Badge>
            <h2 className="mt-3 text-3xl md:text-4xl">Common questions</h2>
          </div>
          <Accordion type="single" collapsible className="mt-10 glass-card glass-blur-md rounded-2xl border border-glass-border divide-y divide-glass-border-soft">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`} className="border-0 px-6">
                <AccordionTrigger className="text-left py-4 font-semibold text-foreground hover:text-primary transition">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <Card className="border-0 overflow-hidden shadow-elevated">
          <div className="bg-primary-gradient p-10 md:p-16 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-5xl text-white">Ready to Start with SkyRise Future?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">Create your free account, explore packages, and manage your growth from one smart dashboard.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {isAuthenticated ? (
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 always-glow"><Link to="/dashboard">Go to Dashboard</Link></Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 always-glow"><Link to="/register">Create Free Account</Link></Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 always-glow"><Link to="/login">Login</Link></Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </section>
    </PublicLayout>
  );
}
