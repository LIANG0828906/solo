import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { projects, currentProjectId, addProject, deleteProject, setCurrentProject } = useTaskStore();
  const [newProjectName, setNewProjectName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim());
      setNewProjectName('');
      setIsAdding(false);
    }
  };

  const handleProjectClick = (id: string) => {
    setCurrentProject(id);
    onClose();
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个项目吗？所有相关任务也将被删除。')) {
      deleteProject(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddProject();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewProjectName('');
    }
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">CollabTask</h1>
        </div>
        <div className="sidebar-content">
          <ul className="project-list">
            {projects.map((project) => (
              <li
                key={project.id}
                className={`project-item ${project.id === currentProjectId ? 'active' : ''}`}
                onClick={() => handleProjectClick(project.id)}
              >
                <span className="project-name">{project.name}</span>
                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteProject(e, project.id)}
                  title="删除项目"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>

          {isAdding ? (
            <div style={{ marginTop: '12px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="输入项目名称"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button className="btn btn-primary" onClick={handleAddProject} style={{ flex: 1 }}>
                  添加
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsAdding(false);
                    setNewProjectName('');
                  }}
                  style={{ flex: 1 }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button className="add-project-btn" onClick={() => setIsAdding(true)} style={{ marginTop: '12px' }}>
              <Plus size={16} />
              添加项目
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default React.memo(Sidebar);
