import { EditorTool, Annotation, CaptureMode } from "../types";
import {
  MousePointer2,
  Trash2,
  Bold,
  Italic,
  Spline,
  Settings,
  CornerDownRight,
  Circle,
  Square,
  MoveRight,
  Minus,
  Type,
  Lightbulb,
  Palette,
  Layers,
} from "lucide-react";
import { ColorPickerDropdown } from "./color-picker-dropdown";
import { StrokeWidthDropdown } from "./stroke-width-dropdown";
import { ToolsDropdown } from "./tools-dropdown";

interface AnnotationToolbarProps {
  activeTool: EditorTool;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  fontStyle: "normal" | "bold" | "italic" | "bold italic";
  onToolChange: (tool: EditorTool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onFontSizeChange: (size: number) => void;
  onFontStyleChange: (
    style: "normal" | "bold" | "italic" | "bold italic"
  ) => void;
  onCurvedChange?: (curved: boolean) => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  selectedAnnotation?: Annotation;
  // New props for enhanced controls
  onBorderRadiusChange?: (radius: number) => void;
  onFillColorChange?: (color: string) => void;
  onOpacityChange?: (opacity: number) => void;
  // Capture props
  onCapture?: (mode: CaptureMode) => void;
  isCapturing?: boolean;
  onClear?: () => void;
  onOpenSettings?: () => void;
}

const FONT_SIZES = [16, 24, 32, 48, 64, 80, 96];

export function AnnotationToolbar({
  activeTool,
  strokeColor,
  strokeWidth,
  fontSize,
  fontStyle,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onFontSizeChange,
  onFontStyleChange,
  onCurvedChange,
  onDeleteSelected,
  hasSelection,
  selectedAnnotation,
  onBorderRadiusChange,
  onFillColorChange,
  onOpacityChange,
  onCapture,
  isCapturing = false,
  onClear,
  onOpenSettings,
}: AnnotationToolbarProps) {
  const showTextControls =
    activeTool === "text" || selectedAnnotation?.type === "text";
  const showArrowControls = selectedAnnotation?.type === "arrow";
  const showRectangleControls = selectedAnnotation?.type === "rectangle";
  const showShapeControls =
    selectedAnnotation?.type === "rectangle" ||
    selectedAnnotation?.type === "ellipse";
  const isArrowCurved =
    selectedAnnotation?.type === "arrow" && selectedAnnotation?.curved;

  const currentFontSize =
    selectedAnnotation?.type === "text"
      ? selectedAnnotation.fontSize || 48
      : fontSize;
  const currentFontStyle =
    selectedAnnotation?.type === "text"
      ? selectedAnnotation.fontStyle || "normal"
      : fontStyle;

  const currentBorderRadius = selectedAnnotation?.borderRadius ?? 0;
  const currentFillColor = selectedAnnotation?.fill ?? "transparent";
  const currentOpacity = selectedAnnotation?.opacity ?? 1;

  const toggleBold = () => {
    const isBold =
      currentFontStyle === "bold" || currentFontStyle === "bold italic";
    const isItalic =
      currentFontStyle === "italic" || currentFontStyle === "bold italic";
    onFontStyleChange(
      isBold
        ? isItalic
          ? "italic"
          : "normal"
        : isItalic
        ? "bold italic"
        : "bold"
    );
  };

  const toggleItalic = () => {
    const isBold =
      currentFontStyle === "bold" || currentFontStyle === "bold italic";
    const isItalic =
      currentFontStyle === "italic" || currentFontStyle === "bold italic";
    onFontStyleChange(
      isItalic
        ? isBold
          ? "bold"
          : "normal"
        : isBold
        ? "bold italic"
        : "italic"
    );
  };

  const isBoldActive =
    currentFontStyle === "bold" || currentFontStyle === "bold italic";
  const isItalicActive =
    currentFontStyle === "italic" || currentFontStyle === "bold italic";

  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 border-b"
      style={{
        borderColor: "rgba(148, 163, 184, 0.06)",
        background: "var(--color-bg-sidebar)",
      }}
    >
      {/* Tools Section */}
      <div className="flex items-center gap-1.5">
        {/* Select Tool */}
        <button
          onClick={() => onToolChange("select")}
          className={`p-2 rounded-lg transition-all duration-200 ${
            activeTool === "select"
              ? "text-white"
              : "hover:text-white hover:bg-white/10"
          }`}
          style={
            activeTool === "select"
              ? ({
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "rgba(240, 240, 240, 1)",
                } as React.CSSProperties)
              : ({
                  color: "rgba(148, 163, 184, 0.65)",
                } as React.CSSProperties)
          }
          title="Select (V)"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>

        {/* Shapes & Tools Dropdown */}
        <ToolsDropdown activeTool={activeTool} onToolChange={onToolChange} />
      </div>

      {/* Divider */}
      <div
        className="h-6 w-px mx-1"
        style={{ background: "rgba(148, 163, 184, 0.1)" }}
      />

      {/* Stroke Controls */}
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-medium whitespace-nowrap"
          style={{ color: "rgba(148, 163, 184, 0.7)" }}
        >
          Stroke
        </span>
        <ColorPickerDropdown
          color={strokeColor}
          onColorChange={onColorChange}
        />
        {!showTextControls && (
          <StrokeWidthDropdown
            width={strokeWidth}
            onWidthChange={onStrokeWidthChange}
          />
        )}
      </div>

      {/* Fill Controls - for shapes */}
      {showShapeControls && onFillColorChange && (
        <>
          <div
            className="h-6 w-px mx-1"
            style={{ background: "rgba(148, 163, 184, 0.1)" }}
          />
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{ color: "rgba(148, 163, 184, 0.7)" }}
            >
              Fill
            </span>
            <ColorPickerDropdown
              color={
                currentFillColor === "transparent"
                  ? "#ffffff"
                  : currentFillColor
              }
              onColorChange={(color) => {
                if (color === "#ffffff" && currentFillColor === "transparent") {
                  onFillColorChange("transparent");
                } else {
                  onFillColorChange(color);
                }
              }}
            />
            <button
              onClick={() => onFillColorChange("transparent")}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentFillColor === "transparent"
                  ? "text-white"
                  : "hover:text-white hover:bg-white/10"
              }`}
              style={
                currentFillColor === "transparent"
                  ? ({
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "rgba(240, 240, 240, 1)",
                    } as React.CSSProperties)
                  : ({
                      color: "rgba(148, 163, 184, 0.65)",
                    } as React.CSSProperties)
              }
              title="No Fill"
            >
              None
            </button>
          </div>
        </>
      )}

      {/* Border Radius Control - for rectangles */}
      {showRectangleControls && onBorderRadiusChange && (
        <>
          <div
            className="h-6 w-px mx-1"
            style={{ background: "rgba(148, 163, 184, 0.1)" }}
          />
          <div className="flex items-center gap-2">
            <CornerDownRight
              className="w-4 h-4"
              style={{ color: "rgba(148, 163, 184, 0.7)" }}
            />
            <input
              type="range"
              min="0"
              max="50"
              value={currentBorderRadius}
              onChange={(e) => onBorderRadiusChange(Number(e.target.value))}
              className="w-20 h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgba(99, 102, 241, 0.8) 0%, rgba(99, 102, 241, 0.8) ${
                  (currentBorderRadius / 50) * 100
                }%, rgba(148, 163, 184, 0.2) ${
                  (currentBorderRadius / 50) * 100
                }%, rgba(148, 163, 184, 0.2) 100%)`,
              }}
              title={`Border Radius: ${currentBorderRadius}px`}
            />
            <span
              className="text-xs font-medium w-8 text-right"
              style={{ color: "rgba(148, 163, 184, 0.7)" }}
            >
              {currentBorderRadius}px
            </span>
          </div>
        </>
      )}

      {/* Opacity Control - for all annotations */}
      {hasSelection && onOpacityChange && (
        <>
          <div
            className="h-6 w-px mx-1"
            style={{ background: "rgba(148, 163, 184, 0.1)" }}
          />
          <div className="flex items-center gap-2">
            <Layers
              className="w-4 h-4"
              style={{ color: "rgba(148, 163, 184, 0.7)" }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={currentOpacity * 100}
              onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
              className="w-20 h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgba(99, 102, 241, 0.8) 0%, rgba(99, 102, 241, 0.8) ${
                  currentOpacity * 100
                }%, rgba(148, 163, 184, 0.2) ${
                  currentOpacity * 100
                }%, rgba(148, 163, 184, 0.2) 100%)`,
              }}
              title={`Opacity: ${Math.round(currentOpacity * 100)}%`}
            />
            <span
              className="text-xs font-medium w-10 text-right"
              style={{ color: "rgba(148, 163, 184, 0.7)" }}
            >
              {Math.round(currentOpacity * 100)}%
            </span>
          </div>
        </>
      )}

      {/* Text Controls */}
      {showTextControls && (
        <>
          <div
            className="h-6 w-px mx-1"
            style={{ background: "rgba(148, 163, 184, 0.1)" }}
          />
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{ color: "rgba(148, 163, 184, 0.7)" }}
            >
              Size
            </span>
            <select
              value={currentFontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-md border text-xs transition-all duration-200
                         focus:outline-none focus:ring-2 cursor-pointer"
              style={
                {
                  background: "var(--color-bg-input)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  "--tw-ring-color": "var(--color-primary-500)",
                } as React.CSSProperties
              }
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-primary)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-border)")
              }
              title={`Font Size: ${currentFontSize}px`}
            >
              {FONT_SIZES.map((size) => (
                <option
                  key={size}
                  value={size}
                  style={{ background: "var(--color-bg-primary)" }}
                >
                  {size}px
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleBold}
              className={`p-1.5 rounded-md transition-all duration-200 ${
                isBoldActive
                  ? "text-white"
                  : "hover:text-white hover:bg-white/10"
              }`}
              style={
                isBoldActive
                  ? ({
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "rgba(240, 240, 240, 1)",
                    } as React.CSSProperties)
                  : ({
                      color: "rgba(148, 163, 184, 0.65)",
                    } as React.CSSProperties)
              }
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={toggleItalic}
              className={`p-1.5 rounded-md transition-all duration-200 ${
                isItalicActive
                  ? "text-white"
                  : "hover:text-white hover:bg-white/10"
              }`}
              style={
                isItalicActive
                  ? ({
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "rgba(240, 240, 240, 1)",
                    } as React.CSSProperties)
                  : ({
                      color: "rgba(148, 163, 184, 0.65)",
                    } as React.CSSProperties)
              }
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* Arrow Controls */}
      {showArrowControls && onCurvedChange && (
        <>
          <div
            className="h-6 w-px mx-1"
            style={{ background: "rgba(148, 163, 184, 0.1)" }}
          />
          <button
            onClick={() => onCurvedChange(!isArrowCurved)}
            className={`px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-2 ${
              isArrowCurved
                ? "text-white"
                : "hover:text-white hover:bg-white/10"
            }`}
            style={
              isArrowCurved
                ? ({
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "rgba(240, 240, 240, 1)",
                  } as React.CSSProperties)
                : ({
                    color: "rgba(148, 163, 184, 0.65)",
                  } as React.CSSProperties)
            }
            title={isArrowCurved ? "Straight Arrow" : "Curved Arrow"}
          >
            <Spline className="w-4 h-4" />
            <span className="text-xs font-medium">Curve</span>
          </button>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5">
        {/* Delete Button */}
        <button
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          className={`p-2 rounded-lg transition-all duration-200 ${
            hasSelection ? "hover:text-white" : "cursor-not-allowed opacity-50"
          }`}
          style={
            hasSelection
              ? ({
                  color: "var(--color-danger)",
                } as React.CSSProperties)
              : ({
                  color: "var(--color-text-disabled)",
                } as React.CSSProperties)
          }
          title={
            hasSelection
              ? "Delete Selected (Delete)"
              : "Delete Selected (No selection)"
          }
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Clear Button */}
        {onClear && (
          <button
            onClick={onClear}
            className="px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200"
            style={{
              background: "var(--color-bg-slider)",
              borderColor: "rgba(148, 163, 184, 0.1)",
              color: "rgba(148, 163, 184, 0.65)",
            }}
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
            title="Clear screenshot"
          >
            Clear
          </button>
        )}

        {/* Settings Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg border transition-all duration-200"
            style={{
              background: "var(--color-bg-slider)",
              borderColor: "rgba(148, 163, 184, 0.1)",
              color: "rgba(148, 163, 184, 0.65)",
            }}
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
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
