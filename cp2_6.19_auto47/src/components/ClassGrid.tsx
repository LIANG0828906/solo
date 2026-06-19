import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ClassCard } from './ClassCard';
import { CreateClassModal } from './CreateClassModal';

interface ClassGridProps {
  onSelectClass: (classId: string) => void;
}

export const ClassGrid: React.FC<ClassGridProps> = ({ onSelectClass }) => {
  const classes = useStore((state) => state.classes);
  const submissions = useStore((state) => state.submissions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassId, setNewClassId] = useState<string | null>(null);

  const getPendingCount = (classId: string) => {
    return submissions.filter(
      (s) => s.classId === classId && s.score === null
    ).length;
  };

  const handleAddClass = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      if (classes.length > 0) {
        setNewClassId(classes[classes.length - 1].id);
        setTimeout(() => setNewClassId(null), 500);
      }
    }, 100);
  };

  return (
    <div className="class-grid-page">
      <header className="page-header">
        <h1 className="page-title">作业批改与反馈系统</h1>
        <p className="page-subtitle">管理班级作业，高效批改反馈</p>
      </header>

      <div className="class-grid-toolbar">
        <h2 className="section-title">我的班级</h2>
        <button className="add-class-btn" onClick={handleAddClass}>
          <span className="plus-icon">+</span>
          创建班级
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>还没有班级</h3>
          <p>点击上方"创建班级"按钮开始使用</p>
        </div>
      ) : (
        <div className="class-grid">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              classData={cls}
              pendingCount={getPendingCount(cls.id)}
              onClick={() => onSelectClass(cls.id)}
              isNew={cls.id === newClassId}
            />
          ))}
        </div>
      )}

      <CreateClassModal isOpen={isModalOpen} onClose={handleCloseModal} />

      <style>{`
        .class-grid-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 700;
          color: #333;
          margin-bottom: 8px;
        }

        .page-subtitle {
          font-size: 16px;
          color: #888;
        }

        .class-grid-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }

        .add-class-btn {
          background: linear-gradient(135deg, #4a90d9, #3a7bc8);
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .add-class-btn:hover {
          background: linear-gradient(135deg, #3a7bc8, #2e6bb0);
          transform: translateY(-1px);
        }

        .plus-icon {
          font-size: 18px;
          line-height: 1;
        }

        .class-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 20px;
          color: #555;
          margin-bottom: 8px;
        }

        .empty-state p {
          font-size: 14px;
          color: #999;
        }

        @media (max-width: 768px) {
          .class-grid-page {
            padding: 20px 16px;
          }

          .page-title {
            font-size: 24px;
          }

          .class-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
