import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, Wallet, TrendingUp, Users, Layers,
  Gift, ArrowLeftRight, Crown, Trophy, ArrowDownToLine, Receipt,
  User, LifeBuoy, LogOut, Bell, Search, Menu, X, CreditCard, Megaphone
} from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useAuthStore } from "@/store/authStore";
import { SkyRiseLogo } from "@/components/logo";
import chargingBull from "@/assets/charging_bull.png";
import { playSound } from "@/lib/sounds";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true, hasAdmin: true },
  { to: "/dashboard/packages", label: "Investment Packages", icon: Package, hasAdmin: true },
  { to: "/dashboard/investments", label: "My Investments", icon: Wallet },
  { to: "/dashboard/roi", label: "Daily ROI", icon: TrendingUp },
  { to: "/dashboard/team", label: "Referral Team", icon: Users },
  { to: "/dashboard/levels", label: "Level Income", icon: Layers },
  { to: "/dashboard/wallet", label: "Bonus Wallet", icon: Gift },
  { to: "/dashboard/transfer", label: "Transfer Bonus", icon: ArrowLeftRight },
  { to: "/dashboard/weekly-salary", label: "VIP Salary Claims", icon: Crown },
  { to: "/dashboard/achievements", label: "Achievement Rewards", icon: Trophy },
  { to: "/dashboard/withdraw", label: "Withdraw Funds", icon: ArrowDownToLine },
  { to: "/dashboard/payment-methods", label: "Saved Accounts", icon: CreditCard },
  { to: "/dashboard/transactions", label: "Transactions", icon: Receipt },
  { to: "/dashboard/profile", label: "Profile", icon: User },
  { to: "/dashboard/support", label: "Support", icon: LifeBuoy },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("SUPER_ADMIN");
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    onClose?.();
    navigate({ to: "/login", replace: true });
  };

  return (
    <aside className="flex h-full w-64 flex-col glass-sidebar glass-blur-md">
      <div className="flex items-center justify-between px-6 py-5 border-b border-glass-border">
        <Link to="/" onClick={onClose}>
          <SkyRiseLogo variant="sidebar" className="h-9 w-auto" />
        </Link>
        {onClose && <button onClick={onClose} className="lg:hidden hover:opacity-70 transition"><X size={18} /></button>}
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {nav.filter(n => !isAdmin || n.hasAdmin).map((n) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onClose}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${active
                ? "bg-primary-gradient text-white shadow-soft"
                : "text-foreground/70 hover:bg-glass-surface-soft hover:text-foreground"
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                <span className="truncate">{n.label}</span>
              </div>
              {isAdmin && n.hasAdmin && (
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" title="Admin controls inside" />
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-foreground/45 tracking-wider uppercase border-t border-glass-border/30 mt-4">
              Admin Center
            </div>
            {[
              { to: "/dashboard/admin/users", label: "Users Management", icon: Users },
              { to: "/dashboard/admin/withdrawals", label: "Verify Withdrawals Queue", icon: ArrowDownToLine },
              { to: "/dashboard/admin/weekly-salary", label: "Verify Salary Queue", icon: Crown },
              { to: "/dashboard/admin/announcements", label: "Manage Announcements", icon: Megaphone },
            ].map((n) => {
              const active = pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={onClose}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${active
                    ? "bg-primary-gradient text-white shadow-soft"
                    : "text-foreground/70 hover:bg-glass-surface-soft hover:text-foreground"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span className="truncate">{n.label}</span>
                  </div>
                </Link>
              );
            })}
          </>
        )}

        {!isAdmin && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-[#002b1c]/95 to-[#001e14]/95 border border-[#f3ba2f]/20 relative overflow-hidden group shadow-lg text-left transition-all duration-300 hover:border-[#f3ba2f]/45">
            <div className="relative z-10 space-y-3">
              <h3 className="text-xs font-black text-white tracking-wider uppercase flex items-center gap-1.5">
                <Crown size={12} className="text-[#f3ba2f] animate-pulse" /> Grow With SkyRise
              </h3>
              <p className="text-[10px] text-zinc-300 leading-relaxed">
                Smart investments in Stock Market for Stable Daily Returns
              </p>
              
              {/* Structured Framed bull image container */}
              <div className="overflow-hidden rounded-xl border border-[#004d33] bg-[#000f0a]/60 p-1 flex items-center justify-center shadow-inner relative group-hover:border-[#0e9f6e]/45 transition-colors">
                <img
                  src={chargingBull}
                  alt="Charging Bull"
                  className="w-full h-24 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <Link to="/dashboard/packages" className="block w-full" onClick={() => playSound.playClick()}>
                <Button className="w-full bg-gradient-to-r from-[#f3ba2f] to-[#ffe082] hover:from-[#ffe082] hover:to-[#f3ba2f] text-[#002b1c] font-black text-[10px] uppercase tracking-wider h-8.5 rounded-xl shadow-[0_4px_12px_rgba(243,186,47,0.18)] cursor-pointer hover:scale-[1.02] active:scale-98 transition-all duration-200">
                  Invest Now
                </Button>
              </Link>
            </div>
            {/* Subtle glow/orb in card background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0e9f6e]/10 via-transparent to-[#f3ba2f]/5 opacity-60 pointer-events-none" />
          </div>
        )}

        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
        >
          <LogOut size={18} />Logout
        </button>
      </nav>
    </aside>
  );
}

export function DashboardLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, fetchProfile } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("SUPER_ADMIN");

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Calculate total balance from specific Firebase synced wallets
  const w = user?.wallets;
  const walletBalance = w
    ? (w.deposit || 0) + (w.roi || 0) + (w.referral || 0) + (w.bonusReceived || 0) + (w.salary || 0) + (w.achievement || 0) - (w.withdrawal || 0)
    : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex"><Sidebar /></div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0"><Sidebar onClose={() => setOpen(false)} /></div>
        </div>
      )}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 glass-navbar glass-blur-md px-5 py-3 md:px-7">
          <button className="lg:hidden hover:opacity-70 transition" onClick={() => setOpen(true)}><Menu /></button>
          <h1 className="text-base font-bold md:text-lg flex-1 truncate text-foreground tracking-tight">{title}</h1>
          {/* <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" className="w-64 pl-10" />
          </div> */}
          {/* <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold animate-pulse" />
          </Button> */}
          {!isAdmin && (
            <div className="hidden sm:flex flex-col text-right justify-center h-10 self-start">
              <span className="text-[20px] text-muted-foreground font-semibold uppercase tracking-wider">Wallet</span>
              <span className="text-lr font-black text-primary">${walletBalance.toFixed(2)}</span>
            </div>
          )}
          <div className="flex flex-col items-center gap-1 min-w-[64px]">
            <Avatar className="h-10 w-10 ring-2 ring-primary-gradient/30 shadow-sm transition-transform hover:scale-105 duration-200">
              <AvatarImage 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                alt={user?.name || "User avatar"} 
              />
              <AvatarFallback className="bg-primary-gradient text-white font-bold text-xs">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[9px] sm:text-[10px] font-bold text-foreground/80 leading-none tracking-tight text-center max-w-[80px] truncate">
              {user?.name || "Zubair"}
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-liquid-bg">{children}</main>
      </div>
    </div>
  );
}
