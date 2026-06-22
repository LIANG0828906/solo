import { useState, useEffect } from 'react';
import type { ExperienceItem } from '../types';

interface TimelineCardProps {
  item: ExperienceItem;
  isFirst: boolean;
}

export function TimelineCard({ item }: TimelineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (expanded) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 220);
      return () => clearTimeout(t);
    }
  }, [expanded]);

  const dateRange =
    item.startDate && item.endDate
      ? `${item.startDate} ~ ${item.endDate}`
      : item.startDate || item.endDate || '未标注';

  return (
    <div className="timeline-node">
      <div className="timeline-date">{dateRange}</div>
      <div className="timeline-dot" />
      <div
        className={`timeline-card ${expanded ? 'expanded' : ''} ${
          flash ? 'expanded-flash' : ''
        }`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="timeline-header">
          <h4 className="timeline-position">{item.position}</h4>
          <p className="timeline-company">{item.company}</p>
        </div>
        {item.projects.length > 0 && (
          <div className="timeline-projects-tags">
            {item.projects.map((p, i) => (
              <span className="project-tag" key={i}>
                {p}
              </span>
            ))}
          </div>
        )}
        <div className="expand-hint">▼</div>
        <div className="timeline-body">
          <div className="timeline-body-content">
            {item.description || '（无详细描述）'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimelineCard;
