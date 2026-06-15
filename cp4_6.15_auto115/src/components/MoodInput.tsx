import React, { useState } from 'react';
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

export default function MoodInput({ onSubmit }: Props) {
  const [selected, setSelected] = useState<MoodType | null>(null);
  const [text, setText] = useState('');
  const [rippling, setRippling] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selected || rippling) return;
    setRippling(true);
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
      }, 900);
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
    <div className={`mood-input-panel ${rippling ? 'rippling' : ''}`}>
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
      {rippling && (
        <div className="ripple-container">
          <div className="ripple-circle" />
          <div className="ripple-circle delay-1" />
          <div className="ripple-circle delay-2" />
        </div>
      )}
    </div>
  );
}
