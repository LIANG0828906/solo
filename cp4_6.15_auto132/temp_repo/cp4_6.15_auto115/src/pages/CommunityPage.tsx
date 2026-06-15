import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MoodRecord, MOOD_META } from '../types';
import { getCommunity } from '../api';

interface FlowerAnim {
  id: number;
  startX: number;
  startY: number;
}

interface CommunityMood extends MoodRecord {
  userName: string;
  userAvatar: string;
}

const PAPER_COLORS = ['#FFF9C4', '#FFCCBC', '#C8E6C9', '#B3E5FC', '#F3E5F5', '#FFE0B2', '#FCE4EC', '#E8F5E9'];

export default function CommunityPage() {
  const [communityMoods, setCommunityMoods] = useState<CommunityMood[]>([]);
  const [flowers, setFlowers] = useState<FlowerAnim[]>([]);
  const [flowerCount, setFlowerCount] = useState(0);
  const [basketAnim, setBasketAnim] = useState(false);
  const flowerIdRef = useRef(0);
  const wallRef = useRef<HTMLDivElement>(null);

  const rotations = useMemo(
    () => communityMoods.map(() => (Math.random() * 6 - 3).toFixed(1)),
    [communityMoods]
  );

  useEffect(() => {
    getCommunity().then((data) => setCommunityMoods(data as CommunityMood[]));
  }, []);

  const handleSendFlower = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const wallRect = wallRef.current?.getBoundingClientRect();
    if (!wallRect) return;
    const id = flowerIdRef.current++;
    setFlowers((prev) => [
      ...prev,
      { id, startX: rect.left - wallRect.left + rect.width / 2, startY: rect.top - wallRect.top },
    ]);
    setFlowerCount((c) => c + 1);
    setBasketAnim(true);
    setTimeout(() => setBasketAnim(false), 600);
    setTimeout(() => {
      setFlowers((prev) => prev.filter((f) => f.id !== id));
    }, 1400);
  };

  return (
    <div className="community-page">
      <h2 className="page-title">心情花园</h2>
      <div className={`flower-basket ${basketAnim ? 'flower-arrived' : ''}`}>
        🧺 <span className="basket-count">{flowerCount}</span>
      </div>
      <div className="cork-wall" ref={wallRef}>
        {communityMoods.map((mood, i) => {
          const meta = MOOD_META[mood.mood as keyof typeof MOOD_META];
          const rotation = rotations[i];
          const paperColor = PAPER_COLORS[i % PAPER_COLORS.length];
          return (
            <div
              key={mood.id}
              className="note-card"
              style={{
                transform: `rotate(${rotation}deg)`,
                background: paperColor,
              }}
            >
              <div className="note-header">
                <span className="note-avatar">{mood.userAvatar}</span>
                <span className="note-name">{mood.userName}</span>
                <span className="note-date">{mood.date.slice(5)}</span>
              </div>
              <div className="note-emoji">{meta?.emoji}</div>
              <div className="note-text">{mood.text}</div>
              <div className="note-weather">
                {meta?.weatherIcon} {meta?.weather}
              </div>
              <button
                className="send-flower-btn"
                onClick={(e) => handleSendFlower(e, i)}
              >
                🌸 送朵小花
              </button>
            </div>
          );
        })}
        {flowers.map((flower) => (
          <div
            key={flower.id}
            className="flying-flower"
            style={{
              left: flower.startX,
              top: flower.startY,
            }}
          >
            🌸
            {[...Array(8)].map((_, pi) => (
              <span
                key={pi}
                className="particle"
                style={{
                  '--px': `${(Math.random() * 60 - 30)}px`,
                  '--py': `${(Math.random() * 60 - 30)}px`,
                  animationDelay: `${pi * 0.08}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
