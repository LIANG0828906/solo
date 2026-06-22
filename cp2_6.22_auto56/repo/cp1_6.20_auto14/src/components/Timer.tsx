import { useState, useEffect, useRef, useCallback } from 'react';
import { StudyLog, Subject } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface TimerProps {
  onComplete: (log: StudyLog) => void;
  subjects: Subject[];
}

const timerContainerStyle: React.CSSProperties = {
  maxWidth: '500px',
  margin: '0 auto',
  backgroundColor: '#fff',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(74, 144, 217, 0.1)',
  padding: '40px',
  textAlign: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#333',
  marginBottom: '30px',
};

const timerDisplayStyle: React.CSSProperties = {
  position: 'relative',
  width: '280px',
  height: '280px',
  margin: '0 auto 30px',
};

const timerTextStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: '48px',
  fontWeight: 'bold',
  color: '#4A90D9',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
  marginBottom: '24px',
};

const controlButtonStyle: React.CSSProperties = {
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  position: 'relative',
  overflow: 'hidden',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: '1px solid #D0D8E0',
  borderRadius: '8px',
  fontSize: '14px',
  backgroundColor: '#fff',
  color: '#333',
  outline: 'none',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  color: '#555',
  marginBottom: '8px',
  display: 'block',
  textAlign: 'left',
};

const statusTextStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#666',
  marginBottom: '20px',
};

function Timer({ onComplete, subjects }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const expectedEndTimeRef = useRef<number>(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak
    ? (1 - timeLeft / (5 * 60)) * 100
    : (1 - timeLeft / (25 * 60)) * 100;

  const tick = useCallback(() => {
    const now = Date.now();
    const diff = Math.floor((expectedEndTimeRef.current - now) / 1000);

    if (diff <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeLeft(0);
      setIsRunning(false);

      if (!isBreak && startTimeRef.current) {
        const log: StudyLog = {
          id: uuidv4(),
          date: format(new Date(), 'yyyy-MM-dd'),
          duration: 25,
          subject: selectedSubject || undefined,
          startTime: format(startTimeRef.current, 'HH:mm:ss'),
          endTime: format(new Date(), 'HH:mm:ss'),
        };
        onComplete(log);
        setSessionsCompleted((prev) => prev + 1);
      }

      if (!isBreak) {
        setIsBreak(true);
        setTimeLeft(5 * 60);
        if (confirm('专注时间结束！休息5分钟吧~')) {
          startBreak();
        }
      } else {
        setIsBreak(false);
        setTimeLeft(25 * 60);
        alert('休息结束！准备开始下一轮专注~');
      }
    } else {
      setTimeLeft(diff);
    }
  }, [isBreak, onComplete, selectedSubject]);

  const startTimer = useCallback(() => {
    if (isRunning) return;

    setIsRunning(true);
    startTimeRef.current = new Date();
    expectedEndTimeRef.current = Date.now() + timeLeft * 1000;

    timerRef.current = window.setInterval(tick, 100);
  }, [isRunning, timeLeft, tick]);

  const startBreak = () => {
    setIsBreak(true);
    setTimeLeft(5 * 60);
    setIsRunning(true);
    startTimeRef.current = new Date();
    expectedEndTimeRef.current = Date.now() + 5 * 60 * 1000;
    timerRef.current = window.setInterval(tick, 100);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div style={timerContainerStyle}>
      <h2 style={titleStyle}>
        {isBreak ? '☕ 休息时间' : '🍅 番茄钟专注'}
      </h2>

      <p style={statusTextStyle}>
        已完成 {sessionsCompleted} 个番茄钟
      </p>

      <div style={timerDisplayStyle}>
        <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="#F0F4F8"
            strokeWidth="12"
          />
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke={isBreak ? '#3CB371' : '#4A90D9'}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.1s linear',
            }}
          />
          {isRunning && (
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke={isBreak ? '#3CB371' : '#4A90D9'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                animation: 'pulse 2s ease-in-out infinite',
                opacity: 0.3,
              }}
            />
          )}
        </svg>
        <div style={timerTextStyle}>{formatTime(timeLeft)}</div>
      </div>

      <div style={buttonGroupStyle}>
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="ripple-button"
            style={{
              ...controlButtonStyle,
              backgroundColor: '#4A90D9',
              color: '#fff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3A7BC8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4A90D9';
            }}
          >
            {timeLeft === 25 * 60 || timeLeft === 5 * 60 ? '开始' : '继续'}
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="ripple-button"
            style={{
              ...controlButtonStyle,
              backgroundColor: '#FFA500',
              color: '#fff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF8C00';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFA500';
            }}
          >
            暂停
          </button>
        )}
        <button
          onClick={resetTimer}
          className="ripple-button"
          style={{
            ...controlButtonStyle,
            backgroundColor: '#F0F4F8',
            color: '#666',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E0E8F0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F0F4F8';
          }}
        >
          重置
        </button>
      </div>

      <div>
        <label style={labelStyle}>选择学习科目</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={selectStyle}
          disabled={isRunning}
        >
          <option value="">-- 请选择科目 --</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.name}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#F0F4F8',
          borderRadius: '10px',
        }}
      >
        <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.8 }}>
          💡 <strong>番茄工作法</strong>：专注25分钟，休息5分钟。每完成4个番茄钟，可以休息更长时间。保持专注，提高效率！
        </p>
      </div>
    </div>
  );
}

export default Timer;
