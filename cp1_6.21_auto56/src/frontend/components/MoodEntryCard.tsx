import { useState } from 'react';
import type { MoodType, DietLabel } from '../../types';
import { MOOD_EMOJIS, MOOD_LABELS, DIET_LABELS } from '../../types';

interface MoodEntryCardProps {
  onSubmit: (data: {
    mood: MoodType;
    intensity: number;
    sleepHours: number;
    exerciseMinutes: number;
    waterCups: number;
    dietLabels: DietLabel[];
  }) => Promise<void>;
}

const moodTypes: MoodType[] = ['happy', 'calm', 'anxious', 'sad', 'angry'];
const dietLabels: DietLabel[] = ['high_sugar', 'high_salt', 'healthy', 'light', 'spicy'];

export default function MoodEntryCard({ onSubmit }: MoodEntryCardProps) {
  const [mood, setMood] = useState<MoodType>('happy');
  const [intensity, setIntensity] = useState(7);
  const [sleepHours, setSleepHours] = useState(7);
  const [exerciseMinutes, setExerciseMinutes] = useState(30);
  const [waterCups, setWaterCups] = useState(6);
  const [selectedDiets, setSelectedDiets] = useState<DietLabel[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleDiet = (label: DietLabel) => {
    setSelectedDiets((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label]
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    setTimeout(async () => {
      try {
        await onSubmit({
          mood,
          intensity,
          sleepHours,
          exerciseMinutes,
          waterCups,
          dietLabels: selectedDiets,
        });
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          setIsSubmitting(false);
        }, 500);
      } catch {
        setIsSubmitting(false);
      }
    }, 150);
  };

  const intensityColor = (() => {
    const ratio = (intensity - 1) / 9;
    const r = Math.round(229 + (67 - 229) * ratio);
    const g = Math.round(57 + (160 - 57) * ratio);
    const b = Math.round(53 + (71 - 53) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  })();

  return (
    <div className={`card mood-entry-card ${isSubmitting && !isSubmitted ? 'submitting' : ''}`}>
      <h2 className="card-title">
        <span className="material-icons">edit_note</span>
        今日情绪记录
      </h2>

      <div className="form-group">
        <label className="form-label">选择情绪</label>
        <div className="emoji-picker">
          {moodTypes.map((type) => (
            <div
              key={type}
              className={`emoji-option ${mood === type ? 'selected' : ''}`}
              onClick={() => setMood(type)}
              title={MOOD_LABELS[type]}
            >
              {MOOD_EMOJIS[type]}
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginTop: '4px' }}>
          {MOOD_LABELS[mood]}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">情绪强度</label>
        <input
          type="range"
          min="1"
          max="10"
          value={intensity}
          onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
        />
        <div className="intensity-display" style={{ color: intensityColor }}>
          {intensity} / 10
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          <span className="material-icons" style={{ fontSize: '18px', verticalAlign: 'middle' }}>
            bed
          </span>{' '}
          睡眠时长（小时）
        </label>
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={sleepHours}
          onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          <span className="material-icons" style={{ fontSize: '18px', verticalAlign: 'middle' }}>
            directions_run
          </span>{' '}
          运动时长（分钟）
        </label>
        <input
          type="number"
          min="0"
          max="300"
          step="5"
          value={exerciseMinutes}
          onChange={(e) => setExerciseMinutes(parseInt(e.target.value, 10) || 0)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          <span className="material-icons" style={{ fontSize: '18px', verticalAlign: 'middle' }}>
            water_drop
          </span>{' '}
          饮水量（杯）
        </label>
        <input
          type="range"
          min="0"
          max="15"
          value={waterCups}
          onChange={(e) => setWaterCups(parseInt(e.target.value, 10))}
        />
        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
          {waterCups} 杯
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          <span className="material-icons" style={{ fontSize: '18px', verticalAlign: 'middle' }}>
            restaurant
          </span>{' '}
          饮食标签
        </label>
        <div className="diet-tags">
          {dietLabels.map((label) => (
            <span
              key={label}
              className={`diet-tag ${selectedDiets.includes(label) ? 'active' : ''}`}
              onClick={() => toggleDiet(label)}
            >
              {DIET_LABELS[label]}
            </span>
          ))}
        </div>
      </div>

      <button
        className={`btn submit-btn ${isSubmitted ? 'btn-success' : 'btn-primary'}`}
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitted ? (
          <>
            <span className="material-icons">check</span>
            已保存
          </>
        ) : (
          <>
            <span className="material-icons">send</span>
            提交记录
          </>
        )}
      </button>
    </div>
  );
}
