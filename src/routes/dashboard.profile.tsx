import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Camera, Loader2 } from "lucide-react"; 
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
  const { user } = useAuthStore();
  const [newPassword, setNewPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const triggerFileInput = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, JPEG, PNG, and WEBP formats are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await api.post<{ secure_url: string; message: string }>("/upload/image", formData);
      if (response && response.secure_url) {
        toast.success("Profile image updated successfully!");
        
        useAuthStore.setState((state) => {
          if (state.user) {
            return {
              user: {
                ...state.user,
                imageUrl: response.secure_url
              }
            };
          }
          return {};
        });

        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload image. Please try again.");
      setPreviewUrl(null);
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            <div className="flex items-center gap-5">
              <div className="relative group cursor-pointer" onClick={triggerFileInput} title="Click to upload profile image">
                <Avatar className="h-20 w-20 ring-3 ring-primary-gradient/30 shadow-soft transition-transform group-hover:scale-105 duration-300">
                  {previewUrl ? (
                    <AvatarImage src={previewUrl} alt="Preview" className="object-cover" />
                  ) : user?.imageUrl ? (
                    <AvatarImage src={user.imageUrl} alt={user.name || "Avatar"} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-primary-gradient text-white text-2xl font-bold animate-fade-in">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera className="h-5 w-5 text-white" />
                  <span className="text-[10px] text-white font-medium mt-1">Change</span>
                </div>

                {/* Uploading overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/75 rounded-full flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">{user?.name || "Unknown User"}</div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-0 text-[10px] uppercase">
                    {user?.roles?.[0] || user?.role || "USER"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground font-mono">{user?.referralCode || "No Code"}</div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg, image/webp" 
                  onChange={handleFileChange}
                />

                {selectedFile && !isUploading && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" className="glass-button-primary text-xs h-7 px-3" onClick={handleUpload}>
                      Save Photo
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7 px-3 text-muted-foreground hover:bg-glass-surface" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                )}
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
