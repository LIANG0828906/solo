import React, { useState, useRef } from 'react';
import { MoodType, MoodRecord, MOOD_META } from '../types';
import { submitMood } from '../api';

const MOODS = [
  MoodType.HAPPY,
  MoodType.CALM,
  MoodType.SAD,
  MoodType.ANGRY,
  MoodType.ANXIOUS,
  MoodType.TIRED,
];

interface Props {
  onSubmit: (record: MoodRecord) => void;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function MoodInput({ onSubmit }: Props) {
  const [selected, setSelected] = useState<MoodType | null>(null);
  const [text, setText] = useState('');
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [rippling, setRippling] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);

  const handleSubmit = async (e: React.MouseEvent) => {
    if (!selected || rippling) return;

    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const id = rippleIdRef.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
    setRippling(true);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 1200);

    try {
      const record = await submitMood({
        userId: 'user1',
        mood: selected,
        text: text || `${MOOD_META[selected].label}的一天`,
        date: new Date().toISOString().split('T')[0],
        intensity: 0.3 + Math.random() * 0.7,
      });
      setTimeout(() => {
        setRippling(false);
        setSubmitted(true);
        onSubmit(record);
      }, 1000);
    } catch {
      setRippling(false);
    }
  };

  const handleReset = () => {
    setSelected(null);
    setText('');
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="mood-input-panel submitted" onClick={handleReset}>
        <div className="submitted-hint">✨ 今日心情已记录，点击重新记录</div>
      </div>
    );
  }

  return (
    <div ref={panelRef} className={`mood-input-panel ${rippling ? 'rippling' : ''}`}>
      <div className="mood-emoji-grid">
        {MOODS.map((mood) => {
          const meta = MOOD_META[mood];
          return (
            <button
              key={mood}
              className={`mood-emoji-btn ${selected === mood ? 'selected' : ''}`}
              onClick={() => setSelected(mood)}
            >
              <span className="emoji-icon">{meta.emoji}</span>
              <span className="emoji-label">{meta.label}</span>
            </button>
          );
        })}
      </div>
      {selected && !rippling && (
        <div className="mood-text-area">
          <textarea
            placeholder="写一两句话记录今天的心情..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={100}
          />
          <button className="submit-btn" onClick={handleSubmit}>
            记录心情
          </button>
        </div>
      )}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="click-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}
    </div>
  );
}
