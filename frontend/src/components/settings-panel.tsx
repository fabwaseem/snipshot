import { useState } from "react";
import { CaptureResult, CustomDimensions, OutputRatio } from "../types";
import { BackgroundSelector } from "./background-selector";
import { CustomSlider } from "./custom-slider";
import { MediaUploader } from "./media-uploader";
import { SizeDropdown } from "./size-dropdown";

interface SettingsPanelProps {
  padding: number;
  cornerRadius: number;
  shadowSize: number;
  backgroundColor: string;
  outputRatio: OutputRatio;
  imageWidth?: number;
  imageHeight?: number;
  customDimensions: CustomDimensions | null;
  screenshot: CaptureResult | null;
  onPaddingChange: (value: number) => void;
  onCornerRadiusChange: (value: number) => void;
  onShadowSizeChange: (value: number) => void;
  onBackgroundChange: (value: string) => void;
  onOutputRatioChange: (value: OutputRatio) => void;
  onCustomDimensionsChange: (dimensions: CustomDimensions | null) => void;
  onImageImport: (screenshot: CaptureResult) => void;
}

export function SettingsPanel({
  padding,
  cornerRadius,
  shadowSize,
  backgroundColor,
  outputRatio,
  imageWidth,
  imageHeight,
  customDimensions,
  screenshot,
  onPaddingChange,
  onCornerRadiusChange,
  onShadowSizeChange,
  onBackgroundChange,
  onOutputRatioChange,
  onCustomDimensionsChange,
  onImageImport,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<"mockup" | "framer">("mockup");

  const maxPadding =
    imageWidth && imageHeight
      ? Math.floor(Math.min(imageWidth, imageHeight) / 3)
      : 200;

  return (
    <div
      className="w-72 border-r overflow-y-auto flex flex-col"
      style={{
        borderColor: "rgba(148, 163, 184, 0.06)",
        background: "var(--color-bg-sidebar)",
      }}
    >
      {/* Tabs */}
      <div
        className="flex border-b"
        style={{ borderColor: "rgba(148, 163, 184, 0.06)" }}
      >
        <button
          onClick={() => setActiveTab("mockup")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all duration-200 ${
            activeTab === "mockup" ? "text-white" : ""
          }`}
          style={
            activeTab === "mockup"
              ? ({
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "rgba(240, 240, 240, 1)",
                } as React.CSSProperties)
              : ({
                  background: "transparent",
                  color: "rgba(148, 163, 184, 0.65)",
                } as React.CSSProperties)
          }
        >
          Mockup
        </button>
        <button
          onClick={() => setActiveTab("framer")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all duration-200 ${
            activeTab === "framer" ? "text-white" : ""
          }`}
          style={
            activeTab === "framer"
              ? ({
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "rgba(240, 240, 240, 1)",
                } as React.CSSProperties)
              : ({
                  background: "transparent",
                  color: "rgba(148, 163, 184, 0.65)",
                } as React.CSSProperties)
          }
        >
          Frame
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "mockup" && (
          <div className="p-4 space-y-5">
            {/* Media Uploader */}
            <MediaUploader
              currentScreenshot={screenshot}
              onImageImport={onImageImport}
            />

            {/* Padding */}
            {screenshot && (
              <div>
                <CustomSlider
                  label="Padding"
                  value={Math.min(padding, maxPadding)}
                  min={0}
                  max={maxPadding}
                  onChange={onPaddingChange}
                />
              </div>
            )}

            {!screenshot && (
              <div
                className="text-xs text-center py-8"
                style={{ color: "rgba(148, 163, 184, 0.5)" }}
              >
                Upload media to access editing options
              </div>
            )}

            {/* Border Radius */}
            {screenshot && imageWidth && imageHeight && (
              <div>
                <label
                  className="block text-xs font-semibold uppercase mb-2 tracking-wider"
                  style={{ color: "rgba(203, 213, 225, 0.5)" }}
                >
                  BORDER
                </label>
                {/* Calculate dynamic values based on image size */}
                {(() => {
                  const minDimension = Math.min(imageWidth, imageHeight);
                  const curvedValue = Math.round(minDimension * 0.05); // 5% of smaller dimension
                  const roundValue = Math.round(minDimension * 0.1); // 10% of smaller dimension

                  const borderStyles = [
                    {
                      label: "Sharp",
                      value: 0,
                      icon: (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 4 L4 12 L12 12" />
                        </svg>
                      ),
                    },
                    {
                      label: "Curved",
                      value: curvedValue,
                      icon: (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 4 Q4 8 8 8 L12 8" />
                        </svg>
                      ),
                    },
                    {
                      label: "Round",
                      value: roundValue,
                      icon: (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 4 A8 8 0 0 1 12 12" />
                        </svg>
                      ),
                    },
                  ];

                  // Check if current radius matches any preset (with small tolerance)
                  const getIsSelected = (value: number) => {
                    return Math.abs(cornerRadius - value) < 1;
                  };

                  return (
                    <>
                      <div
                        className="grid grid-cols-3 gap-1 p-1 rounded-lg mb-4"
                        style={{
                          background: "var(--color-bg-slider)",
                        }}
                      >
                        {borderStyles.map((item, index) => {
                          const isSelected = getIsSelected(item.value);
                          return (
                            <button
                              key={index}
                              onClick={() => onCornerRadiusChange(item.value)}
                              className="flex flex-col items-center justify-center gap-2 rounded-md transition-all duration-200 cursor-pointer"
                              style={{
                                background: isSelected
                                  ? "rgba(255, 255, 255, 0.1)"
                                  : "transparent",
                                minHeight: "60px",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background =
                                    "rgba(255, 255, 255, 0.05)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background =
                                    "transparent";
                                }
                              }}
                            >
                              <div
                                style={{
                                  color: isSelected
                                    ? "rgba(203, 213, 225, 1)"
                                    : "rgba(148, 163, 184, 0.5)",
                                }}
                              >
                                {item.icon}
                              </div>
                              <span
                                className="text-xs uppercase tracking-wider"
                                style={{
                                  color: isSelected
                                    ? "rgba(203, 213, 225, 1)"
                                    : "rgba(148, 163, 184, 0.5)",
                                }}
                              >
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <CustomSlider
                        label="Radius"
                        value={cornerRadius}
                        min={0}
                        max={200}
                        onChange={onCornerRadiusChange}
                      />
                    </>
                  );
                })()}
              </div>
            )}

            {/* Shadow Blur */}
            {screenshot && (
              <div>
                <CustomSlider
                  label="Shadow Blur"
                  value={shadowSize}
                  min={0}
                  max={100}
                  onChange={onShadowSizeChange}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "framer" && (
          <div className="p-4 space-y-5">
            <SizeDropdown
              customDimensions={customDimensions}
              onCustomDimensionsChange={onCustomDimensionsChange}
            />

            {/* Background Selector */}
            {screenshot && (
              <BackgroundSelector
                backgroundColor={backgroundColor}
                onBackgroundChange={onBackgroundChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
