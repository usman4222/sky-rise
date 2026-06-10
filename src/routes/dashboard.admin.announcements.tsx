import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Image as ImageIcon, Link as LinkIcon, FileText, Upload, Pencil, X, Eye, EyeOff, Save, Layers } from "lucide-react";
import { announcementsApi, type Announcement } from "@/lib/api-announcements";
import { GearSpinner } from "@/components/gear-loader";
import { playSound } from "@/lib/sounds";

export const Route = createFileRoute("/dashboard/admin/announcements")({
  component: AdminAnnouncementsPage,
});

function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Announcement | null>(null);
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null);

  // Fetch announcements/banners
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementsApi.getAnnouncements(),
  });

  // Sort announcements by order ascending, then by createdAt descending
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const resetForm = () => {
    setTitle("");
    setLink("");
    setImageUrl("");
    setOrder(0);
    setIsActive(true);
    setSelectedFile(null);
    setEditingSlide(null);
  };

  const handleEditClick = (slide: Announcement) => {
    setEditingSlide(slide);
    setTitle(slide.title || "");
    setLink(slide.link || "");
    setImageUrl(slide.imageUrl || "");
    setOrder(slide.order ?? 0);
    setIsActive(slide.isActive !== false);
    setSelectedFile(null);
    playSound.playClick();
  };

  // Create slide mutation
  const createMutation = useMutation({
    mutationFn: (data: {
      imageUrl?: string;
      title?: string;
      link?: string;
      order?: number;
      isActive?: boolean;
      imageFile?: File | null;
    }) => announcementsApi.createAnnouncement(data),
    onSuccess: () => {
      toast.success("Announcement slide added successfully!");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      playSound.playSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add slide");
    },
  });

  // Update slide mutation
  const updateMutation = useMutation({
    mutationFn: (variables: {
      id: string;
      data: {
        imageUrl?: string;
        title?: string;
        link?: string;
        order?: number;
        isActive?: boolean;
        imageFile?: File | null;
      };
    }) => announcementsApi.updateAnnouncement(variables.id, variables.data),
    onSuccess: () => {
      toast.success("Announcement slide updated successfully!");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      playSound.playSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update slide");
    },
  });

  // Toggle active status mutation
  const toggleMutation = useMutation({
    mutationFn: (variables: { id: string; isActive: boolean }) =>
      announcementsApi.updateAnnouncement(variables.id, { isActive: variables.isActive }),
    onSuccess: () => {
      toast.success("Slide visibility updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      playSound.playChime();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update visibility");
    },
  });

  // Delete slide mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.deleteAnnouncement(id),
    onSuccess: () => {
      toast.success("Slide deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      playSound.playChime();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete slide");
    },
  });

  // Handle local image file upload and convert to base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 3MB
    if (file.size > 3 * 1024 * 1024) {
      toast.error("File is too large! Please choose an image under 3MB.");
      return;
    }

    setUploadingFile(true);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
        toast.success("Image selected successfully!");
      }
      setUploadingFile(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
      setUploadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl && !selectedFile) {
      toast.error("Please provide an image URL or upload an image file!");
      return;
    }

    const payload = {
      title,
      link,
      order,
      isActive,
      imageUrl: selectedFile ? undefined : imageUrl,
      imageFile: selectedFile,
    };

    if (editingSlide) {
      updateMutation.mutate({ id: editingSlide.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout title="Manage Announcements">
      {/* Component Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Slide Upload/Add/Edit Form */}
        <Card className="border-soft shadow-card lg:col-span-1 h-fit bg-white/90 dark:bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-foreground">
              {editingSlide ? "Edit Banner Slide" : "Add New Slide"}
            </CardTitle>
            {editingSlide && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              >
                <X size={15} />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <FileText size={13} /> Slide Title (Optional)
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Join the KSE 100 Referral Program!"
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <LinkIcon size={13} /> Action Link (Optional)
                </Label>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="e.g. /dashboard/packages"
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Layers size={13} /> Display Order
                  </Label>
                  <Input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                    placeholder="e.g. 0"
                    className="rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-glass-border text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer accent-[#0e9f6e]"
                    />
                    <span>Active / Visible</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon size={13} /> Image Option A: Upload File
                </Label>
                <div className="relative flex items-center justify-center border-2 border-dashed border-glass-border hover:border-primary/50 transition-colors rounded-xl p-4 bg-secondary/20 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center space-y-1 pointer-events-none">
                    <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] block font-medium text-muted-foreground">
                      {uploadingFile
                        ? "Reading image..."
                        : selectedFile
                        ? `Selected: ${selectedFile.name.slice(0, 18)}...`
                        : "Upload local image (Max 3MB)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-glass-border-soft"></div>
                <span className="flex-shrink mx-2 text-[9px] uppercase tracking-wider text-muted-foreground font-bold">OR</span>
                <div className="flex-grow border-t border-glass-border-soft"></div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon size={13} /> Image Option B: Direct Image URL
                </Label>
                <Input
                  value={imageUrl && imageUrl.startsWith("data:") ? "" : imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setSelectedFile(null); // Clear selected file when user writes a URL
                  }}
                  placeholder="e.g. https://domain.com/banner.png"
                  className="rounded-xl h-10 text-xs"
                  disabled={!!selectedFile}
                />
                {imageUrl && imageUrl.startsWith("data:") && (
                  <div className="flex justify-between items-center bg-emerald-500/10 text-emerald-500 p-2 rounded-lg text-[10px] font-semibold mt-1">
                    <span>Local image selected for upload</span>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl("");
                        setSelectedFile(null);
                      }}
                      className="underline font-bold cursor-pointer"
                    >
                      Clear File
                    </button>
                  </div>
                )}
              </div>

              {imageUrl && (
                <div className="space-y-1.5 mt-2">
                  <span className="text-[10px] font-bold text-muted-foreground block uppercase">Preview:</span>
                  <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-glass-border bg-zinc-900">
                    <img src={imageUrl} alt="Slide Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending || uploadingFile || (!imageUrl && !selectedFile)}
                className="w-full mt-4 bg-primary-gradient text-white text-xs h-10 rounded-xl font-bold hover:scale-[1.01] active:scale-98 transition-all"
              >
                {isPending ? (
                  <>
                    <GearSpinner className="mr-2 h-4 w-4" /> Processing...
                  </>
                ) : editingSlide ? (
                  <>
                    <Save size={16} className="mr-1.5" /> Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-1.5" /> Add to Slider
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Active Slides Gallery */}
        <Card className="border-soft shadow-card lg:col-span-2 bg-white/90 dark:bg-card/90">
          <CardHeader>
            <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-foreground">
              Current Announcement Slides ({announcements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <GearSpinner className="h-8 w-8 text-primary" />
                <span className="text-xs text-muted-foreground mt-2">Loading slides from DB...</span>
              </div>
            ) : sortedAnnouncements.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground font-medium border border-dashed border-glass-border rounded-2xl">
                No active announcement slides. Add a slide on the left to start.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 rounded-2xl">
                {sortedAnnouncements.map((slide: Announcement) => (
                  <Card
                    key={slide.id}
                    className={`overflow-hidden rounded-2xl border transition-all flex flex-col justify-between ${
                      slide.isActive !== false ? "border-glass-border shadow-soft" : "border-dashed border-zinc-300 dark:border-zinc-700 opacity-60"
                    }`}
                  >
                    <div className="aspect-[16/9] w-full relative bg-zinc-900 flex items-center justify-center rounded-t-2xl overflow-hidden">
                      <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                      {slide.id.startsWith("default-") && (
                        <span className="absolute top-2 left-2 bg-[#f3ba2f] text-[#002b1c] font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                          Default Slide
                        </span>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className="bg-black/70 backdrop-blur-sm text-white font-mono text-[9px] px-2 py-0.5 rounded-md">
                          Order: {slide.order ?? 0}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4 flex flex-col justify-between flex-1 space-y-3">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-foreground leading-tight">
                            {slide.title || "Untitled Slide"}
                          </h4>
                          {/* Toggle Active Status */}
                          <button
                            type="button"
                            disabled={toggleMutation.isPending}
                            onClick={() =>
                              toggleMutation.mutate({
                                id: slide.id,
                                isActive: slide.isActive === false,
                              })
                            }
                            className={`flex-shrink-0 cursor-pointer p-1 rounded-md transition-colors ${
                              slide.isActive !== false
                                ? "text-emerald-500 hover:bg-emerald-500/10"
                                : "text-zinc-400 hover:bg-zinc-500/10"
                            }`}
                            title={slide.isActive !== false ? "Click to Deactivate" : "Click to Activate"}
                          >
                            {slide.isActive !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                        </div>

                        {slide.link && (
                          <div className="text-[10px] font-medium text-muted-foreground mt-1 flex items-center gap-1">
                            <LinkIcon size={10} /> {slide.link}
                          </div>
                        )}
                        <div className="text-[9px] text-muted-foreground/60 mt-1 flex justify-between items-center">
                          <span>
                            Added: {new Date(slide.createdAt).toLocaleDateString()}
                          </span>
                          <span className={`text-[9px] font-bold ${slide.isActive !== false ? "text-emerald-500" : "text-zinc-400"}`}>
                            {slide.isActive !== false ? "● Visible" : "○ Hidden"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(slide)}
                          className="gap-1.5 h-9 rounded-xl text-[10px] font-bold border border-glass-border hover:bg-secondary/40"
                        >
                          <Pencil size={12} />
                          Edit
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            setSlideToDelete(slide.id);
                            playSound.playNotify();
                          }}
                          className="gap-1.5 h-9 rounded-xl text-[10px] font-bold"
                        >
                          <Trash2 size={12} />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom Confirmation Modal (Rendered inside body via createPortal to guarantee it sits on top of all stacking contexts) */}
      {slideToDelete && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <Card className="w-full max-w-sm border border-glass-border bg-white/95 dark:bg-zinc-900/95 shadow-2xl p-6 rounded-2xl mx-4 transform scale-100 transition-transform animate-[scaleUp_0.2s_ease-out]">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Warning Indicator Icon */}
              <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Trash2 size={22} className="stroke-[2.5]" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                  Confirm Slide Deletion
                </h3>
                <p className="text-[11px] text-muted-foreground leading-normal px-2">
                  Are you sure you want to delete this announcement slide? This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="flex w-full gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    playSound.playClick();
                    setSlideToDelete(null);
                  }}
                  className="flex-1 rounded-xl h-10 text-xs font-bold border border-glass-border hover:bg-secondary/40"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    playSound.playChime();
                    deleteMutation.mutate(slideToDelete);
                    setSlideToDelete(null);
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 text-xs font-bold shadow-md shadow-rose-600/15 active:scale-98 transition-all"
                >
                  {deleteMutation.isPending ? (
                    <GearSpinner className="h-3 w-3" />
                  ) : (
                    "Yes, Delete"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
}
