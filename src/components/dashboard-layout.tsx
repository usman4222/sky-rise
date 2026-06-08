import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, Wallet, TrendingUp, Users, Layers,
  Gift, ArrowLeftRight, Crown, Trophy, ArrowDownToLine, Receipt,
  User, LifeBuoy, LogOut, Bell, Search, Menu, X, CreditCard, Pencil,
  Image, Copy, Home, Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useAuthStore } from "@/store/authStore";
import { Logo } from "@/components/logo";

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
          <Logo />
        </Link>
        {onClose && <button onClick={onClose} className="lg:hidden hover:opacity-70 transition"><X size={18} /></button>}
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 sidebar-scroll">
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
              { to: "/dashboard/admin/banners", label: "Manage Banners", icon: Image },
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDashboardHome = pathname === "/dashboard" || pathname === "/dashboard/";
  const showMobileProfile = !isAdmin && isDashboardHome;

  useEffect(() => {
    // Ensure dark class is never applied
    window.document.documentElement.classList.remove('dark');
  }, []);

  const tabs = [
    {
      id: "home",
      label: "Home",
      to: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard" || pathname === "/dashboard/",
      color: "text-primary",
      borderColor: "border-primary/40",
      shadowColor: "shadow-[0_8px_24px_rgba(123,92,255,0.25)]",
    },
    {
      id: "market",
      label: "Market",
      to: "/dashboard/packages",
      icon: Package,
      isActive: pathname.startsWith("/dashboard/packages"),
      color: "text-primary",
      borderColor: "border-primary/40",
      shadowColor: "shadow-[0_8px_24px_rgba(123,92,255,0.25)]",
    },
    {
      id: "wallet",
      label: "Wallet",
      to: "/dashboard/investments",
      icon: Wallet,
      isActive: pathname.startsWith("/dashboard/investments") || pathname.startsWith("/dashboard/withdraw"),
      color: "text-[#18b66a]",
      borderColor: "border-[#18b66a]/40",
      shadowColor: "shadow-[0_8px_24px_rgba(24,182,106,0.25)]",
    },
    {
      id: "history",
      label: "History",
      to: "/dashboard/transactions",
      icon: Clock,
      isActive: pathname.startsWith("/dashboard/transactions"),
      color: "text-primary",
      borderColor: "border-primary/40",
      shadowColor: "shadow-[0_8px_24px_rgba(123,92,255,0.25)]",
    },
    {
      id: "more",
      label: "More",
      onClick: () => setOpen(true),
      icon: Menu,
      isActive: open,
      color: "text-primary",
      borderColor: "border-primary/40",
      shadowColor: "shadow-[0_8px_24px_rgba(123,92,255,0.25)]",
    },
  ];

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getJoinedDate = (createdAt?: string) => {
    if (!createdAt) return "JOINED • -";
    const date = new Date(createdAt);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = date.getFullYear();
    return `JOINED • ${day} ${month}, ${year}`;
  };

  // Calculate total balance from specific Firebase synced wallets
  const w = user?.wallets;
  const walletBalance = w
    ? (w.deposit || 0) + (w.roi || 0) + (w.referral || 0) + (w.bonusReceived || 0) + (w.salary || 0) + (w.achievement || 0) - (w.withdrawal || 0)
    : 0;

  const sponsorStr = user?.sponsor ? `SPONSORED BY • ${user.sponsor.toUpperCase()}` : "SPONSORED BY • NONE";
  const joinedStr = getJoinedDate(user?.createdAt);

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

          <Link to="/dashboard/profile" className="cursor-pointer transition hover:opacity-80">
            <Avatar className="h-10 w-10 ring-2 ring-primary-gradient/30">
              {user?.imageUrl && (
                <AvatarImage src={user.imageUrl} alt={user.name || "User Avatar"} className="object-cover" />
              )}
              <AvatarFallback className="bg-primary-gradient text-white font-semibold">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </header>
        <main className="flex-1 p-4 pb-24 md:pb-6 md:p-6 lg:p-8 bg-gradient-liquid-bg">
          {showMobileProfile && (
            <div className="mb-6 block lg:hidden">
              <div className="relative flex items-center justify-between p-4 rounded-2xl border border-glass-border/30 bg-glass-surface/35 backdrop-blur-md shadow-card">
                <div className="flex items-center gap-4">
                  {/* Avatar with primary ring */}
                  <div className="relative animate-fade-in">
                    <Avatar className="h-16 w-16 ring-2 ring-primary ring-offset-2 ring-offset-background">
                      {user?.imageUrl ? (
                        <AvatarImage src={user.imageUrl} alt={user.name || "User Avatar"} className="object-cover animate-fade-in" />
                      ) : null}
                      <AvatarFallback className="bg-primary-gradient text-white text-lg font-bold">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* User Info */}
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      {user?.name || "User"}
                    </h3>
                    {user?.referralCode && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user.referralCode);
                          toast.success("Referral code copied!");
                        }}
                        className="flex items-center gap-1.5 text-xs text-primary font-mono mt-0.5 font-semibold hover:opacity-80 active:scale-95 transition-all text-left bg-transparent border-0 p-0 cursor-pointer"
                        title="Click to copy referral code"
                      >
                        <span>REF: {user.referralCode.toUpperCase()}</span>
                        <Copy size={11} className="shrink-0" />
                      </button>
                    )}
                    <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">
                      {sponsorStr}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                      {joinedStr}
                    </span>
                  </div>
                </div>

                {/* Edit Button */}
                <Link
                  to="/dashboard/profile"
                  className="flex items-center justify-center h-10 w-10 rounded-full border border-primary-gradient/30 bg-primary-gradient text-white transition-all active:scale-95"
                >
                  <Pencil size={16} />
                </Link>
              </div>
            </div>
          )}
          {children}
        </main>

        {/* Bottom Navigation Bar for Mobile */}
        {!isAdmin && (
          <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden bg-white/90 dark:bg-[#111625]/90 border border-glass-border/30 dark:border-glass-border/10 backdrop-blur-md rounded-full shadow-[0_16px_48px_rgba(0,0,0,0.15)] flex items-center justify-around py-1 px-2 max-w-lg mx-auto select-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const content = (
                <div className="flex flex-col items-center justify-center relative">
                  <div className={tab.isActive
                    ? `rounded-full p-2 shadow-md flex items-center justify-center border bg-white dark:bg-slate-900 transition-all transform duration-300 -translate-y-3 scale-110 ${tab.borderColor} ${tab.color} ${tab.shadowColor}`
                    : "flex items-center justify-center p-1.5 transition-all text-muted-foreground/70"
                  }>
                    <Icon
                      size={20}
                      className={tab.isActive
                        ? `${tab.color} stroke-[2.5]`
                        : "stroke-[1.8]"
                      }
                    />
                  </div>
                  <span className={`text-[9px] font-bold mt-0.5 transition-all ${tab.isActive
                      ? `${tab.color} font-extrabold`
                      : "text-muted-foreground/85"
                    }`}>
                    {tab.label}
                  </span>
                </div>
              );

              if (tab.to) {
                return (
                  <Link
                    key={tab.id}
                    to={tab.to}
                    className="flex-1 flex flex-col items-center justify-center py-0.5 transition-all"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={tab.onClick}
                  className="flex-1 flex flex-col items-center justify-center py-0.5 transition-all bg-transparent border-0 cursor-pointer"
                >
                  {content}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
