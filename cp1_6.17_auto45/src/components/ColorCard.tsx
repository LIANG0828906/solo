import { useState, useCallback } from 'react';
import type { ColorItem, SimulationType } from '@/types';
import { simulateColorBlindness } from '@/utils/colorUtils';
import { usePaletteStore } from '@/stores/usePaletteStore';
import styles from './ColorCard.module.css';

interface ColorCardProps {
  color: ColorItem;
  simulation?: SimulationType;
  onCopy?: (hex: string) => void;
}

export default function ColorCard({ color, simulation = 'normal', onCopy }: ColorCardProps) {
  const [copied, setCopied] = useState(false);
  const selectedColorId = usePaletteStore((s) => s.selectedColorId);
  const secondSelectedColorId = usePaletteStore((s) => s.secondSelectedColorId);
  const selectColor = usePaletteStore((s) => s.selectColor);
  const removeColor = usePaletteStore((s) => s.removeColor);

  const displayHex = simulation === 'normal' ? color.hex : simulateColorBlindness(color.hex, simulation);
  const isSelected = selectedColorId === color.id || secondSelectedColorId === color.id;

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) {
      onCopy(color.hex);
    }
    navigator.clipboard.writeText(color.hex).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 500);
  }, [color.hex, onCopy]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    removeColor(color.id);
  }, [color.id, removeColor]);

  const handleSelect = useCallback(() => {
    selectColor(color.id);
  }, [color.id, selectColor]);

  const isLight = (() => {
    const [r, g, b] = [parseInt(displayHex.slice(1, 3), 16), parseInt(displayHex.slice(3, 5), 16), parseInt(displayHex.slice(5, 7), 16)];
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  })();

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={handleSelect}
    >
      <div
        className={styles.colorBlock}
        style={{ backgroundColor: displayHex }}
      >
        {isSelected && (
          <div className={styles.selectedRing} />
        )}
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          title="删除颜色"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isLight ? '#424242' : '#FFFFFF'} strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{color.name}</span>
        <span className={styles.hex}>{displayHex.toUpperCase()}</span>
        <span className={styles.role}>{color.role}</span>
      </div>
      <button
        className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
        onClick={handleCopy}
        title="复制色值"
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}
