import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Share2, Users, Layers, Award } from "lucide-react";
import { GearSectionLoader } from "@/components/gear-loader";

import { networkApi } from "@/lib/api-network";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/dashboard/team")({ component: TeamPage });

function TeamPage() {
  const { user } = useAuthStore();
  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`;

  const [activeTab, setActiveTab] = useState<"directs" | "levels">("directs");
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  const { data: downlineData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["downline"],
    queryFn: async () => {
      const res = await networkApi.getDownline();
      return res;
    }
  });

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  const directs = downlineData?.directReferralsList || [];
  const levelDataMap = downlineData?.levelTeamData || {};
  const currentLevelMembers = levelDataMap[selectedLevel] || [];

  // Calculate statistics for selected level
  const totalLevelMembers = currentLevelMembers.length;
  const activeLevelMembers = currentLevelMembers.filter((m: any) => m.isActiveUser).length;
  const totalLevelInvested = currentLevelMembers.reduce((sum: number, m: any) => sum + (m.totalInvestments || 0), 0);
  const totalLevelWithdrawn = currentLevelMembers.reduce((sum: number, m: any) => sum + (m.totalWithdrawals || 0), 0);

  return (
    <DashboardLayout title="Referral Team">
      <div className="space-y-6">

        {/* Referral Link & Stats Header */}
        <Card className="border-glass-border shadow-soft bg-white/90 dark:bg-card/90">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Referral Program</CardTitle>
              <CardDescription>Share your link with your network to earn team matching bonuses and salary points.</CardDescription>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 cursor-pointer rounded-full" onClick={() => refetch()} disabled={isLoading || isRefetching}>
              <Users size={16} className={isRefetching ? "animate-spin" : ""} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-2.5 rounded-2xl border border-glass-border bg-secondary/50 p-2.5">
              <input readOnly value={referralLink} className="flex-1 bg-transparent text-sm outline-none px-3 text-muted-foreground select-all font-mono" />
              <div className="flex gap-2 w-full sm:w-auto">
                <Button size="sm" variant="ghost" className="flex-1 sm:flex-none h-10 border border-glass-border rounded-xl cursor-pointer" onClick={copyLink}>
                  <Copy size={14} className="mr-1.5" /> Copy
                </Button>
                <Button size="sm" className="flex-1 sm:flex-none bg-primary-gradient text-primary-foreground h-10 rounded-xl cursor-pointer shadow-soft hover:scale-[1.02] active:scale-98 transition-all" onClick={copyLink}>
                  <Share2 size={14} className="mr-1.5" /> Share
                </Button>
              </div>
            </div>

            {isLoading ? (
              <GearSectionLoader text="Loading Team Summary..." className="min-h-[100px]" />
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-glass-border bg-glass-surface p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"><Users size={18} /></div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider leading-none">Direct Referrals</div>
                    <div className="text-base sm:text-lg font-black mt-1 text-foreground leading-none">{downlineData?.directReferralsCount || 0}</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-glass-border bg-glass-surface p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-profit/10 text-profit flex items-center justify-center flex-shrink-0"><Award size={18} /></div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider leading-none">Active Directs</div>
                    <div className="text-base sm:text-lg font-black mt-1 text-profit leading-none">{downlineData?.activeDirectReferralsCount || 0}</div>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-glass-border bg-glass-surface p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0"><Layers size={18} /></div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider leading-none">Total Team Size</div>
                    <div className="text-base sm:text-lg font-black mt-1 text-foreground leading-none">{downlineData?.totalTeamSize || 0}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-glass-border pb-px">
          <button
            onClick={() => setActiveTab("directs")}
            className={`pb-2.5 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === "directs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Direct Referrals ({directs.length})
          </button>
          <button
            onClick={() => setActiveTab("levels")}
            className={`pb-2.5 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === "levels"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Multi-Level Downlines
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "directs" ? (
          <Card className="border-glass-border shadow-soft bg-white/90 dark:bg-card/90">
            <CardHeader>
              <CardTitle>Direct Referrals List</CardTitle>
              <CardDescription>Your directly sponsored level 1 team members.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {isLoading ? (
                <GearSectionLoader text="Loading Referral List..." className="min-h-[150px]" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-glass-border">
                        <TableHead className="font-extrabold uppercase text-[10px] tracking-wider">User Details</TableHead>
                        <TableHead className="font-extrabold uppercase text-[10px] tracking-wider text-right">Investments</TableHead>
                        <TableHead className="font-extrabold uppercase text-[10px] tracking-wider text-right">Withdrawals</TableHead>
                        <TableHead className="font-extrabold uppercase text-[10px] tracking-wider text-center">Status</TableHead>
                        <TableHead className="font-extrabold uppercase text-[10px] tracking-wider text-right">Joined Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {directs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs font-medium">
                            No direct referrals yet. Share your link to start building your team!
                          </TableCell>
                        </TableRow>
                      ) : directs.map((r: any) => (
                        <TableRow key={r.id} className="border-glass-border/40 hover:bg-secondary/15">
                          <TableCell>
                            <div className="font-bold text-foreground">{r.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{r.email}</div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground font-mono text-xs">
                            ${(r.totalInvestments || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-muted-foreground font-mono text-xs">
                            ${(r.totalWithdrawals || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col gap-1 items-center">
                              <Badge className={`px-1.5 py-0.5 rounded-md text-[9px] border-0 capitalize font-extrabold ${r.isActiveUser ? "bg-profit/15 text-profit" : "bg-orange-500/15 text-orange-500"}`}>
                                {r.isActiveUser ? "Active (Invested)" : "Inactive"}
                              </Badge>
                              {r.status === "suspended" && (
                                <Badge className="px-1.5 py-0.5 rounded-md text-[9px] border-0 bg-destructive/15 text-destructive font-extrabold">
                                  Suspended
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground font-medium">
                            {new Date(r.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">

            {/* Level Selector Bar */}
            <div className="flex gap-1.5 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => {
                const count = (levelDataMap[lvl] || []).length;
                const isUnlocked = user?.unlockedLevels?.includes(lvl);
                return (
                  <Button
                    key={lvl}
                    variant={selectedLevel === lvl ? "default" : "outline"}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`h-9 px-3 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                      selectedLevel === lvl
                        ? "bg-primary-gradient text-primary-foreground border-0 shadow-soft"
                        : "border-glass-border text-foreground bg-white/70 hover:bg-white"
                    } ${!isUnlocked ? "opacity-60" : ""}`}
                  >
                    Level {lvl}
                    <span className={`ml-1 px-1.5 py-0.2 bg-foreground/10 text-[9px] rounded-full font-black ${selectedLevel === lvl ? "text-primary-foreground" : "text-muted-foreground"}`}>
                      {count}
                    </span>
                  </Button>
                );
              })}
            </div>

            {/* Level Data Summary Grid */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <Card className="border-glass-border p-4 bg-white/70 dark:bg-card/70 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Level Members</span>
                <span className="text-xl font-black text-foreground mt-2 leading-none">{totalLevelMembers}</span>
              </Card>
              <Card className="border-glass-border p-4 bg-white/70 dark:bg-card/70 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Active Members</span>
                <span className="text-xl font-black text-profit mt-2 leading-none">{activeLevelMembers}</span>
              </Card>
              <Card className="border-glass-border p-4 bg-white/70 dark:bg-card/70 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Total Invested</span>
                <span className="text-xl font-black text-foreground mt-2 leading-none font-mono">${totalLevelInvested.toFixed(2)}</span>
              </Card>
              <Card className="border-glass-border p-4 bg-white/70 dark:bg-card/70 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Total Withdrawn</span>
                <span className="text-xl font-black text-muted-foreground mt-2 leading-none font-mono">${totalLevelWithdrawn.toFixed(2)}</span>
              </Card>
            </div>

            {/* Level Members Details List */}
            <Card className="border-glass-border shadow-soft bg-white/90 dark:bg-card/90">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Level {selectedLevel} Members List</CardTitle>
                    <CardDescription>Members residing at downline depth level {selectedLevel}.</CardDescription>
                  </div>
                  {!user?.unlockedLevels?.includes(selectedLevel) && (
                    <Badge variant="destructive" className="border-0 font-extrabold uppercase text-[9px] tracking-wider py-0.5 px-2">
                      Locked Deep Commission
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                {isLoading ? (
                  <GearSectionLoader text="Loading Downline Level List..." className="min-h-[150px]" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-glass-border">
                          <TableHead className="font-extrabold uppercase text-[10px] tracking-wider">User Details</TableHead>
                          <TableHead className="font-extrabold uppercase text-[10px] tracking-wider text-right">Investments</TableHead>
                          <TableHead className="font-extrabold uppercase text-[10px] tracking-wider text-right">Withdrawals</TableHead>
                          <TableHead className="font-extrabold uppercase text-[10px] tracking-wider text-center">Status</TableHead>
                          <TableHead className="font-extrabold uppercase text-[10px] tracking-wider text-right">Joined Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentLevelMembers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs font-medium">
                              No team members at downline level {selectedLevel} yet.
                            </TableCell>
                          </TableRow>
                        ) : currentLevelMembers.map((r: any) => (
                          <TableRow key={r.id} className="border-glass-border/40 hover:bg-secondary/15">
                            <TableCell>
                              <div className="font-bold text-foreground">{r.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{r.email}</div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-foreground font-mono text-xs">
                              ${(r.totalInvestments || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-muted-foreground font-mono text-xs">
                              ${(r.totalWithdrawals || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col gap-1 items-center">
                                <Badge className={`px-1.5 py-0.5 rounded-md text-[9px] border-0 capitalize font-extrabold ${r.isActiveUser ? "bg-profit/15 text-profit" : "bg-orange-500/15 text-orange-500"}`}>
                                  {r.isActiveUser ? "Active (Invested)" : "Inactive"}
                                </Badge>
                                {r.status === "suspended" && (
                                  <Badge className="px-1.5 py-0.5 rounded-md text-[9px] border-0 bg-destructive/15 text-destructive font-extrabold">
                                    Suspended
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground font-medium">
                              {new Date(r.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
