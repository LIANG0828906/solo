import { EMOTION_MAP } from '@/types';
import type { EmotionType } from '@/types';

interface EmotionPickerProps {
  value: EmotionType;
  onChange: (emotion: EmotionType) => void;
}

export function EmotionPicker({ value, onChange }: EmotionPickerProps) {
  return (
    <div className="emotion-picker">
      {Object.entries(EMOTION_MAP).map(([key, config]) => (
        <button
          key={key}
          type="button"
          className={`emotion-btn ${value === key ? 'active' : ''}`}
          style={{ color: config.color }}
          onClick={() => onChange(value === key ? null : key as EmotionType)}
          title={config.label}
        >
          {config.emoji}
        </button>
      ))}
    </div>
  );
}
