import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { ANNOTATION_COLORS } from "../colors";

interface ColorPickerDropdownProps {
  color: string;
  onColorChange: (color: string) => void;
}

// Helper function to determine if a color is light (needs dark text)
const isLightColor = (hex: string): boolean => {
  // Remove # if present
  const cleanHex = hex.replace("#", "");

  // Convert to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Calculate luminance (relative luminance formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If luminance is greater than 0.5, it's a light color
  return luminance > 0.5;
};

export function ColorPickerDropdown({
  color,
  onColorChange,
}: ColorPickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(color);
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

  // Update custom color when prop changes (if it's not in predefined colors)
  useEffect(() => {
    const isPredefinedColor = ANNOTATION_COLORS.includes(color as any);
    if (!isPredefinedColor) {
      setCustomColor(color);
    }
  }, [color]);

  const handleCustomColorChange = (newColor: string) => {
    setCustomColor(newColor);
    onColorChange(newColor);
  };

  const isCustomColorSelected = !ANNOTATION_COLORS.includes(color as any);

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
        }}
      >
        <div
          className="w-5 h-5 rounded border-2"
          style={{
            backgroundColor: color,
            borderColor: isCustomColorSelected
              ? "var(--color-primary)"
              : "rgba(255, 255, 255, 0.2)",
          }}
        />
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{ color: "var(--color-text-secondary)" }}
        />
      </button>

      {/* Dropdown Panel - Rendered via Portal to appear above canvas */}
      {isOpen &&
        createPortal(
          <div
            className="fixed z-[99999] rounded-xl border shadow-2xl p-4 min-w-[280px]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              background: "var(--color-bg-glass-dark)",
              borderColor: "var(--color-border)",
              backdropFilter: "blur(20px)",
            }}
            ref={dropdownRef}
          >
            {/* Predefined Colors */}
            <div className="mb-4">
              <div
                className="text-xs font-semibold mb-2.5 px-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                Predefined Colors
              </div>
              <div className="grid grid-cols-6 gap-2">
                {ANNOTATION_COLORS.map((predefinedColor) => {
                  const isSelected =
                    color === predefinedColor && !isCustomColorSelected;
                  return (
                    <button
                      key={predefinedColor}
                      onClick={() => {
                        onColorChange(predefinedColor);
                        setIsOpen(false);
                      }}
                      className={`relative w-9 h-9 rounded-lg transition-all duration-200
                               ${
                                 isSelected
                                   ? "ring-2 scale-110"
                                   : "hover:scale-110 hover:ring-1"
                               }`}
                      style={{
                        backgroundColor: predefinedColor,
                        ...(isSelected &&
                          ({
                            "--tw-ring-color": "var(--color-primary)",
                            "--tw-ring-offset-color": "var(--color-bg-primary)",
                          } as React.CSSProperties)),
                      }}
                      title={predefinedColor}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check
                            className="w-4 h-4"
                            style={{
                              color: isLightColor(predefinedColor)
                                ? "#000"
                                : "#fff",
                            }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div
              className="h-px my-4"
              style={{ background: "var(--color-border)" }}
            />

            {/* Custom Color Picker */}
            <div>
              <div
                className="text-xs font-semibold mb-2.5 px-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                Custom Color
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customColor.startsWith("#") ? customColor : "#000000"}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border transition-colors
                           hover:border-primary-500"
                  style={{
                    borderColor: "var(--color-border)",
                  }}
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value) ||
                        value === ""
                      ) {
                        handleCustomColorChange(value);
                      }
                    }}
                    placeholder="#000000"
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={
                      {
                        background: "var(--color-bg-input)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                        "--tw-ring-color": "var(--color-primary-500)",
                      } as React.CSSProperties
                    }
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--color-primary)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--color-border)")
                    }
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
