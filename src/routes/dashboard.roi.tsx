import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Timer } from "lucide-react";
import { GearSectionLoader } from "@/components/gear-loader";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { investmentsApi } from "@/lib/api-investments";
import { SimplePagination } from "@/components/simple-pagination";

export const Route = createFileRoute("/dashboard/roi")({ component: RoiPage });

function RoiPage() {
  // 1. Fetch active investments to calculate current running ROI details
  const { data: investments = [], isLoading: isInvestmentsLoading } = useQuery({
    queryKey: ["myInvestments"],
    queryFn: async () => {
      const res = await investmentsApi.getMyInvestments();
      return res.investments || [];
    },
    refetchOnWindowFocus: false,
  });

  const [page, setPage] = useState(1);

  // 2. Fetch ROI payouts history list
  const { data: roiHistoryData, isLoading: isRoiHistoryLoading } = useQuery({
    queryKey: ["roiHistory", page],
    queryFn: () => investmentsApi.getRoiHistory(page, 10),
    refetchOnWindowFocus: false,
  });

  const isLoading = isInvestmentsLoading || isRoiHistoryLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Daily ROI">
        <GearSectionLoader text="Loading ROI Data..." className="h-[350px]" />
      </DashboardLayout>
    );
  }

  const activeInvestments = investments.filter((i: any) => i.status === "active");
  const roiHistory = roiHistoryData?.roiHistory || [];

  // Calculate total daily ROI expected today based on current active packages
  const todayProjRoi = activeInvestments.reduce((acc: number, cur: any) => {
    const dailyRate = cur.currentRoi || 0;
    const amount = cur.amount || 0;
    return acc + (amount * (dailyRate / 100));
  }, 0);

  // Highest active ROI rate currently running
  const currentMaxRoiRate = activeInvestments.length > 0 
    ? Math.max(...activeInvestments.map((i: any) => i.currentRoi || 0))
    : 0;

  // Format Recharts AreaChart data from backend ROI history
  // If empty, show a blank chart. Otherwise take up to latest 7 entries.
  const chartData = roiHistory.slice(0, 10).reverse().map((r: any) => ({
    day: new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    amount: r.amount
  }));

  // Determine if user has any packages requiring manual claiming
  const hasManualClaimPackages = activeInvestments.some((i: any) => i.package?.manualClaim === true);

  return (
    <DashboardLayout title="Daily ROI">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-soft shadow-card lg:col-span-1">
          <CardContent className="p-6">
            <div className="rounded-xl bg-profit-gradient p-5 text-white">
              <div className="text-xs opacity-85">Today's Est. Return</div>
              <div className="text-3xl font-bold">${todayProjRoi.toFixed(2)}</div>
              <div className="mt-2 text-xs opacity-85">Peak ROI Rate: {currentMaxRoiRate}% Daily</div>
              <div className="mt-1 flex items-center gap-1 text-xs opacity-85">
                <Timer size={12} /> Auto-compounding at 00:00 UTC
              </div>
            </div>
            {hasManualClaimPackages ? (
              <>
                <Button className="mt-4 w-full bg-primary-gradient text-primary-foreground">
                  Claim Daily ROI
                </Button>
                <Alert className="mt-4 border-gold/30 bg-gold/10">
                  <AlertTriangle className="h-4 w-4 text-gold" />
                  <AlertTitle>Manual claim window</AlertTitle>
                  <AlertDescription className="text-xs">
                    Manual ROI must be claimed within 24 hours or it may expire.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div className="mt-4 rounded-xl border border-glass-border p-4 text-center text-xs text-muted-foreground bg-secondary/30">
                🌱 Payouts are fully automated. Auto-reinvest packages compound principal, and cash packages are credited to your ROI wallet daily.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-soft shadow-card lg:col-span-2">
          <CardHeader><CardTitle>Projected vs Payout Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Active package investments will start plotting payouts here daily.
                </div>
              ) : (
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="r" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAF1FB" />
                    <XAxis dataKey="day" fontSize={11} stroke="#64748B" />
                    <YAxis fontSize={11} stroke="#64748B" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #DDE8F5" }} />
                    <Area type="monotone" dataKey="amount" stroke="#2563EB" fill="url(#r)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-soft shadow-card">
        <CardHeader><CardTitle>ROI Transactions Logs</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>ROI %</TableHead>
                <TableHead>ROI Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roiHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                    No daily ROI payouts recorded yet. Buy an investment package to start receiving daily returns.
                  </TableCell>
                </TableRow>
              ) : (
                roiHistory.map((r: any) => (
                  <TableRow key={r._id}>
                    <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{r.userInvestment?.package?.name || "Standard Share"}</TableCell>
                    <TableCell>{r.roiPercent}%</TableCell>
                    <TableCell className="font-semibold text-profit">${r.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={r.isCompounded ? "bg-profit/10 text-profit border-0" : "bg-primary/10 text-primary border-0"}>
                        {r.isCompounded ? "Compounded" : "Wallet Credited"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <SimplePagination
            currentPage={page}
            totalPages={roiHistoryData?.pagination?.totalPages || 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
