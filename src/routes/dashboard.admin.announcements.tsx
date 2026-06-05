import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Image as ImageIcon, Link as LinkIcon, FileText, Upload } from "lucide-react";
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
  const [uploadingFile, setUploadingFile] = useState(false);

  // Fetch announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementsApi.getAnnouncements(),
  });

  // Create slide mutation
  const createMutation = useMutation({
    mutationFn: (data: { imageUrl: string; title?: string; link?: string }) =>
      announcementsApi.createAnnouncement(data),
    onSuccess: () => {
      toast.success("Announcement slide added successfully!");
      setTitle("");
      setLink("");
      setImageUrl("");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      playSound.playSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add slide");
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

    // Limit file size to 3MB for localStorage storage efficiency
    if (file.size > 3 * 1024 * 1024) {
      toast.error("File is too large! Please choose an image under 3MB.");
      return;
    }

    setUploadingFile(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
        toast.success("Image uploaded and parsed successfully!");
      }
      setUploadingFile(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
      setUploadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error("Please provide an image URL or upload an image file!");
      return;
    }
    createMutation.mutate({ imageUrl, title, link });
  };

  return (
    <DashboardLayout title="Manage Announcements">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Slide Upload/Add Form */}
        <Card className="border-soft shadow-card lg:col-span-1 h-fit bg-white/90 dark:bg-card/90">
          <CardHeader>
            <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-foreground">
              Add New Slide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSlide} className="space-y-4">
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
                      {uploadingFile ? "Reading image..." : "Upload local image (Max 3MB)"}
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
                  value={imageUrl.startsWith("data:") ? "" : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="e.g. https://domain.com/banner.png"
                  className="rounded-xl h-10 text-xs"
                  disabled={imageUrl.startsWith("data:")}
                />
                {imageUrl.startsWith("data:") && (
                  <div className="flex justify-between items-center bg-emerald-500/10 text-emerald-500 p-2 rounded-lg text-[10px] font-semibold mt-1">
                    <span>Local image selected for upload</span>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="underline font-bold"
                    >
                      Clear File
                    </button>
                  </div>
                )}
              </div>

              {imageUrl && (
                <div className="space-y-1.5 mt-2">
                  <span className="text-[10px] font-bold text-muted-foreground block uppercase">Preview:</span>
                  <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-glass-border">
                    <img src={imageUrl} alt="Slide Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={createMutation.isPending || uploadingFile || !imageUrl}
                className="w-full mt-4 bg-primary-gradient text-white text-xs h-10 rounded-xl font-bold hover:scale-[1.01] active:scale-98 transition-all"
              >
                {createMutation.isPending ? (
                  <>
                    <GearSpinner className="mr-2 h-4 w-4" /> Adding...
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
                <span className="text-xs text-muted-foreground mt-2">Loading slides...</span>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground font-medium border border-dashed border-glass-border rounded-2xl">
                No active announcement slides. Add a slide on the left to start.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {announcements.map((slide: Announcement) => (
                  <Card
                    key={slide.id}
                    className="overflow-hidden border border-glass-border shadow-soft flex flex-col justify-between"
                  >
                    <div className="aspect-[16/9] w-full relative bg-zinc-900 flex items-center justify-center">
                      <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                      {slide.id.startsWith("default-") && (
                        <span className="absolute top-2 left-2 bg-[#f3ba2f] text-[#002b1c] font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                          Default Slide
                        </span>
                      )}
                    </div>
                    <CardContent className="p-4 flex flex-col justify-between flex-1 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-tight">
                          {slide.title || "Untitled Slide"}
                        </h4>
                        {slide.link && (
                          <div className="text-[10px] font-medium text-muted-foreground mt-1 flex items-center gap-1">
                            <LinkIcon size={10} /> {slide.link}
                          </div>
                        )}
                        <div className="text-[9px] text-muted-foreground/60 mt-1 font-mono">
                          Added: {new Date(slide.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(slide.id)}
                        className="w-full gap-1.5 h-8.5 rounded-lg text-[10px] font-bold"
                      >
                        {deleteMutation.isPending && deleteMutation.variables === slide.id ? (
                          <GearSpinner className="h-3 w-3" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        Delete Slide
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
