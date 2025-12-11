import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Save, Instagram, Twitter, Facebook, Linkedin, Youtube, Video } from "lucide-react";
import { CustomDimensions } from "../types";

interface SizePreset {
  name: string;
  width: number;
  height: number;
  ratio: string;
  category: "instagram" | "twitter" | "facebook" | "linkedin" | "youtube" | "tiktok" | "standard";
}

const SOCIAL_MEDIA_PRESETS: SizePreset[] = [
  // Instagram
  { name: "Post", width: 1080, height: 1080, ratio: "1:1", category: "instagram" },
  { name: "Portrait", width: 1080, height: 1350, ratio: "4:5", category: "instagram" },
  { name: "Story", width: 1080, height: 1920, ratio: "9:16", category: "instagram" },
  { name: "Reel", width: 1080, height: 1920, ratio: "9:16", category: "instagram" },
  // Twitter
  { name: "Post", width: 1200, height: 675, ratio: "16:9", category: "twitter" },
  { name: "Card", width: 1200, height: 628, ratio: "1.91:1", category: "twitter" },
  // Facebook
  { name: "Post", width: 1200, height: 630, ratio: "1.91:1", category: "facebook" },
  { name: "Story", width: 1080, height: 1920, ratio: "9:16", category: "facebook" },
  // LinkedIn
  { name: "Post", width: 1200, height: 627, ratio: "1.91:1", category: "linkedin" },
  { name: "Cover", width: 1584, height: 396, ratio: "4:1", category: "linkedin" },
  // YouTube
  { name: "Thumbnail", width: 1280, height: 720, ratio: "16:9", category: "youtube" },
  { name: "Channel Art", width: 2560, height: 1440, ratio: "16:9", category: "youtube" },
  // TikTok
  { name: "Video", width: 1080, height: 1920, ratio: "9:16", category: "tiktok" },
  // Standard
  { name: "16:9", width: 1920, height: 1080, ratio: "16:9", category: "standard" },
  { name: "4:3", width: 1920, height: 1440, ratio: "4:3", category: "standard" },
  { name: "3:2", width: 1920, height: 1280, ratio: "3:2", category: "standard" },
  { name: "1:1", width: 1920, height: 1920, ratio: "1:1", category: "standard" },
  { name: "9:16", width: 1080, height: 1920, ratio: "9:16", category: "standard" },
  { name: "3:4", width: 1440, height: 1920, ratio: "3:4", category: "standard" },
  { name: "2:3", width: 1280, height: 1920, ratio: "2:3", category: "standard" },
];

const SOCIAL_MEDIA_CATEGORIES = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "twitter", label: "Twitter", icon: Twitter },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "tiktok", label: "TikTok", icon: Video },
  { id: "standard", label: "Standard", icon: null },
];

// Helper functions
function calculateDimensions(preset: SizePreset): { width: number; height: number } {
  const maxWidth = 120;
  const aspectRatio = preset.width / preset.height;

  if (preset.width > preset.height) {
    return {
      width: maxWidth,
      height: maxWidth / aspectRatio,
    };
  } else {
    return {
      width: maxWidth * aspectRatio,
      height: maxWidth,
    };
  }
}

function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;

  // Handle common ratios
  if (w === 16 && h === 9) return "16:9";
  if (w === 4 && h === 3) return "4:3";
  if (w === 3 && h === 2) return "3:2";
  if (w === 1 && h === 1) return "1:1";
  if (w === 9 && h === 16) return "9:16";
  if (w === 3 && h === 4) return "3:4";
  if (w === 2 && h === 3) return "2:3";
  if (w === 4 && h === 5) return "4:5";

  return `${w}:${h}`;
}

interface SizeDropdownProps {
  customDimensions: CustomDimensions | null;
  onCustomDimensionsChange: (dimensions: CustomDimensions | null) => void;
}

