import type { CharacterClass } from '@/types/character';
import { CLASS_OPTIONS } from '@/types/character';

interface ClassSelectorProps {
  value: CharacterClass;
  onChange: (cls: CharacterClass) => void;
  disabled?: boolean;
}

export default function ClassSelector({
  value,
  onChange,
  disabled = false,
}: ClassSelectorProps) {
  return (
    <div className="control-card">
      <div className="control-title">职业装备</div>
      <div className="option-grid">
        {CLASS_OPTIONS.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              className={`option-btn ${isActive ? 'active' : ''}`}
              onClick={() => onChange(opt.value)}
            >
              <span className="option-emoji">{opt.emoji}</span>
              <span className="option-label">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
