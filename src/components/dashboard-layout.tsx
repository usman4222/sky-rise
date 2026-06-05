import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, Wallet, TrendingUp, Users, Layers,
  Gift, ArrowLeftRight, Crown, Trophy, ArrowDownToLine, Receipt,
  User, LifeBuoy, LogOut, Bell, Search, Menu, X, CreditCard
} from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useAuthStore } from "@/store/authStore";

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
        <Link to="/" className="flex items-center gap-2" onClick={onClose}>
          <div className="h-8 w-8 rounded-full bg-primary-gradient shadow-soft" />
          <span className="font-bold text-foreground">Sky<span className="text-primary">Rise</span></span>
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
        <header className="sticky top-0 z-30 flex items-center gap-4 glass-navbar glass-blur-md px-4 py-3 md:px-6">
          <button className="lg:hidden hover:opacity-70 transition" onClick={() => setOpen(true)}><Menu /></button>
          <h1 className="text-base font-semibold md:text-lg flex-1 truncate text-foreground">{title}</h1>
          {/* <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" className="w-64 pl-10" />
          </div> */}
          {/* <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold animate-pulse" />
          </Button> */}
          {!isAdmin && (
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-muted-foreground font-medium">Wallet</span>
              <span className="text-sm font-bold text-primary">${walletBalance.toFixed(2)}</span>
            </div>
          )}
          <Avatar className="h-10 w-10 ring-2 ring-primary-gradient/30">
            <AvatarFallback className="bg-primary-gradient text-white font-semibold">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-liquid-bg">{children}</main>
      </div>
    </div>
  );
}
