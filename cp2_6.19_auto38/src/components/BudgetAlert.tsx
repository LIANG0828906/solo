import React, { useEffect, useRef, useCallback } from 'react';

interface BudgetAlertProps {
  type: 'warning' | 'danger';
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

const BudgetAlert: React.FC<BudgetAlertProps> = ({ type, message, visible, onDismiss }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasPlayedRef = useRef(false);
  const interactionListenersRef = useRef<Array<[string, EventListener]>>([]);

  const resumeOnInteraction = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      const ctx = audioContextRef.current;
      const handler = () => {
        ctx.resume().catch(() => {});
        interactionListenersRef.current.forEach(([evt, listener]) => {
          document.removeEventListener(evt, listener);
        });
        interactionListenersRef.current = [];
      };
      const events = ['click', 'keydown', 'touchstart'] as const;
      events.forEach((evt) => {
        const listener = handler as EventListener;
        document.addEventListener(evt, listener, { once: true });
        interactionListenersRef.current.push([evt, listener]);
      });
    }
  }, []);

  const playAlertSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      resumeOnInteraction();

      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, startTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.01);
        gainNode.gain.setValueAtTime(0.25, startTime + duration - 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = ctx.currentTime;

      playTone(880, now, 0.15);
      playTone(660, now + 0.15, 0.15);
      playTone(440, now + 0.30, 0.15);

      playTone(880, now + 0.75, 0.15);
      playTone(660, now + 0.90, 0.15);
      playTone(440, now + 1.05, 0.15);

    } catch (e) {
      console.log('Audio not supported');
    }
  }, [resumeOnInteraction]);

  useEffect(() => {
    if (visible && type === 'danger' && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      playAlertSound();
    }
    if (!visible) {
      hasPlayedRef.current = false;
    }
    return () => {
      interactionListenersRef.current.forEach(([evt, listener]) => {
        document.removeEventListener(evt, listener);
      });
      interactionListenersRef.current = [];
    };
  }, [visible, type, playAlertSound]);

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
