import { useState, useCallback } from 'react';
import type { ColorGroup } from '../types';
import { buildColorFamilies, contrastRatio, formatContrast } from '../utils/colorUtils';

interface ColorGridProps {
  palette: ColorGroup | null;
  loading: boolean;
  onCopy: (hex: string) => void;
}

export default function ColorGrid({ palette, loading, onCopy }: ColorGridProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [animatingKey, setAnimatingKey] = useState<string | null>(null);

  const handleCardClick = useCallback(async (key: string, hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedKey(key);
      setAnimatingKey(key);
      onCopy(hex);
      setTimeout(() => setCopiedKey(null), 800);
      setTimeout(() => setAnimatingKey(null), 300);
    } catch (e) {
      console.error('复制失败:', e);
    }
  }, [onCopy]);

  if (loading) {
    return (
      <div className="color-grid">
        {Array.from({ length: 6 }).map((_, fi) => (
          <div key={fi} className="color-family">
            <div className="skeleton-title" />
            <div className="card-row">
              {Array.from({ length: 4 }).map((_, ci) => (
                <div key={ci} className="skeleton-card" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!palette) {
    return null;
  }

  const families = buildColorFamilies(palette);

  return (
    <div className="color-grid">
      {families.map((family) => (
        <div key={family.name} className="color-family">
          <div className="family-title">{family.name}</div>
          <div className="card-row">
            {family.cards.map((card) => {
              const isOn = card.key.startsWith('on');
              const pairColor = card.onColor || '#000';
              const ratio = contrastRatio(card.color, pairColor);
              const lowContrast = ratio < 3 && isOn;
              const isCopied = copiedKey === card.key;
              const isAnimating = animatingKey === card.key;

              return (
                <div key={card.key} className="card-column">
                  <button
                    type="button"
                    className={`color-card ${isCopied ? 'copied' : ''} ${isAnimating ? 'animate-pop' : ''}`}
                    style={{ backgroundColor: card.color }}
                    onClick={() => handleCardClick(card.key, card.color)}
                    title={`点击复制 ${card.color}`}
                  />
                  <div className="card-label">{card.label}</div>
                  <div className="card-hex">{card.color}</div>
                  {isOn && (
                    <div className={`contrast-label ${lowContrast ? 'low' : ''}`}>
                      {formatContrast(ratio)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
