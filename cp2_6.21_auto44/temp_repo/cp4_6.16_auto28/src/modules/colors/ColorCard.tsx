import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePaletteStore } from '@/stores/usePaletteStore';
import { loadPaletteById } from '@/utils/indexedDB';
import type { Palette } from '@/types';
import './ColorCard.css';

interface ColorCardProps {
  colorId: string;
  showFullColors?: boolean;
  onFavoriteToggle?: () => void;
}

const ColorCard: React.FC<ColorCardProps> = ({
  colorId,
  showFullColors = false,
  onFavoriteToggle,
}) => {
  const [palette, setPalette] = useState<Palette | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRipple, setShowRipple] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  const { favorites, toggleFavorite } = usePaletteStore((state) => ({
    favorites: state.favorites,
    toggleFavorite: state.toggleFavorite,
  }));

  useEffect(() => {
    const loadPalette = async () => {
      setLoading(true);
      try {
        const data = await loadPaletteById(colorId);
        setPalette(data || null);
      } catch (error) {
        console.error('加载色卡失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPalette();
  }, [colorId]);

  const isFavorited = favorites.includes(colorId);

  const handleFavoriteClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowRipple(true);
      setPulseAnimation(true);
      setTimeout(() => setShowRipple(false), 600);
      setTimeout(() => setPulseAnimation(false), 300);
      await toggleFavorite(colorId);
      if (onFavoriteToggle) {
        onFavoriteToggle();
      }
    },
    [colorId, toggleFavorite, onFavoriteToggle]
  );

  if (loading) {
    return <div className="color-card skeleton" />;
  }

  if (!palette) {
    return <div className="color-card error">色卡不存在</div>;
  }

  const displayColors = showFullColors
    ? palette.colors
    : palette.colors.slice(0, 3);

  return (
    <Link to={`/palette/${palette.id}`} className="color-card-link">
      <div className="color-card">
        <div className="card-colors">
          {displayColors.map((color, index) => (
            <div
              key={index}
              className="card-color-swatch"
              style={{
                backgroundColor: color,
                flex: showFullColors ? 1 : undefined,
                width: showFullColors ? undefined : '33.33%',
              }}
            />
          ))}
        </div>
        <div className="card-content">
          <h3 className="card-title">{palette.title}</h3>
          {showFullColors && (
            <div className="card-colors-full">
              {palette.colors.map((color, index) => (
                <div
                  key={index}
                  className="color-item-full"
                  style={{ backgroundColor: color }}
                >
                  <span className="color-hex">{color.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
          <div className="card-footer">
            <span className="card-stats">
              ❤️ {palette.favoriteCount} 收藏
            </span>
            <button
              type="button"
              className={`favorite-btn ${isFavorited ? 'favorited' : ''} ${pulseAnimation ? 'pulse' : ''}`}
              onClick={handleFavoriteClick}
              aria-label={isFavorited ? '取消收藏' : '收藏'}
            >
              <svg
                className="heart-icon"
                viewBox="0 0 24 24"
                fill={isFavorited ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {showRipple && <span className="ripple" />}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default React.memo(ColorCard);
