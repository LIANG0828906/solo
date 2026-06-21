import React from 'react';
import type { Schedule } from '../types';
import ScheduleCard from './ScheduleCard';

interface DayDetailModalProps {
  isOpen: boolean;
  date: string;
  schedules: Schedule[];
  onClose: () => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onDragStart: (e: React.DragEvent, schedule: Schedule) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({
  isOpen,
  date,
  schedules,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
  onDragStart,
  onDragEnd
}) => {
  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
  };

  const sortedSchedules = [...schedules].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal day-detail-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{formatDate(date)} · 日程详情</h3>
        <div className="schedule-list">
          {sortedSchedules.length === 0 ? (
            <div className="empty-state">当天暂无日程</div>
          ) : (
            sortedSchedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleComplete={onToggleComplete}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            ))
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;
