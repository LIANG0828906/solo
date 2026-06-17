import { useMemo } from 'react';
import { useMoodStore } from '../store';
import {
  MOOD_NAMES,
  MOOD_EMOJIS,
  MOOD_COLORS,
  getEntriesByDate,
  getDominantMood,
} from '../data';
import type { MoodType } from '../data';

const MOODS: MoodType[] = ['happy', 'calm', 'irritated', 'sad', 'anxious', 'tired'];

const WEATHER_ICONS: Record<MoodType, string> = {
  happy: '☀️',
  calm: '☁️',
  irritated: '⛈️',
  sad: '🌧️',
  anxious: '☁️',
  tired: '🌙',
};

function MoodPicker() {
  const isOpen = useMoodStore((state) => state.isMoodPickerOpen);
  const setMoodPickerOpen = useMoodStore((state) => state.setMoodPickerOpen);
  const selectMood = useMoodStore((state) => state.selectMood);
  const weekEntries = useMoodStore((state) => state.weekEntries);

  const weekDates = useMemo(() => {
    const dates: string[] = [];
    const dateMap = new Map<string, MoodType>();

    const sortedDates = [...new Set(weekEntries.map((e) => e.date))].sort();
    const firstDate = sortedDates[0];
    if (firstDate) {
      const start = new Date(firstDate);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);

        const dayEntries = getEntriesByDate(weekEntries, dateStr);
        if (dayEntries.length > 0) {
          dateMap.set(dateStr, getDominantMood(dayEntries));
        }
      }
    }

    return { dates, dominantMoods: dateMap };
  }, [weekEntries]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setMoodPickerOpen(false);
    }
  };

  const handleMoodClick = (mood: MoodType) => {
    selectMood(mood);
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[date.getDay()];
  };

  return (
    <div className="mood-picker-overlay" onClick={handleOverlayClick}>
      <div className="mood-picker">
        <h3 className="mood-picker__title">今天心情怎么样？</h3>

        <div className="mood-picker__grid">
          {MOODS.map((mood) => (
            <div key={mood}>
              <button
                className="mood-btn"
                onClick={() => handleMoodClick(mood)}
                style={{
                  background: `linear-gradient(135deg, ${MOOD_COLORS[mood]}33 0%, ${MOOD_COLORS[mood]}11 100%)`,
                }}
              >
                <span>{MOOD_EMOJIS[mood]}</span>
              </button>
              <span className="mood-btn__label">{MOOD_NAMES[mood]}</span>
            </div>
          ))}
        </div>

        <div className="mood-picker__dates">
          {weekDates.dates.map((date) => (
            <div key={date} className="date-item">
              <span className="date-item__icon">
                {weekDates.dominantMoods.get(date)
                  ? WEATHER_ICONS[weekDates.dominantMoods.get(date)!]
                  : '❓'}
              </span>
              <span>周{formatDateShort(date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MoodPicker;
