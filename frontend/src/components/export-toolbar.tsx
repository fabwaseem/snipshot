import { useState } from "react";
import { ClipboardCopy, Download, Save } from "lucide-react";
import { CaptureResult } from "../types";

interface ExportToolbarProps {
  screenshot: CaptureResult | null;
  onSave: (format: "png" | "jpeg", scale?: number) => void;
  onQuickSave: (format: "png" | "jpeg", scale?: number) => void;
  onCopyToClipboard: () => void;
  isExporting: boolean;
}

export function ExportToolbar({
  screenshot,
  onSave,
  onQuickSave,
  onCopyToClipboard,
  isExporting,
}: ExportToolbarProps) {
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [scale, setScale] = useState<number>(1);

  return (
    <div
      className="flex items-center justify-between px-5 py-2.5 border-t"
      style={{
        borderColor: "rgba(148, 163, 184, 0.06)",
        background: "var(--color-bg-sidebar)",
      }}
    >
      {/* Left: Image Details */}
      <div className="flex items-center gap-2 text-xs">
        {screenshot ? (
          <>
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#10b981" }}
            />
            <span style={{ color: "rgba(203, 213, 225, 0.75)" }}>
              Image:{" "}
              <span style={{ color: "rgba(226, 232, 240, 0.9)" }}>
                {screenshot.width}
              </span>{" "}
              ×{" "}
              <span style={{ color: "rgba(226, 232, 240, 0.9)" }}>
                {screenshot.height}
              </span>
            </span>
          </>
        ) : (
          <>
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "rgba(148, 163, 184, 0.5)" }}
            />
            <span style={{ color: "rgba(148, 163, 184, 0.6)" }}>Ready</span>
          </>
        )}
      </div>

      {/* Right: Format and Save Options */}
      <div className="flex items-center gap-3">
        {/* Scale/Resolution Selection */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium"
            style={{ color: "rgba(203, 213, 225, 0.75)" }}
          >
            Resolution
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map((multiplier) => (
              <button
                key={multiplier}
                onClick={() => setScale(multiplier)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all duration-200 ${
                  scale === multiplier ? "text-white" : ""
                }`}
                style={
                  scale === multiplier
                    ? ({
                        background: "rgba(255, 255, 255, 0.1)",
                      } as React.CSSProperties)
                    : ({
                        background: "var(--color-bg-slider)",
                        color: "rgba(148, 163, 184, 0.65)",
                        border: "1px solid rgba(148, 163, 184, 0.06)",
                      } as React.CSSProperties)
                }
                onMouseEnter={(e) => {
                  if (scale !== multiplier) {
                    e.currentTarget.style.background = "rgba(13, 13, 13, 0.8)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (scale !== multiplier) {
                    e.currentTarget.style.background = "var(--color-bg-slider)";
                  }
                }}
                title={`Export at ${multiplier}x resolution`}
              >
                {multiplier}x
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-5 w-px"
          style={{ background: "rgba(148, 163, 184, 0.1)" }}
        />

        {/* Format Selection */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium"
            style={{ color: "rgba(203, 213, 225, 0.75)" }}
          >
            Format
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setFormat("png")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all duration-200 ${
                format === "png" ? "text-white" : ""
              }`}
              style={
                format === "png"
                  ? ({
                      background: "rgba(255, 255, 255, 0.1)",
                    } as React.CSSProperties)
                  : ({
                      background: "var(--color-bg-slider)",
                      color: "rgba(148, 163, 184, 0.65)",
                      border: "1px solid rgba(148, 163, 184, 0.06)",
                    } as React.CSSProperties)
              }
              onMouseEnter={(e) => {
                if (format !== "png") {
                  e.currentTarget.style.background = "rgba(13, 13, 13, 0.8)";
                }
              }}
              onMouseLeave={(e) => {
                if (format !== "png") {
                  e.currentTarget.style.background = "var(--color-bg-slider)";
                }
              }}
            >
              PNG
            </button>
            <button
              onClick={() => setFormat("jpeg")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all duration-200 ${
                format === "jpeg" ? "text-white" : ""
              }`}
              style={
                format === "jpeg"
                  ? ({
                      background: "rgba(255, 255, 255, 0.1)",
                    } as React.CSSProperties)
                  : ({
                      background: "var(--color-bg-slider)",
                      color: "rgba(148, 163, 184, 0.65)",
                      border: "1px solid rgba(148, 163, 184, 0.06)",
                    } as React.CSSProperties)
              }
              onMouseEnter={(e) => {
                if (format !== "jpeg") {
                  e.currentTarget.style.background = "rgba(13, 13, 13, 0.8)";
                }
              }}
              onMouseLeave={(e) => {
                if (format !== "jpeg") {
                  e.currentTarget.style.background = "var(--color-bg-slider)";
                }
              }}
            >
              JPEG
            </button>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-5 w-px"
          style={{ background: "rgba(148, 163, 184, 0.1)" }}
        />

        {/* Export Actions */}
        <div className="flex items-center gap-1.5">
          {/* Copy to Clipboard */}
          <button
            onClick={onCopyToClipboard}
            disabled={isExporting}
            className="p-2 rounded-md transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
            style={
              {
                background: "var(--color-bg-slider)",
                border: "1px solid rgba(148, 163, 184, 0.06)",
                color: "rgba(148, 163, 184, 0.65)",
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              if (!isExporting) {
                e.currentTarget.style.background = "rgba(13, 13, 13, 0.8)";
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.12)";
                e.currentTarget.style.color = "rgba(226, 232, 240, 0.9)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-bg-slider)";
              e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.06)";
              e.currentTarget.style.color = "rgba(148, 163, 184, 0.65)";
            }}
            title="Copy to Clipboard (Ctrl+C)"
          >
            <ClipboardCopy className="w-4 h-4" />
          </button>

          {/* Quick Save */}
          <button
            onClick={() => onQuickSave(format, scale)}
            disabled={isExporting}
            className="p-2 rounded-md transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
            style={
              {
                background: "rgba(6, 182, 212, 0.25)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                color: "rgba(103, 232, 249, 0.9)",
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              if (!isExporting) {
                e.currentTarget.style.background = "rgba(6, 182, 212, 0.35)";
                e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(6, 182, 212, 0.25)";
              e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.3)";
            }}
            title="Quick Save to Pictures/Snipshot (Ctrl+S)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Save As */}
          <button
            onClick={() => onSave(format, scale)}
            disabled={isExporting}
            className="p-2 rounded-md text-white transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={
              {
                background: "rgba(99, 102, 241, 0.85)",
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              if (!isExporting) {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.95)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.85)";
            }}
            title="Save As... (Ctrl+Shift+S)"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
