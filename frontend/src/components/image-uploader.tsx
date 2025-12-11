import { useRef, useState, useCallback } from "react";
import { ImagePlus } from "lucide-react";

interface ImageUploaderProps {
  label?: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  showPreview?: boolean;
  previewImage?: string | null;
  previewText?: string;
}

export function ImageUploader({
  label,
  onFileSelect,
  accept = "image/*",
  disabled = false,
  showPreview = false,
  previewImage = null,
  previewText = "Current media",
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = useCallback(
    async (file: File | null) => {
      if (!file || !file.type.startsWith("image/") || disabled) {
        return;
      }

      setIsLoading(true);
      try {
        onFileSelect(file);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load image:", error);
        setIsLoading(false);
      }
    },
    [onFileSelect, disabled]
  );

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    [disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect, disabled]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect]
  );

  // Format preview image source
  const imageSrc = previewImage
    ? previewImage.startsWith("data:")
      ? previewImage
      : `data:image/png;base64,${previewImage}`
    : null;

  return (
    <div>
      {label && (
        <label
          className="block text-xs font-medium mb-2"
          style={{ color: "rgba(203, 213, 225, 0.75)" }}
        >
          {label}
        </label>
      )}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative w-full rounded-md border-2 border-dashed transition-all duration-200 flex items-center justify-center overflow-hidden"
        style={{
          background: isDragging
            ? "rgba(13, 13, 13, 0.8)"
            : "var(--color-bg-slider)",
          borderColor: isDragging
            ? "rgba(148, 163, 184, 0.3)"
            : "rgba(148, 163, 184, 0.1)",
          minHeight: "200px",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isDragging && !disabled) {
            e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging && !disabled) {
            e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.1)";
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {showPreview && imageSrc ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4 gap-2">
            <img
              src={imageSrc}
              alt={previewText || "Preview"}
              className="max-w-full max-h-full object-contain rounded"
              style={{
                opacity: isLoading ? 0.5 : 1,
                maxHeight: "160px",
              }}
            />
            {previewText && (
              <span
                className="text-xs"
                style={{ color: "rgba(148, 163, 184, 0.6)" }}
              >
                {previewText}
              </span>
            )}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                <div className="text-xs" style={{ color: "rgba(148, 163, 184, 0.65)" }}>
                  Loading...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-8">
            <ImagePlus
              className="w-6 h-6"
              style={{ color: "rgba(148, 163, 184, 0.5)" }}
            />
            <span
              className="text-xs text-center"
              style={{ color: "rgba(148, 163, 184, 0.6)" }}
            >
              Drop media or click to choose
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

