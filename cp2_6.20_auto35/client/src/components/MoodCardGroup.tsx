import React, { useState } from 'react';
import { MoodData } from '../types';
import MoodCard from './MoodCard';

interface MoodCardGroupProps {
  date: string;
  moods: MoodData[];
  avgColor: string;
}

const MoodCardGroup: React.FC<MoodCardGroupProps> = ({ date, moods, avgColor }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const formattedDate = new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          height: '6px',
          background: `linear-gradient(90deg, ${avgColor}80, ${avgColor})`,
          transition: 'all 0.3s ease',
        }}
      />
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '20px 24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#fafafa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: avgColor,
              boxShadow: `0 0 12px ${avgColor}80`,
            }}
          />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#333', margin: 0 }}>
              {formattedDate}
            </h3>
            <p style={{ fontSize: '13px', color: '#999', margin: '4px 0 0 0' }}>
              {moods.length} 条记录
            </p>
          </div>
        </div>
        <div
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            color: '#bbb',
            fontSize: '18px',
          }}
        >
          ▼
        </div>
      </div>
      <div
        style={{
          maxHeight: isExpanded ? '2000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            padding: '0 24px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {moods.map((mood, index) => (
            <div
              key={mood.id}
              style={{
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
                animation: isExpanded
                  ? `slideInLeft 0.4s ease-out ${index * 0.1}s forwards`
                  : 'none',
              }}
            >
              <MoodCard
                moodData={mood}
                isExpanded={expandedCardId === mood.id}
                onToggle={() =>
                  setExpandedCardId(expandedCardId === mood.id ? null : mood.id)
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoodCardGroup;
