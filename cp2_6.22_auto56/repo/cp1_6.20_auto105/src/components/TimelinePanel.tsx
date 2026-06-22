import React from 'react';
import type { StoryboardCard } from '../types';

interface Props {
  cards: StoryboardCard[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  open?: boolean;
}

export const TimelinePanel: React.FC<Props> = ({ cards, selectedIdx, onSelect, open }) => {
  return (
    <aside className={`timeline-panel ${open ? 'open' : ''}`}>
      <h4 className="timeline-title">时间线 · Timeline</h4>
      <div className="tl">
        {cards.map((c, i) => (
          <div
            key={c.id}
            className={`tl-item ${i === selectedIdx ? 'active' : ''}`}
            onClick={() => onSelect(i)}
          >
            <div className="tl-thumb">
              {c.imageUrl ? <img src={c.imageUrl} alt="" loading="lazy" /> : null}
            </div>
            <div className="tl-meta">
              <div className="tt">{c.title || `卡片 ${i + 1}`}</div>
              <div className="td">{c.description.slice(0, 24) || '未设置描述'}</div>
            </div>
            <span className="tl-no">{String(i + 1).padStart(2, '0')}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};
