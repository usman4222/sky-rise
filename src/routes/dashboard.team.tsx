import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Share2, Loader2 } from "lucide-react";

import { networkApi } from "@/lib/api-network";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/dashboard/team")({ component: TeamPage });

function TeamPage() {
  const { user } = useAuthStore();
  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`;

  const { data: downlineData, isLoading } = useQuery({
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

  return (
    <DashboardLayout title="Referral Team">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-soft shadow-card lg:col-span-3">
          <CardHeader><CardTitle>Your Referral Link</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-soft bg-secondary p-2.5">
              <input readOnly value={referralLink} className="flex-1 bg-transparent text-sm outline-none px-2" />
              <Button size="sm" variant="ghost" onClick={copyLink}><Copy size={14} /></Button>
              <Button size="sm" className="bg-primary-gradient text-primary-foreground" onClick={copyLink}>
                <Share2 size={14} className="mr-1" /> Share
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-soft bg-white p-4">
                  <div className="text-xs text-muted-foreground">Direct Referrals</div>
                  <div className="text-lg font-bold">{downlineData?.directReferralsCount || 0}</div>
                </div>
                <div className="rounded-xl border border-soft bg-white p-4">
                  <div className="text-xs text-muted-foreground">Active Directs (Invested)</div>
                  <div className="text-lg font-bold text-profit">{downlineData?.activeDirectReferralsCount || 0}</div>
                </div>
                <div className="rounded-xl border border-soft bg-white p-4">
                  <div className="text-xs text-muted-foreground">Total Team Size (Global Downline)</div>
                  <div className="text-lg font-bold">{downlineData?.totalTeamSize || 0}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-soft shadow-card">
        <CardHeader><CardTitle>Direct Referrals List</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Account Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No direct referrals yet. Share your link!</TableCell></TableRow>
                ) : directs.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.email}</TableCell>
                    <TableCell>{new Date(r.joinedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={r.kycStatus === "approved" ? "bg-emerald-500/10 text-emerald-500 border-0 capitalize" : "bg-gold/15 text-gold border-0 capitalize"}>
                        {r.kycStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={r.status === "active" ? "bg-profit/10 text-profit border-0 capitalize" : "bg-destructive/10 text-destructive border-0 capitalize"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