export function SizeDropdown({
  customDimensions,
  onCustomDimensionsChange,
}: SizeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectSocialRatioTab, setSelectSocialRatioTab] = useState("standard");
  const [customWidth, setCustomWidth] = useState<number>(0);
  const [customHeight, setCustomHeight] = useState<number>(0);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected preset or create custom one
  interface SelectedRatio {
    label: string;
    width: number;
    height: number;
    ratio: number;
  }

  const selectedRatio: SelectedRatio = customDimensions
    ? {
        label: `Custom - ${getAspectRatio(customDimensions.width, customDimensions.height)}`,
        width: customDimensions.width,
        height: customDimensions.height,
        ratio: customDimensions.width / customDimensions.height,
      }
    : {
        label: SOCIAL_MEDIA_PRESETS[0].name,
        width: SOCIAL_MEDIA_PRESETS[0].width,
        height: SOCIAL_MEDIA_PRESETS[0].height,
        ratio: SOCIAL_MEDIA_PRESETS[0].width / SOCIAL_MEDIA_PRESETS[0].height,
      };

  // Update custom dimensions when they change externally
  useEffect(() => {
    if (customDimensions) {
      setCustomWidth(customDimensions.width);
      setCustomHeight(customDimensions.height);
    }
  }, [customDimensions]);

  // Update position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handlePresetSelect = (preset: SizePreset) => {
    setCustomWidth(preset.width);
    setCustomHeight(preset.height);
    onCustomDimensionsChange({ width: preset.width, height: preset.height });
    // Keep dropdown open when preset is selected
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customWidth > 0 && customHeight > 0) {
      onCustomDimensionsChange({ width: customWidth, height: customHeight });
      setIsOpen(false);
    }
  };

  const currentCategory = SOCIAL_MEDIA_CATEGORIES.find(
    (cat) => cat.id === selectSocialRatioTab
  );
  const currentPresets = SOCIAL_MEDIA_PRESETS.filter(
    (p) => p.category === selectSocialRatioTab
  );

  return (
    <>
      {/* Trigger Button */}
      <div>
        <label
          className="block text-xs font-semibold uppercase mb-2 tracking-wider"
          style={{ color: "rgba(203, 213, 225, 0.5)" }}
        >
          SIZE
        </label>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-200"
          style={{
            background: "var(--color-bg-slider)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
            e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.1)";
            e.currentTarget.style.background = "var(--color-bg-slider)";
          }}
        >
          <div className="flex items-center gap-2 justify-start flex-1 min-w-0">
            {/* Preview thumbnail */}
            <div
              className="relative flex-shrink-0"
              style={{
                width: `${Math.max(calculateDimensions({ ...selectedRatio, name: selectedRatio.label, ratio: getAspectRatio(selectedRatio.width, selectedRatio.height), category: "standard" } as SizePreset).width / 5, 20)}px`,
                height: `${Math.max(calculateDimensions({ ...selectedRatio, name: selectedRatio.label, ratio: getAspectRatio(selectedRatio.width, selectedRatio.height), category: "standard" } as SizePreset).height / 5, 20)}px`,
                minWidth: "20px",
                minHeight: "20px",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                  borderRadius: "4px",
                  border: "1px solid rgba(148, 163, 184, 0.15)",
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold truncate" style={{ color: "rgba(226, 232, 240, 0.95)" }}>
                {selectedRatio.label}
              </h4>
              <p className="text-xs mt-0.5" style={{ color: "rgba(148, 163, 184, 0.7)", fontSize: "10px" }}>
                {selectedRatio.width} × {selectedRatio.height}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ml-2 ${
              isOpen ? "rotate-180" : ""
            }`}
            style={{ color: "rgba(148, 163, 184, 0.7)" }}
          />
        </button>
      </div>

      {/* Dropdown Panel - Rendered via Portal */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[99999] rounded-xl border shadow-2xl overflow-hidden"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: "calc(100vw - 32px)",
              maxWidth: "600px",
              maxHeight: "70vh",
              background: "var(--color-bg-primary)",
              borderColor: "rgba(148, 163, 184, 0.1)",
            }}
          >
            <div className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
              {/* Custom Dimensions Input */}
              <div className="p-3 border-b" style={{ borderColor: "rgba(148, 163, 184, 0.1)", background: "var(--color-bg-sidebar)" }}>
                <h6
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "rgba(203, 213, 225, 0.5)" }}
                >
                  Custom Size
                </h6>
                <form className="flex gap-2" onSubmit={handleSubmit}>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={customWidth === 0 ? "" : customWidth}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setCustomWidth(value);
                      }}
                      placeholder={selectedRatio.width.toString()}
                      className="w-full px-3 py-1.5 text-xs rounded-md transition-all duration-200"
                      style={{
                        background: "var(--color-bg-slider)",
                        border: "1px solid rgba(148, 163, 184, 0.1)",
                        color: "rgba(226, 232, 240, 0.95)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.3)";
                        e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.1)";
                        e.currentTarget.style.background = "var(--color-bg-slider)";
                      }}
                    />
                    <label className="text-xs mt-1 block" style={{ color: "rgba(148, 163, 184, 0.65)", fontSize: "10px" }}>
                      Width
                    </label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={customHeight === 0 ? "" : customHeight}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setCustomHeight(value);
                      }}
                      placeholder={selectedRatio.height.toString()}
                      className="w-full px-3 py-1.5 text-xs rounded-md transition-all duration-200"
                      style={{
                        background: "var(--color-bg-slider)",
                        border: "1px solid rgba(148, 163, 184, 0.1)",
                        color: "rgba(226, 232, 240, 0.95)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.3)";
                        e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.1)";
                        e.currentTarget.style.background = "var(--color-bg-slider)";
                      }}
                    />
                    <label className="text-xs mt-1 block" style={{ color: "rgba(148, 163, 184, 0.65)", fontSize: "10px" }}>
                      Height
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center self-end"
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "rgba(240, 240, 240, 1)",
                      border: "1px solid rgba(148, 163, 184, 0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                      e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.1)";
                    }}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Set
                  </button>
                </form>
              </div>

              {/* Social Media Tabs */}
              <div className="p-3 border-b" style={{ borderColor: "rgba(148, 163, 184, 0.1)", background: "var(--color-bg-sidebar)" }}>
                <h6
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "rgba(203, 213, 225, 0.5)" }}
                >
                  Presets
                </h6>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {SOCIAL_MEDIA_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectSocialRatioTab(category.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                          selectSocialRatioTab === category.id ? "text-white" : ""
                        }`}
                        style={
                          selectSocialRatioTab === category.id
                            ? ({
                                background: "rgba(255, 255, 255, 0.1)",
                                color: "rgba(240, 240, 240, 1)",
                                border: "1px solid rgba(148, 163, 184, 0.2)",
                              } as React.CSSProperties)
                            : ({
                                background: "var(--color-bg-slider)",
                                color: "rgba(148, 163, 184, 0.65)",
                                border: "1px solid rgba(148, 163, 184, 0.1)",
                              } as React.CSSProperties)
                        }
                        onMouseEnter={(e) => {
                          if (selectSocialRatioTab !== category.id) {
                            e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)";
                            e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.15)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectSocialRatioTab !== category.id) {
                            e.currentTarget.style.background = "var(--color-bg-slider)";
                            e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.1)";
                          }
                        }}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        <span>{category.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Presets Grid */}
              <div className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentPresets.map((preset, index) => {
                    const isSelected =
                      customDimensions?.width === preset.width &&
                      customDimensions?.height === preset.height;
                    const previewDims = calculateDimensions(preset);
                    return (
                      <button
                        key={index}
                        onClick={() => handlePresetSelect(preset)}
                        className={`flex flex-col items-stretch p-2.5 rounded-lg transition-all duration-200 ${
                          isSelected ? "" : ""
                        }`}
                        style={
                          isSelected
                            ? ({
                                background: "var(--color-bg-slider)",
                                border: "2px solid rgba(255, 255, 255, 0.5)",
                              } as React.CSSProperties)
                            : ({
                                background: "var(--color-bg-slider)",
                                border: "1px solid rgba(148, 163, 184, 0.1)",
                              } as React.CSSProperties)
                        }
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.25)";
                            e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.1)";
                            e.currentTarget.style.background = "var(--color-bg-slider)";
                          }
                        }}
                      >
                        <div className="text-left mb-2">
                          <h6 className="text-xs font-semibold mb-0.5" style={{ color: "rgba(226, 232, 240, 0.95)" }}>
                            {preset.name}
                          </h6>
                          <p className="text-xs" style={{ color: "rgba(148, 163, 184, 0.7)", fontSize: "10px" }}>
                            {preset.width} × {preset.height} <span style={{ color: "rgba(148, 163, 184, 0.5)" }}>({preset.ratio})</span>
                          </p>
                        </div>
                        <div className="relative flex-1 min-h-16 flex items-center justify-center">
                          <div
                            className="relative rounded-md"
                            style={{
                              width: `${previewDims.width * 0.8}px`,
                              height: `${previewDims.height * 0.8}px`,
                              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                              border: "1px solid rgba(148, 163, 184, 0.15)",
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

