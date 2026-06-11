import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, X } from "lucide-react";
import { GearSpinner } from "@/components/gear-loader";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();
  const [newPassword, setNewPassword] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Current avatar: prefer uploaded imageUrl, then avatarUrl, then photoUrl
  const currentAvatar = user?.imageUrl || user?.avatarUrl || user?.photoUrl || null;

  // ─── Avatar Upload Mutation ───────────────────────────────────────────────
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);  // Must match Multer's .single('image') config

      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const stored = window.localStorage.getItem("auth-storage");
      const parsed = stored ? JSON.parse(stored) : null;
      const authToken = parsed?.state?.token || token;

      const response = await fetch(`${BASE_URL}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      const newImageUrl = data?.data?.imageUrl || data?.data?.secure_url;
      if (newImageUrl && user && token) {
        // Update the user in auth store immediately
        const updatedUser = { ...user, imageUrl: newImageUrl, avatarUrl: newImageUrl };
        setAuth(token, updatedUser, user.roles || []);
        toast.success("Profile photo updated successfully!");
      }
      setPreviewUrl(null);
      setSelectedFile(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload image");
      setPreviewUrl(null);
      setSelectedFile(null);
    },
  });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WebP, etc.)");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadAvatarMutation.mutate(selectedFile);
  };

  const handleCancelPreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
        {/* ─── Personal Information Card ─── */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent>
            {/* Avatar Upload Section */}
            <div className="flex items-start gap-5 mb-6">
              {/* Avatar with camera overlay */}
              <div className="relative group flex-shrink-0">
                <Avatar className="h-20 w-20 ring-2 ring-primary/20 shadow-soft">
                  {previewUrl ? (
                    <AvatarImage src={previewUrl} alt="Preview" />
                  ) : currentAvatar ? (
                    <AvatarImage
                      src={currentAvatar}
                      alt={user?.name || "User avatar"}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary-gradient text-white text-xl font-bold uppercase">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Camera click overlay */}
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadAvatarMutation.isPending}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                  title="Change photo"
                >
                  {uploadAvatarMutation.isPending ? (
                    <GearSpinner className="h-5 w-5 text-white" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Name/role + upload controls */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-lg font-bold">{user?.name || "Unknown User"}</div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-0 text-[10px] uppercase">
                    {user?.roles?.[0] || user?.role || "USER"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">{user?.referralCode || "No Code"}</div>

                {/* Upload action buttons — shown when file selected */}
                {selectedFile ? (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={handleUpload}
                      disabled={uploadAvatarMutation.isPending}
                      className="h-8 bg-[#00693e] hover:bg-[#005530] text-white text-xs font-bold gap-1.5"
                    >
                      {uploadAvatarMutation.isPending ? (
                        <GearSpinner className="h-3 w-3" />
                      ) : (
                        <Upload className="h-3 w-3" />
                      )}
                      {uploadAvatarMutation.isPending ? "Uploading…" : "Save Photo"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelPreview}
                      disabled={uploadAvatarMutation.isPending}
                      className="h-8 text-xs gap-1"
                    >
                      <X className="h-3 w-3" /> Cancel
                    </Button>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                      {selectedFile.name}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploadAvatarMutation.isPending}
                    className="mt-2 text-[11px] text-[#00693e] dark:text-[#00e676] font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="h-3 w-3" />
                    {currentAvatar ? "Change profile photo" : "Upload profile photo"}
                  </button>
                )}

                <p className="text-[10px] text-muted-foreground mt-1">
                  JPG, PNG or WebP · Max 5 MB
                </p>
              </div>
            </div>

            {/* Info fields */}
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold block mb-2">User Referral Code</Label>
                <Input value={user?.referralCode || ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold block mb-2">Sponsor</Label>
                <Input value={user?.sponsor || "None"} readOnly />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold block mb-2">Email</Label>
                <Input defaultValue={user?.email || ""} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold block mb-2">Phone</Label>
                <Input defaultValue={user?.phone || ""} />
              </div>
            </div>
            <Button className="mt-5 glass-button-primary w-full">Save Changes</Button>
          </CardContent>
        </Card>

        {/* ─── Right Column: Security Card ─── */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold block mb-2">New Password</Label>
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
                    {updatePasswordMutation.isPending ? <GearSpinner className="mr-2 h-4 w-4" /> : null}
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
                <div>
                  <div className="text-sm font-medium">Two-factor Auth</div>
                  <div className="text-xs text-muted-foreground">Extra account protection</div>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
