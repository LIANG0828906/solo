import { useState, useEffect } from 'react';
import { useAttendanceStore } from '../store/attendanceStore';

const ClockPanel = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  const { isPunching, actions, message, messageVisible } = useAttendanceStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePunch = () => {
    if (isPunching) return;
    setIsAnimating(true);
    actions.punchIn();
    setTimeout(() => setIsAnimating(false), 300);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const getMessageBgColor = () => {
    if (!message) return '#4CAF50';
    switch (message.type) {
      case 'normal': return '#4CAF50';
      case 'late': return '#FFC107';
      case 'absent': return '#F44336';
      case 'leave': return '#2196F3';
      default: return '#4CAF50';
    }
  };

  return (
    <div style={styles.container}>
      {message && messageVisible && (
        <div
          className="message-enter"
          style={{
            ...styles.message,
            backgroundColor: getMessageBgColor(),
          }}
        >
          {message.text}
        </div>
      )}

      <div style={styles.clockDisplay}>
        <div style={styles.timeText}>{formatTime(currentTime)}</div>
        <div style={styles.dateText}>{formatDate(currentTime)}</div>
      </div>

      <button
        onClick={handlePunch}
        disabled={isPunching}
        className={isAnimating ? 'pulse-animation' : ''}
        style={{
          ...styles.punchButton,
          backgroundColor: isPunching ? '#4CAF50' : '#E0E0E0',
        }}
      >
        <span style={styles.buttonText}>
          {isPunching ? '打卡中...' : '点击打卡'}
        </span>
      </button>

      <div style={styles.statusHint}>
        <div style={styles.hintItem}>
          <span style={{ ...styles.hintDot, backgroundColor: '#4CAF50' }} />
          <span style={styles.hintText}>9:00前 正常</span>
        </div>
        <div style={styles.hintItem}>
          <span style={{ ...styles.hintDot, backgroundColor: '#FFC107' }} />
          <span style={styles.hintText}>9:01-9:30 迟到</span>
        </div>
        <div style={styles.hintItem}>
          <span style={{ ...styles.hintDot, backgroundColor: '#F44336' }} />
          <span style={styles.hintText}>9:31后 缺勤</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    position: 'relative' as const,
  },
  message: {
    position: 'absolute' as const,
    top: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 100,
  },
  clockDisplay: {
    textAlign: 'center' as const,
    marginBottom: '40px',
  },
  timeText: {
    fontSize: '64px',
    fontWeight: 300,
    color: '#333',
    letterSpacing: '2px',
    marginBottom: '8px',
  },
  dateText: {
    fontSize: '18px',
    color: '#666',
    fontWeight: 400,
  },
  punchButton: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease-in-out',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    outline: 'none',
  },
  buttonText: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
  },
  statusHint: {
    marginTop: '40px',
    display: 'flex',
    gap: '24px',
  },
  hintItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  hintDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  hintText: {
    fontSize: '14px',
    color: '#666',
  },
};

export default ClockPanel;
