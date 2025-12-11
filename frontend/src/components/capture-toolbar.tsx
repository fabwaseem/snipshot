import { CaptureMode } from '../types';
import { Monitor, Scan, AppWindow, Settings, ChevronDown, FolderOpen } from 'lucide-react';

interface CaptureToolbarProps {
  onCapture: (mode: CaptureMode) => void;
  isCapturing: boolean;
  hasScreenshot: boolean;
  onClear: () => void;
  onMinimize?: () => void;
  onOpenSettings?: () => void;
  onImportImage?: () => void;
}

export function CaptureToolbar({
  onCapture,
  isCapturing,
  hasScreenshot,
  onClear,
  onMinimize,
  onOpenSettings,
  onImportImage
}: CaptureToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 glass border-b" style={{
      borderColor: 'var(--color-border-light)',
    }}>
      <div className="flex items-center gap-2.5">
        {/* Fullscreen Capture */}
        <button
          onClick={() => onCapture('fullscreen')}
          disabled={isCapturing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                     text-white shadow-lg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          style={!isCapturing ? {
            background: 'var(--gradient-primary)',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
          } as React.CSSProperties : {
            background: 'var(--color-gray-600)',
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3)';
            }
          }}
          title="Capture entire screen (PrintScreen)"
        >
          <Monitor className="w-4 h-4" />
          Fullscreen
        </button>

        {/* Region Capture */}
        <button
          onClick={() => onCapture('region')}
          disabled={isCapturing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                     text-white shadow-lg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          style={!isCapturing ? {
            background: 'var(--gradient-accent)',
            boxShadow: '0 4px 16px rgba(6, 182, 212, 0.3)',
          } as React.CSSProperties : {
            background: 'var(--color-gray-600)',
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(6, 182, 212, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(6, 182, 212, 0.3)';
            }
          }}
          title="Select region to capture (Ctrl+PrintScreen)"
        >
          <Scan className="w-4 h-4" />
          Region
        </button>

        {/* Window Capture */}
        <button
          onClick={() => onCapture('window')}
          disabled={isCapturing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                     text-white shadow-lg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          style={!isCapturing ? {
            background: 'var(--gradient-primary-accent)',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
          } as React.CSSProperties : {
            background: 'var(--color-gray-600)',
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCapturing) {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3)';
            }
          }}
          title="Capture specific window (Ctrl+Shift+PrintScreen)"
        >
          <AppWindow className="w-4 h-4" />
          Window
        </button>

        {/* Import Image */}
        {onImportImage && (
          <button
            onClick={onImportImage}
            disabled={isCapturing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                       border transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (!isCapturing) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
            title="Import image from file (Ctrl+O)"
          >
            <FolderOpen className="w-4 h-4" />
            Import
          </button>
        )}
      </div>

      {/* Divider */}
      {hasScreenshot && (
        <>
          <div className="h-6 w-px bg-white/10" />
          <button
            onClick={onClear}
            className="px-4 py-2.5 rounded-lg font-medium text-sm border transition-all duration-200"
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
            Clear
          </button>
        </>
      )}

      {/* Capture Status */}
      {isCapturing && (
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-accent)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-accent-light)' }}>Capturing...</span>
        </div>
      )}

      {/* Spacer */}
      {!isCapturing && <div className="flex-1" />}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-lg border transition-all duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'var(--color-border-hover)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        {onMinimize && (
          <button
            onClick={onMinimize}
            className="p-2.5 rounded-lg border transition-all duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'var(--color-border-hover)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
            title="Minimize to tray"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}