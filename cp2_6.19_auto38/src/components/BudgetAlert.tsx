import React, { useEffect, useRef } from 'react';

interface BudgetAlertProps {
  type: 'warning' | 'danger';
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

const BudgetAlert: React.FC<BudgetAlertProps> = ({ type, message, visible, onDismiss }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  
  useEffect(() => {
    if (visible && type === 'danger') {
      playAlertSound();
    }
  }, [visible, type]);
  
  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, startTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = ctx.currentTime;
      playTone(880, now, 0.15);
      playTone(660, now + 0.2, 0.15);
      playTone(880, now + 0.4, 0.2);
      
    } catch (e) {
      console.log('Audio not supported');
    }
  };
  
  if (!visible) return null;
  
  return (
    <div
      className={`budget-alert ${type} ${visible ? 'show' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="budget-alert-content">
        <span className="budget-alert-icon">
          {type === 'danger' ? '🚨' : '⚠️'}
        </span>
        <div className="budget-alert-text">
          <div className="budget-alert-title">
            {type === 'danger' ? '预算超支警告！' : '预算提醒'}
          </div>
          <div className="budget-alert-message">{message}</div>
        </div>
      </div>
      <button
        className="budget-alert-close"
        onClick={onDismiss}
        aria-label="关闭提醒"
      >
        ✕
      </button>
    </div>
  );
};

export default BudgetAlert;
