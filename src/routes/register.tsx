import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Gift } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [
    { title: "Register — SkyRise Future" },
    { name: "description", content: "Create your free SkyRise Future account and receive a $5 registration bonus." },
  ]}),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-liquid-bg">
      <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary-gradient shadow-soft" />
          <span className="text-lg font-bold">SkyRise <span className="text-primary">Future</span></span>
        </Link>
        <Card className="mt-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-300/20 to-orange-400/20 p-3 border border-amber-300/40">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gold-gradient text-gold-foreground"><Gift size={18} /></div>
              <div>
                <div className="font-semibold text-sm">Get $5 free registration bonus</div>
                <div className="text-xs text-muted-foreground">For your first investment usage.</div>
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-bold">Create your account</h1>
            <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/dashboard" }); }}>
              <div className="space-y-2 sm:col-span-2"><Label className="text-sm font-semibold">Full Name</Label><Input placeholder="Alex Morgan" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Email</Label><Input type="email" placeholder="you@example.com" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Phone Number</Label><Input placeholder="+1 555 0123" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Username</Label><Input placeholder="alexm" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Sponsor / Referral ID</Label><Input placeholder="SKY-10001" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Password</Label><Input type="password" placeholder="••••••••" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Confirm Password</Label><Input type="password" placeholder="••••••••" /></div>
              <label className="sm:col-span-2 flex items-start gap-2 text-sm text-muted-foreground">
                <Checkbox className="mt-0.5" /> I agree to the Terms, Privacy Policy, and platform rules.
              </label>
              <Button type="submit" className="sm:col-span-2 w-full glass-button-primary">Register</Button>
            </form>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary font-medium hover:text-primary/80">Login</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
