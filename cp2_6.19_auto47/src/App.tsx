import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from './store/useStore';
import { ClassGrid } from './components/ClassGrid';
import { 作业列表面板 } from './components/作业列表面板';
import { GradingEditor } from './components/GradingEditor';
import { 班级统计面板 } from './components/班级统计面板';
import { AddSubmissionModal } from './components/AddSubmissionModal';

function App() {
  const currentClassId = useStore((state) => state.currentClassId);
  const currentSubmissionId = useStore((state) => state.currentSubmissionId);
  const setCurrentClass = useStore((state) => state.setCurrentClass);
  const setCurrentSubmission = useStore((state) => state.setCurrentSubmission);
  const submissions = useStore((state) => state.submissions);
  const getSubmissionById = useStore((state) => state.getSubmissionById);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'editor'>('list');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const classSubmissions = useMemo(() => {
    if (!currentClassId) return [];
    return submissions
      .filter((s) => s.classId === currentClassId)
      .sort((a, b) => b.submittedAt - a.submittedAt);
  }, [currentClassId, submissions]);

  const currentSubmission = useMemo(() => {
    if (!currentSubmissionId) return null;
    return getSubmissionById(currentSubmissionId) ?? null;
  }, [currentSubmissionId, getSubmissionById]);

  const studentHistory = useMemo(() => {
    if (!currentSubmission || !currentClassId) return [];
    return submissions
      .filter(
        (s) =>
          s.classId === currentClassId &&
          s.studentName === currentSubmission.studentName
      )
      .sort((a, b) => b.submittedAt - a.submittedAt);
  }, [currentSubmission, currentClassId, submissions]);

  const handleSelectClass = (classId: string) => {
    setCurrentClass(classId);
    setCurrentSubmission(null);
  };

  const handleBackToList = () => {
    setCurrentClass(null);
    setCurrentSubmission(null);
  };

  const handleSelectSubmission = (id: string) => {
    setCurrentSubmission(id);
    if (isMobile) {
      setMobileTab('editor');
    }
  };

  const handleAddSubmission = () => {
    setIsAddModalOpen(true);
  };

  if (!currentClassId) {
    return <ClassGrid onSelectClass={handleSelectClass} />;
  }

  return (
    <div className="app-container">
      {isMobile ? (
        <div className="mobile-layout">
          <div className="mobile-tabs">
            <button
              className={`mobile-tab ${mobileTab === 'list' ? 'active' : ''}`}
              onClick={() => setMobileTab('list')}
            >
              作业列表
            </button>
            <button
              className={`mobile-tab ${mobileTab === 'editor' ? 'active' : ''}`}
              onClick={() => setMobileTab('editor')}
              disabled={!currentSubmission}
            >
              批改
            </button>
          </div>
          <div className="mobile-content">
            {mobileTab === 'list' ? (
              <>
                <班级统计面板 submissions={classSubmissions} />
                <作业列表面板
                  submissions={classSubmissions}
                  currentSubmissionId={currentSubmissionId}
                  onSelect={handleSelectSubmission}
                  onAddClick={handleAddSubmission}
                  onBackClick={handleBackToList}
                />
              </>
            ) : currentSubmission ? (
              <GradingEditor
                submission={currentSubmission}
                studentHistory={studentHistory}
              />
            ) : (
              <div className="empty-editor-hint">
                <p>请从左侧列表选择一份作业开始批改</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="desktop-layout">
          <作业列表面板
            submissions={classSubmissions}
            currentSubmissionId={currentSubmissionId}
            onSelect={handleSelectSubmission}
            onAddClick={handleAddSubmission}
            onBackClick={handleBackToList}
          />
          <div className="main-content">
            <班级统计面板 submissions={classSubmissions} />
            {currentSubmission ? (
              <GradingEditor
                submission={currentSubmission}
                studentHistory={studentHistory}
              />
            ) : (
              <div className="empty-editor">
                <div className="empty-editor-icon">📝</div>
                <h3>选择一份作业开始批改</h3>
                <p>从左侧列表中点击作业卡片即可开始批改</p>
              </div>
            )}
          </div>
        </div>
      )}

      <AddSubmissionModal
        isOpen={isAddModalOpen}
        classId={currentClassId}
        onClose={() => setIsAddModalOpen(false)}
      />

      <style>{`
        .app-container {
          min-height: 100vh;
          background: #f5f5f5;
        }

        .desktop-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }

        .empty-editor {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #999;
          padding: 40px;
        }

        .empty-editor-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .empty-editor h3 {
          font-size: 20px;
          color: #555;
          margin-bottom: 8px;
        }

        .empty-editor p {
          font-size: 14px;
          color: #999;
        }

        .mobile-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }

        .mobile-tabs {
          display: flex;
          background: #fff;
          border-bottom: 1px solid #e5e5e5;
        }

        .mobile-tab {
          flex: 1;
          padding: 12px;
          background: none;
          border: none;
          font-size: 14px;
          color: #888;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .mobile-tab.active {
          color: #4a90d9;
          border-bottom-color: #4a90d9;
        }

        .mobile-tab:disabled {
          color: #ccc;
          cursor: not-allowed;
        }

        .mobile-content {
          flex: 1;
          overflow: hidden;
        }

        .empty-editor-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #999;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default App;
