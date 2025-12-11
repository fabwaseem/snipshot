import html2canvas from "html2canvas";
import { ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Annotation,
  AnnotationType,
  CaptureResult,
  CustomDimensions,
  EditorTool,
  OutputRatio,
} from "../types";

interface HtmlEditorCanvasProps {
  screenshot: CaptureResult | null;
  padding: number;
  cornerRadius: number;
  shadowSize: number;
  backgroundColor: string;
  outputRatio: OutputRatio;
  customDimensions: CustomDimensions | null;
  stageRef?: React.RefObject<HTMLDivElement>;
  // Annotation props
  activeTool: EditorTool;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  fontStyle: "normal" | "bold" | "italic" | "bold italic";
  onAnnotationAdd: (annotation: Annotation) => void;
  onAnnotationSelect: (id: string | null) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onToolChange?: (tool: EditorTool) => void;
}

// Helper to parse ratio string into numeric ratio
function parseRatio(ratio: OutputRatio): number | null {
  if (ratio === "auto") return null;
  const [w, h] = ratio.split(":").map(Number);
  return w / h;
}

// Calculate output dimensions based on ratio, screenshot, and padding
// Note: Padding is NOT included in container size - it's only the space between container and image
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
    // Auto mode: container size matches screenshot size (padding will shrink image)
    return { totalWidth: screenshotWidth, totalHeight: screenshotHeight };
  }

  // Calculate container dimensions based on screenshot size to maintain target ratio
  // Padding does NOT affect container size - it only affects image size inside the container
  const screenshotAspect = screenshotWidth / screenshotHeight;

  if (targetRatio > screenshotAspect) {
    // Target is wider - expand width to match ratio
    return {
      totalWidth: Math.round(screenshotHeight * targetRatio),
      totalHeight: screenshotHeight,
    };
  } else {
    // Target is taller - expand height to match ratio
    return {
      totalWidth: screenshotWidth,
      totalHeight: Math.round(screenshotWidth / targetRatio),
    };
  }
}

