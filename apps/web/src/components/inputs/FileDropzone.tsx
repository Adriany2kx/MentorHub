import { useState, useRef, useCallback } from "react";
import { Upload, X, File, Image, FileText, Check, AlertCircle } from "lucide-react";

interface FileDropzoneProps {
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  uploading?: boolean;
  progress?: number; // 0-100
  error?: string;
  className?: string;
}

interface FilePreview {
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "complete" | "error";
  progress: number;
}

/**
 * FileDropzone — Dropbox-style file upload with animations
 *
 * Stages:
 * 1. Idle: Dashed border, upload icon
 * 2. Dragover: Border pulses, background lightens
 * 3. Dropped: File thumbnail with progress ring
 * 4. Uploading: Circular progress indicator
 * 5. Complete: Checkmark animation
 * 6. Error: Red pulse, shake animation
 */
export default function FileDropzone({
  accept = "*",
  maxSize = 10,
  multiple = false,
  onFilesSelected,
  uploading = false,
  progress = 0,
  error,
  className = "",
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize * 1024 * 1024) {
        return `File too large (max ${maxSize}MB)`;
      }
      return null;
    },
    [maxSize]
  );

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles: FilePreview[] = [];
      const validFiles: File[] = [];

      Array.from(fileList).forEach((file) => {
        const error = validateFile(file);
        const preview = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;

        newFiles.push({
          file,
          preview,
          status: error ? "error" : "pending",
          progress: 0,
        });

        if (!error) {
          validFiles.push(file);
        }
      });

      setFiles((prev) => (multiple ? [...prev, ...newFiles] : newFiles));
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [multiple, onFilesSelected, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles);
      }
    },
    [processFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        processFiles(selectedFiles);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [processFiles]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return newFiles;
    });
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return Image;
    if (file.type.includes("pdf")) return FileText;
    return File;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: "relative",
          padding: "32px 24px",
          border: `2px dashed ${isDragging ? "var(--color-green)" : "var(--color-border)"}`,
          borderRadius: "var(--radius-md)",
          background: isDragging
            ? "var(--color-green-light)"
            : "var(--color-surface)",
          cursor: "pointer",
          textAlign: "center",
          transition: "all 200ms ease",
          animation: isDragging ? "dropzonePulse 1s ease-in-out infinite" : "none",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          style={{ display: "none" }}
        />

        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            background: isDragging
              ? "var(--color-green)"
              : "var(--color-border-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            transition: "all 200ms ease",
            transform: isDragging ? "scale(1.1)" : "scale(1)",
          }}
        >
          <Upload
            size={24}
            style={{
              color: isDragging ? "#fff" : "var(--color-ink-3)",
              transition: "color 200ms ease",
            }}
          />
        </div>

        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--color-ink)",
            margin: "0 0 4px",
          }}
        >
          {isDragging ? "Drop files here" : "Drop files here or click to browse"}
        </p>
        <p style={{ fontSize: 12, color: "var(--color-ink-3)", margin: 0 }}>
          {accept === "*" ? "Any file type" : accept.replace(/\./g, "").toUpperCase()}{" "}
          up to {maxSize}MB
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            padding: "10px 14px",
            background: "var(--color-error-bg)",
            border: "1px solid var(--color-error-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-error)",
            fontSize: 13,
            animation: "dropzoneShake 400ms ease",
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {files.map((fp, index) => {
            const FileIcon = getFileIcon(fp.file);
            const isComplete = fp.status === "complete" || (uploading && progress === 100);
            const isError = fp.status === "error";
            const isUploading = fp.status === "uploading" || (uploading && progress < 100);
            const displayProgress = fp.status === "uploading" ? fp.progress : progress;

            return (
              <div
                key={`${fp.file.name}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  background: isError
                    ? "var(--color-error-bg)"
                    : "var(--color-surface)",
                  border: `1px solid ${isError ? "var(--color-error-border)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-sm)",
                  animation: `fileItemIn 300ms ease-out ${index * 50}ms both`,
                }}
              >
                {/* Thumbnail or Icon */}
                <div
                  style={{
                    position: "relative",
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-border-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {fp.preview ? (
                    <img
                      src={fp.preview}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <FileIcon size={20} style={{ color: "var(--color-ink-3)" }} />
                  )}

                  {/* Progress Ring */}
                  {isUploading && (
                    <svg
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        transform: "rotate(-90deg)",
                      }}
                    >
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        fill="none"
                        stroke="var(--color-border)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        fill="none"
                        stroke="var(--color-green)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(displayProgress / 100) * 113} 113`}
                        style={{
                          transition: "stroke-dasharray 200ms ease",
                        }}
                      />
                    </svg>
                  )}

                  {/* Complete Checkmark */}
                  {isComplete && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(16, 185, 129, 0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "checkmarkPop 300ms ease-out",
                      }}
                    >
                      <Check size={20} style={{ color: "#fff" }} />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--color-ink)",
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {fp.file.name}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: isError ? "var(--color-error)" : "var(--color-ink-3)",
                      margin: "2px 0 0",
                    }}
                  >
                    {isError ? "Upload failed" : formatSize(fp.file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    color: "var(--color-ink-3)",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-border-soft)";
                    e.currentTarget.style.color = "var(--color-error)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.color = "var(--color-ink-3)";
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes dropzonePulse {
          0%, 100% {
            border-color: var(--color-green);
            background: var(--color-green-light);
          }
          50% {
            border-color: var(--color-green-dark);
            background: color-mix(in oklab, var(--color-green-light) 70%, var(--color-green) 30%);
          }
        }

        @keyframes dropzoneShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
        }

        @keyframes fileItemIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes checkmarkPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes dropzonePulse { from, to { opacity: 1; } }
          @keyframes dropzoneShake { from, to { transform: none; } }
          @keyframes fileItemIn { from, to { opacity: 1; transform: none; } }
          @keyframes checkmarkPop { from, to { transform: scale(1); opacity: 1; } }
        }
      `}</style>
    </div>
  );
}
