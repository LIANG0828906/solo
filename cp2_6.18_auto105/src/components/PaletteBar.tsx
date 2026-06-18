import React, { useState } from 'react';
import { usePaletteStore } from '../store';

export const PaletteBar: React.FC = () => {
  const { palette, locked, toggleLock } = usePaletteStore();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (color: string, index: number) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  };

  const handleLockToggle = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    toggleLock(index);
  };

  const getContrastColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1A1A1A' : '#FFFFFF';
  };

  return (
    <div className="palette-bar">
      <h3 className="palette-title">色板</h3>
      <div className="palette-container">
        {palette.map((color, index) => (
          <div
            key={index}
            className="swatch-wrapper"
            onClick={() => handleCopy(color, index)}
          >
            <div
              className="swatch"
              style={{
                backgroundColor: color,
                color: getContrastColor(color),
              }}
            >
              <span className="swatch-label">
                {copiedIndex === index ? '已复制!' : color}
              </span>
              <button
                className={`lock-btn ${locked[index] ? 'locked' : ''}`}
                onClick={(e) => handleLockToggle(e, index)}
                title={locked[index] ? '取消锁定' : '锁定此色阶'}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill={locked[index] ? '#FFD700' : 'currentColor'}
                >
                  {locked[index] ? (
                    <path d="M12 1C9.24 1 7 3.24 7 6v4H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V12c0-1.1-.9-2-2-2h-1V6c0-2.76-2.24-5-5-5zm0 10c.83 0 1.5.67 1.5 1.5S12.83 14 12 14s-1.5-.67-1.5-1.5S11.17 11 12 11zm3-5H9V6c0-1.66 1.34-3 3-3s3 1.34 3 3v0z" />
                  ) : (
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="palette-hint">点击色块复制颜色，点击锁图标锁定色阶</p>
      <style>{`
        .palette-bar {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .palette-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: inherit;
        }
        .palette-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .swatch-wrapper {
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .swatch-wrapper:hover {
          transform: scale(1.02);
        }
        .swatch-wrapper:hover .swatch {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        .swatch {
          width: 100%;
          height: 48px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          box-sizing: border-box;
          position: relative;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s ease;
          user-select: none;
        }
        .swatch-label {
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .lock-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
          color: rgba(128, 128, 128, 0.6);
          opacity: 0;
          transition: opacity 0.2s ease, background-color 0.2s ease,
            color 0.2s ease, transform 0.2s ease;
        }
        .swatch:hover .lock-btn {
          opacity: 1;
        }
        .lock-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }
        .lock-btn.locked {
          opacity: 1;
          color: #FFD700;
        }
        .lock-btn.locked:hover {
          transform: scale(1.1);
        }
        .palette-hint {
          font-size: 12px;
          color: #999;
          margin: 0;
          text-align: center;
        }

        @media (max-width: 768px) {
          .palette-container {
            flex-direction: row;
            flex-wrap: wrap;
          }
          .swatch-wrapper {
            flex: 1;
            min-width: 60px;
          }
          .swatch {
            height: 56px;
            padding: 0 8px;
            justify-content: center;
          }
          .swatch-label {
            font-size: 11px;
          }
          .lock-btn {
            position: absolute;
            top: 4px;
            right: 4px;
          }
        }
      `}</style>
    </div>
  );
};
