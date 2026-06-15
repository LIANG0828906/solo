import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BackgroundTemplate } from './BackgroundGenerator';

interface BgSelectorProps {
  templates: BackgroundTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (template: BackgroundTemplate) => void;
  onSelectColor: (color: string) => void;
  onUploadBackground: (file: File) => void;
  selectedColor: string;
}

const BgSelector: React.FC<BgSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onSelectColor,
  onUploadBackground,
  selectedColor
}) => {
  const [hue, setHue] = useState(0);
  const [lightness, setLightness] = useState(50);
  const colorPickerRef = useRef<HTMLCanvasElement>(null);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const [isDraggingLightness, setIsDraggingLightness] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentColor = `hsl(${hue}, 80%, ${lightness}%)`;

  const hexToHsl = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 80, l: 50 };
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }, []);

  useEffect(() => {
    if (selectedColor.startsWith('#')) {
      const hsl = hexToHsl(selectedColor);
      setHue(hsl.h);
      setLightness(hsl.l);
    }
  }, [selectedColor, hexToHsl]);

  useEffect(() => {
    const canvas = colorPickerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 10;
    const innerRadius = outerRadius - 25;

    ctx.clearRect(0, 0, width, height);

    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 0.5) * Math.PI / 180;
      const endAngle = (angle + 0.5) * Math.PI / 180;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = `hsl(${angle}, 80%, 50%)`;
      ctx.fill();
    }

    const indicatorAngle = (hue - 90) * Math.PI / 180;
    const indicatorX = centerX + Math.cos(indicatorAngle) * (outerRadius + innerRadius) / 2;
    const indicatorY = centerY + Math.sin(indicatorAngle) * (outerRadius + innerRadius) / 2;

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [hue]);

  const handleColorPickerMouseDown = (e: React.MouseEvent) => {
    setIsDraggingHue(true);
    updateHueFromMouse(e.nativeEvent);
  };

  const handleLightnessMouseDown = (e: React.MouseEvent) => {
    setIsDraggingLightness(true);
    updateLightnessFromMouse(e.nativeEvent);
  };

  const updateHueFromMouse = useCallback((e: MouseEvent) => {
    const canvas = colorPickerRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvas.width / 2;
    const y = e.clientY - rect.top - canvas.height / 2;
    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    
    setHue(Math.round(angle));
  }, []);

  const updateLightnessFromMouse = useCallback((e: MouseEvent) => {
    const slider = document.getElementById('lightness-slider');
    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setLightness(Math.round(percentage));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingHue) {
        updateHueFromMouse(e);
      }
      if (isDraggingLightness) {
        updateLightnessFromMouse(e);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingHue || isDraggingLightness) {
        onSelectColor(currentColor);
      }
      setIsDraggingHue(false);
      setIsDraggingLightness(false);
    };

    if (isDraggingHue || isDraggingLightness) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHue, isDraggingLightness, updateHueFromMouse, updateLightnessFromMouse, currentColor, onSelectColor]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('文件大小不能超过5MB');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert('仅支持JPG和PNG格式');
        return;
      }
      onUploadBackground(file);
    }
  };

  return (
    <div className="bg-selector">
      <h3 className="selector-title">预设背景</h3>
      <div className="template-grid">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${selectedTemplateId === template.id ? 'selected' : ''}`}
            onClick={() => onSelectTemplate(template)}
          >
            <img src={template.thumbnail} alt={template.name} className="template-thumbnail" />
            <span className="template-name">{template.name}</span>
          </div>
        ))}
      </div>

      <div className="divider" />

      <h3 className="selector-title">自定义颜色</h3>
      <div className="color-picker-section">
        <canvas
          ref={colorPickerRef}
          width={180}
          height={180}
          className="color-wheel"
          onMouseDown={handleColorPickerMouseDown}
        />
        <div
          id="lightness-slider"
          className="lightness-slider"
          onMouseDown={handleLightnessMouseDown}
        >
          <div
            className="lightness-track"
            style={{
              background: `linear-gradient(to right, hsl(${hue}, 80%, 0%), hsl(${hue}, 80%, 50%), hsl(${hue}, 80%, 100%))`
            }}
          />
          <div
            className="lightness-thumb"
            style={{ left: `${lightness}%` }}
          />
        </div>
        <div className="color-preview">
          <div
            className="color-preview-box"
            style={{ backgroundColor: currentColor }}
          />
          <span className="color-value">{currentColor}</span>
        </div>
      </div>

      <div className="divider" />

      <h3 className="selector-title">上传背景</h3>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        className="hidden-file-input"
        onChange={handleFileUpload}
      />
      <button
        className="upload-btn"
        onClick={() => fileInputRef.current?.click()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        选择背景图片
      </button>
    </div>
  );
};

export default BgSelector;
