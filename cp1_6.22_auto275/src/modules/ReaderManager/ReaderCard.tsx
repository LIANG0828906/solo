import React from 'react';
import { Reader } from '@/types';

interface ReaderCardProps {
  reader: Reader;
  active?: boolean;
  onClick?: (reader: Reader) => void;
}

const ReaderCard: React.FC<ReaderCardProps> = ({ reader, active, onClick }) => {
  return (
    <div 
      className={`reader-card ${active ? 'active' : ''}`} 
      onClick={() => onClick?.(reader)}
    >
      <div className="reader-name">{reader.name}</div>
      <div className="reader-tags">
        <span className="reader-tag borrow">
          借阅 {reader.borrowCount} 次
        </span>
        {reader.overdueCount > 0 && (
          <span className="reader-tag overdue">
            逾期 {reader.overdueCount} 次
          </span>
        )}
      </div>
      {reader.preferredCategories.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>偏好分类</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {reader.preferredCategories.slice(0, 2).map((cat, idx) => (
              <span 
                key={idx} 
                style={{ 
                  fontSize: 10, 
                  padding: '2px 6px', 
                  background: '#F5F0E8', 
                  color: '#C49A6C', 
                  borderRadius: 4 
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderCard;
