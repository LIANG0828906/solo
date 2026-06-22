import React, { useState, useEffect } from 'react';
import { useProjectStore } from './store/projectStore';
import { ProjectList } from './components/ProjectList';
import { StepEditor } from './components/StepEditor';
import { TimelineReview } from './components/TimelineReview';
import { formatDate, getProjectColor } from './utils';
import type { Project, ViewMode } from './types';

interface CreateModalState {
  open: boolean;
  name: string;
  coverDescription: string;
  errors: { name?: string };
}

function App() {
  const { projects, fetchProjects, createProject, deleteProject, loading } = useProjectStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createModal, setCreateModal] = useState<CreateModalState>({
    open: false,
    name: '',
    coverDescription: '',
    errors: {}
  });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const currentProject = currentProjectId
    ? projects.find(p => p.id === currentProjectId) || null
    : null;

  const handleSelectProject = (project: Project) => {
    setCurrentProjectId(project.id);
    setViewMode('detail');
    setSidebarOpen(false);
  };

  const handleOpenCreateModal = () => {
    setCreateModal({
      open: true,
      name: '',
      coverDescription: '',
      errors: {}
    });
    setSidebarOpen(false);
  };

  const handleCloseCreateModal = () => {
    setCreateModal({ open: false, name: '', coverDescription: '', errors: {} });
  };

  const handleCreateProject = async () => {
    if (!createModal.name.trim()) {
      setCreateModal(prev => ({
        ...prev,
        errors: { name: '请输入项目名称' }
      }));
      return;
    }

    const newProject = await createProject(
      createModal.name.trim(),
      createModal.coverDescription.trim()
    );

    if (newProject) {
      setCurrentProjectId(newProject.id);
      setViewMode('detail');
      handleCloseCreateModal();
    }
  };

  const handleDeleteProject = async () => {
    if (!currentProject) return;
    if (!confirm(`确定要删除项目"${currentProject.name}"吗？此操作不可恢复。`)) return;

    const success = await deleteProject(currentProject.id);
    if (success) {
      setCurrentProjectId(null);
      setViewMode('list');
    }
  };

  const renderListPage = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">我的项目</h2>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          + 新建项目
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">加载中...</div>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧵</div>
          <div className="empty-state-text">还没有任何项目，开始记录你的第一件皮具作品吧！</div>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            创建第一个项目
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => handleSelectProject(project)}
            >
              <div
                className="project-card-cover"
                style={{
                  background: `linear-gradient(135deg, ${getProjectColor(project.createdAt)}, ${getProjectColor(project.createdAt + 100000)})`
                }}
              >
                🧶
              </div>
              <div className="project-card-body">
                <div className="project-card-title">{project.name}</div>
                <div className="project-card-time">
                  最后编辑: {formatDate(project.updatedAt)}
                </div>
                {project.coverDescription && (
                  <div className="project-card-desc">{project.coverDescription}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDetailPage = () => {
    if (!currentProject) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">❓</div>
          <div className="empty-state-text">项目不存在</div>
          <button className="btn btn-secondary" onClick={() => setViewMode('list')}>
            返回项目列表
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="project-detail-header">
          <div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginBottom: '12px' }}
              onClick={() => setViewMode('list')}
            >
              ← 返回列表
            </button>
            <h1 className="project-detail-title">{currentProject.name}</h1>
          </div>
          <div className="project-detail-actions">
            <button
              className={`btn ${viewMode === 'detail' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('detail')}
            >
              ✏️ 编辑
            </button>
            <button
              className={`btn ${viewMode === 'review' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('review')}
            >
              📊 复盘
            </button>
            <button className="btn btn-danger" onClick={handleDeleteProject}>
              🗑️ 删除
            </button>
          </div>
        </div>

        {currentProject.coverDescription && (
          <div className="project-description">
            💡 {currentProject.coverDescription}
          </div>
        )}

        {viewMode === 'detail' ? (
          <StepEditor projectId={currentProject.id} />
        ) : (
          <TimelineReview projectId={currentProject.id} />
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </button>
        <span className="mobile-title">🧵 皮具手作志</span>
      </div>

      <ProjectList
        currentProjectId={currentProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleOpenCreateModal}
        sidebarOpen={sidebarOpen}
      />

      <main className="main">
        {viewMode === 'list' ? renderListPage() : renderDetailPage()}
      </main>

      {createModal.open && (
        <div className="modal-overlay" onClick={handleCloseCreateModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">新建项目</h3>

            <div className="form-group">
              <label className="form-label">项目名称 *</label>
              <input
                type="text"
                className={`form-input ${createModal.errors.name ? 'error' : ''}`}
                value={createModal.name}
                onChange={e =>
                  setCreateModal(prev => ({
                    ...prev,
                    name: e.target.value,
                    errors: { ...prev.errors, name: undefined }
                  }))
                }
                placeholder="例如：植鞣皮短夹"
                autoFocus
              />
              {createModal.errors.name && (
                <div className="form-error">{createModal.errors.name}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">封面描述</label>
              <textarea
                className="form-textarea"
                value={createModal.coverDescription}
                onChange={e =>
                  setCreateModal(prev => ({ ...prev, coverDescription: e.target.value }))
                }
                placeholder="简单描述这个作品的设计理念、使用的皮料等..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleCloseCreateModal}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateProject}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
