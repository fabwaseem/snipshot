import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Square, Circle, MoveRight, Minus, Type, Lightbulb } from "lucide-react";
import { EditorTool } from "../types";

interface Tool {
  id: EditorTool;
  icon: JSX.Element;
  label: string;
  shortcut: string;
}

interface ToolsDropdownProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
}

const SHAPE_TOOLS: Tool[] = [
  {
    id: "rectangle",
    label: "Rectangle",
    shortcut: "R",
    icon: <Square className="w-4 h-4" />,
  },
  {
    id: "ellipse",
    label: "Ellipse",
    shortcut: "E",
    icon: <Circle className="w-4 h-4" />,
  },
  {
    id: "arrow",
    label: "Arrow",
    shortcut: "A",
    icon: <MoveRight className="w-4 h-4" />,
  },
  {
    id: "line",
    label: "Line",
    shortcut: "L",
    icon: <Minus className="w-4 h-4 -rotate-45" />,
  },
  {
    id: "text",
    label: "Text",
    shortcut: "T",
    icon: <Type className="w-4 h-4" />,
  },
  {
    id: "spotlight",
    label: "Spotlight",
    shortcut: "S",
    icon: <Lightbulb className="w-4 h-4" />,
  },
];

export function ToolsDropdown({ activeTool, onToolChange }: ToolsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the active tool info
  const activeToolInfo = SHAPE_TOOLS.find((tool) => tool.id === activeTool);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleToolSelect = (tool: EditorTool) => {
    onToolChange(tool);
    setIsOpen(false);
  };

  // Determine if a shape tool is active (not select)
  const isShapeToolActive = activeTool !== "select" && SHAPE_TOOLS.some(t => t.id === activeTool);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
                   hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        style={{
          background: isOpen
            ? "rgba(255, 255, 255, 0.1)"
            : isShapeToolActive
            ? "var(--gradient-primary)"
            : "rgba(255, 255, 255, 0.05)",
          borderColor: isOpen ? "var(--color-primary)" : "var(--color-border)",
          color: isShapeToolActive ? "white" : "var(--color-text-secondary)",
          boxShadow: isShapeToolActive ? "var(--shadow-primary)" : "none",
        }}
        title="Shapes & Tools"
      >
        {activeToolInfo ? (
          <>
            <div className="flex items-center justify-center">
              {activeToolInfo.icon}
            </div>
            <span className="text-sm font-medium">{activeToolInfo.label}</span>
          </>
        ) : (
          <>
            <Square className="w-4 h-4" />
            <span className="text-sm font-medium">Shapes</span>
          </>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Panel - Rendered via Portal */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[99999] rounded-xl border shadow-2xl p-2 min-w-[200px]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              background: "var(--color-bg-glass-dark)",
              borderColor: "var(--color-border)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="space-y-1">
              {SHAPE_TOOLS.map((tool) => {
                const isSelected = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                               ${
                                 isSelected
                                   ? "text-white"
                                   : "hover:bg-white/10 hover:text-white"
                               }`}
                    style={
                      isSelected
                        ? ({
                            background: "var(--gradient-primary)",
                            boxShadow: "var(--shadow-primary)",
                          } as React.CSSProperties)
                        : ({
                            color: "var(--color-text-secondary)",
                          } as React.CSSProperties)
                    }
                    title={`${tool.label} (${tool.shortcut})`}
                  >
                    <div className="flex items-center justify-center w-5 h-5">
                      {tool.icon}
                    </div>
                    <span className="text-sm font-medium flex-1 text-left">
                      {tool.label}
                    </span>
                    <span
                      className="text-xs opacity-60"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {tool.shortcut}
                    </span>
                    {isSelected && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: "white" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

