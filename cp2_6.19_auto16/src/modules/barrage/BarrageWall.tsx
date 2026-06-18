import React, { memo, useMemo } from 'react';
import type { BarrageItem, SpeedLevel } from '../../types';
import { SPEED_DURATION } from '../../types';
import { useBarrageStore } from '../../stores/useBarrageStore';

interface BarrageCardProps {
  barrage: BarrageItem;
  targetLang: string;
  isFiltering: boolean;
  keyword: string;
  isTransitioning: boolean;
}

const HeartIcon = ({ filled, bouncing }: { filled: boolean; bouncing: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    className={`heart-icon ${filled ? 'filled' : ''} ${bouncing ? 'bounce' : ''}`}
    fill={filled ? '#ff4757' : 'rgba(255,255,255,0.6)'}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const BarrageCard = memo(function BarrageCard({
  barrage,
  targetLang,
  isFiltering,
  keyword,
  isTransitioning
}: BarrageCardProps) {
  const likeBarrage = useBarrageStore((s) => s.likeBarrage);
  const [bounce, setBounce] = React.useState(false);

  const translatedText = barrage.translations[targetLang as keyof typeof barrage.translations];
  const displayTranslated = translatedText ?? barrage.originalText;

  const matchesKeyword = useMemo(() => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return (
      barrage.originalText.toLowerCase().includes(kw) ||
      (translatedText?.toLowerCase().includes(kw) ?? false)
    );
  }, [keyword, barrage.originalText, translatedText]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!barrage.likedByCurrentUser) {
      setBounce(true);
      window.setTimeout(() => setBounce(false), 600);
    }
    likeBarrage(barrage.id);
  };

  const animationDuration = SPEED_DURATION[barrage.speed as SpeedLevel];

  return (
    <div
      className={`barrage-item ${isFiltering && !matchesKeyword ? 'fading-out' : ''} ${
        isFiltering && matchesKeyword ? 'highlight' : ''
      } ${isTransitioning ? 'lang-transition' : ''}`}
      style={{
        top: `${barrage.top}%`,
        borderColor: barrage.color,
        boxShadow: `0 0 8px ${barrage.color}`,
        animationDuration: `${animationDuration}ms`
      }}
    >
      <div className="barrage-content">
        <div className="barrage-original">{barrage.originalText}</div>
        <div className="barrage-translated" style={{ color: '#4fc3f7' }}>
          {displayTranslated}
        </div>
      </div>
      <button className="barrage-like-btn" onClick={handleLike} aria-label="点赞">
        <HeartIcon filled={barrage.likedByCurrentUser} bouncing={bounce} />
        <span className={`like-count ${barrage.likedByCurrentUser ? 'count-pulse' : ''}`}>
          {barrage.likes}
        </span>
      </button>
    </div>
  );
});

export const BarrageWall = memo(function BarrageWall() {
  const barrages = useBarrageStore((s) => s.barrages);
  const targetLanguage = useBarrageStore((s) => s.settings.targetLanguage);
  const filterKeyword = useBarrageStore((s) => s.settings.filterKeyword);
  const isTransitioning = useBarrageStore((s) => s.isTransitioning);

  const isFiltering = filterKeyword.trim().length > 0;

  return (
    <div className="barrage-wall">
      <div className="video-placeholder" />
      <div className="barrage-container">
        {barrages.map((barrage) => (
          <BarrageCard
            key={barrage.id}
            barrage={barrage}
            targetLang={targetLanguage}
            isFiltering={isFiltering}
            keyword={filterKeyword}
            isTransitioning={isTransitioning}
          />
        ))}
      </div>
    </div>
  );
});
