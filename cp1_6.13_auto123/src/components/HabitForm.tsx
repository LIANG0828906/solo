import { useState } from 'react';
import type { Habit } from '../types';
import { ICONS, COLORS, TIME_PERIODS } from '../utils/constants';

interface HabitFormProps {
  onSubmit: (habit: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'badges' | 'checkins'>) => void;
  onClose: () => void;
}

function HabitForm({ onSubmit, onClose }: HabitFormProps) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState(7);
  const [timePeriod, setTimePeriod] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime');
  const [reminderTime, setReminderTime] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      frequency: Math.max(1, Math.min(7, frequency)),
      timePeriod,
      reminderTime: reminderTime || undefined,
      color: selectedColor,
      icon: selectedIcon,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>创建新习惯</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>习惯名称</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="如：每天阅读30分钟"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>每周频率：{frequency} 次/周</label>
            <input
              type="range"
              min="1"
              max="7"
              value={frequency}
              onChange={e => setFrequency(Number(e.target.value))}
              className="slider"
            />
          </div>

          <div className="form-group">
            <label>时间段</label>
            <div className="segmented-control">
              {TIME_PERIODS.map(tp => (
                <button
                  key={tp.value}
                  type="button"
                  className={`segment-btn ${timePeriod === tp.value ? 'active' : ''}`}
                  onClick={() => setTimePeriod(tp.value as typeof timePeriod)}
                  style={timePeriod === tp.value ? { backgroundColor: selectedColor, borderColor: selectedColor } : {}}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>提醒时间（可选）</label>
            <input
              type="time"
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>颜色标签</label>
            <div className="color-grid">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  aria-label={`选择颜色 ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>图标</label>
            <div className="icon-grid">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                  onClick={() => setSelectedIcon(icon)}
                  style={selectedIcon === icon ? { borderColor: selectedColor, backgroundColor: `${selectedColor}22` } : {}}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary" style={{ backgroundColor: selectedColor }}>
              创建习惯
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HabitForm;
