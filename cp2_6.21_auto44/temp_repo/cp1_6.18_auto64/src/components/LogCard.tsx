import React from 'react';
import { useAppStore, type LogEntry } from '../store/useAppStore';
import { emotionIcons, formatDateString, getGradientBackground } from '../utils/emotionColors';

interface LogCardProps {
  log: LogEntry;
}

const LogCard: React.FC<LogCardProps> = ({ log }) => {
  const setSelectedLog = useAppStore((s) => s.setSelectedLog);

  return (
    <div
      onClick={() => setSelectedLog(log)}
      style={{
        background: getGradientBackground(log.emotion),
        backgroundSize: '200% 200%',
        animation: 'gradientShift 5s ease infinite, fadeIn 0.4s ease-in-out both',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'filter 0.2s ease, transform 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.filter = 'brightness(1.2)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.filter = 'brightness(1)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.25) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 500,
            letterSpacing: '0.3px',
          }}
        >
          {formatDateString(log.date)}
        </span>
        <span style={{ fontSize: '28px', lineHeight: 1 }}>{emotionIcons[log.emotion]}</span>
      </div>
      <p
        style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.92)',
          lineHeight: 1.7,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          position: 'relative',
          zIndex: 1,
          margin: 0,
        }}
      >
        {log.text}
      </p>
    </div>
  );
};

export default LogCard;
