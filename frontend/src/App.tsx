import { useState, useRef, useCallback, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import { TitleBar } from "./components/title-bar";
import { CaptureWidget } from "./components/capture-widget";
import { WindowPicker } from "./components/window-picker";
import { RegionSelector } from "./components/region-selector";
import { ScreenSelector } from "./components/screen-selector";
import { HtmlEditorCanvas as EditorCanvas } from "./components/html-editor-canvas";
import { SettingsPanel } from "./components/settings-panel";
import { SettingsModal } from "./components/settings-modal";
import { AnnotationToolbar } from "./components/annotation-toolbar";
import { ExportToolbar } from "./components/export-toolbar";
import {
  CaptureResult,
  CaptureMode,
  WindowInfo,
  Annotation,
  EditorTool,
  OutputRatio,
  CustomDimensions,
} from "./types";
import {
  CaptureFullscreen,
  CaptureWindow,
  CaptureDisplay,
  GetDisplayBounds,
  SaveImage,
  QuickSave,
  MinimizeToTray,
  PrepareRegionCapture,
  FinishRegionCapture,
  UpdateWindowSize,
  GetConfig,
  OpenImage,
  SetWidgetMode,
  SetEditorMode,
  SetScreenSelectionMode,
  SetWindowPickerMode,
} from "../wailsjs/go/main/App";
import { EventsOn, EventsOff, WindowGetSize } from "../wailsjs/runtime/runtime";

// Storage key for persistent editor settings
const EDITOR_SETTINGS_KEY = "snipshot-editor-settings";

interface EditorSettings {
  padding: number;
  cornerRadius: number;
  shadowSize: number;
  backgroundColor: string;
  outputRatio: OutputRatio;
}

const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  padding: 40,
  cornerRadius: 12,
  shadowSize: 20,
  backgroundColor: "#0d0d0d",
  outputRatio: "auto",
};

// Load settings from localStorage
function loadEditorSettings(): EditorSettings {
  try {
    const stored = localStorage.getItem(EDITOR_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_EDITOR_SETTINGS, ...parsed };
    }
  } catch {
    // Invalid stored data, use defaults
  }
  return DEFAULT_EDITOR_SETTINGS;
}

// Save settings to localStorage
function saveEditorSettings(settings: EditorSettings): void {
  localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(settings));
}

// Helper to parse ratio string into numeric ratio
function parseRatio(ratio: OutputRatio): number | null {
  if (ratio === "auto") return null;
  const [w, h] = ratio.split(":").map(Number);
  return w / h;
}

// Calculate output dimensions based on ratio, screenshot, and padding
// If customDimensions is provided, use those instead
function calculateOutputDimensions(
  screenshotWidth: number,
  screenshotHeight: number,
  padding: number,
  outputRatio: OutputRatio,
  customDimensions: CustomDimensions | null = null
): { totalWidth: number; totalHeight: number } {
  // If custom dimensions are set, use them directly
  if (customDimensions) {
    return {
      totalWidth: customDimensions.width,
      totalHeight: customDimensions.height,
    };
  }

  const targetRatio = parseRatio(outputRatio);

  if (targetRatio === null) {
    // Auto mode: output size same as screenshot dimensions
    return { totalWidth: screenshotWidth, totalHeight: screenshotHeight };
  }

  // Calculate dimensions to fit the screenshot with padding while maintaining target ratio
  const minWidth = screenshotWidth + padding * 2;
  const minHeight = screenshotHeight + padding * 2;
  const minAspect = minWidth / minHeight;

  if (targetRatio > minAspect) {
    // Target is wider - expand width to match ratio
    return {
      totalWidth: Math.round(minHeight * targetRatio),
      totalHeight: minHeight,
    };
  } else {
    // Target is taller - expand height to match ratio
    return {
      totalWidth: minWidth,
      totalHeight: Math.round(minWidth / targetRatio),
    };
  }
}

// Helper to copy screenshot to clipboard with format from config
async function copyScreenshotToClipboard(
  screenshotData: string,
  format: "png" | "jpeg",
  jpegQuality: number
): Promise<boolean> {
  try {
    // Create an image from the base64 data
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = `data:image/png;base64,${screenshotData}`;
    });

    // Create canvas and draw image
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0);

    // Convert to blob with appropriate format
    const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
    const quality = format === "jpeg" ? jpegQuality / 100 : undefined;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, quality);
    });

    if (!blob) return false;

    // Copy to clipboard - always use PNG for clipboard compatibility
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png":
          format === "png"
            ? blob
            : await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b!), "image/png");
              }),
      }),
    ]);
    return true;
  } catch (error) {
    console.error("Failed to copy screenshot to clipboard:", error);
    return false;
  }
}

