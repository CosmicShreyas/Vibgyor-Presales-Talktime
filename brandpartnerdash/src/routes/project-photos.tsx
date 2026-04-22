import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthenticated, useAuth, API_BASE } from "@/lib/auth";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Upload, Image as ImageIcon, X, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/project-photos")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Project Photos — Brand Partner" },
      { name: "description", content: "Project photo gallery." },
    ],
  }),
  component: ProjectPhotosPage,
});

function ProjectPhotosPage() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<{ uniqueId: string; name: string; status: string }[]>([]);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [imageBlobUrls, setImageBlobUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [selectedLead, setSelectedLead] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex((i) => (i !== null ? (i - 1 + uploadedImages.length) % uploadedImages.length : null));
  const nextImage = () => setLightboxIndex((i) => (i !== null ? (i + 1) % uploadedImages.length : null));

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/brand-partners/leads`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ leads }: { leads: { uniqueId: string; name: string; status: string }[] }) => setLeads(leads))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE}/api/brand-partners/images`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        if (data.success) {
          setUploadedImages(data.images);
          // Fetch blob URLs for each image
          data.images.forEach((image: any) => {
            fetch(`${API_BASE}/api/brand-partners/images/${image.imageId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => r.blob())
              .then((blob) => {
                const url = URL.createObjectURL(blob);
                setImageBlobUrls((prev) => ({ ...prev, [image.imageId]: url }));
              })
              .catch(() => {});
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleUpload = async () => {
    if (!photo || !title || !selectedLead || !token) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", photo);
    formData.append("leadUniqueId", selectedLead);
    formData.append("title", title);
    formData.append("tags", tags);

    try {
      const response = await fetch(`${API_BASE}/api/brand-partners/images/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setUploadedImages((prev) => [data.image, ...prev]);
        // Fetch blob URL for the new image
        fetch(`${API_BASE}/api/brand-partners/images/${data.image.imageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.blob())
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            setImageBlobUrls((prev) => ({ ...prev, [data.image.imageId]: url }));
          });
        setOpen(false);
        setTitle("");
        setTags("");
        setSelectedLead("");
        setPhoto(null);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/brand-partners/images/${imageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setUploadedImages((prev) => prev.filter((img) => img.imageId !== imageId));
      setImageBlobUrls((prev) => { const next = { ...prev }; delete next[imageId]; return next; });
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Project Photos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? "Loading..." : `${uploadedImages.length} photos uploaded`}
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer gap-2">
                <Upload className="h-4 w-4" /> Upload photos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Photo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter photo title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="Enter tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead">Select Lead</Label>
                  <Select value={selectedLead} onValueChange={setSelectedLead}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map((lead) => (
                        <SelectItem key={lead.uniqueId} value={lead.uniqueId}>
                          <div className="flex items-center gap-2">
                            <span>{lead.name}</span>
                            <Badge
                              className={`text-xs ${
                                lead.status === "yet to call" || lead.status === "pending"
                                  ? "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400"
                                  : lead.status === "contacted" || lead.status === "follow-up"
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  : lead.status === "qualified"
                                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                  : lead.status === "converted" || lead.status === "won"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : lead.status === "lost"
                                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                                  : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400"
                              }`}
                            >
                              {lead.status === "pending" ? "yet to call" : lead.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  />
                </div>
                <Button onClick={handleUpload} disabled={uploading || !photo || !title || !selectedLead} className="w-full">
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {uploadedImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {uploadedImages.map((image, index) => (
              <div
                key={image.imageId}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
                onClick={() => openLightbox(index)}
              >
                <div className="relative flex aspect-[4/3] items-center justify-center bg-muted">
                  {imageBlobUrls[image.imageId] ? (
                    <img
                      src={imageBlobUrls[image.imageId]}
                      alt={image.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                  )}
                  {/* Lead name + date pill — top left */}
                  <div className="absolute left-2 top-2 flex flex-col gap-0.5 rounded-xl bg-black/70 px-2.5 py-1.5 backdrop-blur-sm">
                    <span className="text-xs font-semibold leading-tight text-white">{image.leadName}</span>
                    <span className="text-[10px] font-bold leading-tight text-white/70">
                      {new Date(image.uploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {image.tags?.length > 0 && (
                    <Badge className="absolute right-2 top-2 border-0 bg-black text-white">
                      {image.tags[0]}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3">
                  <div className="truncate text-base font-bold text-black dark:text-white">{image.title}</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="ml-2 shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={(e) => { e.stopPropagation(); handleDelete(image.imageId); }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              No photos uploaded yet. Click "Upload photos" to get started.
            </div>
          )
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closeLightbox}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {imageBlobUrls[uploadedImages[lightboxIndex].imageId] ? (
              <img
                src={imageBlobUrls[uploadedImages[lightboxIndex].imageId]}
                alt={uploadedImages[lightboxIndex].title}
                className="max-h-[80vh] max-w-[85vw] rounded-xl object-contain"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-xl bg-muted">
                <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}
            <div className="text-center text-white">
              <div className="font-medium">{uploadedImages[lightboxIndex].title}</div>
              <div className="text-sm text-white/70">{uploadedImages[lightboxIndex].leadName}</div>
            </div>
          </div>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </AppShell>
  );
}
