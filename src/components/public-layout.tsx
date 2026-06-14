import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { SkyRiseLogo } from "@/components/logo";

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
  const { isAuthenticated } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 w-full glass-navbar glass-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link to="/">
          <SkyRiseLogo className="h-10 w-auto transition-transform hover:scale-[1.02]" />
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
          {isAuthenticated ? (
            <Button asChild className="glass-button-primary"><Link to="/dashboard">Dashboard</Link></Button>
          ) : (
            <>
              <Button asChild variant="outline"><Link to="/login">Login</Link></Button>
              <Button asChild className="glass-button-primary"><Link to="/register">Get Started</Link></Button>
            </>
          )}
        </div>
        <button className="lg:hidden hover:opacity-70 transition" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300 lg:hidden">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          
          {/* Capsule Card matching the screenshot style */}
          <div className="relative w-full max-w-[420px] bg-[#f8fdf9]/98 dark:bg-[#081407]/98 border border-[#c2ddd2]/40 dark:border-[#00e676]/12 rounded-[96px] pt-12 pb-10 px-10 shadow-elevated flex flex-col justify-between overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between w-full px-2">
              <SkyRiseLogo className="h-10 w-auto" />
              <button 
                className="p-2 hover:opacity-75 transition-opacity text-foreground cursor-pointer focus:outline-none" 
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Divider */}
            <div className="border-b border-[#c2ddd2]/30 dark:border-[#00e676]/10 w-full my-5" />
            
            {/* Navigation links stack */}
            <div className="flex flex-col gap-6 py-4 px-4 overflow-y-auto max-h-[46vh] scrollbar-thin">
              {navItems.map((n) => {
                const active = pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className={`text-lg font-bold transition-colors ${active ? "text-primary dark:text-[#00e676]" : "text-foreground/90 hover:text-primary dark:hover:text-[#00e676]"}`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Footer action button */}
            <div className="pt-6 px-2 mt-auto">
              {isAuthenticated ? (
                <Button
                  asChild
                  className="w-full h-14 rounded-full bg-primary-gradient text-white font-bold text-base shadow-soft hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button
                    asChild
                    className="w-full h-14 rounded-full bg-primary-gradient text-white font-bold text-base shadow-soft hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer"
                    onClick={() => setOpen(false)}
                  >
                    <Link to="/register">Get Started</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-12 rounded-full font-bold text-sm cursor-pointer"
                    onClick={() => setOpen(false)}
                  >
                    <Link to="/login">Login</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


export function PublicFooter() {
  return (
    <footer className="mt-24 glass-navbar glass-blur-md !rounded-t-[96px] md:!rounded-t-none !rounded-b-none border-t border-glass-border">
      <div className="mx-auto grid max-w-7xl gap-12 px-8 pt-16 pb-12 md:py-12 md:grid-cols-4 md:px-6">
        <div>
          <div className="flex items-center">
            <SkyRiseLogo className="h-10 w-auto" />
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
