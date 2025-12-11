import { useState, useRef, useEffect } from "react";

interface CustomSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  step?: number;
}

export function CustomSlider({
  label,
  value,
  min,
  max,
  onChange,
  step = 1,
}: CustomSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;
  const railPercentage = 100 - percentage;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && sliderRef.current) {
      updateValue(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateValue = (e: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = Math.round((percentage / 100) * (max - min) + min);
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    onChange(clampedValue);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={sliderRef}
      className="relative cursor-pointer touch-none user-select-none"
      style={{
        width: "100%",
        height: "30px",
        borderRadius: "8px",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Track */}
      <div
        className="absolute"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "var(--color-bg-slider)",
          borderRadius: "6px",
          height: "100%",
        }}
      />

      {/* Rail (filled portion) */}
      <div
        className="absolute"
        style={{
          top: 0,
          left: "0%",
          right: `${railPercentage}%`,
          bottom: 0,
          background: "var(--color-bg-slider-progress)",
          borderRadius: "6px",
          height: "100%",
          boxShadow: "0 1.5px 6px -3px rgba(0, 0, 0, 0.4)",
        }}
      />

      {/* Thumb */}
      <div
        ref={thumbRef}
        className="absolute cursor-pointer transition-all duration-200 z-10"
        style={{
          left: `calc(${percentage}% - 6px)`,
          top: "6px",
          bottom: "6px",
          width: "2px",
          borderRadius: "2px",
          background: "rgba(240, 240, 240, 0.36)",
          outline: "none",
          transition: isDragging ? "none" : "background 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.background = "rgba(240, 240, 240, 0.5)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.background = "rgba(240, 240, 240, 0.36)";
          }
        }}
      />

      {/* Labels */}
      <div
        className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none"
        style={{
          padding: "0 12px",
        }}
      >
        <span
          className="text-xs font-medium"
          style={{
            color: "rgba(203, 213, 225, 0.75)",
          }}
        >
          {label}
        </span>
        <span
          className="text-xs font-medium"
          style={{
            color: "rgba(226, 232, 240, 0.9)",
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
