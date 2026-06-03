import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react"; 
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user } = useAuthStore();
  const [newPassword, setNewPassword] = useState("");

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isKycVerified = user?.kycStatus === "verified";

  const updatePasswordMutation = useMutation({
    mutationFn: (password: string) => api.put("/firebase-auth/password", { newPassword: password }),
    onSuccess: () => {
      toast.success("Password updated successfully!");
      setNewPassword("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update password");
    }
  });

  const handleUpdatePassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    updatePasswordMutation.mutate(newPassword);
  };

  return (
    <DashboardLayout title="Profile">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary-gradient/30 shadow-soft">
                <AvatarFallback className="bg-primary-gradient text-white text-lg font-bold">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">{user?.name || "Unknown User"}</div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-0 text-[10px] uppercase">
                    {user?.roles?.[0] || user?.role || "USER"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground font-mono">{user?.referralCode || "No Code"}</div>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">User Referral Code</Label>
                <Input value={user?.referralCode || ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Sponsor</Label>
                <Input value={user?.sponsor || "None"} readOnly />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Email</Label>
                <Input defaultValue={user?.email || ""} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Phone</Label>
                <Input defaultValue={user?.phone || ""} />
              </div>
            </div>
            <Button className="mt-5 glass-button-primary w-full">Save Changes</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>KYC Status</CardTitle></CardHeader>
            <CardContent>
              {isKycVerified ? (
                <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 p-4 border border-emerald-400/30">
                  <ShieldCheck className="h-6 w-6 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-sm">Verified</div>
                    <div className="text-xs text-muted-foreground">Your identity has been verified.</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400/20 to-orange-400/20 p-4 border border-amber-400/30">
                  <ShieldAlert className="h-6 w-6 text-amber-500" />
                  <div>
                    <div className="font-semibold text-sm">Unverified</div>
                    <div className="text-xs text-muted-foreground">Please complete KYC to unlock full access.</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">New Password</Label>
                <Input 
                  type="password" 
                  placeholder="Minimum 6 characters" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={!newPassword || newPassword.length < 6 || updatePasswordMutation.isPending}>
                    {updatePasswordMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Password
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will change your password immediately. You will need to use your new password next time you log in.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUpdatePassword}>Yes, Update Password</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

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
