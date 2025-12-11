import { useCallback } from "react";
import { CaptureResult } from "../types";
import { ImageUploader } from "./image-uploader";

interface MediaUploaderProps {
  currentScreenshot: CaptureResult | null;
  onImageImport: (screenshot: CaptureResult) => void;
}

export function MediaUploader({
  currentScreenshot,
  onImageImport,
}: MediaUploaderProps) {
  const handleFileSelect = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          // Extract base64 part from data URL to match backend format
          // data:image/png;base64,iVBORw0KG... -> iVBORw0KG...
          let base64Data = dataUrl;
          if (dataUrl.includes(",")) {
            base64Data = dataUrl.split(",")[1];
          }

          const result: CaptureResult = {
            data: base64Data,
            width: img.width,
            height: img.height,
          };
          onImageImport(result);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [onImageImport]
  );

  // Format image source same way as html-editor-canvas
  // Backend returns base64 string, so we need to prepend data URL prefix
  const previewImage = currentScreenshot
    ? `data:image/png;base64,${currentScreenshot.data}`
    : null;

  return (
    <ImageUploader
      label="MEDIA"
      onFileSelect={handleFileSelect}
      showPreview={true}
      previewImage={previewImage}
      previewText="Current media"
    />
  );
}
