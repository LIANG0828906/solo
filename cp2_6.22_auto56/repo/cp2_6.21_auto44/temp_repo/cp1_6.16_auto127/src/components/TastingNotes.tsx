import React, { useState } from 'react';
import { useTeaStore } from '../store/teaStore';
import { generateThumbnailFromFlavor } from '../canvas/FlavorRadar';
import { FLAVOR_DIMENSIONS } from '../utils/flavorProfile';

interface RippleProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const Ripple: React.FC<RippleProps> = ({ x, y, onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(onComplete, 400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <span
      className="ripple"
      style={{
        left: x,
        top: y
      }}
    />
  );
};

const TastingNotes: React.FC = () => {
  const { rating, notes, setRating, setNotes, saveRecord, getCurrentFlavorProfile, getCurrentTea, temperature, brewTime } = useTeaStore();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);

    const tea = getCurrentTea();
    if (tea) {
      const flavorProfile = getCurrentFlavorProfile();
      const thumbnail = generateThumbnailFromFlavor(
        tea.defaultFlavor,
        flavorProfile,
        tea.color,
        temperature,
        brewTime,
        300
      );
      saveRecord(thumbnail);
    }
  };

  const removeRipple = (id: number) => {
    setRipples(prev => prev.filter(r => r.id !== id));
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="tasting-notes">
      <h3 className="notes-title">品鉴笔记</h3>

      <div className="rating-section">
        <label className="rating-label">主观评分</label>
        <div className="star-rating">
          {stars.map(star => (
            <button
              key={star}
              className={`star-btn ${star <= rating ? 'active' : ''}`}
              onClick={() => setRating(star === rating ? 0 : star)}
              aria-label={`${star}星`}
            >
              <svg
                viewBox="0 0 24 24"
                fill={star <= rating ? '#FFD700' : '#E0E0E0'}
                className="star-icon"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="notes-text-section">
        <label className="notes-label">品鉴备注</label>
        <textarea
          className="notes-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="记录您的品鉴感受... 支持emoji ✨🍵"
          rows={4}
        />
      </div>

      <button
        className="save-btn"
        onClick={handleSave}
      >
        {ripples.map(ripple => (
          <Ripple
            key={ripple.id}
            x={ripple.x}
            y={ripple.y}
            onComplete={() => removeRipple(ripple.id)}
          />
        ))}
        保存配方
      </button>
    </div>
  );
};

export default TastingNotes;
