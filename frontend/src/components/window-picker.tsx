import { useState, useEffect } from "react";
import { WindowInfo, WindowInfoWithThumbnail } from "../types";
import { GetWindowListWithThumbnails } from "../../wailsjs/go/main/App";
import { X, Search, AppWindow, RefreshCw } from "lucide-react";

interface WindowPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (window: WindowInfo, excludeTitleBar: boolean) => void;
}

export function WindowPicker({ isOpen, onClose, onSelect }: WindowPickerProps) {
  const [windows, setWindows] = useState<WindowInfoWithThumbnail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [excludeTitleBar, setExcludeTitleBar] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWindows();
    } else {
      setWindows([]);
      setSearchTerm("");
      setExcludeTitleBar(false); // Reset checkbox when modal closes
    }
  }, [isOpen]);

  const loadWindows = async () => {
    setIsLoading(true);
    try {
      const list = await GetWindowListWithThumbnails();
      // Filter out our own window and sort by title
      const filtered = (list as WindowInfoWithThumbnail[])
        .filter((w) => !w.title.includes("Snipshot"))
        .sort((a, b) => a.title.localeCompare(b.title));
      setWindows(filtered);
    } catch (error) {
      console.error("Failed to get window list:", error);
    }
    setIsLoading(false);
  };

  const filteredWindows = windows.filter((w) =>
    w.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="glass rounded-2xl border p-4 md:p-6 max-w-[95vw] md:max-w-3xl w-full mx-2 md:mx-4 max-h-[95vh] overflow-hidden flex flex-col"
        style={{
          borderColor: "var(--color-border)",
          background: "rgba(27, 38, 54, 0.95)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2
            className="text-lg md:text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Select Window to Capture
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            title="Close (ESC)"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search windows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 rounded-lg text-sm md:text-base
                         border transition-all duration-200 focus:outline-none"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              }}
            />
          </div>
        </div>

        {/* Window List */}
        <div className="flex-1 overflow-y-auto pr-1 md:pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 md:py-12">
              <div className="flex flex-col items-center gap-2 md:gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  />
                  <div
                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full animate-pulse"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      animationDelay: "0.2s",
                    }}
                  />
                  <div
                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full animate-pulse"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      animationDelay: "0.4s",
                    }}
                  />
                </div>
                <span
                  className="text-xs md:text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Loading windows...
                </span>
              </div>
            </div>
          ) : filteredWindows.length === 0 ? (
            <div
              className="flex items-center justify-center py-8 md:py-12"
              style={{ color: "var(--color-text-muted)" }}
            >
              {searchTerm
                ? "No windows found matching your search"
                : "No windows found"}
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {filteredWindows.map((window) => (
                <button
                  key={window.handle}
                  onClick={() => onSelect(window, excludeTitleBar)}
                  className="w-full p-3 md:p-4 text-left rounded-lg transition-all duration-200
                             group cursor-pointer border"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderColor: "var(--color-border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.05)";
                  }}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    {/* Thumbnail */}
                    <div
                      className="w-20 h-14 md:w-24 md:h-16 rounded-lg border overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{
                        background: "rgba(0, 0, 0, 0.3)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      {window.thumbnail ? (
                        <img
                          src={`data:image/png;base64,${window.thumbnail}`}
                          alt={window.title}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <AppWindow
                          className="w-6 h-6 md:w-8 md:h-8"
                          style={{ color: "var(--color-text-muted)" }}
                        />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="truncate font-semibold text-sm md:text-base mb-1"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {window.title}
                      </div>
                      <div
                        className="text-xs md:text-sm"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <span style={{ color: "var(--color-primary)" }}>
                          {window.width}
                        </span>
                        <span style={{ color: "var(--color-text-muted)" }}>
                          {" "}
                          ×{" "}
                        </span>
                        <span style={{ color: "var(--color-primary)" }}>
                          {window.height}
                        </span>
                        <span
                          style={{ color: "var(--color-text-muted)" }}
                          className="ml-2"
                        >
                          px
                        </span>
                      </div>
                    </div>
                    {/* Hover indicator */}
                    <div
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{ color: "var(--color-primary)" }}
                    >
                      <AppWindow className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="mt-4 md:mt-6 pt-4 md:pt-6 border-t flex justify-between items-center gap-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={excludeTitleBar}
                onChange={(e) => setExcludeTitleBar(e.target.checked)}
                className="w-4 h-4 rounded border cursor-pointer
                           transition-all duration-200 focus:ring-2 focus:ring-offset-2
                           focus:ring-offset-transparent"
                style={{
                  accentColor: "var(--color-primary)",
                  borderColor: excludeTitleBar
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                }}
              />
              <span
                className="text-xs md:text-sm select-none"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                Exclude title bar
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadWindows}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         border"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.color = "var(--color-text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.color = "var(--color-text-secondary)";
              }}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
              <span className="text-xs md:text-sm font-medium">Refresh</span>
            </button>
            <span
              className="text-xs md:text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span
                className="font-semibold"
                style={{ color: "var(--color-primary)" }}
              >
                {filteredWindows.length}
              </span>{" "}
              window{filteredWindows.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
