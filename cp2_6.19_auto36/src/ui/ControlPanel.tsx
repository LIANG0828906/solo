import React, { useRef, useEffect, useState } from 'react';
import { Theme, THEMES, MindMapNode, Viewport } from '../types';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ControlPanelProps {
  theme: Theme;
  onThemeChange: (themeId: string) => void;
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
  nodes: MindMapNode[];
  canvasRef: React.RefObject<HTMLDivElement>;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  theme,
  onThemeChange,
  viewport,
  onViewportChange,
  nodes,
  canvasRef,
}) => {
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleZoomIn = () => {
    const newScale = Math.min(2, viewport.scale * 1.2);
    updateScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.5, viewport.scale / 1.2);
    updateScale(newScale);
  };

  const handleZoomSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    updateScale(newScale);
  };

  const updateScale = (newScale: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const worldX = (centerX - viewport.x) / viewport.scale;
    const worldY = (centerY - viewport.y) / viewport.scale;

    const newX = centerX - worldX * newScale;
    const newY = centerY - worldY * newScale;

    onViewportChange({
      x: newX,
      y: newY,
      scale: newScale,
    });
  };

  const handleExportPNG = () => {
    if (!canvasRef.current || nodes.length === 0) return;

    const svgElement = canvasRef.current.querySelector('svg');
    if (!svgElement) return;

    const minX = Math.min(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxX = Math.max(...nodes.map((n) => n.x + n.width));
    const maxY = Math.max(...nodes.map((n) => n.y + n.height));
    const padding = 40;

    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('width', String(width));
    svgClone.setAttribute('height', String(height));
    svgClone.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${width} ${height}`);

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'mindmap.png';
      link.href = pngUrl;
      link.click();

      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const zoomPercent = Math.round(viewport.scale * 100);

  return (
    <div
        style={{
          width: '100%',
          height: '100%',
          background: theme.panelBg,
          color: theme.panelText,
          borderRight: `1px solid ${theme.nodeStroke}`,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          transition: 'background-color 0.6s ease, color 0.6s ease, border-color 0.6s ease',
          boxSizing: 'border-box',
        }}
      >
        <div>
          <p style={{ margin: '0 0 8px 0', fontSize: '11px', opacity: 0.6, fontWeight: 500 }}>主题</p>
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: `1px solid ${theme.nodeStroke}`,
                background: theme.nodeFill,
                color: theme.panelText,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: theme.lineColor,
                  }}
                />
                {theme.name}
              </span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>
            {themeDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.nodeStroke}`,
                  background: theme.panelBg,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                {Object.values(THEMES).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onThemeChange(t.id);
                      setThemeDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: 'none',
                      background: t.id === theme.id ? `${t.lineColor}20` : 'transparent',
                      color: theme.panelText,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (t.id !== theme.id) {
                        e.currentTarget.style.background = `${t.lineColor}10`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (t.id !== theme.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: t.lineColor,
                      }}
                    />
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 8px 0', fontSize: '11px', opacity: 0.6, fontWeight: 500 }}>缩放</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleZoomOut}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: `1px solid ${theme.nodeStroke}`,
                background: theme.nodeFill,
                color: theme.panelText,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              <ZoomOut size={14} />
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={viewport.scale}
                onChange={handleZoomSliderChange}
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '2px',
                  background: theme.nodeStroke,
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />
              <style>{`
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 14px;
                  height: 14px;
                  border-radius: 50%;
                  background: ${theme.lineColor};
                  cursor: pointer;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                input[type="range"]::-moz-range-thumb {
                  width: 14px;
                  height: 14px;
                  border-radius: 50%;
                  background: ${theme.lineColor};
                  cursor: pointer;
                  border: none;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
              `}</style>
            </div>
            <button
              onClick={handleZoomIn}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: `1px solid ${theme.nodeStroke}`,
                background: theme.nodeFill,
                color: theme.panelText,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              <ZoomIn size={14} />
            </button>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '10px', textAlign: 'center', opacity: 0.5 }}>
            {zoomPercent}%
          </p>
        </div>

        <div>
          <button
            onClick={handleExportPNG}
            disabled={nodes.length === 0}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: 'none',
              background: nodes.length === 0 ? theme.nodeStroke : theme.lineColor,
              color: nodes.length === 0 ? theme.panelText + '60' : 'white',
              fontSize: '12px',
              fontWeight: 500,
              cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              opacity: nodes.length === 0 ? 0.5 : 1,
            }}
          >
            <Download size={14} />
            导出 PNG
          </button>
        </div>
      </div>
  );
};
