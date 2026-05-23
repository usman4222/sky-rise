import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, Users, Layers, Crown, Trophy,
  ArrowRight, CheckCircle2, Sparkles, BarChart3, Gift, Coins
} from "lucide-react";
import { packages, incomeModules, vipRanks, achievements, faqs } from "@/lib/mock-data";

export const Route = createFileRoute("/")({ component: HomePage });

function LiquidOrbs({
  variant = "default",
}: {
  variant?: "default" | "hero" | "features" | "packages" | "income" | "vip" | "achievements" | "faq" | "cta";
}) {
  return (
    <div className={`liquid-orbs liquid-orbs-${variant}`} aria-hidden="true">
      <span className="liquid-orb liquid-orb-blue liquid-orb-1" />
      <span className="liquid-orb liquid-orb-cream liquid-orb-2" />
      <span className="liquid-orb liquid-orb-blue liquid-orb-3" />
      <span className="liquid-orb liquid-orb-cream liquid-orb-4" />
      <span className="liquid-orb liquid-orb-blue liquid-orb-5" />
      <span className="liquid-orb liquid-orb-cream liquid-orb-6" />
    </div>
  );
}

function HomePage() {
  return (
    <PublicLayout>
      {/* HERO */}
      <section id="home" className="liquid-section liquid-section-hero relative overflow-hidden">
        <LiquidOrbs variant="hero" />

        <div className="liquid-container relative z-10 grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
          <div>
            <Badge className="liquid-badge">
              <Sparkles className="mr-1.5 h-3 w-3" /> Premium Fintech Experience
            </Badge>

            <h1 className="liquid-hero-title mt-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Start Your <span className="liquid-gradient-text">Global Investment</span> Journey with SkyRise Future
            </h1>

            <p className="liquid-muted mt-5 max-w-xl text-base md:text-lg">
              Invest from just $10, track daily growth, build your referral network, and unlock multiple earning opportunities through one smart dashboard.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="liquid-button-primary">
                <Link to="/register">Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="liquid-button-light">
                <Link to="/packages">View Packages</Link>
              </Button>
            </div>

            <div className="mt-8 grid max-w-md grid-cols-3 gap-4">
              {[
                { label: "Min Invest", value: "$10" },
                { label: "Daily ROI", value: "1 – 2.5%" },
                { label: "VIP Salary", value: "$800/wk" },
              ].map((s) => (
                <div key={s.label} className="liquid-stat-card rounded-2xl p-4 text-center">
                  <div className="text-lg font-bold text-slate-900">{s.value}</div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview mock */}
          <div className="relative">
            <Card className="liquid-dashboard-card overflow-hidden">
              <div className="liquid-dashboard-header p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs opacity-80">Total Investment</div>
                    <div className="text-3xl font-bold">$1,250.00</div>
                  </div>
                  <Badge className="border-0 bg-white/20 text-white">VIP 2</Badge>
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <div><span className="opacity-70">Today's ROI</span><div className="font-semibold">$18.50</div></div>
                  <div><span className="opacity-70">Referral</span><div className="font-semibold">$96.00</div></div>
                  <div><span className="opacity-70">Wallet</span><div className="font-semibold">$245.80</div></div>
                </div>
              </div>

              <CardContent className="grid grid-cols-2 gap-3 p-5">
                {[
                  { icon: Gift, label: "Reg Bonus", v: "$5", c: "liquid-icon-gold" },
                  { icon: Users, label: "Direct Ref", v: "8%", c: "liquid-icon-blue" },
                  { icon: TrendingUp, label: "Daily ROI", v: "1.2%", c: "liquid-icon-green" },
                  { icon: Crown, label: "VIP Salary", v: "$800/wk", c: "liquid-icon-blue" },
                ].map((c) => {
                  const Icon = c.icon;

                  return (
                    <div key={c.label} className="liquid-mini-card rounded-xl p-3">
                      <div className={`liquid-icon-small grid h-9 w-9 place-items-center rounded-lg ${c.c}`}>
                        <Icon size={16} />
                      </div>
                      <div className="mt-2 text-xs text-slate-500">{c.label}</div>
                      <div className="text-base font-bold text-slate-900">{c.v}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="absolute -bottom-4 -left-4 hidden sm:block">
              <Card className="liquid-floating-card">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="liquid-icon-small liquid-icon-green grid h-9 w-9 place-items-center rounded-lg">
                    <BarChart3 size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Achievement</div>
                    <div className="text-sm font-bold text-slate-900">Golden Spark</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="about" className="liquid-section liquid-section-features relative overflow-hidden">
        <LiquidOrbs variant="features" />

        <div className="liquid-container relative z-10 py-20 md:py-24">
          <div className="liquid-heading-wrap mx-auto max-w-2xl text-center">
            <Badge className="liquid-badge">Platform Overview</Badge>
            <h2 className="liquid-title mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Everything you need in one smart dashboard
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Coins, title: "Start from $10", desc: "Low minimum entry lets anyone begin their investment journey." },
              { icon: TrendingUp, title: "Daily ROI Tracking", desc: "Watch package-based daily returns grow over time." },
              { icon: Users, title: "Direct Referral Income", desc: "Earn 8% from your direct referral investments." },
              { icon: Layers, title: "10-Level Income System", desc: "Unlock up to 10 levels of team ROI distribution." },
              { icon: Crown, title: "VIP Weekly Salary", desc: "Qualify for VIP ranks and receive weekly salary rewards." },
              { icon: Trophy, title: "Achievement Rewards", desc: "Unlock rank rewards based on 5-level team business." },
            ].map((f) => {
              const Icon = f.icon;

              return (
                <Card key={f.title} className="liquid-card group">
                  <CardContent className="relative z-10 p-6">
                    <div className="liquid-icon grid h-14 w-14 place-items-center rounded-full text-white transition duration-500 group-hover:scale-110">
                      <Icon size={24} />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-slate-950">{f.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="liquid-section liquid-section-packages relative overflow-hidden">
        <LiquidOrbs variant="packages" />

        <div className="liquid-container relative z-10 py-20">
          <div className="liquid-heading-wrap mx-auto max-w-2xl text-center">
            <Badge className="liquid-badge liquid-badge-gold">Investment Packages</Badge>
            <h2 className="liquid-title mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Pick a plan that fits your goals
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((p) => (
              <Card key={p.id} className="liquid-card group">
                <CardContent className="relative z-10 p-6">
                  <Badge className="liquid-chip">{p.tag}</Badge>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">{p.name}</h3>
                  <div className="mt-1 text-sm text-slate-500">{p.range}</div>

                  <div className="mt-5 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Starting ROI</span>
                      <span className="font-semibold text-slate-900">{p.startRoi}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max ROI</span>
                      <span className="font-semibold text-emerald-500">{p.maxRoi}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Auto reinvest
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Manual claim
                    </div>
                  </div>

                  <Button asChild className="liquid-button-primary mt-5 w-full">
                    <Link to="/register">Select Package</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* INCOME MODULES */}
      <section id="income-plan" className="liquid-section liquid-section-income relative overflow-hidden">
        <LiquidOrbs variant="income" />

        <div className="liquid-container relative z-10 py-20">
          <div className="liquid-heading-wrap mx-auto max-w-2xl text-center">
            <Badge className="liquid-badge liquid-badge-green">Income Modules</Badge>
            <h2 className="liquid-title mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Eight ways to grow
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {incomeModules.map((m, i) => (
              <Card key={m.title} className="liquid-card group">
                <CardContent className="relative z-10 p-6">
                  <div className="liquid-number">0{i + 1}</div>
                  <h3 className="mt-3 text-base font-semibold text-slate-950">{m.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* VIP */}
      <section id="vip" className="liquid-section liquid-section-vip relative overflow-hidden">
        <LiquidOrbs variant="vip" />

        <div className="liquid-container relative z-10 py-20">
          <div className="liquid-heading-wrap mx-auto max-w-2xl text-center">
            <Badge className="liquid-badge liquid-badge-gold">VIP Salary Program</Badge>
            <h2 className="liquid-title mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Weekly salary rewards for top performers
            </h2>
            <p className="liquid-muted mx-auto mt-3 max-w-xl text-sm">
              Users must maintain 5 active legs to qualify for VIP salary rewards.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {vipRanks.map((v) => (
              <Card key={v.rank} className="liquid-card group">
                <CardContent className="relative z-10 p-5">
                  <div className="flex items-center gap-2">
                    <div className="liquid-icon-mini liquid-icon-gold grid h-9 w-9 place-items-center rounded-full">
                      <Crown className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-950">{v.rank}</span>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">Business / Leg</div>
                  <div className="text-lg font-bold text-slate-950">${v.leg.toLocaleString()}</div>
                  <div className="mt-3 text-xs text-slate-500">Weekly Salary</div>
                  <div className="text-lg font-bold text-emerald-500">${v.weekly}</div>
                  <div className="mt-3 text-xs text-slate-500">~ Monthly</div>
                  <div className="text-base font-semibold text-slate-900">${v.monthly}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS */}
      <section id="achievements" className="liquid-section liquid-section-achievements relative overflow-hidden">
        <LiquidOrbs variant="achievements" />

        <div className="liquid-container relative z-10 py-20">
          <div className="liquid-heading-wrap mx-auto max-w-2xl text-center">
            <Badge className="liquid-badge">Achievement Rewards</Badge>
            <h2 className="liquid-title mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Climb the spark ranks
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {achievements.map((a, i) => (
              <Card key={a.name} className="liquid-card group">
                <CardContent className="relative z-10 p-5">
                  <div className="flex items-center gap-2">
                    <div className="liquid-icon-mini liquid-icon-gold grid h-10 w-10 place-items-center rounded-full">
                      <Trophy size={18} />
                    </div>
                    <span className="text-xs font-medium text-slate-500">Rank {i + 1}</span>
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-slate-950">{a.name}</h3>
                  <div className="mt-2 text-xs text-slate-500">Business</div>
                  <div className="text-sm font-bold text-slate-950">${a.business.toLocaleString()}</div>
                  <div className="mt-2 text-xs text-slate-500">Reward</div>
                  <div className="text-base font-bold text-emerald-500">${a.reward.toLocaleString()}</div>
                  <Progress value={(i + 1) * 10} className="mt-3 h-1.5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="liquid-section liquid-section-faq relative overflow-hidden">
        <LiquidOrbs variant="faq" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 md:px-6">
          <div className="text-center">
            <Badge className="liquid-badge">FAQ</Badge>
            <h2 className="liquid-title mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Common questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="liquid-faq-card mt-10 rounded-3xl">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`} className="border-white/30 px-6">
                <AccordionTrigger className="py-4 text-left font-semibold text-slate-950 transition hover:text-sky-700">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-slate-600">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="liquid-section liquid-section-cta relative overflow-hidden">
        <LiquidOrbs variant="cta" />

        <div className="liquid-container relative z-10 py-20">
          <Card className="liquid-cta-card overflow-hidden">
            <div className="liquid-cta-inner p-10 text-center text-white md:p-16">
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Ready to Start with SkyRise Future?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-white/85">
                Create your free account, explore packages, and manage your growth from one smart dashboard.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="bg-white text-slate-950 hover:bg-white/90">
                  <Link to="/register">Create Free Account</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                  <Link to="/login">Login</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