export function HtmlEditorCanvas({
  screenshot,
  padding,
  cornerRadius,
  shadowSize,
  backgroundColor,
  outputRatio,
  customDimensions,
  stageRef,
  activeTool,
  annotations,
  selectedAnnotationId,
  strokeColor,
  strokeWidth,
  fontSize,
  fontStyle,
  onAnnotationAdd,
  onAnnotationSelect,
  onAnnotationUpdate,
  onToolChange,
}: HtmlEditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const exportCanvasRef = useRef<HTMLDivElement>(null); // Hidden canvas for export at full size
  const internalStageRef = useRef<HTMLDivElement>(null);

  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 600,
  });
  const [scale, setScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [tempAnnotation, setTempAnnotation] = useState<Annotation | null>(null);
  const [dragMode, setDragMode] = useState<
    "none" | "moving" | "resizing" | "rotating" | "nw" | "ne" | "sw" | "se"
  >("none");
  const [dragStart, setDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    annotation: Annotation;
    angle?: number;
  } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus text input when editing starts
  useEffect(() => {
    if (editingTextId && textInputRef.current) {
      textInputRef.current.focus();
      // Select all text for easy replacement
      textInputRef.current.select();
    }
  }, [editingTextId]);

  const activeStageRef = stageRef || internalStageRef;

  // Expose export canvas ref for export (initial setup)
  useEffect(() => {
    if (exportCanvasRef.current) {
      if (stageRef) {
        (stageRef as React.MutableRefObject<HTMLDivElement | null>).current =
          exportCanvasRef.current;
      } else {
        (
          internalStageRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = exportCanvasRef.current;
      }
    }
  }, [stageRef]);

  // Calculate dimensions
  const outputDims = screenshot
    ? calculateOutputDimensions(
        screenshot.width,
        screenshot.height,
        padding,
        outputRatio,
        customDimensions
      )
    : { totalWidth: 800, totalHeight: 600 };

  const imageSrc = screenshot
    ? `data:image/png;base64,${screenshot.data}`
    : null;

  // Update container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          setContainerSize({
            width: parent.clientWidth || containerRef.current.clientWidth,
            height: parent.clientHeight || containerRef.current.clientHeight,
          });
        }
      }
    };
    requestAnimationFrame(updateSize);
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [screenshot]);

  // Calculate scale to fit
  useEffect(() => {
    if (screenshot && containerSize.width > 0 && containerSize.height > 0) {
      const scaleX = (containerSize.width - 80) / outputDims.totalWidth;
      const scaleY = (containerSize.height - 80) / outputDims.totalHeight;
      setScale(Math.min(scaleX, scaleY, 1));
    }
  }, [screenshot, containerSize, outputDims]);

  // Helper to get mouse position relative to canvas (accounting for scale)
  const getCanvasPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    return { x, y };
  };

  // Check if click is on a resize handle or rotation handle
  const getHandleAtPosition = (
    pos: { x: number; y: number },
    annotation: Annotation
  ): "nw" | "ne" | "sw" | "se" | "rotate" | null => {
    const HANDLE_SIZE = 8;
    const HANDLE_OFFSET = 20; // Distance for rotation handle
    const centerX = annotation.x + annotation.width / 2;
    const centerY = annotation.y + annotation.height / 2;
    const rotationHandleY = annotation.y - HANDLE_OFFSET;

    // Check rotation handle (above center)
    if (
      pos.x >= centerX - HANDLE_SIZE / 2 &&
      pos.x <= centerX + HANDLE_SIZE / 2 &&
      pos.y >= rotationHandleY - HANDLE_SIZE / 2 &&
      pos.y <= rotationHandleY + HANDLE_SIZE / 2
    ) {
      return "rotate";
    }

    // Check corner handles
    const handles = [
      { pos: "nw" as const, x: annotation.x, y: annotation.y },
      {
        pos: "ne" as const,
        x: annotation.x + annotation.width,
        y: annotation.y,
      },
      {
        pos: "sw" as const,
        x: annotation.x,
        y: annotation.y + annotation.height,
      },
      {
        pos: "se" as const,
        x: annotation.x + annotation.width,
        y: annotation.y + annotation.height,
      },
    ];

    for (const handle of handles) {
      if (
        pos.x >= handle.x - HANDLE_SIZE / 2 &&
        pos.x <= handle.x + HANDLE_SIZE / 2 &&
        pos.y >= handle.y - HANDLE_SIZE / 2 &&
        pos.y <= handle.y + HANDLE_SIZE / 2
      ) {
        return handle.pos;
      }
    }

    return null;
  };

  // Mouse down handler - start drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Handle selection tool interactions
    if (activeTool === "select" || activeTool === "crop") {
      const pos = getCanvasPosition(e);
      if (!pos) return;

      if (activeTool === "select" && selectedAnnotationId) {
        const selectedAnnotation = annotations.find(
          (ann) => ann.id === selectedAnnotationId
        );
        if (selectedAnnotation) {
          const handle = getHandleAtPosition(pos, selectedAnnotation);
          if (handle === "rotate") {
            setDragMode("rotating");
            const centerX = selectedAnnotation.x + selectedAnnotation.width / 2;
            const centerY =
              selectedAnnotation.y + selectedAnnotation.height / 2;
            const angle = Math.atan2(pos.y - centerY, pos.x - centerX);
            setDragStart({
              mouseX: pos.x,
              mouseY: pos.y,
              annotation: { ...selectedAnnotation },
              angle,
            });
            e.stopPropagation();
            return;
          } else if (
            handle === "nw" ||
            handle === "ne" ||
            handle === "sw" ||
            handle === "se"
          ) {
            setDragMode(handle);
            setDragStart({
              mouseX: pos.x,
              mouseY: pos.y,
              annotation: { ...selectedAnnotation },
            });
            e.stopPropagation();
            return;
          }

          // Check if clicking on the annotation itself (move)
          // But skip if it's a text annotation (handled separately for editing)
          if (selectedAnnotation.type !== "text") {
            if (
              pos.x >= selectedAnnotation.x &&
              pos.x <= selectedAnnotation.x + selectedAnnotation.width &&
              pos.y >= selectedAnnotation.y &&
              pos.y <= selectedAnnotation.y + selectedAnnotation.height
            ) {
              setDragMode("moving");
              setDragStart({
                mouseX: pos.x,
                mouseY: pos.y,
                annotation: { ...selectedAnnotation },
              });
              e.stopPropagation();
              return;
            }
          }
        }
      }

      // Check if clicking on any annotation
      const clickedAnnotation = annotations.find((ann) => {
        return (
          pos.x >= ann.x &&
          pos.x <= ann.x + ann.width &&
          pos.y >= ann.y &&
          pos.y <= ann.y + ann.height
        );
      });

      if (clickedAnnotation && activeTool === "select") {
        onAnnotationSelect(clickedAnnotation.id);
      } else if (activeTool === "select") {
        onAnnotationSelect(null);
      }

      return;
    }

    // Handle text tool - create text annotation on click
    if (activeTool === "text") {
      const pos = getCanvasPosition(e);
      if (pos) {
        const newAnnotation: Annotation = {
          id: `annotation-${Date.now()}-${Math.random()}`,
          type: "text",
          x: pos.x,
          y: pos.y,
          width: 200,
          height: fontSize + 10,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          text: "",
          fontSize: fontSize,
          fontStyle: fontStyle,
        };
        onAnnotationAdd(newAnnotation);
        onAnnotationSelect(newAnnotation.id);
        setEditingTextId(newAnnotation.id); // Start editing immediately
        // Switch back to select tool after creating text
        if (onToolChange) {
          onToolChange("select");
        }
      }
      return;
    }

    // For other tools, start drawing
    const pos = getCanvasPosition(e);
    if (
      pos &&
      (activeTool === "rectangle" ||
        activeTool === "ellipse" ||
        activeTool === "arrow" ||
        activeTool === "line" ||
        activeTool === "spotlight")
    ) {
      setIsDrawing(true);
      setDrawStart(pos);
    }
  };

  // Mouse move handler - update drawing or dragging/resizing/rotating
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Handle dragging/resizing/rotating selected annotation
    if (dragMode !== "none" && dragStart && selectedAnnotationId) {
      const pos = getCanvasPosition(e);
      if (!pos) return;

      const selectedAnnotation = annotations.find(
        (ann) => ann.id === selectedAnnotationId
      );
      if (!selectedAnnotation) return;

      if (dragMode === "moving") {
        // Don't move text annotations while editing
        if (selectedAnnotation.type === "text" && editingTextId === selectedAnnotationId) {
          return;
        }
        const deltaX = pos.x - dragStart.mouseX;
        const deltaY = pos.y - dragStart.mouseY;
        onAnnotationUpdate(selectedAnnotationId, {
          x: dragStart.annotation.x + deltaX,
          y: dragStart.annotation.y + deltaY,
        });
      } else if (dragMode === "rotating") {
        // Rotation logic would go here if needed
        // For now, we'll skip rotation
      } else if (
        dragMode === "nw" ||
        dragMode === "ne" ||
        dragMode === "sw" ||
        dragMode === "se"
      ) {
        // Resize from corner
        const startAnnotation = dragStart.annotation;
        let newX = startAnnotation.x;
        let newY = startAnnotation.y;
        let newWidth = startAnnotation.width;
        let newHeight = startAnnotation.height;

        if (dragMode === "nw") {
          newX = Math.min(
            pos.x,
            startAnnotation.x + startAnnotation.width - 10
          );
          newY = Math.min(
            pos.y,
            startAnnotation.y + startAnnotation.height - 10
          );
          newWidth = startAnnotation.x + startAnnotation.width - newX;
          newHeight = startAnnotation.y + startAnnotation.height - newY;
        } else if (dragMode === "ne") {
          newY = Math.min(
            pos.y,
            startAnnotation.y + startAnnotation.height - 10
          );
          newWidth = Math.max(10, pos.x - startAnnotation.x);
          newHeight = startAnnotation.y + startAnnotation.height - newY;
        } else if (dragMode === "sw") {
          newX = Math.min(
            pos.x,
            startAnnotation.x + startAnnotation.width - 10
          );
          newWidth = startAnnotation.x + startAnnotation.width - newX;
          newHeight = Math.max(10, pos.y - startAnnotation.y);
        } else if (dragMode === "se") {
          newWidth = Math.max(10, pos.x - startAnnotation.x);
          newHeight = Math.max(10, pos.y - startAnnotation.y);
        }

        onAnnotationUpdate(selectedAnnotationId, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
      return;
    }

    // Handle drawing new annotation
    if (!isDrawing || !drawStart) return;

    const pos = getCanvasPosition(e);
    if (!pos) return;

    const startX = Math.min(drawStart.x, pos.x);
    const startY = Math.min(drawStart.y, pos.y);
    const width = Math.abs(pos.x - drawStart.x);
    const height = Math.abs(pos.y - drawStart.y);

    // Create or update temp annotation
    const newTempAnnotation: Annotation = {
      id: "temp-annotation",
      type: activeTool as AnnotationType,
      x: startX,
      y: startY,
      width: Math.max(width, 1),
      height: Math.max(height, 1),
      stroke: strokeColor,
      strokeWidth: strokeWidth,
    };
    setTempAnnotation(newTempAnnotation);
  };

  // Mouse up handler - finish drawing or dragging/resizing
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    // Reset drag mode
    if (dragMode !== "none") {
      setDragMode("none");
      setDragStart(null);
    }

    // Handle drawing
    if (!isDrawing || !drawStart) {
      setIsDrawing(false);
      setDrawStart(null);
      return;
    }

    const pos = getCanvasPosition(e);
    if (!pos) {
      setIsDrawing(false);
      setDrawStart(null);
      return;
    }

    const startX = Math.min(drawStart.x, pos.x);
    const startY = Math.min(drawStart.y, pos.y);
    const width = Math.abs(pos.x - drawStart.x);
    const height = Math.abs(pos.y - drawStart.y);

    // Only create annotation if it has minimum size
    if (width > 5 && height > 5) {
      // Create final annotation
      const newAnnotation: Annotation = {
        id: `annotation-${Date.now()}-${Math.random()}`,
        type: activeTool as AnnotationType,
        x: startX,
        y: startY,
        width: width,
        height: height,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      };

      onAnnotationAdd(newAnnotation);
      onAnnotationSelect(newAnnotation.id);
    }

    // Clear temp annotation
    setTempAnnotation(null);
    setIsDrawing(false);
    setDrawStart(null);
  };

  // Helper function to get background style based on type and preview/export mode
  const getBackgroundStyle = (
    isPreview: boolean = false
  ): React.CSSProperties => {
    if (backgroundColor === "transparent") {
      // In preview, show border; in export, use transparent
      if (isPreview) {
        return {
          background: "transparent",
          border: "2px solid rgba(148, 163, 184, 0.3)",
          borderRadius: `18px`,
        };
      } else {
        return {
          background: "transparent",
        };
      }
    }

    if (backgroundColor.startsWith("url(")) {
      return {
        backgroundImage: backgroundColor,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }

    if (backgroundColor.startsWith("linear-gradient")) {
      return {
        background: backgroundColor,
      };
    }

    return {
      background: backgroundColor,
    };
  };

  // Helper function to render canvas content (used by both preview and export)
  const renderCanvasContent = (isPreview: boolean = false) => {
    if (!imageSrc || !screenshot) return null;

    // Calculate image display size to fit within container while maintaining aspect ratio
    const availableWidth = Math.max(1, outputDims.totalWidth - padding * 2);
    const availableHeight = Math.max(1, outputDims.totalHeight - padding * 2);
    const imageAspect = screenshot.width / screenshot.height;
    const availableAspect = availableWidth / availableHeight;

    let displayWidth: number;
    let displayHeight: number;

    if (imageAspect > availableAspect) {
      // Image is wider - fit to width
      displayWidth = availableWidth;
      displayHeight = displayWidth / imageAspect;
      if (displayHeight > availableHeight) {
        displayHeight = availableHeight;
        displayWidth = displayHeight * imageAspect;
      }
    } else {
      // Image is taller - fit to height
      displayHeight = availableHeight;
      displayWidth = displayHeight * imageAspect;
      if (displayWidth > availableWidth) {
        displayWidth = availableWidth;
        displayHeight = displayWidth / imageAspect;
      }
    }

    // Final safety check
    displayWidth = Math.min(displayWidth, availableWidth);
    displayHeight = Math.min(displayHeight, availableHeight);

    return (
      <>
        {/* Background Image (if URL) - not needed for transparent or gradients */}
        {backgroundColor.startsWith("url(") && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: backgroundColor,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Screenshot image */}
        <div
          style={{
            position: "relative",
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
            pointerEvents: "none",
          }}
        >
          <img
            src={imageSrc}
            alt="Screenshot"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: `${cornerRadius}px`,
              boxShadow:
                shadowSize > 0
                  ? `0 ${shadowSize}px ${shadowSize * 2}px rgba(0, 0, 0, 0.3)`
                  : "none",
              objectFit: "contain",
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
          />
        </div>

        {/* Annotations */}
        {annotations.map(renderAnnotation)}

        {/* Selection handles for selected annotation */}
        {selectedAnnotationId &&
          annotations.find((ann) => ann.id === selectedAnnotationId) &&
          renderSelectionHandles(
            annotations.find((ann) => ann.id === selectedAnnotationId)!
          )}

        {/* Temporary annotation being drawn */}
        {tempAnnotation && renderAnnotation(tempAnnotation)}
      </>
    );
  };

  // Render selection handles (resize corners and rotation handle)
  const renderSelectionHandles = (annotation: Annotation) => {
    const HANDLE_SIZE = 8;
    const HANDLE_OFFSET = 20;
    const centerX = annotation.x + annotation.width / 2;
    const rotationHandleY = annotation.y - HANDLE_OFFSET;

    const handleStyle: React.CSSProperties = {
      position: "absolute",
      width: `${HANDLE_SIZE}px`,
      height: `${HANDLE_SIZE}px`,
      background: "#ffffff",
      border: "2px solid #6366f1",
      borderRadius: "2px",
      pointerEvents: "auto",
      cursor: "nwse-resize",
      zIndex: 1000,
      transform: "translate(-50%, -50%)",
      userSelect: "none",
      WebkitUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none",
    };

    const rotationHandleStyle: React.CSSProperties = {
      ...handleStyle,
      cursor: "grab",
    };

    return (
      <>
        {/* Selection border */}
        <div
          style={{
            position: "absolute",
            left: `${annotation.x}px`,
            top: `${annotation.y}px`,
            width: `${annotation.width}px`,
            height: `${annotation.height}px`,
            border: "2px dashed #6366f1",
            pointerEvents: "none",
            zIndex: 999,
          }}
        />

        {/* Rotation handle (above center) */}
        <div
          style={{
            ...rotationHandleStyle,
            left: `${centerX}px`,
            top: `${rotationHandleY}px`,
          }}
        />

        {/* Rotation handle line */}
        <div
          style={{
            position: "absolute",
            left: `${centerX}px`,
            top: `${annotation.y}px`,
            width: "2px",
            height: `${HANDLE_OFFSET}px`,
            background: "#6366f1",
            pointerEvents: "none",
            zIndex: 998,
            transform: "translateX(-50%)",
          }}
        />

        {/* Corner resize handles */}
        {/* Top-left */}
        <div
          style={{
            ...handleStyle,
            left: `${annotation.x}px`,
            top: `${annotation.y}px`,
            cursor: "nwse-resize",
          }}
        />
        {/* Top-right */}
        <div
          style={{
            ...handleStyle,
            left: `${annotation.x + annotation.width}px`,
            top: `${annotation.y}px`,
            cursor: "nesw-resize",
          }}
        />
        {/* Bottom-left */}
        <div
          style={{
            ...handleStyle,
            left: `${annotation.x}px`,
            top: `${annotation.y + annotation.height}px`,
            cursor: "nesw-resize",
          }}
        />
        {/* Bottom-right */}
        <div
          style={{
            ...handleStyle,
            left: `${annotation.x + annotation.width}px`,
            top: `${annotation.y + annotation.height}px`,
            cursor: "nwse-resize",
          }}
        />
      </>
    );
  };

  // Render annotation as HTML element
  const renderAnnotation = (annotation: Annotation) => {
    const isSelected = annotation.id === selectedAnnotationId;
    const style: React.CSSProperties = {
      position: "absolute",
      left: `${annotation.x}px`,
      top: `${annotation.y}px`,
      width: `${annotation.width}px`,
      height: `${annotation.height}px`,
      pointerEvents: activeTool === "select" && !isSelected ? "auto" : "none",
      cursor: activeTool === "select" && !isSelected ? "move" : "default",
      border: "none", // Border is handled by selection handles
    };

    switch (annotation.type) {
      case "rectangle":
        return (
          <div
            key={annotation.id}
            style={{
              ...style,
              border: `${annotation.strokeWidth}px solid ${annotation.stroke}`,
              borderRadius: `${annotation.borderRadius ?? 0}px`,
              backgroundColor: annotation.fill || "transparent",
              opacity: annotation.opacity ?? 1,
            }}
            onClick={() => onAnnotationSelect(annotation.id)}
          />
        );
      case "ellipse":
        return (
          <div
            key={annotation.id}
            style={{
              ...style,
              border: `${annotation.strokeWidth}px solid ${annotation.stroke}`,
              borderRadius: "50%",
              backgroundColor: annotation.fill || "transparent",
              opacity: annotation.opacity ?? 1,
            }}
            onClick={() => onAnnotationSelect(annotation.id)}
          />
        );
      case "text": {
        const isSelected = annotation.id === selectedAnnotationId;
        const isEditing = annotation.id === editingTextId;

        if (isEditing) {
          return (
            <textarea
              key={annotation.id}
              ref={isEditing ? textInputRef : null}
              value={annotation.text || ""}
              onChange={(e) => {
                const newText = e.target.value;
                onAnnotationUpdate(annotation.id, { text: newText });

                // Auto-resize based on content
                const lines = newText.split("\n").length;
                const lineHeight = (annotation.fontSize || fontSize) * 1.2;
                const minHeight = lineHeight + 10;
                const newHeight = Math.max(minHeight, lines * lineHeight + 10);

                // Measure text width for horizontal sizing
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.font = `${annotation.fontStyle || fontStyle} ${annotation.fontSize || fontSize}px ${annotation.fontFamily || "inherit"}`;
                  const longestLine = newText.split("\n").reduce((a, b) =>
                    ctx.measureText(a).width > ctx.measureText(b).width ? a : b
                  );
                  const textWidth = ctx.measureText(longestLine || "Text").width;
                  const minWidth = Math.max(200, textWidth + 20);
                  onAnnotationUpdate(annotation.id, {
                    width: minWidth,
                    height: newHeight
                  });
                } else {
                  onAnnotationUpdate(annotation.id, { height: newHeight });
                }
              }}
              onBlur={() => {
                setEditingTextId(null);
                // Ensure text is not empty
                if (!annotation.text || annotation.text.trim() === "") {
                  onAnnotationUpdate(annotation.id, { text: "Text" });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditingTextId(null);
                  e.currentTarget.blur();
                } else if (e.key === "Enter" && !e.shiftKey) {
                  // Allow Enter to create new line
                  // Don't prevent default, let it add a newline
                }
                e.stopPropagation();
              }}
              style={{
                ...style,
                color: annotation.stroke,
                fontSize: `${annotation.fontSize || fontSize}px`,
                fontStyle: annotation.fontStyle || fontStyle,
                fontWeight: annotation.fontStyle?.includes("bold")
                  ? "bold"
                  : "normal",
                fontFamily: annotation.fontFamily || "inherit",
                textAlign: annotation.textAlign || "left",
                opacity: annotation.opacity ?? 1,
                border: "2px solid #6366f1",
                background: "rgba(0, 0, 0, 0.1)",
                outline: "none",
                resize: "none",
                overflow: "hidden",
                padding: "4px",
                borderRadius: "4px",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                minWidth: "200px",
                minHeight: `${(annotation.fontSize || fontSize) + 10}px`,
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          );
        }

        return (
          <div
            key={annotation.id}
            style={{
              ...style,
              color: annotation.stroke,
              fontSize: `${annotation.fontSize || fontSize}px`,
              fontStyle: annotation.fontStyle || fontStyle,
              fontWeight: annotation.fontStyle?.includes("bold")
                ? "bold"
                : "normal",
              fontFamily: annotation.fontFamily || "inherit",
              textAlign: annotation.textAlign || "left",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              border: "none",
              opacity: annotation.opacity ?? 1,
              cursor: isSelected ? "text" : "default",
            }}
            onClick={(e) => {
              if (isSelected && activeTool === "select") {
                // Double click or single click when selected to edit
                setEditingTextId(annotation.id);
                e.stopPropagation();
              } else {
                onAnnotationSelect(annotation.id);
              }
            }}
            onDoubleClick={(e) => {
              if (activeTool === "select") {
                setEditingTextId(annotation.id);
                e.stopPropagation();
              }
            }}
          >
            {annotation.text || "Text"}
          </div>
        );
      }
      case "arrow":
      case "line": {
        const isArrow = annotation.type === "arrow";
        const x1 = 0;
        const y1 = annotation.height / 2;
        const x2 = annotation.width;
        const y2 = annotation.height / 2;

        // Arrow head points
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowX1 = x2 - arrowLength * Math.cos(angle - arrowAngle);
        const arrowY1 = y2 - arrowLength * Math.sin(angle - arrowAngle);
        const arrowX2 = x2 - arrowLength * Math.cos(angle + arrowAngle);
        const arrowY2 = y2 - arrowLength * Math.sin(angle + arrowAngle);

        return (
          <svg
            key={annotation.id}
            style={{
              ...style,
              pointerEvents: activeTool === "select" ? "auto" : "none",
              overflow: "visible",
              opacity: annotation.opacity ?? 1,
            }}
            onClick={() => onAnnotationSelect(annotation.id)}
          >
            {annotation.curved ? (
              // Curved line/arrow
              <path
                d={`M ${x1} ${y1} Q ${annotation.width / 2} ${
                  annotation.height
                } ${x2} ${y2}`}
                stroke={annotation.stroke}
                strokeWidth={annotation.strokeWidth}
                fill="none"
              />
            ) : (
              // Straight line
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={annotation.stroke}
                strokeWidth={annotation.strokeWidth}
              />
            )}
            {isArrow && (
              // Arrow head
              <polygon
                points={`${x2},${y2} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
                fill={annotation.stroke}
              />
            )}
          </svg>
        );
      }
      case "spotlight": {
        // Spotlight is rendered as a rectangle with dimmed background
        return (
          <div
            key={annotation.id}
            style={{
              ...style,
              background: `rgba(0, 0, 0, ${annotation.dimOpacity || 0.7})`,
              border: "none",
            }}
            onClick={() => onAnnotationSelect(annotation.id)}
          />
        );
      }
      default:
        return null;
    }
  };

  if (!screenshot) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center relative overflow-hidden min-h-0"
        style={{
          background: "var(--bg-pattern)",
          height: "100%",
          width: "100%",
        }}
      >
        <div className="text-center relative z-10 px-8">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-6 backdrop-blur-sm border"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderColor: "var(--color-border)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
          >
            <ImageIcon
              className="w-12 h-12"
              style={{
                color: "var(--color-primary-light)",
              }}
              strokeWidth={1.5}
            />
          </div>
          <h3
            className="text-xl font-semibold mb-2"
            style={{
              color: "var(--color-text-primary)",
            }}
          >
            No screenshot
          </h3>
          <p
            className="text-sm"
            style={{
              color: "var(--color-text-muted)",
            }}
          >
            Capture a screenshot to start editing
          </p>
        </div>
      </div>
    );
  }

  // Export canvas container (created once and reused)
  const exportContainerRef = useRef<HTMLDivElement | null>(null);

  // Create export container on mount
  useEffect(() => {
    if (!exportContainerRef.current) {
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "0";
      container.style.top = "0";
      container.style.overflow = "visible";
      container.style.pointerEvents = "none";
      container.style.zIndex = "-9999";
      container.style.opacity = "0";
      document.body.appendChild(container);
      exportContainerRef.current = container;
    }

    return () => {
      if (exportContainerRef.current?.parentNode) {
        exportContainerRef.current.parentNode.removeChild(
          exportContainerRef.current
        );
        exportContainerRef.current = null;
      }
    };
  }, []);

  // Update container size when dimensions change
  useEffect(() => {
    if (exportContainerRef.current) {
      exportContainerRef.current.style.width = `${Math.max(
        outputDims.totalWidth,
        1
      )}px`;
      exportContainerRef.current.style.height = `${Math.max(
        outputDims.totalHeight,
        1
      )}px`;
    }
  }, [outputDims]);

  return (
    <>
      {/* Hidden export canvas - rendered via portal outside viewport */}
      {exportContainerRef.current &&
        createPortal(
          <div
            ref={(el) => {
              if (el) {
                (
                  exportCanvasRef as React.MutableRefObject<HTMLDivElement | null>
                ).current = el;
                // Update stageRef immediately when export canvas is mounted
                if (stageRef) {
                  (
                    stageRef as React.MutableRefObject<HTMLDivElement | null>
                  ).current = el;
                } else {
                  (
                    internalStageRef as React.MutableRefObject<HTMLDivElement | null>
                  ).current = el;
                }
              }
            }}
            className="export-canvas"
            style={{
              position: "absolute",
              left: "100%",
              top: "100%",
              width: `${outputDims.totalWidth}px`,
              height: `${outputDims.totalHeight}px`,
              ...getBackgroundStyle(false), // false = export mode
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {renderCanvasContent(false)}
          </div>,
          exportContainerRef.current
        )}

      <div
        ref={containerRef}
        className="flex items-center justify-center relative overflow-hidden min-h-0"
        style={{
          background: "var(--bg-pattern)",
          height: "100%",
          width: "100%",
        }}
      >
        {/* Visible preview canvas - scaled for display */}
        <div
          ref={(el) => {
            if (el) {
              (
                canvasRef as React.MutableRefObject<HTMLDivElement | null>
              ).current = el;
            }
          }}
          className="relative"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            width: `${outputDims.totalWidth}px`,
            height: `${outputDims.totalHeight}px`,
            minWidth: `${outputDims.totalWidth}px`,
            maxWidth: `${outputDims.totalWidth}px`,
            minHeight: `${outputDims.totalHeight}px`,
            maxHeight: `${outputDims.totalHeight}px`,
            ...getBackgroundStyle(true), // true = preview mode
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            cursor:
              activeTool === "select"
                ? "default"
                : activeTool === "text"
                ? "text"
                : "crosshair",
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            // Cancel drawing if mouse leaves canvas
            if (isDrawing) {
              setTempAnnotation(null);
              setIsDrawing(false);
              setDrawStart(null);
            }
            // Reset drag mode
            if (dragMode !== "none") {
              setDragMode("none");
              setDragStart(null);
            }
          }}
        >
          {renderCanvasContent(true)}
        </div>
      </div>
    </>
  );
}
