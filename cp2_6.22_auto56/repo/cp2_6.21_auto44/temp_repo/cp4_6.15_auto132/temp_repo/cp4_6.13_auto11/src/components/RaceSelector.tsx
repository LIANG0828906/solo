import type { Race } from '@/types/character';
import { RACE_OPTIONS } from '@/types/character';

interface RaceSelectorProps {
  value: Race;
  onChange: (race: Race) => void;
  disabled?: boolean;
}

export default function RaceSelector({
  value,
  onChange,
  disabled = false,
}: RaceSelectorProps) {
  return (
    <div className="control-card">
      <div className="control-title">种族选择</div>
      <div className="option-grid">
        {RACE_OPTIONS.map((opt) => {
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
