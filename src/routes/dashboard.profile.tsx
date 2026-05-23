import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { user } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/profile")({ component: ProfilePage });

function ProfilePage() {
  return (
    <DashboardLayout title="Profile">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary-gradient/30 shadow-soft">
                <AvatarFallback className="bg-primary-gradient text-white text-lg font-bold">AM</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold">{user.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{user.userId}</div>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label className="text-sm font-semibold">User ID</Label><Input value={user.userId} readOnly /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Sponsor ID</Label><Input value={user.sponsorId} readOnly /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Email</Label><Input defaultValue={user.email} /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Phone</Label><Input defaultValue={user.phone} /></div>
            </div>
            <Button className="mt-5 glass-button-primary w-full">Save Changes</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>KYC Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 p-4 border border-emerald-400/30">
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
                <div>
                  <div className="font-semibold text-sm">Verified</div>
                  <div className="text-xs text-muted-foreground">Your identity has been verified.</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label className="text-sm font-semibold">Current Password</Label><Input type="password" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">New Password</Label><Input type="password" /></div>
              <Button variant="outline" className="w-full">Update Password</Button>
              <div className="flex items-center justify-between border-t border-glass-border pt-4">
                <div><div className="text-sm font-medium">Two-factor Auth</div><div className="text-xs text-muted-foreground">Extra account protection</div></div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
