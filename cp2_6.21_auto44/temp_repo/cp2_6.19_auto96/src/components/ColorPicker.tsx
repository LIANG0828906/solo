import { useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Pipette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onEyedropper: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 999,
  },
  panel: {
    position: 'absolute' as const,
    zIndex: 1000,
    background: '#1e1e1e',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    animation: 'slideIn 200ms ease-out forwards',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
  },
  input: {
    flex: 1,
    background: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#e0e0e0',
    padding: '6px 8px',
    fontSize: '13px',
    fontFamily: 'monospace',
    outline: 'none',
  },
  eyedropperBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#e0e0e0',
    cursor: 'pointer',
    padding: '6px',
  },
  keyframes: `
@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
`,
};

let styleInjected = false;

function injectKeyframes() {
  if (styleInjected) return;
  const sheet = document.createElement('style');
  sheet.textContent = styles.keyframes;
  document.head.appendChild(sheet);
  styleInjected = true;
}

export default function ColorPicker({ color, onChange, onEyedropper, isOpen, onClose }: ColorPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectKeyframes();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div style={styles.overlay} />
      <div ref={containerRef} style={styles.panel}>
        <HexColorPicker color={color} onChange={onChange} />
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={color}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                onChange(val);
              }
            }}
          />
          <button
            style={styles.eyedropperBtn}
            onClick={onEyedropper}
            type="button"
          >
            <Pipette size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
