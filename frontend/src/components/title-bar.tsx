import {
  WindowMinimise,
  WindowToggleMaximise,
  Quit,
  WindowHide,
} from "../../wailsjs/runtime/runtime";
import { Minus, Square, X } from "lucide-react";
import logoImage from "../assets/images/logo.png";
import { GetConfig, MinimizeToTray } from "../../wailsjs/go/main/App";

interface TitleBarProps {
  title?: string;
  onMinimize?: () => void;
}

export function TitleBar({ title = "Snipshot", onMinimize }: TitleBarProps) {
  const handleMinimize = async () => {
    try {
      const cfg = await GetConfig();
      if (cfg.startup?.minimizeToTray) {
        if (onMinimize) {
          onMinimize();
        } else {
          MinimizeToTray();
        }
      } else {
        WindowMinimise();
      }
    } catch {
      WindowMinimise();
    }
  };

  const handleClose = async () => {
    try {
      const cfg = await GetConfig();
      if (cfg.startup?.closeToTray) {
        if (onMinimize) {
          onMinimize();
        } else {
          WindowHide();
        }
      } else {
        Quit();
      }
    } catch {
      Quit();
    }
  };

  return (
    <div
      className="flex items-center h-12 border-b select-none"
      style={
        {
          "--wails-draggable": "drag",
          borderColor: "rgba(148, 163, 184, 0.06)",
          background: "var(--color-bg-sidebar)",
        } as React.CSSProperties
      }
    >
      {/* App icon and title - draggable area */}
      <div className="flex items-center gap-3 px-5 flex-1 h-full">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
          <img
            src={logoImage}
            alt="Logo"
            className="w-full h-full object-contain "
          />
        </div>
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </span>
      </div>

      {/* Window controls - not draggable */}
      <div
        className="flex h-full"
        style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
      >
        {/* Minimize button */}
        <button
          onClick={handleMinimize}
          className="w-12 h-full flex items-center justify-center transition-colors duration-150"
          style={
            {
              color: "var(--color-text-muted)",
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
          title="Minimize"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Maximize/Restore button */}
        <button
          onClick={() => WindowToggleMaximise()}
          className="w-12 h-full flex items-center justify-center transition-colors duration-150"
          style={
            {
              color: "var(--color-text-muted)",
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
          title="Maximize"
        >
          <Square className="w-3.5 h-3.5" />
        </button>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="w-12 h-full flex items-center justify-center transition-colors duration-150"
          style={
            {
              color: "var(--color-text-muted)",
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
            e.currentTarget.style.color = "var(--color-danger)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
