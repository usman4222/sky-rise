import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, Wallet, TrendingUp, Users, Layers,
  Gift, ArrowLeftRight, Crown, Trophy, ArrowDownToLine, Receipt,
  User, LifeBuoy, LogOut, Bell, Search, Menu, X, CreditCard, Megaphone,
  Home, Clock, Send, MessageCircle, Award, Sparkles, ArrowLeft
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
  { to: "/dashboard/team-bonus", label: "Team Building Bonus", icon: Sparkles },
  { to: "/dashboard/wallet", label: "Bonus Wallet", icon: Gift },
  { to: "/dashboard/levels", label: "Level Income", icon: Layers },
  { to: "/dashboard/transfer", label: "Transfer Bonus", icon: ArrowLeftRight },
  { to: "/dashboard/weekly-salary", label: "VIP Salary Claims", icon: Crown },
  { to: "/dashboard/achievements", label: "Achievement Rewards", icon: Trophy },
  { to: "/dashboard/upline-rewards", label: "Upline Team Rewards", icon: Award },
  { to: "/dashboard/withdraw", label: "Withdraw Funds", icon: ArrowDownToLine },
  { to: "/dashboard/payment-methods", label: "Saved Accounts", icon: CreditCard },
  { to: "/dashboard/transactions", label: "Transactions", icon: Receipt },
  { to: "/dashboard/profile", label: "Profile", icon: User },
  { to: "/dashboard/support", label: "Support", icon: LifeBuoy, hasAdmin: true },
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

  const userNav = [
    ...nav.filter(n => !isAdmin || n.hasAdmin),
    ...(user?.favorConditionEnabled ? [{ to: "/dashboard/favor" as any, label: "Leader Condition", icon: Award, exact: false, hasAdmin: false }] : [])
  ];

  return (
    <aside className="flex h-full w-64 flex-col glass-sidebar glass-blur-md">
      <div className="flex items-center justify-between px-6 py-5 border-b border-glass-border">
        <Link to="/" onClick={onClose}>
          <SkyRiseLogo variant="sidebar" className="h-9 w-auto" />
        </Link>
        {onClose && <button onClick={onClose} className="lg:hidden hover:opacity-70 transition"><X size={18} /></button>}
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {userNav.map((n) => {
          const active = n.exact ? pathname === n.to : (pathname === n.to || pathname.startsWith(n.to + "/"));
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
              { to: "/dashboard/admin/balance-adjust", label: "Adjust User Balance", icon: Wallet },
              { to: "/dashboard/admin/withdrawals", label: "Verify Withdrawals Queue", icon: ArrowDownToLine },
              { to: "/dashboard/admin/weekly-salary", label: "Verify Salary Queue", icon: Crown },
              { to: "/dashboard/admin/announcements", label: "Manage Announcements", icon: Megaphone },
              { to: "/dashboard/admin/balance-history", label: "Admin Balance History", icon: Receipt },
            ].map((n) => {
              const active = pathname === n.to || pathname.startsWith(n.to + "/");
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

        {/* {!isAdmin && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-[#001a0d]/98 to-[#000d07]/98 border border-[#f3ba2f]/22 relative overflow-hidden group shadow-[0_8px_24px_rgba(0,0,0,0.4)] text-left transition-all duration-300 hover:border-[#f3ba2f]/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(0,230,118,0.08)]">
            <div className="relative z-10 space-y-3">
              <h3 className="text-xs font-black text-white tracking-wider uppercase flex items-center gap-1.5">
                <Crown size={12} className="text-[#f3ba2f] animate-pulse" /> Grow With SkyRise
              </h3>
              <p className="text-[10px] text-emerald-200/70 leading-relaxed">
                Smart investments in Stock Market for Stable Daily Returns
              </p>

              <div className="overflow-hidden rounded-xl border border-[#00693e]/40 bg-[#000a05]/70 p-1 flex items-center justify-center shadow-inner relative group-hover:border-[#00e676]/30 group-hover:shadow-[0_0_12px_rgba(0,230,118,0.12)] transition-all duration-300">
                <img
                  src={chargingBull}
                  alt="Charging Bull"
                  className="w-full h-24 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <Link to="/dashboard/packages" className="block w-full" onClick={() => playSound.playClick()}>
                <Button className="w-full bg-gradient-to-r from-[#f3ba2f] to-[#ffe47a] hover:from-[#ffe47a] hover:to-[#f3ba2f] text-[#001a0d] font-black text-[10px] uppercase tracking-wider h-8.5 rounded-xl shadow-[0_4px_14px_rgba(243,186,47,0.30)] cursor-pointer hover:scale-[1.02] active:scale-98 transition-all duration-200">
                  Invest Now
                </Button>
              </Link>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00693e]/12 via-transparent to-[#f3ba2f]/6 opacity-70 pointer-events-none" />
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#00e676]/8 rounded-full blur-xl pointer-events-none" />
          </div>
        )} */}

        {/* Official Social Channels */}
        <div className="pt-4 mt-4 border-t border-glass-border/30 space-y-2">
          <div className="px-4 text-[10px] font-bold text-foreground/45 tracking-wider uppercase">
            Official Channels
          </div>
          <div className="flex gap-2 px-2">
            <a
              href="https://t.me/SkyRiseFuture"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-glass-border bg-glass-surface-soft py-2 px-1 text-xs font-semibold text-foreground/80 hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 transition-all cursor-pointer select-none"
            >
              <Send size={13} className="text-blue-500" />
              <span>Telegram</span>
            </a>
            <a
              href="https://whatsapp.com/channel/0029VbCfERo1SWswjFBAVt10"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-glass-border bg-glass-surface-soft py-2 px-1 text-xs font-semibold text-foreground/80 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-all cursor-pointer select-none"
            >
              <MessageCircle size={13} className="text-emerald-500" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

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

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const currentNav = nav.find(n => n.exact ? pathname === n.to : pathname.startsWith(n.to)) ||
    (pathname.startsWith("/dashboard/admin") ? { label: "Admin", icon: Users } : null);
  const IconComponent = currentNav?.icon;

  let iconBgClass = "bg-[#0e9f6e] shadow-[0_4px_12px_rgba(14,159,110,0.25)]";
  if (currentNav) {
    const label = currentNav.label.toLowerCase();
    if (label.includes("withdraw") || label.includes("salary") || label.includes("achievement") || label.includes("saved") || label.includes("profile") || label.includes("upline")) {
      iconBgClass = "bg-[#f3ba2f] shadow-[0_4px_12px_rgba(243,186,47,0.25)]";
    } else if (label.includes("support")) {
      iconBgClass = "bg-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.25)]";
    } else if (label.includes("package") || label.includes("investment") || label.includes("roi")) {
      iconBgClass = "bg-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.25)]";
    }
  }

  const bottomNavItems = [
    { to: "/dashboard", label: "Home", icon: Home, exact: true },
    { to: "/dashboard/packages", label: "Invest/Plans", icon: Package },
    { to: "/dashboard/wallet", label: "Wallet", icon: Wallet },
    { to: "/dashboard/team", label: "Teams", icon: Users },
  ];

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
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-[#f8fdf9]/96 dark:bg-[#060f08]/96 border border-[#c2ddd2] dark:border-[#00e676]/12 rounded-[24px] sm:rounded-[28px] shadow-[0_8px_24px_rgba(0,105,62,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_20px_rgba(0,230,118,0.06)] px-4 py-2 sm:px-6 sm:py-2.5 my-3 mx-4">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden hover:opacity-70 transition text-foreground" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            {IconComponent && (
              <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white ${iconBgClass} flex-shrink-0 transition-transform duration-300 hover:scale-105`}>
                <IconComponent size={16} className="stroke-[2.5]" />
              </div>
            )}
            <h1 className="text-sm sm:text-base font-black text-[#0e1b15] dark:text-[#E8F5E9] truncate tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* {!isAdmin && (
              <div className="flex flex-col text-right justify-center">
                <span className="text-[9px] font-extrabold text-[#2E6F52] dark:text-emerald-400/80 uppercase tracking-widest leading-none">Wallet</span>
                <span className="text-sm sm:text-base font-black text-[#0e9f6e] dark:text-[#10b981] font-sans mt-1 leading-none">${walletBalance.toFixed(2)}</span>
              </div>
            )} */}
            <Link to="/dashboard/profile" className="flex flex-col items-center min-w-[56px] group cursor-pointer focus:outline-none">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-[#00693e]/20 shadow-sm transition-transform hover:scale-105 group-hover:scale-105 duration-200">
                {(user?.imageUrl || user?.avatarUrl || user?.photoUrl) ? (
                  <AvatarImage
                    src={user.imageUrl || user.avatarUrl || user.photoUrl}
                    alt={user?.name || "User avatar"}
                  />
                ) : null}
                <AvatarFallback className="bg-primary-gradient text-white font-bold text-xs uppercase">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[9px] font-semibold text-[#668C7A] dark:text-[#8ca99e] mt-1 leading-none tracking-tight text-center max-w-[70px] truncate group-hover:text-[#0e9f6e] transition-colors">
                {user?.name || "Zubair"}
              </span>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 md:p-6 lg:p-8 bg-gradient-liquid-bg">
          {pathname !== "/dashboard" && pathname !== "/dashboard/" && (
            <button
              onClick={() => {
                playSound.playClick();
                window.history.back();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E6F52] dark:text-emerald-400/90 hover:opacity-80 transition-opacity mb-4 group cursor-pointer focus:outline-none animate-in fade-in duration-200"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>
          )}
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (Floating Pill Layout) */}
        {!isAdmin && (
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-white/95 dark:bg-[#0c1b15]/95 backdrop-blur-md border border-glass-border/40 h-16 rounded-[28px] flex justify-between items-center shadow-[0_12px_35px_rgba(8,26,18,0.12)] px-2">
            {bottomNavItems.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="relative flex flex-col items-center justify-center flex-1 h-full select-none"
                >
                  {active ? (
                    <>
                      <div className="active-nav-circle text-primary">
                        <Icon size={24} className="stroke-[2.2]" />
                      </div>
                      <span className="text-[10px] font-extrabold text-primary mt-8 transition-all duration-300">
                        {item.label}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="text-muted-foreground/80 hover:text-muted-foreground transition-colors">
                        <Icon size={20} className="stroke-[1.8]" />
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground/80 mt-1 transition-all duration-300">
                        {item.label}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
            <button
              onClick={() => setOpen(true)}
              className="relative flex flex-col items-center justify-center flex-1 h-full cursor-pointer select-none"
            >
              <div className="text-muted-foreground/80 hover:text-muted-foreground transition-colors">
                <Menu size={20} className="stroke-[1.8]" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground/80 mt-1">
                More
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
