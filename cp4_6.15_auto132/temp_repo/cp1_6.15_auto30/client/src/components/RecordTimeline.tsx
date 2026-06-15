import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, Clock, MessageSquare } from 'lucide-react';
import type { StudyRecord } from '../types';
import { formatTime, formatMinutes } from '../utils';

interface Props {
  records: StudyRecord[];
  onEdit: (record: StudyRecord) => void;
  onDelete: (id: string) => void;
}

interface ItemState {
  deleting: boolean;
}

const RecordTimeline: React.FC<Props> = ({ records, onEdit, onDelete }) => {
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});

  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      ),
    [records]
  );

  const handleDelete = (id: string) => {
    setItemStates((prev) => ({ ...prev, [id]: { deleting: true } }));
    setTimeout(() => onDelete(id), 320);
  };

  if (sortedRecords.length === 0) {
    return (
      <div className="empty-state">
        <Clock size={40} />
        <p>今日还没有学习记录</p>
        <span>点击下方「开始学习」创建第一条记录</span>
      </div>
    );
  }

  return (
    <div className="timeline">
      {sortedRecords.map((record) => {
        const isDeleting = itemStates[record.id]?.deleting;
        return (
          <div
            key={record.id}
            className={`timeline-item ${isDeleting ? 'deleting' : ''}`}
          >
            <div className="timeline-dot" />
            <div className="timeline-line" />
            <div className="timeline-card glass">
              <div className="timeline-header">
                <div className="timeline-time">
                  <span className="time-start">{formatTime(record.startTime)}</span>
                  <span className="time-arrow">→</span>
                  <span className="time-end">{formatTime(record.endTime)}</span>
                </div>
                <div className="timeline-duration">
                  {formatMinutes(record.durationMinutes)}
                </div>
              </div>
              {record.note && (
                <div className="timeline-note">
                  <MessageSquare size={14} />
                  <span>{record.note}</span>
                </div>
              )}
              <div className="timeline-actions">
                <button className="action-btn edit" onClick={() => onEdit(record)}>
                  <Pencil size={14} />
                  编辑
                </button>
                <button className="action-btn delete" onClick={() => handleDelete(record.id)}>
                  <Trash2 size={14} />
                  删除
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        .timeline {
          position: relative;
          padding-left: 28px;
        }
        .timeline-item {
          position: relative;
          padding-bottom: 20px;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .timeline-item.deleting {
          opacity: 0;
          transform: scale(0.85) translateX(-20px);
          margin-bottom: -80px;
          pointer-events: none;
        }
        .timeline-dot {
          position: absolute;
          left: -28px;
          top: 18px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
          z-index: 2;
        }
        .timeline-line {
          position: absolute;
          left: -23px;
          top: 30px;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, rgba(102, 126, 234, 0.4), transparent);
        }
        .timeline-item:last-child .timeline-line {
          display: none;
        }
        .timeline-card {
          border-radius: 14px;
          padding: 14px 16px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .timeline-card:hover {
          transform: translateX(4px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.18);
        }
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .timeline-time {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          color: #374151;
          font-weight: 600;
        }
        .time-arrow {
          color: #9ca3af;
        }
        .timeline-duration {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
        }
        .timeline-note {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 10px;
          padding: 8px 10px;
          background: rgba(102, 126, 234, 0.06);
          border-radius: 8px;
        }
        .timeline-note svg {
          flex-shrink: 0;
          margin-top: 1px;
          color: #667eea;
        }
        .timeline-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-btn.edit {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }
        .action-btn.edit:hover {
          background: rgba(102, 126, 234, 0.2);
        }
        .action-btn.delete {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .action-btn.delete:hover {
          background: rgba(239, 68, 68, 0.2);
        }
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #9ca3af;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .empty-state svg {
          opacity: 0.5;
          margin-bottom: 8px;
        }
        .empty-state p {
          font-size: 15px;
          color: #6b7280;
          font-weight: 500;
        }
        .empty-state span {
          font-size: 13px;
        }
        @media (max-width: 768px) {
          .timeline {
            padding-left: 20px;
          }
          .timeline-time {
            font-size: 12px;
          }
          .timeline-duration {
            font-size: 11px;
            padding: 3px 8px;
          }
          .timeline-note {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default RecordTimeline;
