import React, { useState, useEffect } from 'react';
import { extractHsvKeyColors, hsvToHex, hsvToString, hslToHsv } from '../utils/colorMapper';
import type { HSL } from '../utils/colorMapper';

export interface ColorSwatchBarProps {
  mixedColor: HSL;
  themeColor: string;
}

interface KeyColor {
  name: string;
  label: string;
  hex: string;
  colorStr: string;
}

export const ColorSwatchBar: React.FC<ColorSwatchBarProps> = ({
  mixedColor,
  themeColor,
}) => {
  const [expandedColor, setExpandedColor] = useState<KeyColor | null>(null);
  const [copied, setCopied] = useState(false);

  const { hKey, sKey, vKey } = extractHsvKeyColors(mixedColor);

  const keyColors: KeyColor[] = [
    { name: 'hue', label: '色相', hex: hsvToHex(hKey), colorStr: hsvToString(hKey) },
    { name: 'saturation', label: '饱和度', hex: hsvToHex(sKey), colorStr: hsvToString(sKey) },
    { name: 'value', label: '明度', hex: hsvToHex(vKey), colorStr: hsvToString(vKey) },
  ];

  const copyToClipboard = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleSwatchClick = (color: KeyColor) => {
    setExpandedColor(color);
    setCopied(false);
  };

  const closeExpanded = () => {
    setExpandedColor(null);
  };

  return (
    <>
      <div
        className="color-swatch-bar"
        style={{ '--theme-color': themeColor } as React.CSSProperties}
      >
        <div className="color-swatch-label">HSV 关键色样</div>
        <div className="color-swatches">
          {keyColors.map((color) => (
            <div
              key={color.name}
              className="color-swatch-item"
              onClick={() => handleSwatchClick(color)}
            >
              <div
                className="color-swatch-preview"
                style={{
                  backgroundColor: color.colorStr,
                  boxShadow: `0 4px 12px ${color.hex}66`,
                }}
              />
              <div className="color-swatch-info">
                <span className="color-swatch-name">{color.label}</span>
                <span className="color-swatch-hex">{color.hex}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {expandedColor && (
        <div className="color-modal-overlay" onClick={closeExpanded}>
          <div className="color-modal-wrapper">
            <div className="color-modal" onClick={(e) => e.stopPropagation()}>
              <div
                className="color-modal-preview"
                style={{
                  backgroundColor: expandedColor.colorStr,
                  boxShadow: `0 20px 60px ${expandedColor.hex}88`,
                }}
              />
              <div className="color-modal-content">
                <h3 className="color-modal-title">{expandedColor.label}</h3>
                <p className="color-modal-hex">{expandedColor.hex}</p>
                <button
                  className={`copy-button ${copied ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(expandedColor.hex)}
                >
                  {copied ? (
                    <>
                      <span className="copy-check-icon">✓</span>
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>复制 HEX</span>
                    </>
                  )}
                </button>
              </div>
              <button className="color-modal-close" onClick={closeExpanded}>
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
