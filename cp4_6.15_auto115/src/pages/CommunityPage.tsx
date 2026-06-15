import React, { useState, useEffect, useRef } from 'react';
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

const rotations = [0, 1, 2, 3, 4, 5].map(() => (Math.random() * 6 - 3).toFixed(1));

const PAPER_COLORS = ['#FFF9C4', '#FFCCBC', '#C8E6C9', '#B3E5FC', '#F3E5F5', '#FFE0B2'];

export default function CommunityPage() {
  const [communityMoods, setCommunityMoods] = useState<CommunityMood[]>([]);
  const [flowers, setFlowers] = useState<FlowerAnim[]>([]);
  const [flowerCount, setFlowerCount] = useState(0);
  const flowerIdRef = useRef(0);
  const wallRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCommunity().then((data) => setCommunityMoods(data as CommunityMood[]));
  }, []);

  const handleSendFlower = (e: React.MouseEvent, index: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const wallRect = wallRef.current?.getBoundingClientRect();
    if (!wallRect) return;
    const id = flowerIdRef.current++;
    setFlowers((prev) => [
      ...prev,
      { id, startX: rect.left - wallRect.left, startY: rect.top - wallRect.top },
    ]);
    setFlowerCount((c) => c + 1);
    setTimeout(() => {
      setFlowers((prev) => prev.filter((f) => f.id !== id));
    }, 1200);
  };

  return (
    <div className="community-page">
      <h2 className="page-title">心情花园</h2>
      <div className="flower-basket">
        🧺 <span className="basket-count">{flowerCount}</span>
      </div>
      <div className="cork-wall" ref={wallRef}>
        {communityMoods.map((mood, i) => {
          const meta = MOOD_META[mood.mood as keyof typeof MOOD_META];
          const rotation = rotations[i % rotations.length];
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
            {[...Array(5)].map((_, pi) => (
              <span
                key={pi}
                className="particle"
                style={{
                  left: Math.random() * 20 - 10,
                  top: Math.random() * 20 - 10,
                  animationDelay: `${pi * 0.1}s`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
