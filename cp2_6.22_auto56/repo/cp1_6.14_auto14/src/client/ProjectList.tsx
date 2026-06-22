import React, { useState } from 'react';
import { Project } from '../shared/types';

interface ProjectListProps {
  projects: Project[];
  currentProjectId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string, name: string) => void;
  onRename: (id: string, name: string) => void;
  onNewProject: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  currentProjectId,
  onSelect,
  onDelete,
  onCopy,
  onRename,
  onNewProject
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const handleRename = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setEditingId(id);
      setEditingName(project.name);
      setContextMenu(null);
    }
  };

  const saveRename = () => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleCopy = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      onCopy(id, `${project.name} 副本`);
    }
    setContextMenu(null);
  };

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.className = 'ripple';
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="left-sidebar-header">
        <h1>🎨 灵感板</h1>
      </div>

      <button
        className="new-project-btn"
        onClick={(e) => {
          createRipple(e);
          onNewProject();
        }}
      >
        + 新建项目
      </button>

      <div className="project-list">
        {projects.map(project => (
          <div
            key={project.id}
            className={`project-card ${currentProjectId === project.id ? 'active' : ''}`}
            onClick={() => !editingId && onSelect(project.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ id: project.id, x: e.clientX, y: e.clientY });
            }}
          >
            <div className="project-thumbnail">
              {project.thumbnail ? (
                <img src={project.thumbnail} alt={project.name} />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #4A90D9, #357ABD)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px'
                }}>
                  🖼️
                </div>
              )}
            </div>
            
            {editingId === project.id ? (
              <input
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                onBlur={saveRename}
                onKeyDown={e => e.key === 'Enter' && saveRename()}
                onClick={e => e.stopPropagation()}
                autoFocus
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  fontSize: '14px',
                  background: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#2d3748'
                }}
              />
            ) : (
              <h3>{project.name}</h3>
            )}
            
            <p>{formatDate(project.updatedAt)}</p>

            <div className="project-card-actions">
              <button
                className="icon-btn"
                onClick={e => { e.stopPropagation(); handleRename(project.id); }}
                title="重命名"
              >
                ✏️
              </button>
              <button
                className="icon-btn"
                onClick={e => { e.stopPropagation(); handleCopy(project.id); }}
                title="复制"
              >
                📋
              </button>
              <button
                className="icon-btn"
                onClick={e => { e.stopPropagation(); onDelete(project.id); }}
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#a0aec0',
            padding: '40px 20px',
            fontSize: '13px'
          }}>
            暂无项目<br />
            点击上方按钮创建第一个项目
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: '#2c3e50',
            borderRadius: '8px',
            padding: '4px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            zIndex: 10000,
            minWidth: '120px'
          }}
          onClick={() => setContextMenu(null)}
        >
          <button
            onClick={() => handleRename(contextMenu.id)}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '13px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            ✏️ 重命名
          </button>
          <button
            onClick={() => handleCopy(contextMenu.id)}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '13px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            📋 复制项目
          </button>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
          <button
            onClick={() => onDelete(contextMenu.id)}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: '#fc8181',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '13px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            🗑️ 删除
          </button>
        </div>
      )}
    </>
  );
};

export default ProjectList;
