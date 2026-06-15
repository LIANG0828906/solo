import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useHabitStore, BadgeLevel, Frequency } from '../../store';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

const EMOJI_OPTIONS = ['💪', '📚', '🏃', '🧘', '💧', '🍎', '😴', '✍️', '🎯', '⭐', '🔥', '💡'];

const PARTICLE_COLORS = ['#e94560', '#0f3460', '#4ade80', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa'];

const getBadgeColor = (level: BadgeLevel | null): string => {
  switch (level) {
    case 'gold':
      return '#fbbf24';
    case 'silver':
      return '#94a3b8';
    case 'bronze':
      return '#cd7f32';
    default:
      return 'rgba(255, 255, 255, 0.3)';
  }
};

const getBadgeLabel = (level: BadgeLevel | null): string => {
  switch (level) {
    case 'gold':
      return '金牌';
    case 'silver':
      return '银牌';
    case 'bronze':
      return '铜牌';
    default:
      return '无徽章';
  }
};

const HabitsPanel: React.FC = () => {
  const habits = useHabitStore((state) => state.habits);
  const checkins = useHabitStore((state) => state.checkins);
  const badges = useHabitStore((state) => state.badges);
  const toggleCheckin = useHabitStore((state) => state.toggleCheckin);
  const getStreakDays = useHabitStore((state) => state.getStreakDays);
  const addHabit = useHabitStore((state) => state.addHabit);
  const removeHabit = useHabitStore((state) => state.removeHabit);

  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('💪');
  const [newHabitFrequency, setNewHabitFrequency] = useState<Frequency>('daily');
  const [newHabitReminder, setNewHabitReminder] = useState('');
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);
  const animationFrameRef = useRef<number>();

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const todayFormatted = useMemo(() => format(new Date(), 'M月d日 EEEE', { locale: zhCN }), []);
  const todayCheckins = checkins[today] || [];

  const getHabitBadge = useCallback((habitId: string): BadgeLevel | null => {
    const badge = badges.find((b) => b.habitId === habitId);
    return badge ? badge.level : null;
  }, [badges]);

  const isCheckedToday = useCallback((habitId: string): boolean => {
    return todayCheckins.includes(habitId);
  }, [todayCheckins]);

  const triggerParticles = useCallback((clientX: number, clientY: number) => {
    const newParticles: Particle[] = [];
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: particleIdRef.current++,
        x: clientX,
        y: clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: 4 + Math.random() * 6,
        life: 1,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;

    const animate = () => {
      setParticles((prev) => {
        const updated = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1,
            life: p.life - 0.02,
          }))
          .filter((p) => p.life > 0);

        if (updated.length > 0) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }

        return updated;
      });
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particles.length]);

  const handleCheckin = useCallback((habitId: string, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    if (!isCheckedToday(habitId)) {
      setFlippedCards((prev) => new Set(prev).add(habitId));
      triggerParticles(centerX, centerY);

      setTimeout(() => {
        setFlippedCards((prev) => {
          const next = new Set(prev);
          next.delete(habitId);
          return next;
        });
      }, 1200);
    }

    toggleCheckin(habitId, today);
  }, [isCheckedToday, toggleCheckin, today, triggerParticles]);

  const handleAddHabit = useCallback(() => {
    if (!newHabitName.trim()) return;
    if (habits.length >= 5) return;

    addHabit({
      name: newHabitName.trim(),
      emoji: newHabitEmoji,
      frequency: newHabitFrequency,
      reminder: newHabitReminder.trim(),
    });

    setNewHabitName('');
    setNewHabitEmoji('💪');
    setNewHabitFrequency('daily');
    setNewHabitReminder('');
    setShowAddForm(false);
  }, [newHabitName, newHabitEmoji, newHabitFrequency, newHabitReminder, habits.length, addHabit]);

  const handleRemoveHabit = useCallback((habitId: string) => {
    if (window.confirm('确定要删除这个习惯吗？')) {
      removeHabit(habitId);
    }
  }, [removeHabit]);

  const maxHabitsReached = habits.length >= 5;

  return (
    <div className="habits-panel">
      <div className="panel-header">
        <div className="panel-title-section">
          <h2 className="panel-title">今日习惯</h2>
          <p className="panel-date">{todayFormatted}</p>
        </div>
        <button
          className={`add-habit-btn ${maxHabitsReached ? 'disabled' : ''}`}
          onClick={() => !maxHabitsReached && setShowAddForm(true)}
          disabled={maxHabitsReached}
        >
          <span className="add-icon">+</span>
          添加习惯
        </button>
      </div>

      {showAddForm && (
        <div className="add-form-overlay" onClick={() => setShowAddForm(false)}>
          <div className="add-form-modal glass animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="form-title">添加新习惯</h3>
            <p className="form-hint">最多添加 5 个习惯 ({habits.length}/5)</p>

            <div className="form-group">
              <label className="form-label">习惯名称</label>
              <input
                type="text"
                className="form-input"
                placeholder="例如：每天喝水"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label className="form-label">选择图标</label>
              <div className="emoji-picker">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    className={`emoji-option ${newHabitEmoji === emoji ? 'selected' : ''}`}
                    onClick={() => setNewHabitEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">频率</label>
              <div className="frequency-options">
                <button
                  className={`frequency-btn ${newHabitFrequency === 'daily' ? 'active' : ''}`}
                  onClick={() => setNewHabitFrequency('daily')}
                >
                  每日
                </button>
                <button
                  className={`frequency-btn ${newHabitFrequency === 'weekly' ? 'active' : ''}`}
                  onClick={() => setNewHabitFrequency('weekly')}
                >
                  每周
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">提醒语</label>
              <input
                type="text"
                className="form-input"
                placeholder="例如：坚持就是胜利！"
                value={newHabitReminder}
                onChange={(e) => setNewHabitReminder(e.target.value)}
                maxLength={30}
              />
            </div>

            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setShowAddForm(false)}>
                取消
              </button>
              <button
                className="btn-submit"
                onClick={handleAddHabit}
                disabled={!newHabitName.trim()}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon">🌱</div>
          <h3 className="empty-title">还没有习惯</h3>
          <p className="empty-text">点击上方"添加习惯"按钮，开始你的第一个微习惯吧！</p>
        </div>
      ) : (
        <div className="cards-grid">
          {habits.map((habit) => {
            const checked = isCheckedToday(habit.id);
            const streak = getStreakDays(habit.id);
            const badgeLevel = getHabitBadge(habit.id);
            const isFlipped = flippedCards.has(habit.id);

            return (
              <div
                key={habit.id}
                className={`flip-container ${isFlipped ? 'flipped' : ''}`}
              >
                <div className="flip-inner">
                  <div className="flip-front">
                    <div className="habit-card glass hover-lift">
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveHabit(habit.id);
                        }}
                      >
                        ×
                      </button>

                      <div className="habit-emoji">{habit.emoji}</div>
                      <h3 className="habit-name">{habit.name}</h3>
                      <p className="habit-reminder">{habit.reminder || '继续加油！'}</p>

                      <div className="habit-stats">
                        <div className="stat-item">
                          <span className="stat-value">{streak}</span>
                          <span className="stat-label">连续天数</span>
                        </div>
                        <div className="stat-item">
                          <span
                            className="badge-indicator"
                            style={{ backgroundColor: getBadgeColor(badgeLevel) }}
                          />
                          <span className="stat-label">{getBadgeLabel(badgeLevel)}</span>
                        </div>
                      </div>

                      <button
                        className={`checkin-btn ${checked ? 'checked' : ''}`}
                        onClick={(e) => handleCheckin(habit.id, e)}
                      >
                        {checked ? (
                          <span className="check-icon animate-scaleIn">✓</span>
                        ) : (
                          <span className="check-circle" />
                        )}
                        <span className="check-text">
                          {checked ? '已完成' : '打卡'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flip-back">
                    <div className="habit-card habit-card-back glass">
                      <div className="checkin-success">
                        <div className="success-icon animate-scaleIn">🎉</div>
                        <h3 className="success-title">打卡成功！</h3>
                        <p className="success-text">你真棒，继续保持！</p>
                        <div className="success-streak">
                          <span className="streak-fire">🔥</span>
                          <span className="streak-days">{streak} 天连续</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life,
            transform: `scale(${particle.life})`,
          }}
        />
      ))}

      <style>{`
        .habits-panel {
          position: relative;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .panel-title-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .panel-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text);
        }

        .panel-date {
          font-size: 14px;
          color: var(--color-text-secondary);
        }

        .add-habit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, var(--color-accent), var(--color-highlight));
          border-radius: var(--radius-full);
          font-size: 14px;
          font-weight: 600;
          color: white;
          transition: all var(--transition-normal);
        }

        .add-habit-btn:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(233, 69, 96, 0.3);
        }

        .add-habit-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .add-icon {
          font-size: 18px;
          font-weight: 700;
        }

        .add-form-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .add-form-modal {
          width: 100%;
          max-width: 400px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 4px;
        }

        .form-hint {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-top: -12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text);
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 14px;
          color: var(--color-text);
          outline: none;
          transition: border-color var(--transition-fast);
        }

        .form-input:focus {
          border-color: var(--color-accent);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .emoji-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .emoji-option {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .emoji-option:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(0);
        }

        .emoji-option.selected {
          border-color: var(--color-accent);
          background: rgba(233, 69, 96, 0.15);
        }

        .frequency-options {
          display: flex;
          gap: 8px;
        }

        .frequency-btn {
          flex: 1;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 14px;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        }

        .frequency-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(0);
        }

        .frequency-btn.active {
          background: rgba(233, 69, 96, 0.2);
          border-color: var(--color-accent);
          color: var(--color-text);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .btn-cancel {
          flex: 1;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(0);
        }

        .btn-submit {
          flex: 1;
          padding: 12px;
          background: linear-gradient(135deg, var(--color-accent), var(--color-highlight));
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 600;
          color: white;
          transition: all var(--transition-fast);
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(233, 69, 96, 0.3);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-state {
          padding: 60px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .empty-icon {
          font-size: 64px;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
        }

        .empty-text {
          font-size: 14px;
          color: var(--color-text-secondary);
          max-width: 280px;
        }

        .habit-card {
          position: relative;
          padding: 24px;
          height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          overflow: hidden;
        }

        .habit-card-back {
          justify-content: center;
        }

        .delete-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: var(--color-text-secondary);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
          opacity: 0;
          transition: all var(--transition-fast);
          z-index: 10;
        }

        .habit-card:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          color: var(--color-accent);
          background: rgba(233, 69, 96, 0.2);
          transform: translateY(0);
        }

        .habit-emoji {
          font-size: 48px;
          margin-bottom: 4px;
        }

        .habit-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
        }

        .habit-reminder {
          font-size: 13px;
          color: var(--color-text-secondary);
          min-height: 20px;
        }

        .habit-stats {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin: 8px 0;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text);
        }

        .stat-label {
          font-size: 12px;
          color: var(--color-text-secondary);
        }

        .badge-indicator {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .checkin-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-full);
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-secondary);
          transition: all var(--transition-normal);
          margin-top: auto;
        }

        .checkin-btn:hover {
          border-color: rgba(233, 69, 96, 0.5);
          background: rgba(233, 69, 96, 0.1);
          transform: translateY(-2px);
        }

        .checkin-btn.checked {
          background: rgba(74, 222, 128, 0.15);
          border-color: #4ade80;
          color: #4ade80;
        }

        .check-icon {
          font-size: 18px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .check-circle {
          width: 18px;
          height: 18px;
          border: 2px solid currentColor;
          border-radius: 50%;
          display: inline-block;
        }

        .checkin-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .success-icon {
          font-size: 64px;
        }

        .success-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--color-text);
        }

        .success-text {
          font-size: 14px;
          color: var(--color-text-secondary);
        }

        .success-streak {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding: 8px 16px;
          background: rgba(251, 191, 36, 0.15);
          border-radius: var(--radius-full);
        }

        .streak-fire {
          font-size: 20px;
        }

        .streak-days {
          font-size: 14px;
          font-weight: 600;
          color: #fbbf24;
        }

        .particle {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 2000;
          transform: translate(-50%, -50%);
        }

        .flip-container {
          height: 280px;
        }

        .flip-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }

        .flip-container.flipped .flip-inner {
          transform: rotateY(180deg);
        }

        .flip-front,
        .flip-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .flip-back {
          transform: rotateY(180deg);
        }

        @media (max-width: 768px) {
          .panel-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .add-habit-btn {
            width: 100%;
            justify-content: center;
          }

          .panel-title {
            font-size: 20px;
          }

          .habit-card {
            height: 260px;
            padding: 20px;
          }

          .flip-container {
            height: 260px;
          }

          .habit-emoji {
            font-size: 40px;
          }

          .delete-btn {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default HabitsPanel;
