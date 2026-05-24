import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/packages", label: "Packages" },
  { to: "/income-plan", label: "Income Plan" },
  { to: "/vip", label: "VIP Rewards" },
  { to: "/achievements", label: "Achievements" },
  { to: "/faq", label: "FAQ" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-40 w-full glass-navbar glass-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary-gradient shadow-soft" />
          <span className="text-lg font-bold tracking-tight">Sky<span className="text-primary">Rise</span></span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${pathname === n.to ? "text-white bg-primary-gradient shadow-soft" : "text-foreground/80 hover:text-foreground hover:bg-glass-surface-soft"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild variant="outline"><Link to="/login">Login</Link></Button>
          <Button asChild className="glass-button-primary"><Link to="/register">Get Started</Link></Button>
        </div>
        <button className="lg:hidden hover:opacity-70 transition" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-glass-border glass-blur-sm bg-glass-surface lg:hidden">
          <div className="flex flex-col p-4 gap-2">
            {navItems.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-glass-surface-strong transition">
                {n.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2">
              <Button asChild variant="outline" className="flex-1"><Link to="/login">Login</Link></Button>
              <Button asChild className="flex-1 glass-button-primary"><Link to="/register">Get Started</Link></Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-24 glass-navbar glass-blur-md">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary-gradient shadow-soft" />
            <span className="text-lg font-bold">Sky<span className="text-primary">Rise</span></span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">A modern global investment-style platform with daily ROI tracking, referral team building, and VIP reward programs.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary transition">About</Link></li>
            <li><Link to="/packages" className="hover:text-primary transition">Packages</Link></li>
            <li><Link to="/faq" className="hover:text-primary transition">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Income Plan</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/income-plan" className="hover:text-primary transition">Income Modules</Link></li>
            <li><Link to="/vip" className="hover:text-primary transition">VIP Salary</Link></li>
            <li><Link to="/achievements" className="hover:text-primary transition">Achievement Rewards</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/login" className="hover:text-primary transition">Login</Link></li>
            <li><Link to="/register" className="hover:text-primary transition">Register</Link></li>
            <li><a href="#" className="hover:text-primary transition">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-glass-border">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground md:px-6">
          <p><strong className="text-foreground">Risk Disclaimer:</strong> Investment involves risk. ROI and rewards are subject to platform rules. Bonus balances may be non-withdrawable. Please review all terms, conditions, and platform policies before participating.</p>
          <p className="mt-2">© {new Date().getFullYear()} SkyRise Future. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
