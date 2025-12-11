import { useState, useEffect } from "react";
import { HotkeyInput } from "./hotkey-input";
import { GetConfig, SaveConfig, SelectFolder } from "../../wailsjs/go/main/App";
import { config } from "../../wailsjs/go/models";
import { X } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = "hotkeys" | "startup" | "quicksave" | "export";

// Local interface for easier state management
interface LocalConfig {
  hotkeys: {
    fullscreen: string;
    region: string;
    window: string;
  };
  startup: {
    launchOnStartup: boolean;
    minimizeToTray: boolean;
    showNotification: boolean;
    closeToTray: boolean;
  };
  quickSave: {
    folder: string;
    pattern: string;
  };
  export: {
    defaultFormat: string;
    jpegQuality: number;
    includeBackground: boolean;
    autoCopyToClipboard: boolean;
  };
}

const defaultConfig: LocalConfig = {
  hotkeys: {
    fullscreen: "PrintScreen",
    region: "Ctrl+PrintScreen",
    window: "Ctrl+Shift+PrintScreen",
  },
  startup: {
    launchOnStartup: false,
    minimizeToTray: false,
    showNotification: true,
    closeToTray: true,
  },
  quickSave: {
    folder: "",
    pattern: "timestamp",
  },
  export: {
    defaultFormat: "png",
    jpegQuality: 95,
    includeBackground: true,
    autoCopyToClipboard: true,
  },
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("hotkeys");
  const [localConfig, setLocalConfig] = useState<LocalConfig>(defaultConfig);
  const [originalConfig, setOriginalConfig] =
    useState<LocalConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load config when modal opens
  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const cfg = await GetConfig();
      const local: LocalConfig = {
        hotkeys: {
          fullscreen:
            cfg.hotkeys?.fullscreen || defaultConfig.hotkeys.fullscreen,
          region: cfg.hotkeys?.region || defaultConfig.hotkeys.region,
          window: cfg.hotkeys?.window || defaultConfig.hotkeys.window,
        },
        startup: {
          launchOnStartup: cfg.startup?.launchOnStartup || false,
          minimizeToTray: cfg.startup?.minimizeToTray || false,
          showNotification: cfg.startup?.showNotification ?? true,
          closeToTray: cfg.startup?.closeToTray ?? true,
        },
        quickSave: {
          folder: cfg.quickSave?.folder || "",
          pattern: cfg.quickSave?.pattern || "timestamp",
        },
        export: {
          defaultFormat: cfg.export?.defaultFormat || "png",
          jpegQuality: cfg.export?.jpegQuality || 95,
          includeBackground: cfg.export?.includeBackground ?? true,
          autoCopyToClipboard: cfg.export?.autoCopyToClipboard ?? true,
        },
      };
      setLocalConfig(local);
      setOriginalConfig(local);
      setError(null);
    } catch (err) {
      console.error("Failed to load config:", err);
      setError("Failed to load settings");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Convert LocalConfig to config.Config for the backend
      const cfg = new config.Config({
        hotkeys: new config.HotkeyConfig(localConfig.hotkeys),
        startup: new config.StartupConfig(localConfig.startup),
        quickSave: new config.QuickSaveConfig(localConfig.quickSave),
        export: new config.ExportConfig(localConfig.export),
      });
      await SaveConfig(cfg);
      setOriginalConfig(localConfig);
      onClose();
    } catch (err) {
      console.error("Failed to save config:", err);
      setError("Failed to save settings");
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    setLocalConfig(originalConfig);
    setError(null);
    onClose();
  };

  const handleSelectFolder = async () => {
    try {
      const folder = await SelectFolder();
      if (folder) {
        setLocalConfig((prev) => ({
          ...prev,
          quickSave: { ...prev.quickSave, folder },
        }));
      }
    } catch (err) {
      console.error("Failed to select folder:", err);
    }
  };

  if (!isOpen) return null;

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "hotkeys", label: "Hotkeys" },
    { id: "startup", label: "Startup" },
    { id: "quicksave", label: "Quick Save" },
    { id: "export", label: "Export" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div
        className="rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border"
        style={{
          background: "var(--color-bg-sidebar)",
          borderColor: "rgba(148, 163, 184, 0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "rgba(148, 163, 184, 0.06)" }}
        >
          <h2
            className="text-xl font-bold"
            style={{ color: "rgba(240, 240, 240, 1)" }}
          >
            Settings
          </h2>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg transition-all duration-200"
            style={
              {
                color: "rgba(148, 163, 184, 0.65)",
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "rgba(240, 240, 240, 1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(148, 163, 184, 0.65)";
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b"
          style={{ borderColor: "rgba(148, 163, 184, 0.06)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 px-4 py-3.5 text-sm font-medium transition-all duration-200 relative"
              style={
                activeTab === tab.id
                  ? ({
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "rgba(240, 240, 240, 1)",
                    } as React.CSSProperties)
                  : ({
                      color: "rgba(148, 163, 184, 0.65)",
                    } as React.CSSProperties)
              }
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.color = "rgba(226, 232, 240, 0.9)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(148, 163, 184, 0.65)";
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "hotkeys" && (
            <div>
              <p
                className="text-sm mb-4 p-3 rounded-lg border"
                style={{
                  color: "rgba(148, 163, 184, 0.65)",
                  background: "var(--color-bg-slider)",
                  borderColor: "rgba(148, 163, 184, 0.1)",
                }}
              >
                Click on a field and press your desired key combination.
              </p>
              <HotkeyInput
                label="Fullscreen Capture"
                value={localConfig.hotkeys.fullscreen}
                onChange={(value) =>
                  setLocalConfig((prev) => ({
                    ...prev,
                    hotkeys: { ...prev.hotkeys, fullscreen: value },
                  }))
                }
              />
              <HotkeyInput
                label="Region Capture"
                value={localConfig.hotkeys.region}
                onChange={(value) =>
                  setLocalConfig((prev) => ({
                    ...prev,
                    hotkeys: { ...prev.hotkeys, region: value },
                  }))
                }
              />
              <HotkeyInput
                label="Window Capture"
                value={localConfig.hotkeys.window}
                onChange={(value) =>
                  setLocalConfig((prev) => ({
                    ...prev,
                    hotkeys: { ...prev.hotkeys, window: value },
                  }))
                }
              />
            </div>
          )}

          {activeTab === "startup" && (
            <div className="space-y-4">
              <label
                className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-200"
                style={{
                  background: "var(--color-bg-slider)",
                  borderColor: "rgba(148, 163, 184, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(13, 13, 13, 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-bg-slider)";
                }}
              >
                <input
                  type="checkbox"
                  checked={localConfig.startup.launchOnStartup}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      startup: {
                        ...prev.startup,
                        launchOnStartup: e.target.checked,
                      },
                    }))
                  }
                />
                <span style={{ color: "rgba(240, 240, 240, 1)" }}>
                  Launch on Windows startup
                </span>
              </label>

              <label
                className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-200"
                style={{
                  background: "var(--color-bg-slider)",
                  borderColor: "rgba(148, 163, 184, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(13, 13, 13, 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-bg-slider)";
                }}
              >
                <input
                  type="checkbox"
                  checked={localConfig.startup.minimizeToTray}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      startup: {
                        ...prev.startup,
                        minimizeToTray: e.target.checked,
                      },
                    }))
                  }
                />
                <span style={{ color: "rgba(240, 240, 240, 1)" }}>
                  Minimize to tray when minimized
                </span>
              </label>

              <label
                className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-200"
                style={{
                  background: "var(--color-bg-slider)",
                  borderColor: "rgba(148, 163, 184, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(13, 13, 13, 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-bg-slider)";
                }}
              >
                <input
                  type="checkbox"
                  checked={localConfig.startup.showNotification}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      startup: {
                        ...prev.startup,
                        showNotification: e.target.checked,
                      },
                    }))
                  }
                />
                <span style={{ color: "rgba(240, 240, 240, 1)" }}>
                  Show notification on capture
                </span>
              </label>

              <label
                className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-200"
                style={{
                  background: "var(--color-bg-slider)",
                  borderColor: "rgba(148, 163, 184, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(13, 13, 13, 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-bg-slider)";
                }}
              >
                <input
                  type="checkbox"
                  checked={localConfig.startup.closeToTray}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      startup: {
                        ...prev.startup,
                        closeToTray: e.target.checked,
                      },
                    }))
                  }
                />
                <div>
                  <span style={{ color: "rgba(240, 240, 240, 1)" }}>
                    Close to tray when closing window
                  </span>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "rgba(148, 163, 184, 0.65)" }}
                  >
                    Use "Quit" from tray menu to fully exit
                  </p>
                </div>
              </label>
            </div>
          )}

          {activeTab === "quicksave" && (
            <div className="space-y-5">
              <div>
                <label
                  className="block text-sm font-medium mb-2.5"
                  style={{ color: "rgba(203, 213, 225, 0.75)" }}
                >
                  Save Folder
                </label>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    value={localConfig.quickSave.folder}
                    readOnly
                    className="flex-1 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 transition-all"
                    style={
                      {
                        background: "var(--color-bg-slider)",
                        borderColor: "rgba(148, 163, 184, 0.1)",
                        color: "rgba(240, 240, 240, 1)",
                      } as React.CSSProperties
                    }
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--color-primary)";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(99, 102, 241, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--color-border)";
                      e.target.style.boxShadow = "none";
                    }}
                    placeholder="Default: Pictures/Snipshot"
                  />
                  <button
                    onClick={handleSelectFolder}
                    className="px-4 py-2.5 rounded-lg font-medium transition-all duration-200 border"
                    style={
                      {
                        background: "var(--color-bg-slider)",
                        borderColor: "rgba(148, 163, 184, 0.1)",
                        color: "rgba(148, 163, 184, 0.65)",
                      } as React.CSSProperties
                    }
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(13, 13, 13, 0.8)";
                      e.currentTarget.style.borderColor =
                        "rgba(148, 163, 184, 0.2)";
                      e.currentTarget.style.color = "rgba(226, 232, 240, 0.9)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "var(--color-bg-slider)";
                      e.currentTarget.style.borderColor =
                        "rgba(148, 163, 184, 0.1)";
                      e.currentTarget.style.color = "rgba(148, 163, 184, 0.65)";
                    }}
                  >
                    Browse
                  </button>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2.5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Filename Pattern
                </label>
                <select
                  value={localConfig.quickSave.pattern}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      quickSave: {
                        ...prev.quickSave,
                        pattern: e.target.value as
                          | "timestamp"
                          | "date"
                          | "increment",
                      },
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={
                    {
                      background: "rgba(255, 255, 255, 0.05)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    } as React.CSSProperties
                  }
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--color-primary)";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--color-border)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <option value="timestamp">
                    snipshot_2024-12-01_15-30-45
                  </option>
                  <option value="date">snipshot_2024-12-01</option>
                  <option value="increment">
                    snipshot_001, snipshot_002...
                  </option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div className="space-y-5">
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Default Format
                </label>
                <div className="flex gap-3">
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 cursor-pointer p-3.5 rounded-lg font-medium transition-all duration-200 ${
                      localConfig.export.defaultFormat === "png"
                        ? "text-white shadow-lg"
                        : "border"
                    }`}
                    style={
                      localConfig.export.defaultFormat === "png"
                        ? ({
                            background: "rgba(255, 255, 255, 0.1)",
                            color: "rgba(240, 240, 240, 1)",
                          } as React.CSSProperties)
                        : ({
                            background: "var(--color-bg-slider)",
                            borderColor: "rgba(148, 163, 184, 0.1)",
                            color: "rgba(148, 163, 184, 0.65)",
                          } as React.CSSProperties)
                    }
                    onMouseEnter={(e) => {
                      if (localConfig.export.defaultFormat !== "png") {
                        e.currentTarget.style.background =
                          "rgba(13, 13, 13, 0.8)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (localConfig.export.defaultFormat !== "png") {
                        e.currentTarget.style.background =
                          "var(--color-bg-slider)";
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="format"
                      checked={localConfig.export.defaultFormat === "png"}
                      onChange={() =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          export: { ...prev.export, defaultFormat: "png" },
                        }))
                      }
                      className="sr-only"
                    />
                    <span>PNG</span>
                  </label>
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 cursor-pointer p-3.5 rounded-lg font-medium transition-all duration-200 ${
                      localConfig.export.defaultFormat === "jpeg"
                        ? "text-white shadow-lg"
                        : "border"
                    }`}
                    style={
                      localConfig.export.defaultFormat === "jpeg"
                        ? ({
                            background: "rgba(255, 255, 255, 0.1)",
                            color: "rgba(240, 240, 240, 1)",
                          } as React.CSSProperties)
                        : ({
                            background: "var(--color-bg-slider)",
                            borderColor: "rgba(148, 163, 184, 0.1)",
                            color: "rgba(148, 163, 184, 0.65)",
                          } as React.CSSProperties)
                    }
                    onMouseEnter={(e) => {
                      if (localConfig.export.defaultFormat !== "jpeg") {
                        e.currentTarget.style.background =
                          "rgba(13, 13, 13, 0.8)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (localConfig.export.defaultFormat !== "jpeg") {
                        e.currentTarget.style.background =
                          "var(--color-bg-slider)";
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="format"
                      checked={localConfig.export.defaultFormat === "jpeg"}
                      onChange={() =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          export: { ...prev.export, defaultFormat: "jpeg" },
                        }))
                      }
                      className="sr-only"
                    />
                    <span>JPEG</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    JPEG Quality
                  </label>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      color: "var(--color-primary)",
                      background: "rgba(99, 102, 241, 0.1)",
                    }}
                  >
                    {localConfig.export.jpegQuality}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={localConfig.export.jpegQuality}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      export: {
                        ...prev.export,
                        jpegQuality: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full"
                  disabled={localConfig.export.defaultFormat !== "jpeg"}
                />
              </div>

              <label
                className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-200"
                style={{
                  background: "var(--color-bg-slider)",
                  borderColor: "rgba(148, 163, 184, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(13, 13, 13, 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-bg-slider)";
                }}
              >
                <input
                  type="checkbox"
                  checked={localConfig.export.includeBackground}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      export: {
                        ...prev.export,
                        includeBackground: e.target.checked,
                      },
                    }))
                  }
                />
                <span style={{ color: "rgba(240, 240, 240, 1)" }}>
                  Include styled background
                </span>
              </label>

              <label
                className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-200"
                style={{
                  background: "var(--color-bg-slider)",
                  borderColor: "rgba(148, 163, 184, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(13, 13, 13, 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-bg-slider)";
                }}
              >
                <input
                  type="checkbox"
                  checked={localConfig.export.autoCopyToClipboard}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      export: {
                        ...prev.export,
                        autoCopyToClipboard: e.target.checked,
                      },
                    }))
                  }
                />
                <div>
                  <span style={{ color: "rgba(240, 240, 240, 1)" }}>
                    Auto-copy to clipboard on capture
                  </span>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "rgba(148, 163, 184, 0.65)" }}
                  >
                    Uses your default export format (PNG/JPEG)
                  </p>
                </div>
              </label>
            </div>
          )}

          {error && (
            <div
              className="mt-4 p-4 rounded-xl border text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                borderColor: "rgba(239, 68, 68, 0.3)",
                color: "var(--color-danger-light)",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 p-5 border-t"
          style={{ borderColor: "rgba(148, 163, 184, 0.06)" }}
        >
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-lg font-medium transition-all duration-200 border"
            style={
              {
                background: "var(--color-bg-slider)",
                borderColor: "rgba(148, 163, 184, 0.1)",
                color: "rgba(148, 163, 184, 0.65)",
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(13, 13, 13, 0.8)";
              e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
              e.currentTarget.style.color = "rgba(226, 232, 240, 0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-bg-slider)";
              e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.1)";
              e.currentTarget.style.color = "rgba(148, 163, 184, 0.65)";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg font-medium transition-all duration-200 text-white
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={
              {
                background: "rgba(255, 255, 255, 0.1)",
                color: "rgba(240, 240, 240, 1)",
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
