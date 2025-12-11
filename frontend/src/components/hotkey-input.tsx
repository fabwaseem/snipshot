import { useState, useCallback, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface HotkeyInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

// Map browser key codes to readable names
const keyCodeToName: Record<string, string> = {
  PrintScreen: 'PrintScreen',
  F1: 'F1', F2: 'F2', F3: 'F3', F4: 'F4', F5: 'F5', F6: 'F6',
  F7: 'F7', F8: 'F8', F9: 'F9', F10: 'F10', F11: 'F11', F12: 'F12',
  Space: 'Space',
  Enter: 'Enter',
  Tab: 'Tab',
  Escape: 'Escape',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Insert: 'Insert',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
};

// Keys that shouldn't be used as main hotkey
const blockedKeys = new Set(['Control', 'Alt', 'Shift', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock']);

export function HotkeyInput({ value, onChange, label, disabled = false }: HotkeyInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);
  const inputRef = useRef<HTMLButtonElement>(null);

  // Format hotkey for display
  const formatHotkey = (hotkey: string): string => {
    if (!hotkey) return 'Click to set';
    return hotkey;
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];

    // Add modifiers in standard order
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Win');

    // Get the main key
    let keyName = e.key;

    // Skip if it's just a modifier key
    if (blockedKeys.has(keyName)) {
      setCurrentKeys(parts);
      return;
    }

    // Map special keys
    if (keyCodeToName[e.code]) {
      keyName = keyCodeToName[e.code];
    } else if (e.key.length === 1) {
      // Single character (letter or number)
      keyName = e.key.toUpperCase();
    }

    parts.push(keyName);
    setCurrentKeys(parts);
  }, [isRecording]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    // If we have a valid hotkey (modifier + key or just a function key), save it
    if (currentKeys.length > 0) {
      const lastKey = currentKeys[currentKeys.length - 1];
      // Check if last item is not a modifier
      if (!['Ctrl', 'Alt', 'Shift', 'Win'].includes(lastKey)) {
        const hotkeyStr = currentKeys.join('+');
        onChange(hotkeyStr);
        setIsRecording(false);
        setCurrentKeys([]);
        inputRef.current?.blur();
      }
    }
  }, [isRecording, currentKeys, onChange]);

  useEffect(() => {
    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown, true);
      window.addEventListener('keyup', handleKeyUp, true);
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
        window.removeEventListener('keyup', handleKeyUp, true);
      };
    }
  }, [isRecording, handleKeyDown, handleKeyUp]);

  const startRecording = () => {
    if (disabled) return;
    setIsRecording(true);
    setCurrentKeys([]);
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setCurrentKeys([]);
  };

  const clearHotkey = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
      <div className="flex gap-2">
        <button
          ref={inputRef}
          onClick={startRecording}
          onBlur={cancelRecording}
          disabled={disabled}
          className={`flex-1 px-4 py-2.5 rounded-lg text-left transition-all duration-200 ${
            isRecording ? 'text-white ring-2' : 'border'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          style={isRecording ? {
            background: 'var(--gradient-primary)',
            ringColor: 'var(--color-primary-light)',
            ringOpacity: '0.5',
          } as React.CSSProperties : {
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            if (!isRecording && !disabled) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'var(--color-border-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRecording) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }
          }}
        >
          {isRecording
            ? currentKeys.length > 0
              ? currentKeys.join('+')
              : 'Press keys...'
            : formatHotkey(value)}
        </button>
        {value && !isRecording && (
          <button
            onClick={clearHotkey}
            disabled={disabled}
            className="px-3 py-2.5 rounded-lg transition-all duration-200 border"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.color = 'var(--color-danger-light)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
            title="Clear hotkey"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
