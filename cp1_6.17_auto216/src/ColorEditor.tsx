import React, { useState, useEffect, useRef } from 'react';
import { hexToRgb, rgbToHex, RGB } from './utils/colorUtils';

interface ColorEditorProps {
  color: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
}

const ColorEditor: React.FC<ColorEditorProps> = ({ color, onColorChange, onClose }) => {
  const [rgb, setRgb] = useState<RGB>(hexToRgb(color));
  const [localColor, setLocalColor] = useState(color);
  const panelRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const newRgb = hexToRgb(color);
    setRgb(newRgb);
    setLocalColor(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const updateColor = (newRgb: RGB) => {
    setRgb(newRgb);
    const newColor = rgbToHex(newRgb);
    setLocalColor(newColor);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      onColorChange(newColor);
    });
  };

  const handleSliderChange = (channel: keyof RGB, value: number) => {
    const newRgb = { ...rgb, [channel]: value };
    updateColor(newRgb);
  };

  const Slider: React.FC<{
    label: string;
    value: number;
    color: string;
    onChange: (v: number) => void;
  }> = ({ label, value, color, onChange }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleInteraction = (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const newValue = Math.round((x / rect.width) * 255);
      onChange(newValue);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      handleInteraction(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const touch = e.touches[0];
      handleInteraction(touch.clientX);
    };

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          handleInteraction(e.clientX);
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (isDragging) {
          const touch = e.touches[0];
          handleInteraction(touch.clientX);
        }
      };

      const handleEnd = () => {
        setIsDragging(false);
      };

      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleEnd);
      }

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }, [isDragging]);

    const percentage = (value / 255) * 100;

    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#333333' }}>
          <span>{label}</span>
          <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
        <div
          ref={trackRef}
          style={{
            position: 'relative',
            height: 6,
            borderRadius: 3,
            background: `linear-gradient(to right, ${color}0, ${color})`,
            cursor: 'pointer',
            touchAction: 'none',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${percentage}%`,
              transform: 'translate(-50%, -50%)',
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: localColor,
              border: '2px solid #FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              transition: 'background-color 0.05s',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        zIndex: 1000,
        width: 280,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#333333' }}>颜色编辑</div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            color: '#9CA3AF',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          width: '100%',
          height: 40,
          borderRadius: 8,
          backgroundColor: localColor,
          marginBottom: 16,
          border: '1px solid #E5E7EB',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8 }}>
        <span style={{ fontSize: 12, color: '#6B7280' }}>HEX:</span>
        <input
          type="text"
          value={localColor}
          onChange={(e) => {
            const val = e.target.value;
            setLocalColor(val);
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
              const newRgb = hexToRgb(val);
              setRgb(newRgb);
              onColorChange(val);
            }
          }}
          style={{
            flex: 1,
            padding: '6px 10px',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            fontSize: 12,
            fontFamily: 'monospace',
            outline: 'none',
          }}
        />
      </div>

      <Slider label="R" value={rgb.r} color="#FF0000" onChange={(v) => handleSliderChange('r', v)} />
      <Slider label="G" value={rgb.g} color="#00FF00" onChange={(v) => handleSliderChange('g', v)} />
      <Slider label="B" value={rgb.b} color="#0000FF" onChange={(v) => handleSliderChange('b', v)} />
    </div>
  );
};

export default ColorEditor;
