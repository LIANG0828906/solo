import { useState, useEffect, useCallback, useRef } from 'react';
import HabitCard from '../components/HabitCard';
import HabitForm from '../components/HabitForm';
import Celebration from '../components/Celebration';
import habitApi from '../services/api';
import type { Habit } from '../types';
import { formatDate, formatDateCN, isBeforeToday, isToday } from '../utils/constants';

function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ show: boolean; milestone: number; habitName: string }>({
    show: false, milestone: 0, habitName: '',
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClickSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch {
      // audio not supported
    }
  }, []);

  const fetchHabits = useCallback(async () => {
    try {
      const data = await habitApi.getHabits();
      setHabits(data);
    } catch (err) {
      console.error('Failed to fetch habits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  useEffect(() => {
    const checkMissed = () => {
      const now = new Date();
      if (now.getHours() === 23 && now.getMinutes() === 59) {
        setHabits(prev => [...prev]);
      }
    };
    const interval = setInterval(checkMissed, 60000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = formatDate(currentDate);
  const isCurrentToday = isToday(todayStr);
  const isPastDay = isBeforeToday(todayStr);
  const now = new Date();
  const endOfDay = new Date(currentDate);
  endOfDay.setHours(23, 59, 0, 0);
  const shouldMarkMissed = isPastDay || (isCurrentToday && now >= endOfDay);

  const sortHabits = (h: Habit[]) => {
    const order = { morning: 0, afternoon: 1, evening: 2, anytime: 3 };
    return [...h].sort((a, b) => (order[a.timePeriod] ?? 0) - (order[b.timePeriod] ?? 0));
  };

  const pendingHabits = sortHabits(
    habits.filter(h => {
      const checkin = h.checkins.find(c => c.date === todayStr);
      return !checkin?.completed;
    })
  );

  const completedHabits = sortHabits(
    habits.filter(h => {
      const checkin = h.checkins.find(c => c.date === todayStr);
      return checkin?.completed;
    })
  );

  const missedHabits = shouldMarkMissed ? [] : [];

  const handleCheckin = async (habitId: string) => {
    playClickSound();
    try {
      const updated = await habitApi.checkin({ habitId, date: todayStr });
      setHabits(prev => prev.map(h => h.id === habitId ? updated : h));
    } catch (err) {
      console.error('Checkin failed:', err);
    }
  };

  const handleCreate = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'badges' | 'checkins'>) => {
    try {
      const newHabit = await habitApi.createHabit(habitData);
      setNewlyCreatedId(newHabit.id);
      setTimeout(() => setNewlyCreatedId(null), 300);
      setHabits(prev => [...prev, newHabit]);
      setShowForm(false);
      playClickSound();
    } catch (err) {
      console.error('Create failed:', err);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handlePrevDay();
      else handleNextDay();
    }
  };

  const showCelebration = useCallback((milestone: number, habitName: string) => {
    setCelebration({ show: true, milestone, habitName });
  }, []);

  const closeCelebration = useCallback(() => {
    setCelebration({ show: false, milestone: 0, habitName: '' });
  }, []);

  const totalCompleted = completedHabits.length;
  const totalHabits = habits.length;
  const todayRate = totalHabits > 0 ? Math.round((totalCompleted / totalHabits) * 100) : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="water-wave" />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div
      className="dashboard"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="date-nav">
        <button className="date-nav-btn" onClick={handlePrevDay} aria-label="前一天">‹</button>
        <div className="date-display">
          <div className={`date-main ${isCurrentToday ? 'today' : ''}`} onClick={() => setCurrentDate(new Date())}>
            {formatDateCN(currentDate)}
          </div>
          {isCurrentToday && <div className="today-underline" />}
        </div>
        <button
          className="date-nav-btn"
          onClick={handleNextDay}
          disabled={isCurrentToday}
          aria-label="后一天"
        >
          ›
        </button>
      </div>

      <div className="stats-summary">
        <div className="summary-item">
          <span className="summary-value">{totalCompleted}</span>
          <span className="summary-label">已完成</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-value">{totalHabits}</span>
          <span className="summary-label">总习惯</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-value">{todayRate}%</span>
          <span className="summary-label">完成率</span>
        </div>
      </div>

      <button className="add-habit-btn" onClick={() => setShowForm(true)}>
        <span className="plus-icon">+</span>
        <span>添加习惯</span>
      </button>

      <div className="habits-section fade-section">
        <div className="section-header">
          <h3 className="section-title">待完成</h3>
          <span className="section-count">{pendingHabits.length}</span>
        </div>
        <div className="habits-list">
          {pendingHabits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <p>{habits.length === 0 ? '还没有习惯，点击上方按钮创建第一个吧！' : '今日习惯全部完成！'}</p>
            </div>
          ) : (
            pendingHabits.map(habit => {
              const habitMissed = shouldMarkMissed && !habit.checkins.find(c => c.date === todayStr)?.completed;
              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onCheckin={handleCheckin}
                  date={currentDate}
                  isMissed={habitMissed}
                  showCelebration={showCelebration}
                  showAnimation={habit.id === newlyCreatedId}
                />
              );
            })
          )}
        </div>
      </div>

      <div className="habits-section fade-section">
        <div className="section-header">
          <h3 className="section-title completed-title">已完成</h3>
          <span className="section-count completed-count">{completedHabits.length}</span>
        </div>
        <div className="habits-list">
          {completedHabits.length === 0 ? (
            <div className="empty-state small">
              <p>暂无完成的习惯</p>
            </div>
          ) : (
            completedHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onCheckin={handleCheckin}
                date={currentDate}
                isDone
                showCelebration={showCelebration}
              />
            ))
          )}
        </div>
      </div>

      {showForm && <HabitForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />}
      <Celebration {...celebration} />
    </div>
  );
}

export default Dashboard;
