import React from 'react';
import { EmotionRecord } from '@/shared/types';
import { getEmotionEmoji } from './emotionMap';

interface Props {
  record: EmotionRecord;
  index: number;
}

export const ColorRecord: React.FC<Props> = ({ record, index }) => {
  const emoji = getEmotionEmoji(record.emotion);

  return (
    <div
      className="color-record-card"
      style={{
        background: `linear-gradient(135deg, ${record.color}30, ${record.color}10)`,
        borderLeft: `4px solid ${record.color}`,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div className="record-header">
        <div className="record-color-block" style={{ background: record.color }} />
        <div className="record-meta">
          <span className="record-date">{record.date}</span>
          <span className="record-emotion">{emoji} {record.emotion}</span>
        </div>
      </div>
      {record.note && (
        <p className="record-note">"{record.note}"</p>
      )}
      <div className="record-intensity">
        <div className="intensity-bar-bg">
          <div
            className="intensity-bar-fill"
            style={{
              width: `${record.intensity}%`,
              background: `linear-gradient(90deg, ${record.color}80, ${record.color})`,
            }}
          />
        </div>
        <span className="intensity-label">强度 {record.intensity}%</span>
      </div>
    </div>
  );
};
