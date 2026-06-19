import React from 'react';
import type { ClassEntity } from '../types';
import { useStore } from '../store/useStore';

interface ClassCardProps {
  classData: ClassEntity;
  pendingCount: number;
  onClick: () => void;
  isNew?: boolean;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  classData,
  pendingCount,
  onClick,
  isNew = false,
}) => {
  const deleteClass = useStore((state) => state.deleteClass);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除班级"${classData.name}"吗？所有作业数据也将被删除。`)) {
      deleteClass(classData.id);
    }
  };

  return (
    <div
      className={`class-card ${isNew ? 'scale-in' : ''}`}
      onClick={onClick}
    >
      <div className="class-card-header">
        <h3 className="class-card-title">{classData.name}</h3>
        <button className="class-card-delete" onClick={handleDelete}>
          ×
        </button>
      </div>
      <div className="class-card-stats">
        <div className="stat-item">
          <span className="stat-value">{classData.studentNames.length}</span>
          <span className="stat-label">学生人数</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value highlight">{pendingCount}</span>
          <span className="stat-label">待批改</span>
        </div>
      </div>
      <div className="class-card-footer">
        <span className="create-time">
          创建于 {new Date(classData.createdAt).toLocaleDateString('zh-CN')}
        </span>
      </div>

      <style>{`
        .class-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .class-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .class-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .class-card-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .class-card-delete {
          background: none;
          border: none;
          font-size: 20px;
          color: #999;
          cursor: pointer;
          padding: 0 6px;
          line-height: 1;
        }

        .class-card-delete:hover {
          color: #ff6b6b;
        }

        .class-card-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 16px;
          padding: 16px 0;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #333;
        }

        .stat-value.highlight {
          color: #ff8c42;
        }

        .stat-label {
          font-size: 12px;
          color: #888;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: #e0e0e0;
        }

        .class-card-footer {
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }

        .create-time {
          font-size: 12px;
          color: #aaa;
        }
      `}</style>
    </div>
  );
};
