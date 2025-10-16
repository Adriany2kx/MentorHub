import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { listResources, uploadResourceFile, deleteResource } from "../lib/api";
import type { Resource } from "../lib/api";
import ResourceCard from "../components/ResourceCard";
import SearchBar from "../components/SearchBar";
import { useToast } from "../context/ToastContext";

const FILE_TYPE_FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Document", value: "DOCUMENT" },
  { label: "Media", value: "MEDIA" },
  { label: "Other", value: "OTHER" },
] as const;

type FileTypeFilter = (typeof FILE_TYPE_FILTERS)[number]["value"];

const LOADING_MESSAGES = [
  "Loading shared files for your upcoming sessions...",
  "Checking the latest uploads from mentors and mentees...",
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [recentlyUploadedId, setRecentlyUploadedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadTitle, setUploadTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    listResources()
      .then((d) => setResources(d.resources))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) return;

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!showUpload) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowUpload(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showUpload]);

  function getGreetingText(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning. Keep your session prep clear and calm.";
    if (hour < 18) return "Good afternoon. Keep your session prep clear and calm.";
    return "Good evening. Keep your session prep clear and calm.";
  }

  function getFriendlyDownloadError(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes("not found on disk") || lower.includes("no longer available")) {
      return "This file is no longer available. Ask the uploader to re-upload it.";
    }
    if (lower.includes("not authenticated")) {
      return "Please sign in again, then try downloading.";
    }
    if (lower.includes("resource not found")) {
      return "We couldn't find this file.";
    }
    return message;
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !uploadTitle.trim()) return;

    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", uploadTitle.trim());
    formData.append("isPublic", String(isPublic));

    try {
      const res = await uploadResourceFile(formData);
      setResources((prev) => [res.resource, ...prev]);
      setRecentlyUploadedId(res.resource.id);
      window.setTimeout(() => {
        setRecentlyUploadedId((current) => (current === res.resource.id ? null : current));
      }, 6000);
      setShowUpload(false);
      setUploadTitle("");
      setIsPublic(false);
      if (fileRef.current) fileRef.current.value = "";
      toast("Shared successfully. Nice work.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "We couldn't upload this file. Try again.";
      setUploadError(message);
      toast(message, "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this file? This cannot be undone.")) {
      return;
    }

    try {
      await deleteResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
      toast("File removed.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "We couldn't delete this file. Try again.", "error");
    }
  }

  function openPreview(resource: Resource) {
    setPreviewResource(resource);
  }

  function closePreview() {
    setPreviewResource(null);
  }

  function openUploadModal() {
    setUploadError("");
    setShowUpload(true);
  }

  function closeUploadModal() {
    if (uploading) return;
    setShowUpload(false);
  }

  function handleDownloadClick(resource: Resource) {
    void downloadResource(resource);
  }

  async function downloadResource(resource: Resource) {
    if (resource.fileSize) {
      toast(`Starting download: ${resource.title} (${formatBytes(resource.fileSize)})`, "info");
    } else {
      toast(`Starting download: ${resource.title} (size unavailable)`, "info");
    }

    try {
      const response = await fetch(`/api/resources/${resource.id}/download`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({ error: "Download failed" }))) as { error?: string };
        throw new Error(errorBody.error ?? "Download failed");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const disposition = response.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="?([^\"]+)"?/i);
      const filename = match?.[1] ?? resource.title;

      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      const message = err instanceof Error ? getFriendlyDownloadError(err.message) : "We couldn't download this file. Try again.";
      toast(message, "error");
    }
  }

  const previewUrl = previewResource ? `/api/resources/${previewResource.id}/preview` : "";

  const visibleResources = resources
    .filter((resource) => {
      if (fileTypeFilter === "ALL") return true;
      if (fileTypeFilter === "MEDIA") return resource.fileType === "VIDEO" || resource.fileType === "IMAGE";
      return resource.fileType === fileTypeFilter;
    })
    .filter((resource) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      const uploaderName = [resource.uploader.firstName, resource.uploader.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const visibility = resource.isPublic ? "public" : "private";
      const haystack = `${resource.title} ${resource.fileType} ${uploaderName} ${visibility}`.toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => Number(a.uploaderId === user?.id) - Number(b.uploaderId === user?.id));

  const total = visibleResources.length;
  const hasActiveFilters = fileTypeFilter !== "ALL" || searchQuery.trim().length > 0;

  function renderPreview() {
    if (!previewResource) return null;

    if (previewResource.fileType === "IMAGE") {
      return (
        <img
          src={previewUrl}
          alt={previewResource.title}
          className="max-h-[70vh] w-auto max-w-full rounded-md border"
          style={{ borderColor: "var(--color-border)" }}
        />
      );
    }

    if (previewResource.fileType === "VIDEO") {
      return (
        <video controls className="max-h-[70vh] w-full rounded-md border" style={{ borderColor: "var(--color-border)" }}>
          <source src={previewUrl} type={previewResource.mimeType ?? undefined} />
          Your browser does not support video preview.
        </video>
      );
    }

    return (
      <iframe
        src={previewUrl}
        title={`${previewResource.title} preview`}
        className="h-[70vh] w-full rounded-md border bg-white"
        style={{ borderColor: "var(--color-border)" }}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <h1 className="wf-h1">Resources</h1>
            <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>
              Find, preview, and download shared files.
            </p>
            <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>
              {getGreetingText()}
            </p>
          </div>
          <button
            onClick={openUploadModal}
            className="wf-btn wf-btn-primary w-full sm:w-auto min-h-11"
          >
            Upload Resource
          </button>
        </div>

        <div className="wf-card-flush p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="wf-eyebrow">Resources</p>
            <p className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
              {total > 0 ? `${total} file${total !== 1 ? "s" : ""} shown` : "No files"}
            </p>
          </div>
          <SearchBar
            placeholder="Search by title, uploader, type, or public/private"
            onSearch={setSearchQuery}
            initialValue={searchQuery}
            live
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILE_TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFileTypeFilter(filter.value)}
                className={`wf-tag ${fileTypeFilter === filter.value ? "wf-tag-active" : ""} whitespace-nowrap min-h-11`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {showUpload && (
          <div className="wf-modal-overlay" onClick={closeUploadModal} role="presentation">
            <div
              className="wf-card wf-modal-panel max-w-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Upload resource"
            >
              <div className="flex items-start sm:items-center justify-between gap-4 pb-4 mb-5 border-b" style={{ borderBottomColor: "var(--color-border)" }}>
                <div>
                  <h2 className="wf-h2">Upload Resource</h2>
                  <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>
                    Share a file with your mentor network.
                  </p>
                </div>
                <button type="button" onClick={closeUploadModal} className="wf-btn wf-btn-secondary min-h-11" aria-label="Close upload modal">
                  Cancel
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-5">
                <div>
                  <label className="wf-label mb-2 block">Choose file</label>
                  <input
                    type="file"
                    ref={fileRef}
                    required
                    className="block w-full wf-text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:bg-blue-50 file:text-blue-700 file:font-medium file:cursor-pointer hover:file:bg-blue-100 transition-colors"
                    style={{ color: "var(--color-ink-2)" }}
                  />
                  <p className="wf-text-xs mt-2" style={{ color: "var(--color-ink-3)" }}>Up to 50 MB. Documents, images, and videos.</p>
                </div>

                <div>
                  <label className="wf-label mb-2 block">Title</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Example: React Hooks Cheatsheet"
                    maxLength={200}
                    required
                    className="wf-input w-full min-h-11"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="wf-text">Share with everyone on MentorHub</span>
                </label>

                {uploadError && <div className="p-3 bg-red-50 border border-red-200 rounded-md" style={{ color: "var(--color-error, #dc2626)" }}>{uploadError}</div>}

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t" style={{ borderTopColor: "var(--color-border)" }}>
                  <button
                    type="submit"
                    disabled={uploading || !uploadTitle.trim()}
                    className="wf-btn wf-btn-primary w-full sm:w-auto min-h-11"
                  >
                    {uploading ? "Uploading..." : "Upload file"}
                  </button>
                  <button
                    type="button"
                    onClick={closeUploadModal}
                    className="wf-btn wf-btn-secondary w-full sm:w-auto min-h-11"
                    disabled={uploading}
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
              {LOADING_MESSAGES[loadingMessageIndex]}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
              <div key={i} className="wf-card p-5 space-y-3">
                <div className="wf-skeleton h-4 w-2/3" />
                <div className="wf-skeleton h-2.5 w-full" />
                <div className="wf-skeleton h-2.5 w-3/4" />
              </div>
              ))}
            </div>
          </div>
        ) : visibleResources.length === 0 ? (
          <div className="wf-empty">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--color-ink-3)", margin: "0 auto 16px" }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15h6M9 11h6" />
            </svg>
            <p className="wf-empty-title">No matching resources</p>
            <p className="wf-empty-text" style={{ color: "var(--color-ink-2)", marginBottom: "16px" }}>
              Try a different search or filter, or upload a file.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFileTypeFilter("ALL");
                  }}
                  className="wf-btn wf-btn-secondary"
                >
                  Clear search and filters
                </button>
              )}
              <button onClick={() => setShowUpload(true)} className="wf-btn wf-btn-primary">
                Upload a file
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleResources.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                onDelete={handleDelete}
                currentUserId={user?.id}
                onPreview={openPreview}
                onDownloadClick={handleDownloadClick}
                highlighted={r.id === recentlyUploadedId}
              />
            ))}
          </div>
        )}

        {previewResource && (
          <div
            className="wf-modal-overlay"
            onClick={closePreview}
            role="presentation"
          >
            <div
              className="wf-card wf-modal-panel max-w-5xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Preview ${previewResource.title}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b" style={{ borderBottomColor: "var(--color-border)" }}>
                <div className="min-w-0">
                  <p className="wf-text font-semibold truncate" style={{ color: "var(--color-ink)" }}>
                    {previewResource.title}
                  </p>
                  <p className="wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
                    {previewResource.fileType}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadClick(previewResource)}
                    className="wf-btn wf-btn-primary text-sm min-h-11 flex-1 sm:flex-none"
                  >
                    Download{previewResource.fileSize ? ` (${formatBytes(previewResource.fileSize)})` : ""}
                  </button>
                  <button type="button" onClick={closePreview} className="wf-btn wf-btn-secondary text-sm min-h-11 flex-1 sm:flex-none" aria-label="Close preview">
                    Done
                  </button>
                </div>
              </div>

              <div className="rounded-md" style={{ background: "var(--color-surface)" }}>
                {renderPreview()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