function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [screenshot, setScreenshot] = useState<CaptureResult | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showWindowPicker, setShowWindowPicker] = useState(false);
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [showScreenSelector, setShowScreenSelector] = useState(false);
  const [pendingRegionCapture, setPendingRegionCapture] = useState(false);
  const [displayBounds, setDisplayBounds] = useState({
    width: 1920,
    height: 1080,
  });
  const [regionScreenshot, setRegionScreenshot] = useState<
    string | undefined
  >();
  const [regionScaleRatio, setRegionScaleRatio] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();

  // Editor settings (loaded from localStorage with lazy initialization)
  const [padding, setPadding] = useState(() => loadEditorSettings().padding);
  const [cornerRadius, setCornerRadius] = useState(
    () => loadEditorSettings().cornerRadius
  );
  const [shadowSize, setShadowSize] = useState(
    () => loadEditorSettings().shadowSize
  );
  const [backgroundColor, setBackgroundColor] = useState(
    () => loadEditorSettings().backgroundColor
  );
  const [outputRatio, setOutputRatio] = useState<OutputRatio>(
    () => loadEditorSettings().outputRatio
  );
  const [customDimensions, setCustomDimensions] =
    useState<CustomDimensions | null>(null);

  // Annotation state
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);
  const [strokeColor, setStrokeColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fontSize, setFontSize] = useState(48);
  const [fontStyle, setFontStyle] = useState<
    "normal" | "bold" | "italic" | "bold italic"
  >("normal");

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);

  // Persist editor settings to localStorage when they change
  useEffect(() => {
    saveEditorSettings({
      padding,
      cornerRadius,
      shadowSize,
      backgroundColor,
      outputRatio,
    });
  }, [padding, cornerRadius, shadowSize, backgroundColor, outputRatio]);

  // Resize window based on screenshot state (widget mode vs editor mode)
  useEffect(() => {
    if (screenshot) {
      // Switch to editor mode when screenshot is loaded
      SetEditorMode();
    } else {
      // Switch to widget mode when no screenshot
      SetWidgetMode();
    }
  }, [screenshot]);

  // Resize window for screen selection modal when in widget mode
  useEffect(() => {
    if (showScreenSelector && !screenshot) {
      // We're in widget mode and opening screen selector - resize to fit modal
      SetScreenSelectionMode();
    } else if (!showScreenSelector && !screenshot && !showWindowPicker) {
      // Screen selector closed in widget mode - restore widget size (only if window picker is also closed)
      SetWidgetMode();
    }
  }, [showScreenSelector, screenshot, showWindowPicker]);

  // Resize window for window picker modal when in widget mode
  useEffect(() => {
    if (showWindowPicker && !screenshot) {
      // We're in widget mode and opening window picker - resize to fit modal
      SetWindowPickerMode();
    } else if (!showWindowPicker && !screenshot && !showScreenSelector) {
      // Window picker closed in widget mode - restore widget size (only if screen selector is also closed)
      SetWidgetMode();
    }
  }, [showWindowPicker, screenshot, showScreenSelector]);

  // Track window size for persistence on close
  // Use Wails WindowGetSize API for accurate DPI-aware dimensions
  useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const updateSize = async () => {
      try {
        const size = await WindowGetSize();
        // Only update size if we're in editor mode (not widget mode)
        if (screenshot) {
          UpdateWindowSize(size.w, size.h);
        }
      } catch {
        // Fallback to window dimensions if Wails API fails
        if (screenshot) {
          UpdateWindowSize(window.outerWidth, window.outerHeight);
        }
      }
    };
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateSize, 200);
    };
    window.addEventListener("resize", handleResize);
    // Initial size report (only if in editor mode)
    if (screenshot) {
      updateSize();
    }
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [screenshot]);

  const handleCapture = useCallback(async (mode: CaptureMode) => {
    if (mode === "window") {
      setShowWindowPicker(true);
      return;
    }

    if (mode === "region") {
      // Show screen selector first to choose which screen to capture region from
      setPendingRegionCapture(true);
      setShowScreenSelector(true);
      setIsCapturing(false);
      return;
    }

    if (mode === "fullscreen") {
      // Show screen selector instead of directly capturing
      setPendingRegionCapture(false); // Ensure this is false for fullscreen
      setShowScreenSelector(true);
      setIsCapturing(false);
      return;
    }

    setIsCapturing(true);
    setStatusMessage("Capturing...");

    try {
      let result: CaptureResult;

      if (mode === "region") {
        // Region capture handled separately
        return;
      } else if (mode === "window") {
        // Window capture handled separately
        return;
      } else {
        throw new Error("Invalid capture mode");
      }

      setScreenshot(result);
      // Reset annotations for new capture
      setAnnotations([]);
      setSelectedAnnotationId(null);
      setActiveTool("select");
      setStatusMessage(undefined);

      // Auto-copy to clipboard if enabled (delay to ensure window is visible)
      setTimeout(async () => {
        try {
          const cfg = await GetConfig();
          if (cfg.export?.autoCopyToClipboard) {
            const format = (cfg.export?.defaultFormat || "png") as
              | "png"
              | "jpeg";
            const quality = cfg.export?.jpegQuality || 95;
            const success = await copyScreenshotToClipboard(
              result.data,
              format,
              quality
            );
            if (success) {
              setStatusMessage("Copied to clipboard!");
              setTimeout(() => setStatusMessage(undefined), 2000);
            }
          }
        } catch (err) {
          console.error("Auto-copy failed:", err);
        }
      }, 100);
    } catch (error) {
      console.error("Capture failed:", error);
      setStatusMessage("Capture failed");
      setTimeout(() => setStatusMessage(undefined), 3000);
    }

    setIsCapturing(false);
  }, []);

  const handleWindowSelect = async (
    window: WindowInfo,
    excludeTitleBar: boolean
  ) => {
    setShowWindowPicker(false);
    setIsCapturing(true);
    setStatusMessage(`Capturing: ${window.title}`);

    try {
      const result = (await CaptureWindow(
        window.handle,
        excludeTitleBar
      )) as CaptureResult;
      setScreenshot(result);
      // Reset annotations for new capture
      setAnnotations([]);
      setSelectedAnnotationId(null);
      setActiveTool("select");
      setStatusMessage(undefined);

      // Auto-copy to clipboard if enabled (delay to ensure window is visible)
      setTimeout(async () => {
        try {
          const cfg = await GetConfig();
          if (cfg.export?.autoCopyToClipboard) {
            const format = (cfg.export?.defaultFormat || "png") as
              | "png"
              | "jpeg";
            const quality = cfg.export?.jpegQuality || 95;
            const success = await copyScreenshotToClipboard(
              result.data,
              format,
              quality
            );
            if (success) {
              setStatusMessage("Copied to clipboard!");
              setTimeout(() => setStatusMessage(undefined), 2000);
            }
          }
        } catch (err) {
          console.error("Auto-copy failed:", err);
        }
      }, 100);
    } catch (error) {
      console.error("Window capture failed:", error);
      setStatusMessage("Capture failed");
      setTimeout(() => setStatusMessage(undefined), 3000);
    }

    setIsCapturing(false);
  };

  const handleRegionSelect = async (
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    setShowRegionSelector(false);
    setIsCapturing(true);
    setStatusMessage("Capturing region...");

    try {
      // Crop the selected region from the fullscreen screenshot (client-side)
      if (!regionScreenshot) {
        throw new Error("No screenshot data available");
      }

      // Create an image from the fullscreen screenshot
      const img = new Image();
      img.onload = async () => {
        // Apply DPI scale ratio to get actual pixel coordinates in the screenshot
        const scale = regionScaleRatio;
        const scaledX = Math.round(x * scale);
        const scaledY = Math.round(y * scale);
        const scaledWidth = Math.round(width * scale);
        const scaledHeight = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setStatusMessage("Failed to create canvas context");
          setIsCapturing(false);
          return;
        }

        // Crop the selected region from the high-DPI screenshot
        ctx.drawImage(
          img,
          scaledX,
          scaledY,
          scaledWidth,
          scaledHeight,
          0,
          0,
          scaledWidth,
          scaledHeight
        );

        // Get the cropped image as base64
        const croppedData = canvas.toDataURL("image/png").split(",")[1];
        setScreenshot({
          width: scaledWidth,
          height: scaledHeight,
          data: croppedData,
        });
        // Reset annotations for new capture
        setAnnotations([]);
        setSelectedAnnotationId(null);
        setActiveTool("select");
        setStatusMessage(undefined);
        setIsCapturing(false);

        // Restore window to normal state
        FinishRegionCapture();
        setRegionScreenshot(undefined);
        setRegionScaleRatio(1);

        // Auto-copy to clipboard if enabled (delay to ensure window is visible)
        setTimeout(async () => {
          try {
            const cfg = await GetConfig();
            if (cfg.export?.autoCopyToClipboard) {
              const format = (cfg.export?.defaultFormat || "png") as
                | "png"
                | "jpeg";
              const quality = cfg.export?.jpegQuality || 95;
              const success = await copyScreenshotToClipboard(
                croppedData,
                format,
                quality
              );
              if (success) {
                setStatusMessage("Copied to clipboard!");
                setTimeout(() => setStatusMessage(undefined), 2000);
              }
            }
          } catch (err) {
            console.error("Auto-copy failed:", err);
          }
        }, 100);
      };
      img.onerror = () => {
        setStatusMessage("Failed to load screenshot");
        setIsCapturing(false);
        FinishRegionCapture();
        setRegionScreenshot(undefined);
        setRegionScaleRatio(1);
      };
      img.src = `data:image/png;base64,${regionScreenshot}`;
    } catch (error) {
      console.error("Region capture failed:", error);
      setStatusMessage("Capture failed");
      setTimeout(() => setStatusMessage(undefined), 3000);
      setIsCapturing(false);
      FinishRegionCapture();
      setRegionScreenshot(undefined);
      setRegionScaleRatio(1);
    }
  };

  const handleClear = () => {
    setScreenshot(null);
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setStatusMessage(undefined);
  };

  const handleScreenSelect = useCallback(
    async (screenIndex: number) => {
      setShowScreenSelector(false);

      if (pendingRegionCapture) {
        // Region capture mode - prepare region capture for selected screen
        setIsCapturing(true);
        setStatusMessage("Preparing region capture...");
        setPendingRegionCapture(false);

        try {
          const data = await PrepareRegionCapture(screenIndex);
          if (!data.screenshot) {
            throw new Error("No screenshot data received");
          }
          setDisplayBounds({ width: data.width, height: data.height });
          setRegionScreenshot(data.screenshot.data);
          setRegionScaleRatio(data.scaleRatio || 1);
          setShowRegionSelector(true);
          setStatusMessage(undefined);
        } catch (error) {
          console.error("Failed to prepare region capture:", error);
          setStatusMessage("Failed to prepare region capture");
          setTimeout(() => setStatusMessage(undefined), 3000);
          setIsCapturing(false);
        }
      } else {
        // Fullscreen capture mode - capture the selected display
        setIsCapturing(true);
        setStatusMessage("Capturing screen...");

        try {
          // Capture the selected display
          const result = (await CaptureDisplay(screenIndex)) as CaptureResult;

          // Switch to editor mode
          SetEditorMode();

          setScreenshot(result);
          // Reset annotations for new capture
          setAnnotations([]);
          setSelectedAnnotationId(null);
          setActiveTool("select");
          setStatusMessage(undefined);

          // Auto-copy to clipboard if enabled
          setTimeout(async () => {
            try {
              const cfg = await GetConfig();
              if (cfg.export?.autoCopyToClipboard) {
                const format = (cfg.export?.defaultFormat || "png") as
                  | "png"
                  | "jpeg";
                const quality = cfg.export?.jpegQuality || 95;
                const success = await copyScreenshotToClipboard(
                  result.data,
                  format,
                  quality
                );
                if (success) {
                  setStatusMessage("Copied to clipboard!");
                  setTimeout(() => setStatusMessage(undefined), 2000);
                }
              }
            } catch (err) {
              console.error("Auto-copy failed:", err);
            }
          }, 100);
        } catch (error) {
          console.error("Screen capture failed:", error);
          setStatusMessage("Capture failed");
          setTimeout(() => setStatusMessage(undefined), 3000);
        }

        setIsCapturing(false);
      }
    },
    [pendingRegionCapture]
  );

  const handleImportImage = useCallback((screenshot: CaptureResult) => {
    setScreenshot(screenshot);
    // Reset annotations and crop state for imported image
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setActiveTool("select");
    setStatusMessage("Image imported successfully");
    setTimeout(() => setStatusMessage(undefined), 2000);
  }, []);

  const handleImportImageDialog = useCallback(async () => {
    setStatusMessage("Opening file dialog...");

    try {
      const result = await OpenImage();

      if (!result) {
        // User cancelled
        setStatusMessage(undefined);
        return;
      }

      handleImportImage(result as CaptureResult);
    } catch (error) {
      console.error("Import failed:", error);
      setStatusMessage("Failed to import image");
      setTimeout(() => setStatusMessage(undefined), 3000);
    }
  }, [handleImportImage]);

  // Listen for global hotkey events from backend
  useEffect(() => {
    const handleFullscreen = () => {
      handleCapture("fullscreen");
    };
    const handleRegion = async () => {
      // Show screen selector first for region capture
      setPendingRegionCapture(true);
      setShowScreenSelector(true);
    };
    const handleWindow = () => {
      setShowWindowPicker(true);
    };

    EventsOn("hotkey:fullscreen", handleFullscreen);
    EventsOn("hotkey:region", handleRegion);
    EventsOn("hotkey:window", handleWindow);

    return () => {
      EventsOff("hotkey:fullscreen");
      EventsOff("hotkey:region");
      EventsOff("hotkey:window");
    };
  }, [handleCapture]);

  // Handle minimize to tray
  const handleMinimizeToTray = useCallback(() => {
    MinimizeToTray();
  }, []);

  // Annotation handlers
  const handleAnnotationAdd = useCallback((annotation: Annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
  }, []);

  const handleAnnotationSelect = useCallback((id: string | null) => {
    setSelectedAnnotationId(id);
  }, []);

  const handleAnnotationUpdate = useCallback(
    (id: string, updates: Partial<Annotation>) => {
      setAnnotations((prev) =>
        prev.map((ann) => (ann.id === id ? { ...ann, ...updates } : ann))
      );
    },
    []
  );

  // Update selected annotation color when stroke color changes
  const handleStrokeColorChange = useCallback(
    (color: string) => {
      setStrokeColor(color);
      if (selectedAnnotationId) {
        handleAnnotationUpdate(selectedAnnotationId, { stroke: color });
      }
    },
    [selectedAnnotationId, handleAnnotationUpdate]
  );

  // Update selected annotation stroke width when it changes
  const handleStrokeWidthChange = useCallback(
    (width: number) => {
      setStrokeWidth(width);
      if (selectedAnnotationId) {
        handleAnnotationUpdate(selectedAnnotationId, { strokeWidth: width });
      }
    },
    [selectedAnnotationId, handleAnnotationUpdate]
  );

  // Update selected text annotation font size when it changes
  const handleFontSizeChange = useCallback(
    (size: number) => {
      setFontSize(size);
      if (selectedAnnotationId) {
        const selectedAnnotation = annotations.find(
          (a) => a.id === selectedAnnotationId
        );
        if (selectedAnnotation?.type === "text") {
          handleAnnotationUpdate(selectedAnnotationId, { fontSize: size });
        }
      }
    },
    [selectedAnnotationId, annotations, handleAnnotationUpdate]
  );

  // Update selected text annotation font style when it changes
  const handleFontStyleChange = useCallback(
    (style: "normal" | "bold" | "italic" | "bold italic") => {
      setFontStyle(style);
      if (selectedAnnotationId) {
        const selectedAnnotation = annotations.find(
          (a) => a.id === selectedAnnotationId
        );
        if (selectedAnnotation?.type === "text") {
          handleAnnotationUpdate(selectedAnnotationId, { fontStyle: style });
        }
      }
    },
    [selectedAnnotationId, annotations, handleAnnotationUpdate]
  );

  // Update selected arrow annotation curved property
  const handleCurvedChange = useCallback(
    (curved: boolean) => {
      if (selectedAnnotationId) {
        const selectedAnnotation = annotations.find(
          (a) => a.id === selectedAnnotationId
        );
        if (selectedAnnotation?.type === "arrow") {
          handleAnnotationUpdate(selectedAnnotationId, { curved });
        }
      }
    },
    [selectedAnnotationId, annotations, handleAnnotationUpdate]
  );

  // Handle border radius change for rectangles
  const handleBorderRadiusChange = useCallback(
    (radius: number) => {
      if (selectedAnnotationId) {
        const selectedAnnotation = annotations.find(
          (a) => a.id === selectedAnnotationId
        );
        if (selectedAnnotation?.type === "rectangle") {
          handleAnnotationUpdate(selectedAnnotationId, { borderRadius: radius });
        }
      }
    },
    [selectedAnnotationId, annotations, handleAnnotationUpdate]
  );

  // Handle fill color change for shapes
  const handleFillColorChange = useCallback(
    (color: string) => {
      if (selectedAnnotationId) {
        const selectedAnnotation = annotations.find(
          (a) => a.id === selectedAnnotationId
        );
        if (
          selectedAnnotation?.type === "rectangle" ||
          selectedAnnotation?.type === "ellipse"
        ) {
          handleAnnotationUpdate(selectedAnnotationId, { fill: color });
        }
      }
    },
    [selectedAnnotationId, annotations, handleAnnotationUpdate]
  );

  // Handle opacity change for annotations
  const handleOpacityChange = useCallback(
    (opacity: number) => {
      if (selectedAnnotationId) {
        handleAnnotationUpdate(selectedAnnotationId, { opacity });
      }
    },
    [selectedAnnotationId, handleAnnotationUpdate]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedAnnotationId) {
      setAnnotations((prev) =>
        prev.filter((ann) => ann.id !== selectedAnnotationId)
      );
      setSelectedAnnotationId(null);
    }
  }, [selectedAnnotationId]);

  // Tool change handler
  const handleToolChange = useCallback((tool: EditorTool) => {
    setActiveTool(tool);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedAnnotationId) {
          handleDeleteSelected();
        }
      } else if (e.key === "Escape") {
        setSelectedAnnotationId(null);
        setActiveTool("select");
      } else if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        // Tool shortcuts (single keys without modifiers)
        const key = e.key.toLowerCase();
        switch (key) {
          case "v":
            handleToolChange("select");
            break;
          case "r":
            handleToolChange("rectangle");
            break;
          case "e":
            handleToolChange("ellipse");
            break;
          case "a":
            handleToolChange("arrow");
            break;
          case "l":
            handleToolChange("line");
            break;
          case "t":
            handleToolChange("text");
            break;
          case "s":
            handleToolChange("spotlight");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAnnotationId, handleDeleteSelected, handleToolChange]);

  const getCanvasDataUrl = useCallback(
    async (
      format: "png" | "jpeg",
      scale: number = 1
    ): Promise<string | null> => {
      const canvasElement = stageRef.current as HTMLDivElement | null;
      if (!canvasElement || !screenshot) return null;

      try {
        // Import html2canvas dynamically
        const html2canvas = (await import("html2canvas")).default;

        // Get the actual output dimensions
        const { totalWidth, totalHeight } = calculateOutputDimensions(
          screenshot.width,
          screenshot.height,
          padding,
          outputRatio,
          customDimensions
        );

        // The canvasElement is the export canvas which is already at full size
        // Wait a frame to ensure layout is complete
        await new Promise((resolve) => requestAnimationFrame(resolve));

        // Temporarily make the export canvas visible for html2canvas
        const parentContainer = canvasElement.parentElement;
        const originalParentStyles = parentContainer
          ? {
              opacity: parentContainer.style.opacity,
              visibility: parentContainer.style.visibility,
              zIndex: parentContainer.style.zIndex,
            }
          : null;
        const originalElementStyles = {
          opacity: canvasElement.style.opacity,
          visibility: canvasElement.style.visibility,
        };

        // Make visible for capture
        if (parentContainer) {
          parentContainer.style.opacity = "1";
          parentContainer.style.visibility = "visible";
          parentContainer.style.zIndex = "999999";
        }
        canvasElement.style.opacity = "1";
        canvasElement.style.visibility = "visible";

        // Wait for visibility changes to take effect
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        );

        try {
          // Determine background color for export
          // If transparent, use null; otherwise use the background color value
          const exportBackgroundColor =
            backgroundColor === "transparent"
              ? null
              : backgroundColor.startsWith("url(")
              ? null // Let html2canvas handle image backgrounds
              : backgroundColor;

          // Capture the export canvas with proper options
          const canvas = await html2canvas(canvasElement, {
            backgroundColor: exportBackgroundColor as any,
            scale: scale,
            useCORS: true,
            logging: false,
            allowTaint: false,
            removeContainer: false,
            imageTimeout: 15000,
            // Don't specify width/height - let html2canvas detect from element
          } as any);

          // Restore original styles
          if (parentContainer && originalParentStyles) {
            parentContainer.style.opacity = originalParentStyles.opacity || "0";
            parentContainer.style.visibility =
              originalParentStyles.visibility || "visible";
            parentContainer.style.zIndex =
              originalParentStyles.zIndex || "-9999";
          }
          canvasElement.style.opacity = originalElementStyles.opacity || "";
          canvasElement.style.visibility =
            originalElementStyles.visibility || "";

          // Verify the captured dimensions match expected
          if (
            canvas.width !== totalWidth * scale ||
            canvas.height !== totalHeight * scale
          ) {
            console.warn(
              `Dimension mismatch: expected ${totalWidth * scale}x${
                totalHeight * scale
              }, got ${canvas.width}x${canvas.height}`
            );
          }

          return format === "jpeg"
            ? canvas.toDataURL("image/jpeg", 0.95)
            : canvas.toDataURL("image/png");
        } finally {
          // Always restore styles even if there's an error
          if (parentContainer && originalParentStyles) {
            parentContainer.style.opacity = originalParentStyles.opacity || "0";
            parentContainer.style.visibility =
              originalParentStyles.visibility || "visible";
            parentContainer.style.zIndex =
              originalParentStyles.zIndex || "-9999";
          }
          canvasElement.style.opacity = originalElementStyles.opacity || "";
          canvasElement.style.visibility =
            originalElementStyles.visibility || "";
        }
      } catch (error) {
        console.error("Failed to export canvas:", error);
        return null;
      }
    },
    [screenshot, padding, outputRatio, customDimensions]
  );
  const getBase64FromDataUrl = (dataUrl: string): string => {
    return dataUrl.split(",")[1];
  };

  // Export handlers
  const handleSave = useCallback(
    async (format: "png" | "jpeg", scale: number = 1) => {
      const dataUrl = await getCanvasDataUrl(format, scale);
      if (!dataUrl) {
        setStatusMessage("Export failed: No canvas available");
        return;
      }

      setIsExporting(true);
      setStatusMessage(
        `Saving${scale > 1 ? ` at ${scale}x resolution` : ""}...`
      );

      try {
        const base64Data = getBase64FromDataUrl(dataUrl);
        const result = await SaveImage(base64Data, format);

        if (result.success) {
          setStatusMessage(
            `Saved to ${result.filePath}${scale > 1 ? ` (${scale}x)` : ""}`
          );
        } else {
          setStatusMessage(result.error || "Save failed");
        }
      } catch (error) {
        console.error("Save failed:", error);
        setStatusMessage("Save failed");
      }

      setIsExporting(false);
      setTimeout(() => setStatusMessage(undefined), 3000);
    },
    [getCanvasDataUrl]
  );

  const handleQuickSave = useCallback(
    async (format: "png" | "jpeg", scale: number = 1) => {
      const dataUrl = await getCanvasDataUrl(format, scale);
      if (!dataUrl) {
        setStatusMessage("Export failed: No canvas available");
        return;
      }

      setIsExporting(true);
      setStatusMessage(
        `Saving${scale > 1 ? ` at ${scale}x resolution` : ""}...`
      );

      try {
        const base64Data = getBase64FromDataUrl(dataUrl);
        const result = await QuickSave(base64Data, format);

        if (result.success) {
          setStatusMessage(`Saved to ${result.filePath}`);
        } else {
          setStatusMessage(result.error || "Quick save failed");
        }
      } catch (error) {
        console.error("Quick save failed:", error);
        setStatusMessage("Quick save failed");
      }

      setIsExporting(false);
      setTimeout(() => setStatusMessage(undefined), 3000);
    },
    [getCanvasDataUrl]
  );

  const handleCopyToClipboard = useCallback(async () => {
    const canvasElement = stageRef.current as HTMLDivElement | null;
    if (!canvasElement || !screenshot) {
      setStatusMessage("Copy failed: No canvas available");
      return;
    }

    setIsExporting(true);
    setStatusMessage("Copying to clipboard...");

    try {
      // Use html2canvas to capture the canvas
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: null as any,
        scale: 1,
        useCORS: true,
        logging: false,
      } as any);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });

      if (!blob) {
        throw new Error("Failed to create image blob");
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);

      setStatusMessage("Copied to clipboard!");
    } catch (error) {
      console.error("Copy to clipboard failed:", error);
      setStatusMessage("Copy to clipboard failed");
    }

    setIsExporting(false);
    setTimeout(() => setStatusMessage(undefined), 2000);
  }, [screenshot, padding, outputRatio]);

  // Keyboard shortcuts for export and import
  useEffect(() => {
    const handleExportKeyDown = (e: KeyboardEvent) => {
      // Ctrl+O for import (works anytime)
      if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        handleImportImageDialog();
        return;
      }

      if (!screenshot) return;

      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        handleSave("png");
      } else if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleQuickSave("png");
      } else if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        handleCopyToClipboard();
      }
    };

    window.addEventListener("keydown", handleExportKeyDown);
    return () => window.removeEventListener("keydown", handleExportKeyDown);
  }, [
    screenshot,
    handleSave,
    handleQuickSave,
    handleCopyToClipboard,
    handleImportImage,
  ]);

  // When no screenshot, show compact capture widget
  if (!screenshot) {
    return (
      <div
        className="flex items-center justify-center h-screen w-screen p-4"
        style={
          {
            background: "var(--color-bg-primary)",
            "--wails-draggable": "drag",
          } as React.CSSProperties
        }
      >
        <CaptureWidget
          onCapture={handleCapture}
          isCapturing={isCapturing}
          onImportImage={handleImportImageDialog}
        />

        <WindowPicker
          isOpen={showWindowPicker}
          onClose={() => setShowWindowPicker(false)}
          onSelect={handleWindowSelect}
        />

        <RegionSelector
          isOpen={showRegionSelector}
          onClose={() => {
            setShowRegionSelector(false);
            FinishRegionCapture();
            setRegionScreenshot(undefined);
            setRegionScaleRatio(1);
          }}
          onSelect={handleRegionSelect}
          screenWidth={displayBounds.width}
          screenHeight={displayBounds.height}
          screenshotData={regionScreenshot}
        />

        <ScreenSelector
          isOpen={showScreenSelector}
          onClose={() => {
            setShowScreenSelector(false);
          }}
          onSelect={handleScreenSelect}
        />

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--color-bg-primary)" }}
    >
      <TitleBar onMinimize={handleMinimizeToTray} />

      {screenshot && (
        <AnnotationToolbar
          activeTool={activeTool}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          fontSize={fontSize}
          fontStyle={fontStyle}
          onToolChange={handleToolChange}
          onColorChange={handleStrokeColorChange}
          onStrokeWidthChange={handleStrokeWidthChange}
          onFontSizeChange={handleFontSizeChange}
          onFontStyleChange={handleFontStyleChange}
          onCurvedChange={handleCurvedChange}
          onBorderRadiusChange={handleBorderRadiusChange}
          onFillColorChange={handleFillColorChange}
          onOpacityChange={handleOpacityChange}
          onDeleteSelected={handleDeleteSelected}
          hasSelection={!!selectedAnnotationId}
          selectedAnnotation={
            selectedAnnotationId
              ? annotations.find((a) => a.id === selectedAnnotationId)
              : undefined
          }
          onCapture={handleCapture}
          isCapturing={isCapturing}
          onClear={handleClear}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      <div className="flex flex-1 overflow-hidden min-h-0">
        <SettingsPanel
          padding={padding}
          cornerRadius={cornerRadius}
          shadowSize={shadowSize}
          backgroundColor={backgroundColor}
          outputRatio={outputRatio}
          imageWidth={screenshot?.width}
          imageHeight={screenshot?.height}
          customDimensions={customDimensions}
          screenshot={screenshot}
          onPaddingChange={setPadding}
          onCornerRadiusChange={setCornerRadius}
          onShadowSizeChange={setShadowSize}
          onBackgroundChange={setBackgroundColor}
          onOutputRatioChange={setOutputRatio}
          onCustomDimensionsChange={setCustomDimensions}
          onImageImport={handleImportImage}
        />

        <div className="flex-1 overflow-hidden">
          <EditorCanvas
            screenshot={screenshot}
            padding={padding}
            cornerRadius={cornerRadius}
            shadowSize={shadowSize}
            backgroundColor={backgroundColor}
            outputRatio={outputRatio}
            customDimensions={customDimensions}
            stageRef={stageRef}
            activeTool={activeTool}
            annotations={annotations}
            selectedAnnotationId={selectedAnnotationId}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            fontSize={fontSize}
            fontStyle={fontStyle}
            onAnnotationAdd={handleAnnotationAdd}
            onAnnotationSelect={handleAnnotationSelect}
            onAnnotationUpdate={handleAnnotationUpdate}
            onToolChange={handleToolChange}
          />
        </div>
      </div>

      <ExportToolbar
        screenshot={screenshot}
        onSave={handleSave}
        onQuickSave={handleQuickSave}
        onCopyToClipboard={handleCopyToClipboard}
        isExporting={isExporting}
      />

      <WindowPicker
        isOpen={showWindowPicker}
        onClose={() => setShowWindowPicker(false)}
        onSelect={handleWindowSelect}
      />

      <RegionSelector
        isOpen={showRegionSelector}
        onClose={() => {
          setShowRegionSelector(false);
          FinishRegionCapture();
          setRegionScreenshot(undefined);
          setRegionScaleRatio(1);
        }}
        onSelect={handleRegionSelect}
        screenWidth={displayBounds.width}
        screenHeight={displayBounds.height}
        screenshotData={regionScreenshot}
      />

      <ScreenSelector
        isOpen={showScreenSelector}
        onClose={() => {
          setShowScreenSelector(false);
        }}
        onSelect={handleScreenSelect}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default App;
