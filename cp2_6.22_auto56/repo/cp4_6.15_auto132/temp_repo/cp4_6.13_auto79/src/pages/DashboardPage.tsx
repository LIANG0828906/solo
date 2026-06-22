import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi, type Project, type User } from '../api';
import '../styles/dashboard.css';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
}

function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const loadProjects = async () => {
    try {
      const data = await projectApi.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('加载项目失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const project = await projectApi.createProject(newProjectName.trim());
      setShowCreateModal(false);
      setNewProjectName('');
      navigate(`/project/${project.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9l6 3-6 3V9z" fill="currentColor" />
            </svg>
            <span>ShotBoard Studio</span>
          </div>
        </div>
        <div className="header-right">
          <span className="user-email">{user.email}</span>
          <button className="logout-btn" onClick={onLogout}>
            退出登录
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-header-section">
          <h1 className="dashboard-title">我的项目</h1>
          <button
            className="create-project-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新建项目
          </button>
        </div>

        {loading ? (
          <div className="loading-state">加载中...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9l6 3-6 3V9z" fill="currentColor" />
              </svg>
            </div>
            <h3>还没有项目</h3>
            <p>创建你的第一个镜头序列项目，开始创作</p>
            <button
              className="empty-create-btn"
              onClick={() => setShowCreateModal(true)}
            >
              创建项目
            </button>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <div className="project-card-preview">
                  <div className="preview-pattern">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="preview-cell"></div>
                    ))}
                  </div>
                </div>
                <div className="project-card-info">
                  <h3 className="project-name">{project.name}</h3>
                  <p className="project-meta">
                    最后编辑：{formatDate(project.lastEditedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-content modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">新建项目</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">项目名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="输入项目名称"
                  autoFocus
                  maxLength={50}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating || !newProjectName.trim()}
                >
                  {creating ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
