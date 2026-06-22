import { useState } from 'react';
import { Skill } from '../store';

interface SkillCardProps {
  skill: Skill;
  onEdit?: (skill: Skill) => void;
  onDelete?: (skill: Skill) => void;
  onViewHistory?: (skill: Skill) => void;
  onBook?: (skill: Skill) => void;
  showActions?: boolean;
  index?: number;
}

const skillColors: Record<string, string> = {
  '吉他': '#f97316',
  '钢琴': '#f97316',
  '音乐': '#f97316',
  '编程': '#3b82f6',
  '前端': '#3b82f6',
  '后端': '#3b82f6',
  '外语': '#10b981',
  '英语': '#10b981',
  '日语': '#10b981',
  '手工': '#8b5cf6',
  '绘画': '#8b5cf6',
  '设计': '#8b5cf6',
  '运动': '#ec4899',
  '健身': '#ec4899',
  '摄影': '#f59e0b',
  '写作': '#6366f1',
  '数学': '#14b8a6',
  '物理': '#14b8a6',
};

const getSkillColor = (type: string) => {
  return skillColors[type] || '#6b7280';
};

function SkillCard({ skill, onEdit, onDelete, onViewHistory, onBook, showActions = true, index = 0 }: SkillCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const timeSlots = typeof skill.time_slots === 'string'
    ? JSON.parse(skill.time_slots || '[]')
    : skill.time_slots;

  const formatTimeSlots = (slots: any[]) => {
    if (!slots || slots.length === 0) return '暂无时间';
    return slots.map((slot, i) => (
      <span key={i} className="time-tag">
        {slot.day} {slot.startTime}-{slot.endTime}
      </span>
    ));
  };

  return (
    <div
      className={`skill-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="skill-card-header">
        <span
          className="skill-tag"
          style={{ backgroundColor: `${getSkillColor(skill.skill_type)}15`, color: getSkillColor(skill.skill_type), borderColor: `${getSkillColor(skill.skill_type)}30` }}
        >
          {skill.skill_type}
        </span>
        {skill.status === 'inactive' && <span className="status-tag inactive">已下架</span>}
      </div>

      <h4 className="skill-name">{skill.skill_name}</h4>
      
      {skill.description && (
        <p className="skill-desc">{skill.description}</p>
      )}

      <div className="time-slots">
        {formatTimeSlots(timeSlots)}
      </div>

      {skill.requirement && (
        <div className="skill-requirement">
          <span className="req-label">要求：</span>
          {skill.requirement}
        </div>
      )}

      {showActions && (
        <div className={`action-menu ${isHovered ? 'visible' : ''}`}>
          {onEdit && (
            <button className="action-btn edit" onClick={() => onEdit(skill)}>
              编辑
            </button>
          )}
          {onDelete && (
            <button className="action-btn delete" onClick={() => onDelete(skill)}>
              下架
            </button>
          )}
          {onViewHistory && (
            <button className="action-btn history" onClick={() => onViewHistory(skill)}>
              历史
            </button>
          )}
          {onBook && (
            <button className="action-btn book" onClick={() => onBook(skill)}>
              预约
            </button>
          )}
        </div>
      )}

      <style>{`
        .skill-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid var(--border-color);
          transition: all var(--transition-fast);
          position: relative;
          overflow: hidden;
          animation: slideInLeft 0.3s ease backwards;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .skill-card.hovered {
          border-color: var(--accent-purple);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .skill-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .skill-tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid;
        }

        .status-tag {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
        }

        .status-tag.inactive {
          background: #fef3c7;
          color: #d97706;
        }

        .skill-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .skill-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .time-slots {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }

        .time-tag {
          display: inline-block;
          padding: 4px 10px;
          background: var(--bg-secondary);
          border-radius: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .skill-requirement {
          font-size: 12px;
          color: var(--text-secondary);
          padding-top: 10px;
          border-top: 1px dashed var(--border-color);
        }

        .req-label {
          font-weight: 500;
          color: var(--text-primary);
        }

        .action-menu {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          pointer-events: none;
          transition: opacity var(--transition-fast);
          border-radius: 16px;
        }

        .action-menu.visible {
          opacity: 1;
          pointer-events: auto;
        }

        .action-btn {
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid;
          background: white;
        }

        .action-btn.edit {
          color: var(--accent-blue);
          border-color: var(--accent-blue);
        }

        .action-btn.edit:hover {
          background: var(--accent-blue);
          color: white;
        }

        .action-btn.delete {
          color: var(--accent-red);
          border-color: var(--accent-red);
        }

        .action-btn.delete:hover {
          background: var(--accent-red);
          color: white;
        }

        .action-btn.history {
          color: var(--accent-purple);
          border-color: var(--accent-purple);
        }

        .action-btn.history:hover {
          background: var(--accent-purple);
          color: white;
        }

        .action-btn.book {
          color: var(--accent-green);
          border-color: var(--accent-green);
        }

        .action-btn.book:hover {
          background: var(--accent-green);
          color: white;
        }

        @media (max-width: 768px) {
          .action-menu {
            position: static;
            background: none;
            backdrop-filter: none;
            opacity: 1;
            pointer-events: auto;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--border-color);
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export default SkillCard;
