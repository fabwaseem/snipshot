import { CaptureResult } from "../types";

interface StatusBarProps {
  screenshot: CaptureResult | null;
  message?: string;
}

export function StatusBar({ screenshot, message }: StatusBarProps) {
  return (
    <div
      className="px-5 py-2.5 glass border-t flex justify-between items-center text-sm"
      style={{
        borderColor: "var(--color-border-light)",
      }}
    >
      <span style={{ color: "var(--color-text-muted)" }}>
        {message ? (
          <span className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
            <span style={{ color: "var(--color-accent-light)" }}>
              {message}
            </span>
          </span>
        ) : screenshot ? (
          <span className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--color-success)" }}
            />
            <span style={{ color: "var(--color-text-secondary)" }}>
              Image:{" "}
              <span
                className="font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                {screenshot.width}
              </span>
              <span style={{ color: "var(--color-text-muted)" }}> × </span>
              <span
                className="font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                {screenshot.height}
              </span>
            </span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--color-gray-500)" }}
            />
            <span style={{ color: "var(--color-text-muted)" }}>Ready</span>
          </span>
        )}
      </span>
      <span
        className="flex items-center gap-3"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span
          className="font-semibold"
          style={{ color: "var(--color-primary)" }}
        >
          Snipshot
        </span>
        <span>•</span>
        <span style={{ color: "var(--color-text-muted)" }}>
          v{__APP_VERSION__ || "1.0"}
        </span>
      </span>
    </div>
  );
}
