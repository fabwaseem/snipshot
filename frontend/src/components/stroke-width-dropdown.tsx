import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Minus } from "lucide-react";

interface StrokeWidthDropdownProps {
  width: number;
  onWidthChange: (width: number) => void;
}

const STROKE_WIDTHS = [2, 4, 6, 8, 10, 12, 16, 20];

export function StrokeWidthDropdown({
  width,
  onWidthChange,
}: StrokeWidthDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8, // 8px = mt-2
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
            : "rgba(255, 255, 255, 0.05)",
          borderColor: isOpen ? "var(--color-primary)" : "var(--color-border)",
          color: "var(--color-text-secondary)",
        }}
      >
        <div className="flex items-center gap-2">
          <Minus
            className="w-4 h-4"
            style={{ color: "var(--color-text-secondary)" }}
          />
          <span className="text-sm font-medium">{width}px</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Panel - Rendered via Portal to appear above canvas */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[99999] rounded-xl border shadow-2xl p-3 min-w-[200px]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              background: "var(--color-bg-glass-dark)",
              borderColor: "var(--color-border)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="space-y-1">
              {STROKE_WIDTHS.map((strokeWidth) => {
                const isSelected = width === strokeWidth;
                return (
                  <button
                    key={strokeWidth}
                    onClick={() => {
                      onWidthChange(strokeWidth);
                      setIsOpen(false);
                    }}
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
                  >
                    <div
                      className="rounded-full bg-current flex-shrink-0"
                      style={{
                        width: strokeWidth + 2,
                        height: strokeWidth + 2,
                      }}
                    />
                    <span className="text-sm font-medium flex-1 text-left">
                      {strokeWidth}px
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
