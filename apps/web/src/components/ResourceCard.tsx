import type { Resource } from "../lib/api";
import type { ReactNode } from "react";

interface ResourceCardProps {
  resource: Resource;
  onDelete?: (id: string) => void;
  currentUserId?: string;
  onPreview?: (resource: Resource) => void;
  onDownloadClick?: (resource: Resource) => void;
  highlighted?: boolean;
}

const FILE_ICONS: Record<string, ReactNode> = {
  DOCUMENT: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  VIDEO: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  IMAGE: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  LINK: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  OTHER: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  ),
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResourceCard({ resource, onDelete, currentUserId, onPreview, onDownloadClick, highlighted = false }: ResourceCardProps) {
  const icon = FILE_ICONS[resource.fileType] ?? FILE_ICONS.OTHER;
  const uploaderName =
    [resource.uploader.firstName, resource.uploader.lastName].filter(Boolean).join(" ") || "User";
  const isOwn = currentUserId === resource.uploaderId;

  return (
    <div className="wf-card group flex flex-col gap-4 p-4 sm:p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className="shrink-0 p-2.5 rounded transition-transform duration-200 group-hover:scale-105"
            style={{
              color: "var(--color-blue)",
              background: "color-mix(in oklab, var(--color-blue) 12%, transparent)",
            }}
          >
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <p className="wf-h3 truncate">{resource.title}</p>
            <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>
              by <span style={{ color: "var(--color-ink-2)", fontWeight: 500 }}>{uploaderName}</span>
            </p>
          </div>
        </div>
        {highlighted && <span className="wf-badge wf-badge-success">Just shared</span>}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 wf-text-xs" style={{ color: "var(--color-ink-3)" }}>
        <span>{resource.fileType}</span>
        <span>{resource.fileSize ? formatBytes(resource.fileSize) : "Unknown size"}</span>
        <span>{resource.isPublic ? "Public" : "Private"}</span>
        <span>
          {new Date(resource.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
        {resource.filePath && onPreview && (
          <button type="button" onClick={() => onPreview(resource)} className="wf-btn wf-btn-secondary text-sm w-full sm:w-auto min-h-11">
            Preview
          </button>
        )}
        {resource.filePath && (
          <button
            type="button"
            className="wf-btn wf-btn-primary text-sm w-full sm:w-auto min-h-11"
            onClick={() => onDownloadClick?.(resource)}
          >
            Download
          </button>
        )}
        {isOwn && onDelete && (
          <button
            onClick={() => onDelete(resource.id)}
            className="wf-btn wf-btn-secondary text-sm w-full sm:w-auto sm:ml-auto min-h-11"
            style={{ color: "var(--color-error)" }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
