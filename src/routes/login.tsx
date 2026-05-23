import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, Shield, Users } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Login — SkyRise Future" },
    { name: "description", content: "Sign in to your SkyRise Future account to manage investments, team, ROI, and rewards." },
  ]}),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-liquid-bg">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 md:px-6 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary-gradient shadow-soft" />
            <span className="text-lg font-bold">Sky<span className="text-primary">Rise</span></span>
          </Link>
          <Card className="mt-8">
            <CardContent className="p-8">
              <h1 className="text-3xl font-bold">Welcome back</h1>
              <p className="mt-2 text-sm text-muted-foreground">Sign in to access your dashboard.</p>
              <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/dashboard" }); }}>
                <div className="space-y-2"><Label className="text-sm font-semibold">Email or User ID</Label><Input placeholder="you@example.com" /></div>
                <div className="space-y-2"><Label className="text-sm font-semibold">Password</Label><Input type="password" placeholder="••••••••" /></div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer"><Checkbox /> Remember me</label>
                  <a href="#" className="text-primary hover:text-primary/80 font-medium">Forgot password?</a>
                </div>
                <Button type="submit" className="w-full glass-button-primary">Login</Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account? <Link to="/register" className="text-primary font-semibold hover:text-primary/80">Create one</Link>
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="order-1 lg:order-2">
          <Card className="overflow-hidden">
            <div className="bg-primary-gradient p-8 text-white">
              <h2 className="text-2xl font-bold">One secure dashboard</h2>
              <p className="mt-2 text-white/85 text-sm leading-relaxed">Manage your investments, team, ROI, and rewards — all in one secure place.</p>
            </div>
            <CardContent className="p-6 space-y-5">
              {[
                { icon: TrendingUp, t: "Live ROI tracking", d: "Daily growth at a glance." },
                { icon: Users, t: "Team insights", d: "5-level overview, direct referrals, and more." },
                { icon: Shield, t: "Transparent rules", d: "Bonus, level, and withdrawal rules clearly defined." },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-blue-400 text-white shadow-soft flex-shrink-0"><f.icon size={20} /></div>
                  <div><div className="font-semibold text-sm text-foreground">{f.t}</div><div className="text-xs text-muted-foreground mt-0.5">{f.d}</div></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
