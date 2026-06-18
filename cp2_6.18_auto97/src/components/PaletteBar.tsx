import React, { useCallback, useState } from 'react';
import { useStore } from '../store';
import { PaletteColor } from '../utils/colorUtils';

interface PaletteItemProps {
  color: PaletteColor;
  index: number;
  onToggleLock: (index: number) => void;
  onCopy: (hex: string) => void;
}

const PaletteItem: React.FC<PaletteItemProps> = React.memo(({ color, index, onToggleLock, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await onCopy(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [color.hex, onCopy]);

  const handleLock = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock(index);
  }, [index, onToggleLock]);

  const getTextColor = (lightness: number) => {
    return lightness > 50 ? '#1A1A1A' : '#FFFFFF';
  };

  return (
    <div
      className="palette-item"
      style={{ backgroundColor: color.hex }}
      onClick={handleCopy}
    >
      <span className="palette-hex" style={{ color: getTextColor(color.hsl.l) }}>
        {copied ? '已复制!' : color.hex}
      </span>
      <button
        className={`lock-btn ${color.locked ? 'locked' : ''}`}
        onClick={handleLock}
        aria-label={color.locked ? '解锁色阶' : '锁定色阶'}
      >
        {color.locked ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
          </svg>
        )}
      </button>
    </div>
  );
});

PaletteItem.displayName = 'PaletteItem';

const PaletteBar: React.FC = React.memo(() => {
  const { palette, toggleLock, copyColor } = useStore();

  const handleToggleLock = useCallback((index: number) => {
    toggleLock(index);
  }, [toggleLock]);

  const handleCopy = useCallback(async (hex: string) => {
    await copyColor(hex);
  }, [copyColor]);

  return (
    <div className="palette-bar">
      <h3 className="palette-title">色板</h3>
      <div className="palette-list">
        {palette.map((color, index) => (
          <PaletteItem
            key={color.hex + index}
            color={color}
            index={index}
            onToggleLock={handleToggleLock}
            onCopy={handleCopy}
          />
        ))}
      </div>
      <p className="palette-hint">点击色块复制十六进制值</p>
    </div>
  );
});

PaletteBar.displayName = 'PaletteBar';

export default PaletteBar;
