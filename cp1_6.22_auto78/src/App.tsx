import { useState, useEffect } from 'react';
import ProjectList from './components/ProjectList';
import EditorPanel from './components/EditorPanel';

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  onlineCount: number;
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.sort((a: Project, b: Project) => b.createdAt - a.createdAt));
    } catch (e) {
      console.error('获取项目列表失败:', e);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name || name.length > 30) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const project = await res.json();
        setProjects(prev => [project, ...prev]);
        setActiveProjectId(project.id);
      }
    } catch (e) {
      console.error('创建项目失败:', e);
    } finally {
      setShowNewModal(false);
      setNewProjectName('');
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个项目吗？')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(null);
    } catch (e) {
      console.error('删除项目失败:', e);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <span>🎵</span>
            <span>乐谱协作</span>
          </div>
          <button
            className="new-project-btn"
            onClick={() => setShowNewModal(true)}
            title="新建项目"
          >
            +
          </button>
        </div>
        <ProjectList
          projects={projects}
          activeProjectId={activeProjectId}
          onSelect={setActiveProjectId}
          onDelete={handleDeleteProject}
        />
      </aside>

      {activeProjectId ? (
        <EditorPanel
          projectId={activeProjectId}
          projectName={projects.find(p => p.id === activeProjectId)?.name || ''}
        />
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🎼</div>
          <div className="empty-state-text">选择或创建一个乐谱项目开始编辑</div>
          <div className="empty-state-hint">左侧列表展示所有项目，点击卡片进入编辑器</div>
        </div>
      )}

      {showNewModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowNewModal(false);
            setNewProjectName('');
          }
        }}>
          <div className="modal">
            <div className="modal-title">新建乐谱项目</div>
            <input
              className="modal-input"
              placeholder="输入项目名称..."
              value={newProjectName}
              autoFocus
              maxLength={30}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') {
                  setShowNewModal(false);
                  setNewProjectName('');
                }
              }}
            />
            <div className="modal-char-count">
              {newProjectName.length}/30
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowNewModal(false);
                  setNewProjectName('');
                }}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
