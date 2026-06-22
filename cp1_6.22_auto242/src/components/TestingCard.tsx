import React, { useState } from 'react';
import type { TestingRecord, Recipe } from '../types';

interface TestingCardProps {
  record: TestingRecord;
  recipe?: Recipe;
}

const TestingCard: React.FC<TestingCardProps> = ({ record, recipe }) => {
  const [expanded, setExpanded] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            style={{
              fontSize: '18px',
              color: star <= (hoveredStar || rating) ? '#C9A96E' : '#D4C5A9',
              transition: 'transform 0.3s ease, color 0.15s',
              transform: star <= (hoveredStar || rating) ? 'scale(1.2)' : 'scale(1)',
              cursor: 'default',
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        backgroundColor: '#FDFBF7',
        border: '1px solid #E0D6C8',
        borderRadius: '8px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(60,36,21,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '10px',
      }}>
        <div>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#3C2415',
            fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
            marginBottom: '4px',
          }}>
            {recipe?.name || '未知配方'}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
          }}>
            {record.date} · 试香 {record.duration}
          </div>
        </div>
        {renderStars(record.rating)}
      </div>

      <div style={{
        fontSize: '13px',
        color: '#8B7355',
        fontFamily: "'Inter', sans-serif",
        marginBottom: expanded ? '12px' : '0',
      }}>
        留香时长：{record.longevity}
      </div>

      {expanded && (
        <div style={{
          paddingTop: '12px',
          borderTop: '1px solid #E0D6C8',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#3C2415',
            fontFamily: "'Inter', sans-serif",
            marginBottom: '8px',
          }}>
            气味演变
          </div>
          <p style={{
            fontSize: '13px',
            color: '#5C4033',
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.6,
            margin: 0,
          }}>
            {record.evolution}
          </p>
        </div>
      )}

      {!expanded && (
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#C9A96E',
          fontFamily: "'Inter', sans-serif",
        }}>
          点击展开详情 →
        </div>
      )}
    </div>
  );
};

export default TestingCard;
