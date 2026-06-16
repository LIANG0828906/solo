import React, { useEffect, useRef } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import type { Danmaku } from '../types';

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const DanmakuPanel: React.FC = () => {
  const { danmakus, fetchDanmakus } = useDashboardStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDanmakus();
  }, [fetchDanmakus]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [danmakus]);

  return (
    <div
      style={{
        width: 320,
        background: '#2D2D44',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 100px)',
        maxHeight: 600,
      }}
      className="card-hover"
    >
      <h3 style={{ color: '#E0E0E0', margin: '0 0 16px 0', fontSize: 18 }}>弹幕流</h3>
      <div
        ref={containerRef}
        className="danmaku-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingRight: 8,
        }}
      >
        {danmakus.map((danmaku: Danmaku) => (
          <div
            key={danmaku.id}
            className="danmaku-item"
            style={{
              background: '#F5F5F5',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <img
              src={danmaku.avatar}
              alt={danmaku.nickname}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                flexShrink: 0,
                background: '#ddd',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: '#FF6B00',
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                {danmaku.nickname}
              </div>
              <div style={{ color: '#212121', fontSize: 14, wordBreak: 'break-word' }}>
                {danmaku.content}
              </div>
              <div style={{ color: '#9E9E9E', fontSize: 11, marginTop: 6 }}>
                {formatTime(danmaku.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DanmakuPanel;
