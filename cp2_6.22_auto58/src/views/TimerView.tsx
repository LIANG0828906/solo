import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../App';
import { timerService } from '../services/timerService';
import '../styles/TimerView.css';

const TIMER_PRESETS = [
  { label: '25分钟', minutes: 25 },
  { label: '45分钟', minutes: 45 },
  { label: '60分钟', minutes: 60 },
];

const STORAGE_KEY = 'focus_timer_state';
const BREAK_DURATION = 5 * 60;

interface SavedTimerState {
  duration: number;
  remainingTime: number;
  startTime: string;
  taskId: string | null;
  isPaused: boolean;
  pausedTime: number;
}

function TimerView() {
  const { tasks, refreshTasks } = useAppContext();
  const [selectedPreset, setSelectedPreset] = useState(25);
  const [duration, setDuration] = useState(25 * 60);
  const [remainingTime, setRemainingTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(BREAK_DURATION);
  const [isBreakActive, setIsBreakActive] = useState(false);
  
  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isCompletingRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state: SavedTimerState = JSON.parse(saved);
        if (state.duration && state.remainingTime > 0) {
          setDuration(state.duration);
          setRemainingTime(state.remainingTime);
          setSelectedTaskId(state.taskId);
          
          if (!state.isPaused && state.startTime) {
            const elapsed = Math.floor((Date.now() - new Date(state.startTime).getTime()) / 1000);
            const newRemaining = Math.max(0, state.remainingTime - elapsed);
            
            if (newRemaining > 0) {
              setRemainingTime(newRemaining);
              setIsRunning(true);
              setIsPaused(false);
              startTimeRef.current = new Date(Date.now() - (state.duration - newRemaining) * 1000);
              startTimerInterval();
            } else {
              clearTimerState();
            }
          } else if (state.isPaused) {
            setIsPaused(true);
            setIsRunning(false);
          }
        }
      } catch (e) {
        console.error('Failed to restore timer state:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        duration,
        remainingTime,
        startTime: startTimeRef.current?.toISOString(),
        taskId: selectedTaskId,
        isPaused: false,
        pausedTime: 0,
      }));
    } else if (isPaused) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        duration,
        remainingTime,
        startTime: null,
        taskId: selectedTaskId,
        isPaused: true,
        pausedTime: remainingTime,
      }));
    }
  }, [isRunning, isPaused, remainingTime, duration, selectedTaskId]);

  const startTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = window.setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const playSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.error('Audio playback failed:', e);
    }
  }, []);

  const playTickingSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
    }
  }, []);

  const handleTimerComplete = useCallback(async () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    setIsRunning(false);
    setIsPaused(false);
    playSound();
    setShowCompleteModal(true);

    const totalFocusTime = duration;
    const startTime = startTimeRef.current?.toISOString() || new Date().toISOString();
    const endTime = new Date().toISOString();

    try {
      await timerService.submitRecord({
        taskId: selectedTaskId,
        duration: totalFocusTime,
        startTime,
        endTime,
        status: 'completed',
      });
      await refreshTasks();
    } catch (e) {
      console.error('Failed to save focus record:', e);
    }

    clearTimerState();
    isCompletingRef.current = false;
  }, [duration, selectedTaskId, playSound, refreshTasks]);

  const clearTimerState = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    localStorage.removeItem(STORAGE_KEY);
    startTimeRef.current = null;
  };

  const handleStart = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = new Date();
    startTimerInterval();
    playTickingSound();
  };

  const handlePause = () => {
    if (!isRunning || isPaused) return;
    
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleResume = () => {
    if (!isPaused) return;
    
    setIsPaused(false);
    startTimerInterval();
  };

  const handleStop = () => {
    if (!isRunning && remainingTime === duration) return;
    
    clearTimerState();
    setIsRunning(false);
    setIsPaused(false);
    setRemainingTime(duration);
  };

  const handlePresetChange = (minutes: number) => {
    if (isRunning) return;
    
    setSelectedPreset(minutes);
    setDuration(minutes * 60);
    setRemainingTime(minutes * 60);
  };

  const handleStartBreak = () => {
    setShowCompleteModal(false);
    setShowBreakModal(true);
    setIsBreakActive(true);
    setBreakTimeLeft(BREAK_DURATION);
  };

  useEffect(() => {
    if (!isBreakActive) return;

    const breakInterval = setInterval(() => {
      setBreakTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(breakInterval);
          setIsBreakActive(false);
          setShowBreakModal(false);
          playSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(breakInterval);
  }, [isBreakActive, playSound]);

  const handleSkipBreak = () => {
    setIsBreakActive(false);
    setShowBreakModal(false);
    setBreakTimeLeft(BREAK_DURATION);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - remainingTime) / duration) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const availableTasks = tasks.filter(t => t.status !== 'done');

  return (
    <div className="timer-view">
      <div className="timer-header">
        <h1 className="page-title">专注计时</h1>
        <p className="page-subtitle">保持专注，提升效率</p>
      </div>

      <div className="timer-container">
        <div className="timer-presets">
          {TIMER_PRESETS.map(preset => (
            <button
              key={preset.minutes}
              className={`preset-btn ${selectedPreset === preset.minutes ? 'active' : ''}`}
              onClick={() => handlePresetChange(preset.minutes)}
              disabled={isRunning}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="timer-display">
          <div className={`circular-progress ${isRunning && !isPaused ? 'running' : ''}`}>
            {isRunning && !isPaused && (
              <div className="particles">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="particle"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      transform: `rotate(${i * 30}deg) translateY(-130px)`,
                    }}
                  />
                ))}
              </div>
            )}
            
            <svg width="280" height="280" className="progress-ring">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4A90D9" />
                  <stop offset="100%" stopColor="#357ABD" />
                </linearGradient>
              </defs>
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke="var(--bg-card)"
                strokeWidth="12"
              />
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 140 140)"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            
            <div className="timer-text">
              <span className="time-display">{formatTime(remainingTime)}</span>
              <span className="time-label">
                {isPaused ? '已暂停' : isRunning ? '专注中...' : '准备开始'}
              </span>
            </div>
          </div>
        </div>

        <div className="timer-controls">
          {!isRunning ? (
            <button className="control-btn start-btn" onClick={handleStart}>
              开始专注
            </button>
          ) : (
            <>
              <button 
                className="control-btn pause-btn" 
                onClick={isPaused ? handleResume : handlePause}
              >
                {isPaused ? '继续' : '暂停'}
              </button>
              <button className="control-btn stop-btn" onClick={handleStop}>
                终止
              </button>
            </>
          )}
        </div>

        <div className="task-selector">
          <label className="selector-label">关联任务</label>
          <select
            value={selectedTaskId || ''}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            className="task-select"
            disabled={isRunning}
          >
            <option value="">不关联任务</option>
            {availableTasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          {selectedTask && (
            <div className="selected-task-info">
              <span className="info-label">当前任务:</span>
              <span className="info-value">{selectedTask.title}</span>
            </div>
          )}
        </div>
      </div>

      {showCompleteModal && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="complete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="complete-icon">🎉</div>
            <h2>恭喜完成！</h2>
            <p className="complete-text">
              你已专注 <strong>{formatTime(duration)}</strong>
              {selectedTask && <span> - {selectedTask.title}</span>}
            </p>
            <div className="complete-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowCompleteModal(false)}
              >
                关闭
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleStartBreak}
              >
                休息5分钟
              </button>
            </div>
          </div>
        </div>
      )}

      {showBreakModal && (
        <div className="modal-overlay break-overlay">
          <div className="break-modal">
            <h2>休息时间</h2>
            <p className="break-instruction">深呼吸，放松一下</p>
            
            <div className="breathing-circle">
              <div className={`breathe-ring ${isBreakActive ? 'inhale' : ''}`} />
              <div className="breath-text">
                {isBreakActive ? (Math.floor(breakTimeLeft / 2) % 2 === 0 ? '吸气' : '呼气') : '休息结束'}
              </div>
            </div>
            
            <div className="break-timer">
              {formatTime(breakTimeLeft)}
            </div>
            
            <button 
              className="btn btn-secondary skip-break-btn"
              onClick={handleSkipBreak}
            >
              跳过休息
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimerView;
