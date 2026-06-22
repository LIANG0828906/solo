import { useState, useRef, useCallback } from 'react';
import chroma from 'chroma-js';

interface ColorPickerProps {
  onColorChange: (hex: string) => void;
  initialColor?: string;
}

export function ColorPicker({ onColorChange, initialColor = '#4A90D9' }: ColorPickerProps) {
  const [color, setColor] = useState(initialColor);
  const [hue, setHue] = useState(210);
  const [isDragging, setIsDragging] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const updateColorFromHue = useCallback(
    (newHue: number) => {
      const hsl = `hsl(${newHue}, 80%, 50%)`;
      const hex = chroma(hsl).hex();
      setHue(newHue);
      setColor(hex);
      onColorChange(hex);
    },
    [onColorChange]
  );

  const handleWheelClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = e.clientX - centerX;
      const y = e.clientY - centerY;
      const angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
      const newHue = angle < 0 ? angle + 360 : angle;
      updateColorFromHue(newHue);
    },
    [updateColorFromHue]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = e.clientX - centerX;
      const y = e.clientY - centerY;
      const angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
      const newHue = angle < 0 ? angle + 360 : angle;
      updateColorFromHue(newHue);
    },
    [isDragging, updateColorFromHue]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
      handleWheelClick(e);
    },
    [handleWheelClick]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!wheelRef.current) return;
      const touch = e.touches[0];
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = touch.clientX - centerX;
      const y = touch.clientY - centerY;
      const angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
      const newHue = angle < 0 ? angle + 360 : angle;
      updateColorFromHue(newHue);
    },
    [updateColorFromHue]
  );

  const handleHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      try {
        if (chroma.valid(value)) {
          const hex = chroma(value).hex();
          const hsl = chroma(hex).hsl();
          setColor(hex);
          if (!isNaN(hsl[0])) {
            setHue(hsl[0]);
          }
          onColorChange(hex);
        }
      } catch {
        // Invalid color, ignore
      }
    },
    [onColorChange]
  );

  return (
    <div
      className="color-picker-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={wheelRef}
        className="color-wheel"
        onMouseDown={handleMouseDown}
        onTouchMove={handleTouchMove}
      >
        <div className="color-wheel-gradient" />
        <div
          className="color-wheel-cursor"
          style={{
            transform: `rotate(${hue}deg) translateY(-70px)`,
            backgroundColor: chroma(`hsl(${hue}, 80%, 50%)`).hex(),
          }}
        />
      </div>
      <div className="color-picker-inputs">
        <div className="color-preview" style={{ backgroundColor: color }} />
        <input
          type="text"
          className="hex-input"
          value={color}
          onChange={handleHexInput}
          placeholder="#RRGGBB"
          maxLength={7}
        />
        <input
          type="color"
          className="native-color-input"
          value={color}
          onChange={(e) => {
            const hex = e.target.value;
            const hsl = chroma(hex).hsl();
            setColor(hex);
            if (!isNaN(hsl[0])) {
              setHue(hsl[0]);
            }
            onColorChange(hex);
          }}
        />
      </div>
    </div>
  );
}
