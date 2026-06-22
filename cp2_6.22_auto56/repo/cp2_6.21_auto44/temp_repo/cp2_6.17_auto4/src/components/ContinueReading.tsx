import { useBookStore } from '@/store/bookStore';
import { useEffect, useState } from 'react';

export default function ContinueReading() {
  const { hideContinueReading } = useBookStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setVisible(true);
    });
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(hideContinueReading, 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, [hideContinueReading]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.85)',
          color: '#333',
          padding: '14px 32px',
          borderRadius: 8,
          fontSize: 16,
          fontFamily: "'Noto Sans SC', sans-serif",
          fontWeight: 500,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        继续阅读
      </div>
    </div>
  );
}
