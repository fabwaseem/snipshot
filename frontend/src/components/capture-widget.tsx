import { CaptureMode } from "../types";
import { Monitor, Scan, AppWindow, FolderOpen } from "lucide-react";

interface CaptureWidgetProps {
  onCapture: (mode: CaptureMode) => void;
  isCapturing: boolean;
  onImportImage?: () => void;
}

export function CaptureWidget({
  onCapture,
  isCapturing,
  onImportImage,
}: CaptureWidgetProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Title */}
      <div className="flex-shrink-0">
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Snipshot
        </h2>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Capture your screen
        </p>
      </div>

      {/* Capture Buttons */}
      <div className="flex items-center gap-2">
        {/* Fullscreen Capture */}
        <button
          onClick={() => onCapture("fullscreen")}
          disabled={isCapturing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                       text-white shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          style={
            !isCapturing
              ? {
                  background: "var(--gradient-primary)",
                  boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
                }
              : {
                  background: "var(--color-gray-600)",
                }
          }
          onMouseEnter={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(99, 102, 241, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(99, 102, 241, 0.3)";
            }
          }}
          title="Capture entire screen (PrintScreen)"
        >
          <Monitor className="w-4 h-4" />
          <span>Fullscreen</span>
        </button>

        {/* Region Capture */}
        <button
          onClick={() => onCapture("region")}
          disabled={isCapturing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                       text-white shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          style={
            !isCapturing
              ? {
                  background: "var(--gradient-accent)",
                  boxShadow: "0 4px 16px rgba(6, 182, 212, 0.3)",
                }
              : {
                  background: "var(--color-gray-600)",
                }
          }
          onMouseEnter={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(6, 182, 212, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(6, 182, 212, 0.3)";
            }
          }}
          title="Select region to capture (Ctrl+PrintScreen)"
        >
          <Scan className="w-4 h-4" />
          <span>Region</span>
        </button>

        {/* Window Capture */}
        <button
          onClick={() => onCapture("window")}
          disabled={isCapturing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                       text-white shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          style={
            !isCapturing
              ? {
                  background: "var(--gradient-primary-accent)",
                  boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
                }
              : {
                  background: "var(--color-gray-600)",
                }
          }
          onMouseEnter={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(99, 102, 241, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(99, 102, 241, 0.3)";
            }
          }}
          title="Capture specific window (Ctrl+Shift+PrintScreen)"
        >
          <AppWindow className="w-4 h-4" />
          <span>Window</span>
        </button>

        {/* Import Image */}
        {onImportImage && (
          <button
            onClick={onImportImage}
            disabled={isCapturing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                         border transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0
                         disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
            onMouseEnter={(e) => {
              if (!isCapturing) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "var(--color-border-hover)";
                e.currentTarget.style.color = "var(--color-text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
            title="Import image from file (Ctrl+O)"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Import</span>
          </button>
        )}

        {/* Capturing Status */}
        {isCapturing && (
          <div className="flex items-center gap-2 ml-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: "var(--color-accent-light)" }}
            >
              Capturing...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
