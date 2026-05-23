import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", id: "home", label: "Home" },
  { to: "/about", id: "about", label: "About" },
  { to: "/packages", id: "packages", label: "Packages" },
  { to: "/income-plan", id: "income-plan", label: "Income Plan" },
  { to: "/vip", id: "vip", label: "VIP Rewards" },
  { to: "/achievements", id: "achievements", label: "Achievements" },
  { to: "/faq", id: "faq", label: "FAQ" },
];

function HeaderFooterOrbs({ area }: { area: "header" | "footer" }) {
  return (
    <div className={`hf-orbs hf-orbs-${area}`} aria-hidden="true">
      <span className="hf-orb hf-orb-blue hf-orb-1" />
      <span className="hf-orb hf-orb-cream hf-orb-2" />
      <span className="hf-orb hf-orb-blue hf-orb-3" />
    </div>
  );
}

function SkyRiseLogo() {
  return (
    <Link to="/" className="sky-logo-group">
      <span className="sky-logo-mark">
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="sky-logo-text">
        Sky<span>Rise</span>
      </span>
    </Link>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="liquid-header sticky top-0 z-40 w-full">
      <HeaderFooterOrbs area="header" />

      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <SkyRiseLogo />

        <nav className="liquid-desktop-nav hidden items-center gap-1">
          {navItems.map((n) => {
            return (
              <a
                key={n.to}
                href={`#${n.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(n.id);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`liquid-nav-link`}
              >
                {n.label}
              </a>
            );
          })}
        </nav>

        <div className="liquid-desktop-actions hidden items-center gap-3">
          <Button asChild variant="outline" className="liquid-header-login">
            <Link to="/login">Login</Link>
          </Button>

          <Button asChild className="liquid-header-cta">
            <Link to="/register">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <button
          className="liquid-menu-button"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="liquid-mobile-menu relative z-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
            {navItems.map((n) => {
              return (
                <a
                  key={n.to}
                  href={`#${n.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    const el = document.getElementById(n.id);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`liquid-mobile-link`}
                >
                  {n.label}
                </a>
              );
            })}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="liquid-header-login">
                <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
              </Button>

              <Button asChild className="liquid-header-cta">
                <Link to="/register" onClick={() => setOpen(false)}>Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="liquid-footer relative overflow-hidden">
      <HeaderFooterOrbs area="footer" />

      <div className="liquid-footer-shell relative z-10 mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-4 ml-10">
          <div>
            <SkyRiseLogo />

            <p className="mt-4 text-sm leading-6 text-slate-600">
              A modern global investment-style platform with daily ROI tracking,
              referral team building, and VIP reward programs.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/35 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-xl">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Smart dashboard experience
            </div>
          </div>

          <div>
            <h4 className="liquid-footer-title">Quick Links</h4>
            <ul className="liquid-footer-list">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/packages">Packages</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="liquid-footer-title">Income Plan</h4>
            <ul className="liquid-footer-list">
              <li><Link to="/income-plan">Income Modules</Link></li>
              <li><Link to="/vip">VIP Salary</Link></li>
              <li><Link to="/achievements">Achievement Rewards</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="liquid-footer-title">Support</h4>
            <ul className="liquid-footer-list">
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="liquid-footer-bottom ml-10 mt-10 pt-6 text-xs leading-6 text-slate-600">
          <p>
            <strong className="text-slate-950">Risk Disclaimer:</strong> Investment involves risk.
            ROI and rewards are subject to platform rules. Bonus balances may be non-withdrawable.
            Please review all terms, conditions, and platform policies before participating.
          </p>

          <p className="mt-2">© {new Date().getFullYear()} SkyRise Future. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="liquid-site flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
