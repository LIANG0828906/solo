import { useMemo, useState } from 'react';

export const PRESET_ICONS: string[] = [
  '💧', '🧘', '🏃', '📚', '✍️', '💪', '🛌', '🥗',
  '🧹', '🎯', '🎨', '🎵', '💻', '🧠', '🌱', '😊',
  '🚶', '☕', '🧋', '🍎', '🎹', '📝', '🧮', '🔔',
  '🌞', '🌙', '🔥', '⚡', '🎁', '🧩', '🎬', '🫶',
];

export const PRESET_COLORS: string[] = [
  '#e94560', '#f5c542', '#3fb950', '#58a6ff',
  '#bc8cff', '#ff7b72', '#79c0ff', '#ffa657',
  '#0ea5e9', '#8b5cf6', '#ef4444', '#10b981',
];

export interface AddHabitData {
  name: string;
  icon: string;
  color: string;
  weeklyTarget: number;
}

interface AddHabitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddHabitData) => void;
}

export function AddHabitModal({ open, onClose, onSubmit }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [color, setColor] = useState(PRESET_COLORS[3]);
  const [weeklyTarget, setWeeklyTarget] = useState(5);

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim().slice(0, 30),
      icon,
      color,
      weeklyTarget,
    });
    setName('');
    setIcon(PRESET_ICONS[0]);
    setColor(PRESET_COLORS[3]);
    setWeeklyTarget(5);
  };

  return (
    <div
      className="modal-mask"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-habit-title">
        <div id="add-habit-title" className="modal-title">
          ✨ 添加新习惯
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="habit-name">习惯名称</label>
          <input
            id="habit-name"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：每天喝水 2L"
            maxLength={30}
            autoFocus
          />
        </div>

        <div className="form-row">
          <span className="form-label">选择图标</span>
          <div className="icon-grid" role="radiogroup" aria-label="图标选择">
            {PRESET_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                role="radio"
                aria-checked={icon === ic}
                className={'icon-opt ' + (icon === ic ? 'selected' : '')}
                onClick={() => setIcon(ic)}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <span className="form-label">主题色</span>
          <div className="color-grid" role="radiogroup" aria-label="颜色选择">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                className={'color-opt ' + (color === c ? 'selected' : '')}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`颜色 ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="form-row">
          <span className="form-label">每周目标天数</span>
          <div className="target-row">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                className={'target-btn ' + (weeklyTarget === n ? 'selected' : '')}
                onClick={() => setWeeklyTarget(n)}
              >
                {n === 7 ? '每天' : String(n)}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            确认添加
          </button>
        </div>
      </div>
    </div>
  );
}
