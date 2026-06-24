import { useState, useRef } from "react";
import { User } from "lucide-react";
import { uploadAvatar } from "../lib/api";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onUploadSuccess: (newAvatarUrl: string) => void;
}

export default function AvatarUpload({ currentAvatarUrl, onUploadSuccess }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview || currentAvatarUrl;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, GIF, and WebP images are allowed");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    handleUpload(file);
  }

  async function handleUpload(file: File) {
    setIsUploading(true);
    setError("");

    try {
      const result = await uploadAvatar(file);
      onUploadSuccess(result.user.avatarUrl);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={handleClick}
        className="relative wf-avatar wf-avatar-lg cursor-pointer hover:opacity-80 transition-opacity"
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <User size={40} className="text-ink-3" />
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-paper border-t-transparent animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="wf-btn wf-btn-link"
      >
        {isUploading ? "Uploading..." : "Change Photo"}
      </button>
      {error && <p className="wf-error-text">{error}</p>}
    </div>
  );
}
