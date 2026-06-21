import { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from '../../styles/ui.module.css';

export interface StatusMessageProps {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  duration?: number;
  onDone?: () => void;
}

const typeStyles: Record<string, string> = {
  success: 'var(--accent-gold-active)',
  error: 'var(--accent-red)',
  info: 'var(--accent-blue)',
};

export function StatusMessage({
  message,
  type,
  visible,
  duration = 2000,
  onDone,
}: StatusMessageProps) {
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      if (duration > 0) {
        const timer = setTimeout(() => {
          setShouldRender(false);
          onDone?.();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setShouldRender(false);
    }
  }, [visible, duration, onDone]);

  if (!shouldRender) return null;

  return (
    <div
      className={clsx('glass-panel', styles.statusMessage)}
      style={{
        color: typeStyles[type],
        borderColor: typeStyles[type] + '40',
      }}
    >
      {message}
    </div>
  );
}

export default StatusMessage;
