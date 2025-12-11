import { useState, useEffect } from 'react';
import { GetDisplayCount, GetDisplayBounds, CaptureDisplayThumbnail } from '../../wailsjs/go/main/App';
import { ScreenGetAll } from '../../wailsjs/runtime/runtime';
import { Monitor, X } from 'lucide-react';

interface ScreenInfo {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isPrimary?: boolean;
  thumbnail?: string; // Base64 image data
}

interface ScreenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (screenIndex: number) => void;
}

export function ScreenSelector({ isOpen, onClose, onSelect }: ScreenSelectorProps) {
  const [screens, setScreens] = useState<ScreenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadScreens();
    } else {
      setScreens([]);
    }
  }, [isOpen]);

  const loadScreens = async () => {
    setIsLoading(true);
    try {
      // Get display count
      const displayCount = await GetDisplayCount();
      const screensList: ScreenInfo[] = [];

      // Get screens from Wails runtime for logical dimensions
      const wailsScreens = await ScreenGetAll();

      // Find primary screen index from Wails screens
      let primaryIndex = 0;
      for (let i = 0; i < wailsScreens.length; i++) {
        if (wailsScreens[i].isPrimary) {
          primaryIndex = i;
          break;
        }
      }

      // Get bounds for each display and capture thumbnails
      for (let i = 0; i < displayCount; i++) {
        const bounds = await GetDisplayBounds(i);

        // Capture thumbnail (max 320x240 for preview)
        let thumbnail: string | undefined;
        try {
          const thumbResult = await CaptureDisplayThumbnail(i, 320, 240);
          thumbnail = thumbResult.data;
        } catch (error) {
          console.error(`Failed to capture thumbnail for screen ${i}:`, error);
        }

        screensList.push({
          index: i,
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          isPrimary: i === primaryIndex,
          thumbnail,
        });
      }

      setScreens(screensList);
    } catch (error) {
      console.error('Failed to get screens:', error);
    }
    setIsLoading(false);
  };

  const handleScreenClick = (screenIndex: number) => {
    onSelect(screenIndex);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="glass rounded-2xl border p-4 md:p-6 max-w-[95vw] md:max-w-4xl w-full mx-2 md:mx-4 max-h-[95vh] overflow-y-auto"
        style={{
          borderColor: 'var(--color-border)',
          background: 'rgba(27, 38, 54, 0.95)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2
            className="text-lg md:text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Select Screen to Capture
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Close (ESC)"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 md:py-12">
            <div className="flex flex-col items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
                <div
                  className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full animate-pulse"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    animationDelay: '0.2s'
                  }}
                />
                <div
                  className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full animate-pulse"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    animationDelay: '0.4s'
                  }}
                />
              </div>
              <span
                className="text-xs md:text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Loading screens...
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {screens.map((screen) => (
              <div
                key={screen.index}
                onClick={() => handleScreenClick(screen.index)}
                className="relative group cursor-pointer rounded-lg overflow-hidden border transition-all duration-200 hover:scale-[1.02] md:hover:scale-105 hover:shadow-xl"
                style={{
                  borderColor: screen.isPrimary
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = screen.isPrimary
                    ? 'var(--color-primary)'
                    : 'var(--color-border)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-900 relative overflow-hidden">
                  {screen.thumbnail ? (
                    <img
                      src={`data:image/png;base64,${screen.thumbnail}`}
                      alt={`Screen ${screen.index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Monitor
                        className="w-8 h-8 md:w-12 md:h-12"
                        style={{ color: 'var(--color-text-muted)' }}
                      />
                    </div>
                  )}

                  {/* Primary badge */}
                  {screen.isPrimary && (
                    <div
                      className="absolute top-1.5 right-1.5 md:top-2 md:right-2 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-xs font-semibold"
                      style={{
                        background: 'var(--gradient-primary)',
                        color: 'white',
                      }}
                    >
                      Primary
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Monitor className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: 'var(--color-primary)' }} />
                    <span
                      className="font-semibold text-sm md:text-base"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Screen {screen.index + 1}
                    </span>
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {screen.width} × {screen.height}
                  </div>
                </div>

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                  }}
                >
                  <span
                    className="text-white font-semibold text-sm md:text-lg px-2"
                  >
                    Click to Capture
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
