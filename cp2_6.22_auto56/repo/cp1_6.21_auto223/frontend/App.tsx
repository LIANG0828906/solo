import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Board from './Board';
import ProjectDetail from './ProjectDetail';
import Login from './Login';
import { useApp } from './context';

const TopBar: React.FC = () => {
  const { projects, currentProject, setCurrentProject, currentUser, setCurrentUser, refreshProjects } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState<'board' | 'detail'>('board');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', deadline: '' });
  const { createProject } = useApp();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject(formData);
    setShowProjectModal(false);
    setFormData({ name: '', description: '', deadline: '' });
    refreshProjects();
  };

  return (
    <>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1>
            <span className="accent">◆</span> 项目看板
          </h1>
          <select
            className="project-select"
            value={currentProject?.id || ''}
            onChange={(e) => {
              const p = projects.find((x) => x.id === e.target.value);
              setCurrentProject(p || null);
            }}
          >
            {projects.length === 0 && <option value="">暂无项目</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button onClick={() => setShowProjectModal(true)}>+ 新建项目</button>
        </div>
        <div className="top-bar-actions">
          {currentProject && (
            <div className="nav-tabs">
              <button
                className={`nav-tab ${view === 'board' ? 'active' : ''}`}
                onClick={() => {
                  setView('board');
                  navigate('/');
                }}
              >
                看板
              </button>
              <button
                className={`nav-tab ${view === 'detail' ? 'active' : ''}`}
                onClick={() => {
                  setView('detail');
                  navigate(`/project/${currentProject.id}`);
                }}
              >
                项目详情
              </button>
            </div>
          )}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="member-avatar">{currentUser.avatar}</div>
              <span style={{ fontSize: 13 }}>{currentUser.username}</span>
              <button onClick={() => setCurrentUser(null)}>退出</button>
            </div>
          ) : (
            <button className="accent" onClick={() => navigate('/login')}>
              登录
            </button>
          )}
        </div>
      </div>

      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">新建项目</h3>
              <button className="modal-close" onClick={() => setShowProjectModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>项目名称 *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入项目名称"
                />
              </div>
              <div className="form-group">
                <label>项目描述（最多200字）</label>
                <textarea
                  rows={3}
                  maxLength={200}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="简要描述项目目标"
                />
              </div>
              <div className="form-group">
                <label>截止日期</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowProjectModal(false)}>
                  取消
                </button>
                <button type="submit" className="accent">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const App: React.FC = () => {
  const { currentUser } = useApp();

  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <>
              <TopBar />
              <div className="main-content">
                <Routes>
                  <Route path="/" element={<Board />} />
                  <Route path="/project/:id" element={<ProjectDetail />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
