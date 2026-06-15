import React from 'react';
import type { PlantRecord } from './types';
import { groupRecordsByDate, RECORD_META } from './utils';

interface TimelineProps {
  records: PlantRecord[];
  onDelete?: (recordId: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ records, onDelete }) => {
  const groups = groupRecordsByDate(records);

  if (groups.length === 0) {
    return (
      <div className="timeline-empty">
        <div className="timeline-empty-icon">🌱</div>
        <p>还没有记录，开始第一笔观察吧～</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {groups.map(group => (
        <div key={group.dateKey} className="timeline-group">
          <div className="timeline-date">
            <span className="timeline-date-dot" />
            {group.dateLabel}
          </div>
          <div className="timeline-list">
            {group.records.map((record, idx) => {
              const meta = RECORD_META[record.type];
              return (
                <div
                  key={record.id}
                  className="timeline-item slide-in"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="timeline-line" />
                  <div className="timeline-icon" style={{ background: meta.color }}>
                    {meta.icon}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-type" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="timeline-time">
                        {new Date(record.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {onDelete && (
                        <button
                          className="timeline-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(record.id);
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {record.note && <p className="timeline-note">{record.note}</p>}
                    {record.photo && (
                      <img
                        src={record.photo}
                        alt="记录照片"
                        className="timeline-photo"
                        loading="lazy"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
