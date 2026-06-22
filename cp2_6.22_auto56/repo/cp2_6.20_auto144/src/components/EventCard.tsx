import { useState, useEffect } from 'react';
import type { EventCard } from '@/types/game';

type EventCardProps = {
  event: EventCard | null;
  message: string | null;
};

export default function EventCardOverlay({ event, message }: EventCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (event) {
      setFlipped(false);
      setVisible(false);
      const scaleTimer = setTimeout(() => setVisible(true), 30);
      const flipTimer = setTimeout(() => setFlipped(true), 330);
      return () => {
        clearTimeout(scaleTimer);
        clearTimeout(flipTimer);
      };
    }
  }, [event]);

  if (!event) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          perspective: '1000px',
          width: '200px',
          height: '280px',
          transform: visible ? 'scale(1)' : 'scale(0)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s ease-in-out',
            transform: flipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6c3483, #4a235a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <span
              style={{
                fontSize: '72px',
                color: '#d4af37',
                fontWeight: 'bold',
              }}
            >
              ?
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              borderRadius: '12px',
              background: '#fdf2e9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              transform: 'rotateY(180deg)',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#d4af37',
                textAlign: 'center',
              }}
            >
              {event.name}
            </span>
            <span
              style={{
                fontSize: '14px',
                color: '#2c3e50',
                textAlign: 'center',
                marginTop: '12px',
              }}
            >
              {event.description}
            </span>
          </div>
        </div>
      </div>
      {message && (
        <div
          style={{
            color: 'white',
            fontSize: '16px',
            marginTop: '24px',
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            textAlign: 'center',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
