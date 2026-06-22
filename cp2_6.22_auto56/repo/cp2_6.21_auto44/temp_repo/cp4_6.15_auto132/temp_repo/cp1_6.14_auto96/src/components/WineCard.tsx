import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassWater, Handshake } from 'lucide-react';
import type { Wine, TastingRecord } from '@/types';
import { REGION_CONFIG } from '@/types';
import type { RegionKey } from '@/types';
import './WineCard.css';

interface WineCardProps {
  wine: Wine;
  lastTasting?: TastingRecord;
  index?: number;
}

export default function WineCard({ wine, lastTasting, index = 0 }: WineCardProps) {
  const [flipped, setFlipped] = useState(false);
  const navigate = useNavigate();

  const handleTastingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFlipped(!flipped);
  };

  const handleExchangeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCardClick = () => {
    if (!flipped) {
      navigate(`/bottle/${wine.id}`);
    }
  };

  const regionConfig = REGION_CONFIG[wine.region as RegionKey] || REGION_CONFIG.other;

  return (
    <div
      className="wine-card-container"
      onClick={handleCardClick}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className={`wine-card ${flipped ? 'flipped' : ''}`}>
        <div className="wine-card-front">
          <div className="card-header">
            <div
              className="logo-placeholder"
              style={{ background: `linear-gradient(135deg, ${wine.logoColor}, ${wine.logoColor}88)` }}
            />
            <div className="star-rating">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={`star ${i < Math.round(wine.rating) ? 'filled' : ''}`}>
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="card-body">
            <h3 className="wine-name">{wine.name}</h3>
            <p className="wine-year">{wine.year} · {wine.variety}</p>
          </div>
          <div className="card-region">
            <span
              className="region-tag"
              style={{ background: regionConfig.color }}
            >
              {wine.regionLabel}
            </span>
          </div>
          <div className="card-actions">
            <button className="action-btn" onClick={handleTastingClick} title="品鉴记录">
              <GlassWater size={18} />
            </button>
            <button className="action-btn" onClick={handleExchangeClick} title="交换转让">
              <Handshake size={18} />
            </button>
          </div>
        </div>
        <div className="wine-card-back">
          {lastTasting ? (
            <div className="tasting-summary">
              <p className="tasting-date">{lastTasting.date}</p>
              <p className="tasting-notes">
                {lastTasting.notes.length > 60
                  ? lastTasting.notes.slice(0, 60) + '…'
                  : lastTasting.notes}
              </p>
              <div className="tasting-mini-rating">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`star ${i < lastTasting.rating ? 'filled' : ''}`}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="no-tasting">暂无品鉴记录</p>
          )}
          <button className="back-btn" onClick={(e) => { e.stopPropagation(); setFlipped(false); }}>
            返回
          </button>
        </div>
      </div>
    </div>
  );
}
