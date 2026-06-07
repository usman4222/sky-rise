import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Upload, Sliders, Image, Eye, Save, Loader2, Link as LinkIcon } from "lucide-react";
import { GearSectionLoader } from "@/components/gear-loader";
import { bannersApi, Banner } from "@/lib/api-banners";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard/admin/banners")({
  component: AdminBannersPage,
});

function AdminBannersPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for new banner
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [order, setOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  // Edit states for existing banners
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editOrder, setEditOrder] = useState("0");

  const { data: bannersRes, isLoading } = useQuery({
    queryKey: ["adminBanners"],
    queryFn: bannersApi.getBanners,
  });

  const banners = bannersRes?.banners || [];

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => bannersApi.createBanner(formData),
    onSuccess: () => {
      toast.success("Banner uploaded successfully!");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["adminBanners"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err) || "Failed to upload banner");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; data: Partial<Banner> }) => 
      bannersApi.updateBanner(vars.id, vars.data),
    onSuccess: () => {
      toast.success("Banner updated successfully!");
      setEditingBannerId(null);
      queryClient.invalidateQueries({ queryKey: ["adminBanners"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err) || "Failed to update banner");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: bannersApi.deleteBanner,
    onSuccess: () => {
      toast.success("Banner deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminBanners"] });
    },
    onError: (err) => {
      toast.error(getFirebaseErrorMessage(err) || "Failed to delete banner");
    },
  });

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

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setTitle("");
    setLink("");
    setOrder("0");
    setIsActive(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select an image file first");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("title", title);
    formData.append("link", link);
    formData.append("order", order);
    formData.append("isActive", String(isActive));

    uploadMutation.mutate(formData);
  };

  const handleToggleActive = (banner: Banner) => {
    updateMutation.mutate({
      id: banner._id,
      data: { isActive: !banner.isActive }
    });
  };

  const startEdit = (banner: Banner) => {
    setEditingBannerId(banner._id);
    setEditTitle(banner.title || "");
    setEditLink(banner.link || "");
    setEditOrder(String(banner.order || 0));
  };

  const saveEdit = (bannerId: string) => {
    updateMutation.mutate({
      id: bannerId,
      data: {
        title: editTitle,
        link: editLink,
        order: parseInt(editOrder, 10) || 0
      }
    });
  };

  return (
    <DashboardLayout title="Banner Management">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            Manage Dashboard Banners
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload and configure promotional or announcement banners for the user dashboard home page slider.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upload New Banner Card */}
          <Card className="border-soft shadow-card lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-primary" /> Upload New Banner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div 
                  className="border-2 border-dashed border-glass-border hover:border-primary/40 rounded-xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center bg-secondary/10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {previewUrl ? (
                    <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden">
                      <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Image className="h-10 w-10 text-muted-foreground/40" />
                      <span className="text-xs font-semibold">Click to select banner image</span>
                      <span className="text-[10px]">JPG, PNG, WEBP up to 5MB (Ideal ratio 21:9)</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-semibold">Banner Title (Optional)</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. 15% ROI Launch Promo" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="link" className="text-xs font-semibold">Redirect Link (Optional)</Label>
                  <Input 
                    id="link" 
                    placeholder="e.g. /dashboard/packages" 
                    value={link} 
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="order" className="text-xs font-semibold">Display Order</Label>
                    <Input 
                      id="order" 
                      type="number" 
                      value={order} 
                      onChange={(e) => setOrder(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-2">
                    <div className="flex items-center gap-2">
                      <Switch id="active-toggle" checked={isActive} onCheckedChange={setIsActive} />
                      <Label htmlFor="active-toggle" className="text-xs font-semibold cursor-pointer">Active</Label>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={uploadMutation.isPending} 
                  className="w-full bg-primary-gradient text-white h-9 text-xs"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1.5" /> Upload Banner
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Banners Grid */}
          <Card className="border-soft shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-primary" /> Active Banners Queue ({banners.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <GearSectionLoader text="Loading Banners..." className="h-48" />
              ) : banners.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                  <Image className="h-10 w-10 text-muted-foreground/30" />
                  No banners uploaded yet. Banners uploaded here will show up as a slider on the user home dashboard.
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {banners.map((b) => (
                    <Card key={b._id} className="overflow-hidden border border-glass-border/30 bg-glass-surface/35 hover:scale-[1.01] transition-transform duration-300">
                      <div className="relative aspect-[21/9] w-full overflow-hidden bg-black/20">
                        <img src={b.imageUrl} alt={b.title || "Banner"} className="object-cover w-full h-full" />
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <Badge className={b.isActive ? "bg-emerald-500/10 text-emerald-400 border-0" : "bg-destructive/10 text-destructive border-0"}>
                            {b.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge className="bg-primary/20 text-white border-0 font-mono">
                            Order {b.order}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-4 space-y-3 text-xs">
                        {editingBannerId === b._id ? (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Title</Label>
                              <Input 
                                size={1}
                                className="h-7 text-xs" 
                                value={editTitle} 
                                onChange={(e) => setEditTitle(e.target.value)} 
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Redirect Link</Label>
                              <Input 
                                size={1}
                                className="h-7 text-xs" 
                                value={editLink} 
                                onChange={(e) => setEditLink(e.target.value)} 
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Order</Label>
                              <Input 
                                size={1}
                                type="number" 
                                className="h-7 text-xs" 
                                value={editOrder} 
                                onChange={(e) => setEditOrder(e.target.value)} 
                              />
                            </div>
                            <div className="flex gap-2 justify-end items-center pt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 min-h-0 text-xs text-muted-foreground px-3" 
                                onClick={() => setEditingBannerId(null)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-8 min-h-0 text-xs bg-primary-gradient text-white px-3 flex items-center gap-1.5 shadow-sm" 
                                onClick={() => saveEdit(b._id)}
                              >
                                <Save size={12} /> Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-1">
                              <div className="text-[10px] uppercase font-bold text-muted-foreground">Title</div>
                              <div className="font-semibold text-foreground truncate">{b.title || <span className="italic text-muted-foreground/60">No Title</span>}</div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-[10px] uppercase font-bold text-muted-foreground">Redirect Link</div>
                              <div className="flex items-center gap-1 text-primary font-medium truncate">
                                <LinkIcon size={10} />
                                <span>{b.link || <span className="italic text-muted-foreground/60">No Link</span>}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-glass-border pt-3 mt-1">
                              <div className="flex items-center gap-2">
                                <Switch checked={b.isActive} onCheckedChange={() => handleToggleActive(b)} />
                                <span className="font-semibold text-[10px]">Active</span>
                              </div>
                              <div className="flex gap-1.5">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 min-h-0 text-[10px] text-muted-foreground px-2.5"
                                  onClick={() => startEdit(b)}
                                >
                                  Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-7 min-h-0 text-[10px] text-destructive hover:bg-destructive/10 border-destructive/20 px-2"
                                    >
                                      <Trash2 size={12} />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete this banner image from Cloudinary and database storage. 
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => deleteMutation.mutate(b._id)}
                                        className="bg-destructive text-white hover:bg-[#d32f2f]"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Inline badge helper in case UI package lacks it
function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10 ${className}`}>
      {children}
    </span>
  );
}
