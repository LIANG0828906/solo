import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { BattleEvent, EVENT_TYPE_LABEL } from '../types';

interface LogPanelProps {
  events: BattleEvent[];
  currentIndex: number;
}

export interface LogPanelHandle {
  clear: () => void;
}

const EVENT_COLORS: Record<string, string> = {
  attack: '#ff5c5c',
  defense: '#5c8cff',
  heal: '#5cff8c'
};

const LogPanel = forwardRef<LogPanelHandle, LogPanelProps>(({ events, currentIndex }, ref) => {
  const [displayEvents, setDisplayEvents] = useState<BattleEvent[]>([]);
  const [fadeInIds, setFadeInIds] = useState<Set<number>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  useImperativeHandle(ref, () => ({
    clear: () => {
      setDisplayEvents([]);
      setFadeInIds(new Set());
      prevLengthRef.current = 0;
    }
  }));

  useEffect(() => {
    const visibleEvents = events.slice(0, currentIndex + 1);
    const limitedEvents = visibleEvents.slice(-200);

    if (limitedEvents.length > prevLengthRef.current) {
      const newEvents = limitedEvents.slice(prevLengthRef.current);
      const newIds = new Set(fadeInIds);
      newEvents.forEach((e) => newIds.add(e.id));
      setFadeInIds(newIds);

      setTimeout(() => {
        setFadeInIds((prev) => {
          const next = new Set(prev);
          newEvents.forEach((e) => next.delete(e.id));
          return next;
        });
      }, 300);
    }

    setDisplayEvents(limitedEvents);
    prevLengthRef.current = limitedEvents.length;
  }, [events, currentIndex]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [displayEvents]);

  const formatEvent = (event: BattleEvent): React.ReactNode => {
    const typeLabel = EVENT_TYPE_LABEL[event.type];
    const typeColor = EVENT_COLORS[event.type];
    const valuePrefix = event.value >= 0 ? '+' : '';

    return (
      <>
        <span style={{ color: '#888' }}>[{event.round}]</span>
        <span style={{ color: '#888' }}>[</span>
        <span style={{ color: typeColor, fontWeight: 'bold' }}>{typeLabel}</span>
        <span style={{ color: '#888' }}>]</span>
        <span style={{ color: '#888' }}>[</span>
        <span style={{ color: '#c0c0c0' }}>{event.source}</span>
        <span style={{ color: '#888' }}>]</span>
        <span style={{ color: '#888' }}>[</span>
        <span style={{ color: '#c0c0c0' }}>{event.target}</span>
        <span style={{ color: '#888' }}>]</span>
        <span style={{ color: '#888' }}>[</span>
        <span style={{ color: event.value >= 0 ? '#5cff8c' : '#ff5c5c', fontWeight: 'bold' }}>
          {valuePrefix}{event.value}
        </span>
        <span style={{ color: '#888' }}>]</span>
      </>
    );
  };

  return (
    <div
      className="log-panel"
      style={{
        backgroundColor: '#2a2a3c',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        height: '60vh',
        minHeight: '300px',
        resize: 'vertical',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div
        style={{
          color: '#c0c0c0',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid #3a3a5c'
        }}
      >
        战斗日志 ({displayEvents.length} 条)
      </div>
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          display: 'flex',
          flexDirection: 'column-reverse'
        }}
      >
        {[...displayEvents].reverse().map((event) => (
          <div
            key={event.id}
            style={{
              padding: '4px 8px',
              marginBottom: '2px',
              borderRadius: '4px',
              opacity: fadeInIds.has(event.id) ? 0 : 1,
              transform: fadeInIds.has(event.id) ? 'translateY(-8px)' : 'translateY(0)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              backgroundColor:
                event.id === events[currentIndex]?.id ? 'rgba(90, 90, 124, 0.4)' : 'transparent'
            }}
          >
            {formatEvent(event)}
          </div>
        ))}
        {displayEvents.length === 0 && (
          <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>暂无战斗日志</div>
        )}
      </div>
    </div>
  );
});

LogPanel.displayName = 'LogPanel';

export default LogPanel;
