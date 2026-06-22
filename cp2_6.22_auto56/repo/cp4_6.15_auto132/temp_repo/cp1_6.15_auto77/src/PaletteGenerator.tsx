import React, { useState, useCallback } from 'react';
import type { Palette } from './utils/types';
import { copyToClipboard, getContrastColor, adjustBrightness } from './utils/colorUtils';
import { Check, Copy } from 'lucide-react';

interface PaletteGeneratorProps {
  palettes: Palette[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const PaletteGenerator: React.FC<PaletteGeneratorProps> = ({ palettes, selectedIndex, onSelect }) => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopy = useCallback(async (color: string, key: string) => {
    const success = await copyToClipboard(color);
    if (success) {
      setCopiedIndex(key);
      setTimeout(() => {
        setCopiedIndex((prev) => (prev === key ? null : prev));
      }, 1500);
    }
  }, []);

  return (
    <div className="palette-generator">
      <style>{`
        .palette-generator {
          padding: 24px;
          background: var(--bg-card);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-soft);
          transition: all var(--transition-normal);
        }
        .palette-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 20px;
          color: var(--text-primary);
        }
        .palette-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .palette-card {
          border-radius: var(--radius-card);
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all var(--transition-normal);
          background: rgba(255,255,255,0.03);
        }
        .palette-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-hover);
        }
        .palette-card.selected {
          border-color: rgba(255,255,255,0.3);
        }
        .palette-card.selected .palette-name-row {
          background: rgba(255,255,255,0.08);
        }
        .palette-colors {
          display: flex;
          height: 72px;
        }
        .color-swatch {
          flex: 1;
          position: relative;
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          align-items: flex-end;
          padding: 8px;
          overflow: hidden;
        }
        .color-swatch:hover {
          flex: 1.3;
        }
        .color-swatch:first-child {
          border-top-left-radius: 10px;
        }
        .color-swatch:last-child {
          border-top-right-radius: 10px;
        }
        .color-swatch .color-hex-text {
          font-size: 11px;
          font-family: 'Courier New', monospace;
          font-weight: 600;
          opacity: 0;
          transform: translateY(10px);
          transition: all var(--transition-fast);
          letter-spacing: 0.5px;
        }
        .color-swatch:hover .color-hex-text {
          opacity: 1;
          transform: translateY(0);
        }
        .copy-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(0,0,0,0.6);
          font-size: 11px;
          font-weight: 500;
          color: #fff;
          animation: fadeIn 0.2s ease;
          pointer-events: none;
        }
        .palette-name-row {
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.03);
          transition: background var(--transition-fast);
        }
        .palette-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .palette-count {
          font-size: 11px;
          color: var(--text-secondary);
        }
      `}</style>
      <div className="palette-title">配色方案</div>
      <div className="palette-list">
        {palettes.map((palette, idx) => (
          <div
            key={palette.type}
            className={`palette-card ${idx === selectedIndex ? 'selected' : ''}`}
            onClick={() => onSelect(idx)}
          >
            <div className="palette-colors">
              {palette.colors.map((color, cIdx) => {
              const copyKey = `${palette.type}-${cIdx}`;
              const textColor = getContrastColor(color);
              return (
                <div
                  key={cIdx}
                  className="color-swatch"
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${adjustBrightness(color, -8)})`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(color, copyKey);
                  }}
                >
                  <span className="color-hex-text" style={{ color: textColor }}>{color}</span>
                  {copiedIndex === copyKey && (
                    <div className="copy-indicator">
                      <Check size={12} />
                      <span>已复制</span>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
            <div className="palette-name-row">
              <span className="palette-name">{palette.name}</span>
              <span className="palette-count">5 色</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(PaletteGenerator);
