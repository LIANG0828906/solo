import React, { useState } from 'react';
import type { ColorSwatch } from '../types';
import styles from './ColorPaletteBar.module.css';

interface ColorPaletteBarProps {
  swatches: ColorSwatch[];
  onRemoveSwatch: (id: string) => void;
}

export const ColorPaletteBar: React.FC<ColorPaletteBarProps> = ({
  swatches,
  onRemoveSwatch,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex.toUpperCase());
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 1500);
    } catch (e) {
      console.error('Failed to copy hex code');
    }
  };

  return (
    <div className={styles.paletteBar}>
      <div className={styles.label}>配色板</div>
      <div className={styles.swatchesContainer}>
        {swatches.map((swatch, index) => (
          <div
            key={swatch.id}
            className={styles.swatchWrapper}
            style={{
              animationDelay: `${index * 0.05}s`,
            }}
          >
            <button
              className={`${styles.swatch} ${
                copiedHex === swatch.hex ? styles.copied : ''
              }`}
              style={{ backgroundColor: swatch.hex }}
              onClick={() => handleCopyHex(swatch.hex)}
              onContextMenu={(e) => {
                e.preventDefault();
                onRemoveSwatch(swatch.id);
              }}
              title={`${swatch.hex.toUpperCase()} - 点击复制，右键删除`}
            >
              {copiedHex === swatch.hex && (
                <span className={styles.tooltip}>已复制!</span>
              )}
            </button>
            <div className={styles.hexLabel}>
              {swatch.hex.toUpperCase().slice(1)}
            </div>
          </div>
        ))}
        {swatches.length === 0 && (
          <div className={styles.emptyState}>
            点击画布上的图片提取颜色
          </div>
        )}
      </div>
    </div>
  );
};
