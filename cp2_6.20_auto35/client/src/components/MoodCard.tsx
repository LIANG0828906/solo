import React from 'react';
import { MoodData, MOOD_CONFIGS, TAG_LABELS } from '../types';

interface MoodCardProps {
  moodData: MoodData;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const MoodCard: React.FC<MoodCardProps> = ({ moodData, isExpanded = false, onToggle }) => {
  const config = MOOD_CONFIGS[moodData.type];
  const time = new Date(moodData.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onClick={onToggle}
      style={{
        animation: 'slideInLeft 0.4s ease-out forwards',
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        cursor: onToggle ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onToggle) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (onToggle) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: config.color,
            flexShrink: 0,
            boxShadow: `0 4px 12px ${config.color}40`,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#333' }}>
              {config.label}
            </span>
            <span style={{ fontSize: '14px', color: '#999' }}>{time}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>强度</span>
            <div
              style={{
                display: 'flex',
                gap: '3px',
                alignItems: 'center',
              }}
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: i < moodData.intensity ? config.color : '#eee',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: config.color }}>
              {moodData.intensity}/10
            </span>
          </div>
          {(isExpanded || !onToggle) && moodData.description && (
            <p
              style={{
                fontSize: '14px',
                color: '#555',
                lineHeight: 1.6,
                marginBottom: '12px',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              {moodData.description}
            </p>
          )}
          {(isExpanded || !onToggle) && moodData.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {moodData.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: `${config.color}20`,
                    color: config.color,
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {TAG_LABELS[tag]}
                </span>
              ))}
            </div>
          )}
        </div>
        {onToggle && (
          <div
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.3s ease',
              color: '#ccc',
              fontSize: '20px',
            }}
          >
            ▼
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodCard;
