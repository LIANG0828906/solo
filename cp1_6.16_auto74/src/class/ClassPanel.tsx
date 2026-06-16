import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ClassCard } from '../components/ClassCard';
import { Modal } from '../components/Modal';
import '../styles/ClassPanel.css';

export function ClassPanel() {
  const { classes, currentUser, createClass, joinClass } = useApp();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classId, setClassId] = useState('');

  const handleCreateClass = () => {
    if (className.trim()) {
      createClass(className.trim());
      setClassName('');
      setShowCreateModal(false);
    }
  };

  const handleJoinClass = () => {
    if (classId.trim()) {
      joinClass(classId.trim());
      setClassId('');
      setShowJoinModal(false);
    }
  };

  const userClasses = classes.filter((c) =>
    c.members.includes(currentUser?.id || '')
  );

  return (
    <div className="class-panel page-enter">
      <div className="class-panel__header">
        <div>
          <h1 className="class-panel__title">我的班级</h1>
          <p className="class-panel__subtitle">
            {currentUser?.role === 'teacher' ? '管理你的班级和任务' : '查看你加入的班级'}
          </p>
        </div>
        {currentUser?.role === 'teacher' && (
          <div className="class-panel__actions">
            <button
              className="btn btn--primary"
              onClick={() => setShowCreateModal(true)}
            >
              创建班级
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => setShowJoinModal(true)}
            >
              加入班级
            </button>
          </div>
        )}
      </div>

      {userClasses.length === 0 ? (
        <div className="class-panel__empty">
          <div className="class-panel__empty-icon">📚</div>
          <h2 className="class-panel__empty-title">还没有加入任何班级</h2>
          <p className="class-panel__empty-text">
            {currentUser?.role === 'teacher'
              ? '创建一个新班级开始你的教学之旅'
              : '请加入班级开始学习'}
          </p>
          {currentUser?.role === 'teacher' && (
            <button
              className="btn btn--primary"
              onClick={() => setShowCreateModal(true)}
            >
              创建班级
            </button>
          )}
        </div>
      ) : (
        <div className="class-panel__grid">
          {userClasses.map((classItem, index) => (
            <div key={classItem.id} style={{ animationDelay: `${index * 0.1}s` }} className="breathe-in">
              <ClassCard
                classItem={classItem}
                onClick={() => navigate(`/class/${classItem.id}`)}
              />
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建新班级"
      >
        <div className="form-group">
          <label className="form-label">班级名称</label>
          <input
            type="text"
            className="form-input"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="请输入班级名称"
            autoFocus
          />
        </div>
        <div className="form-actions">
          <button
            className="btn btn--secondary"
            onClick={() => setShowCreateModal(false)}
          >
            取消
          </button>
          <button
            className="btn btn--primary"
            onClick={handleCreateClass}
            disabled={!className.trim()}
          >
            创建
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="加入班级"
      >
        <div className="form-group">
          <label className="form-label">班级ID</label>
          <input
            type="text"
            className="form-input"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            placeholder="请输入班级ID"
            autoFocus
          />
        </div>
        <div className="form-actions">
          <button
            className="btn btn--secondary"
            onClick={() => setShowJoinModal(false)}
          >
            取消
          </button>
          <button
            className="btn btn--primary"
            onClick={handleJoinClass}
            disabled={!classId.trim()}
          >
            加入
          </button>
        </div>
      </Modal>
    </div>
  );
}
