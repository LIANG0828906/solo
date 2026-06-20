import React, { useState } from 'react';
import { Record as RecordType } from '../types';

interface RecordCardProps {
  record: RecordType;
  isHighlighted: boolean;
  onClick: () => void;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
};

export const RecordCard: React.FC<RecordCardProps> = ({ record, isHighlighted, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    onClick();
  };

  return (
    <div
      className={`record-card ${isExpanded ? 'expanded' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      onClick={handleClick}
    >
      <div className="record-card-header">
        <span className="record-card-time">{formatTime(record.timestamp)}</span>
        <span className="record-card-expand">▼</span>
      </div>
      <div className="record-card-thumbnail">
        <img src={record.imageUrl} alt="" className="record-card-image" />
        <p className="record-card-description">{record.description}</p>
      </div>
      <div className="record-card-full">
        <img src={record.imageUrl} alt="" />
      </div>
    </div>
  );
};
