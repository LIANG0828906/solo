import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight } from 'lucide-react';
import ProgressRing from './ProgressRing';
import type { Goal } from '../types';
import { formatMinutes } from '../utils';

interface Props {
  goal: Goal;
  onClick?: () => void;
}

const GoalCard: React.FC<Props> = React.memo(({ goal, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const plannedMin = goal.totalPlannedHours * 60;
  const progress = plannedMin > 0 ? Math.min((goal.accumulatedMinutes / plannedMin) * 100, 100) : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="glass goal-card"
      onClick={onClick}
    >
      <div className="goal-card-inner">
        <button
          className="drag-handle"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="拖拽排序"
        >
          <GripVertical size={18} />
        </button>

        <ProgressRing progress={progress} size={76} strokeWidth={7} />

        <div className="goal-info">
          <h3 className="goal-name">{goal.name}</h3>
          <div className="goal-stats">
            <span className="stat-current">
              {formatMinutes(goal.accumulatedMinutes)}
            </span>
            <span className="stat-sep">/</span>
            <span className="stat-total">{goal.totalPlannedHours} 小时</span>
          </div>
          <div className="goal-daily">
            每日目标 {goal.dailyGoalMinutes} 分钟
          </div>
        </div>

        <div className="goal-arrow">
          <ChevronRight size={20} />
        </div>
      </div>

      <style>{`
        .goal-card {
          border-radius: 20px;
          padding: 20px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease;
          user-select: none;
        }
        .goal-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.25);
        }
        .goal-card-inner {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .drag-handle {
          background: rgba(255,255,255,0.6);
          border: none;
          border-radius: 8px;
          padding: 6px;
          cursor: grab;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .drag-handle:hover {
          background: rgba(102, 126, 234, 0.15);
          color: #667eea;
        }
        .drag-handle:active {
          cursor: grabbing;
        }
        .goal-info {
          flex: 1;
          min-width: 0;
        }
        .goal-name {
          font-size: 17px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .goal-stats {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 4px;
        }
        .stat-current {
          font-size: 15px;
          font-weight: 700;
          color: #667eea;
        }
        .stat-sep {
          color: #9ca3af;
          font-size: 13px;
        }
        .stat-total {
          font-size: 13px;
          color: #6b7280;
        }
        .goal-daily {
          font-size: 12px;
          color: #9ca3af;
        }
        .goal-arrow {
          color: #9ca3af;
          transition: transform 0.3s ease, color 0.3s ease;
          flex-shrink: 0;
        }
        .goal-card:hover .goal-arrow {
          transform: translateX(4px);
          color: #667eea;
        }
        @media (max-width: 768px) {
          .goal-card {
            padding: 14px;
          }
          .goal-card-inner {
            gap: 12px;
          }
          .goal-name {
            font-size: 15px;
          }
          .drag-handle {
            padding: 4px;
          }
        }
      `}</style>
    </div>
  );
});

GoalCard.displayName = 'GoalCard';
export default GoalCard;
