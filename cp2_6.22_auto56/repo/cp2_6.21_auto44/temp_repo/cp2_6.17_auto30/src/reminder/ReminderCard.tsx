import { useState } from 'react';
import { useStore } from '../store';
import { CARE_TYPE_LABELS } from '../types';
import type { Reminder } from '../types';
import './ReminderCard.css';

interface ReminderCardProps {
  reminder: Reminder;
}

const TYPE_ICONS: Record<string, string> = {
  watering: '💧',
  fertilizing: '🌱',
  repotting: '🪴',
  soilLoosening: '🪨'
};

export function ReminderCard({ reminder }: ReminderCardProps) {
  const plants = useStore(state => state.plants);
  const markReminderComplete = useStore(state => state.markReminderComplete);
  const [isFading, setIsFading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const plant = plants.find(p => p.id === reminder.plantId);

  const getUrgencyColor = () => {
    if (reminder.daysLeft < 0) return '#E74C3C';
    if (reminder.daysLeft <= 1) return '#F39C12';
    return '#27AE60';
  };

  const getDaysText = () => {
    if (reminder.daysLeft < 0) return `已超期 ${Math.abs(reminder.daysLeft)} 天`;
    if (reminder.daysLeft === 0) return '今日到期';
    return `${reminder.daysLeft} 天后`;
  };

  const getProgressPercent = () => {
    const max = 7;
    const current = Math.max(0, max - reminder.daysLeft);
    return Math.min(100, (current / max) * 100);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsFading(true);
    setTimeout(() => {
      markReminderComplete(reminder.id);
    }, 300);
  };

  if (!plant) return null;

  return (
    <div
      className={`reminder-card ${isFading ? 'fading-out' : ''}`}
      style={{ borderLeftColor: getUrgencyColor() }}
    >
      <div
        className="reminder-icon"
        style={{ backgroundColor: getUrgencyColor() + '20' }}
      >
        {TYPE_ICONS[reminder.type]}
      </div>
      <div className="reminder-content">
        <div className="reminder-top-row">
          <span className="reminder-title">
            {CARE_TYPE_LABELS[reminder.type]} - {plant.name}
          </span>
          {reminder.delayedByWeather && (
            <span className="weather-tag">🌧️ 因雨推迟</span>
          )}
        </div>
        <p className="reminder-subtitle">
          {plant.species} · {plant.location || '位置未设置'}
        </p>
        <div className="progress-wrapper">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${getProgressPercent()}%`,
                backgroundColor: getUrgencyColor()
              }}
            />
          </div>
          <span className="days-text" style={{ color: getUrgencyColor() }}>
            {getDaysText()}
          </span>
        </div>
      </div>
      <button
        className="complete-btn"
        onClick={handleComplete}
        disabled={isCompleting}
      >
        {isCompleting ? '完成中...' : '完成'}
      </button>
    </div>
  );
}
