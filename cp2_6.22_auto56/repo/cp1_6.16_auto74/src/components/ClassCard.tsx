import React from 'react';
import { getGradientColors } from '../utils/colorHash';
import { formatDate } from '../utils/dateUtils';
import type { ClassItem } from '../types';
import '../styles/ClassCard.css';

interface ClassCardProps {
  classItem: ClassItem;
  onClick?: () => void;
}

export function ClassCard({ classItem, onClick }: ClassCardProps) {
  const [colorStart, colorEnd] = getGradientColors(classItem.name);
  const firstChar = classItem.name.charAt(0);

  return (
    <div className="class-card" onClick={onClick}>
      <div
        className="class-card__avatar"
        style={{
          background: `linear-gradient(135deg, ${colorStart}, ${colorEnd})`,
        }}
      >
        <span className="class-card__avatar-text">{firstChar}</span>
      </div>
      <div className="class-card__content">
        <h3 className="class-card__name">{classItem.name}</h3>
        <div className="class-card__meta">
          <span className="class-card__meta-item">
            创建于 {formatDate(classItem.createdAt)}
          </span>
          <span className="class-card__meta-item">
            {classItem.memberCount} 名成员
          </span>
        </div>
      </div>
    </div>
  );
}
