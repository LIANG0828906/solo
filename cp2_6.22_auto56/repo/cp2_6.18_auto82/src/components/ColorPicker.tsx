import React, { useRef, useEffect, useState, useCallback } from 'react';
import { hexToHsv, hsvToHex, HSV } from '../utils/colorUtils';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

const DISC_SIZE = 200;
const SLIDER_WIDTH = 180;
const SLIDER_HEIGHT = 12;

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange }) => {
  const discRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLCanvasElement>(null);
  const [isDraggingDisc, setIsDraggingDisc] = useState(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [hsv, setHsv] = useState<HSV>(hexToHsv(color));

  useEffect(() => {
    const newHsv = hexToHsv(color);
    if (Math.abs(newHsv.h - hsv.h) > 0.1 || Math.abs(newHsv.s - hsv.s) > 0.1 || Math.abs(newHsv.v - hsv.v) > 0.1) {
      setHsv(newHsv);
    }
  }, [color]);

  const drawDisc = useCallback(() => {
    const canvas = discRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = Math.min(width, height) / 2;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= radius) {
          const saturation = (dist / radius) * 100;
          let hue = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          if (hue < 0) hue += 360;
          
          const rgb = hsvToRgbHex({ h: hue, s: saturation, v: hsv.v });
          ctx.fillStyle = rgb;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hsv.v]);

  const drawSlider = useCallback(() => {
    const canvas = sliderRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, SLIDER_WIDTH, 0);
    gradient.addColorStop(0, hsvToHex({ h: hsv.h, s: hsv.s, v: 0 }));
    gradient.addColorStop(1, hsvToHex({ h: hsv.h, s: hsv.s, v: 100 }));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SLIDER_WIDTH, SLIDER_HEIGHT);

    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, SLIDER_WIDTH - 1, SLIDER_HEIGHT - 1);
  }, [hsv.h, hsv.s]);

  useEffect(() => {
    drawDisc();
    drawSlider();
  }, [drawDisc, drawSlider]);

  const hsvToRgbHex = (h: HSV): string => {
    return hsvToHex(h);
  };

  const getColorFromDisc = (clientX: number, clientY: number) => {
    const canvas = discRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * DISC_SIZE;
    const y = ((clientY - rect.top) / rect.height) * DISC_SIZE;
    const centerX = DISC_SIZE / 2;
    const centerY = DISC_SIZE / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = DISC_SIZE / 2;

    const clampedDist = Math.min(dist, radius);
    const saturation = (clampedDist / radius) * 100;
    let hue = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (hue < 0) hue += 360;

    return { h: hue, s: saturation, v: hsv.v };
  };

  const getValueFromSlider = (clientX: number) => {
    const canvas = sliderRef.current;
    if (!canvas) return hsv.v;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * SLIDER_WIDTH;
    const value = Math.max(0, Math.min(100, (x / SLIDER_WIDTH) * 100));
    return value;
  };

  const handleDiscMouseDown = (e: React.MouseEvent) => {
    setIsDraggingDisc(true);
    const newHsv = getColorFromDisc(e.clientX, e.clientY);
    if (newHsv) {
      setHsv(newHsv);
      onChange(hsvToHex(newHsv));
    }
  };

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSlider(true);
    const newValue = getValueFromSlider(e.clientX);
    const newHsv = { ...hsv, v: newValue };
    setHsv(newHsv);
    onChange(hsvToHex(newHsv));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingDisc) {
        const newHsv = getColorFromDisc(e.clientX, e.clientY);
        if (newHsv) {
          setHsv(newHsv);
          onChange(hsvToHex(newHsv));
        }
      }
      if (isDraggingSlider) {
        const newValue = getValueFromSlider(e.clientX);
        const newHsv = { ...hsv, v: newValue };
        setHsv(newHsv);
        onChange(hsvToHex(newHsv));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingDisc(false);
      setIsDraggingSlider(false);
    };

    if (isDraggingDisc || isDraggingSlider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDisc, isDraggingSlider, hsv, onChange]);

  const indicatorX = (DISC_SIZE / 2) + Math.cos(((hsv.h - 90) * Math.PI) / 180) * (hsv.s / 100) * (DISC_SIZE / 2);
  const indicatorY = (DISC_SIZE / 2) + Math.sin(((hsv.h - 90) * Math.PI) / 180) * (hsv.s / 100) * (DISC_SIZE / 2);
  const sliderX = (hsv.v / 100) * SLIDER_WIDTH;

  return (
    <div className="color-picker">
      <div className="color-picker-header">
        <span className="color-picker-label">{label}</span>
        <span className="color-picker-hex">{color.toUpperCase()}</span>
      </div>
      <div className="color-picker-disc-wrapper">
        <canvas
          ref={discRef}
          width={DISC_SIZE}
          height={DISC_SIZE}
          className="color-picker-disc"
          onMouseDown={handleDiscMouseDown}
        />
        <div
          className="color-picker-indicator"
          style={{
            left: `${indicatorX}px`,
            top: `${indicatorY}px`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="color-picker-slider-wrapper">
        <canvas
          ref={sliderRef}
          width={SLIDER_WIDTH}
          height={SLIDER_HEIGHT}
          className="color-picker-slider"
          onMouseDown={handleSliderMouseDown}
        />
        <div
          className="color-picker-slider-thumb"
          style={{ left: `${sliderX}px` }}
        />
      </div>
      <div className="color-picker-preview" style={{ backgroundColor: color }} />
    </div>
  );
};

export default ColorPicker;
