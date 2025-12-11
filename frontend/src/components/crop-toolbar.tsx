import React from 'react';
import { CropAspectRatio } from '../types';
import { Check, X, RotateCcw } from 'lucide-react';

interface CropToolbarProps {
  aspectRatio: CropAspectRatio;
  onAspectRatioChange: (ratio: CropAspectRatio) => void;
  onApply: () => void;
  onCancel: () => void;
  onReset: () => void;
  canApply: boolean;
  canReset: boolean;
}

const ASPECT_RATIOS: { value: CropAspectRatio; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
  { value: '1:1', label: '1:1' },
  { value: '9:16', label: '9:16' },
  { value: '3:4', label: '3:4' },
];

export function CropToolbar({
  aspectRatio,
  onAspectRatioChange,
  onApply,
  onCancel,
  onReset,
  canApply,
  canReset,
}: CropToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 glass border-b" style={{
      borderColor: 'var(--color-border-light)',
    }}>
      {/* Aspect Ratio Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Ratio:</span>
        <div className="flex gap-1.5">
          {ASPECT_RATIOS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onAspectRatioChange(value)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                aspectRatio === value ? 'text-white shadow-lg' : 'border'
              }`}
              style={aspectRatio === value ? {
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-primary)',
              } as React.CSSProperties : {
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-secondary)',
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                if (aspectRatio !== value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (aspectRatio !== value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/10" />

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          disabled={!canReset}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 border ${
            !canReset ? 'cursor-not-allowed opacity-50' : ''
          }`}
          style={canReset ? {
            background: 'rgba(239, 68, 68, 0.2)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: 'var(--color-danger-light)',
          } as React.CSSProperties : {
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-disabled)',
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            if (canReset) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (canReset) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium border transition-all duration-200"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'var(--color-border-hover)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
        <button
          onClick={onApply}
          disabled={!canApply}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
            !canApply ? 'cursor-not-allowed opacity-50' : 'text-white shadow-lg'
          }`}
          style={canApply ? {
            background: 'var(--gradient-success)',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)',
          } as React.CSSProperties : {
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--color-text-disabled)',
          } as React.CSSProperties}
        >
          <Check className="w-3.5 h-3.5" />
          Apply
        </button>
      </div>

      {/* Hint */}
      <div className="flex-1" />
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Press Esc to cancel</span>
    </div>
  );
}