import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useCityStore } from '../store/useCityStore';
import { averageHotness, formatTime } from '../utils/heatData';

export default function Timeline() {
  const selectedTime = useCityStore((s) => s.selectedTime);
  const setSelectedTime = useCityStore((s) => s.setSelectedTime);
  const isAutoPlay = useCityStore((s) => s.isAutoPlay);
  const setAutoPlay = useCityStore((s) => s.setAutoPlay);
  const hotness = useCityStore((s) => s.hotness);

  const railRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [bubbleX, setBubbleX] = useState(0);

  const pct = (selectedTime / 1439) * 100;

  const bubbleSpring = useSpring({
    opacity: bubbleVisible || dragging ? 1 : 0,
    transform: bubbleVisible || dragging ? 'translateY(0px)' : 'translateY(8px)',
    config: { tension: 240, friction: 22 },
  });

  const avg = averageHotness(hotness);
  const displayTime = formatTime(selectedTime);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      if (!railRef.current) return;
      const rect = railRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const minute = Math.round(ratio * 1439);
      setSelectedTime(minute);
      setBubbleX(clientX - rect.left);
    },
    [setSelectedTime]
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      updateFromClientX(e.clientX);
    };
    const onUp = () => {
      setDragging(false);
      setBubbleVisible(false);
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, updateFromClientX]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setAutoPlay(false);
    setDragging(true);
    setBubbleVisible(true);
    updateFromClientX(e.clientX);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '0',
        right: '0',
        bottom: '32px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        zIndex: 20,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '60%',
          minWidth: '320px',
          maxWidth: '900px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <animated.div
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '0',
            transform: bubbleSpring.transform.to(
              (v) => `translate(${bubbleX - 48}px, ${parseFloat(v.match(/-?\d+\.?\d*/)?.[0] || '0')}px)`
            ),
            opacity: bubbleSpring.opacity,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 0 6px rgba(0, 229, 255, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '1px' }}>
              {displayTime}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.85, marginTop: '2px' }}>
              {avg}%
            </div>
          </div>
        </animated.div>

        <div
          ref={railRef}
          onPointerDown={onPointerDown}
          onMouseEnter={() => !dragging && !isAutoPlay && setBubbleVisible(true)}
          onMouseLeave={() => !dragging && setBubbleVisible(false)}
          style={{
            position: 'relative',
            width: '100%',
            height: '12px',
            background: 'rgba(74, 74, 106, 0.35)',
            borderRadius: '8px',
            cursor: 'pointer',
            touchAction: 'none',
            boxShadow: '0 0 6px rgba(0, 229, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              height: '100%',
              width: `${pct}%`,
              background:
                'linear-gradient(90deg, rgba(0, 229, 255, 0.6), rgba(192, 132, 252, 0.6))',
              borderRadius: '8px',
              transition: 'width 0.2s ease',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-5px',
              left: `calc(${pct}% - 11px)`,
              width: '22px',
              height: '22px',
              borderRadius: '8px',
              background: '#4A4A6A',
              border: '2px solid rgba(0, 229, 255, 0.7)',
              boxShadow: '0 0 10px rgba(0, 229, 255, 0.6)',
              transition: 'left 0.15s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}
