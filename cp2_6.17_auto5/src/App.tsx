import React, { useState } from 'react';
import ColorGrid from './palette/ColorGrid';
import ColorRules from './project/ColorRules';
import InviteLink from './project/InviteLink';
import { useProjectStore } from './project/store';

const App: React.FC = () => {
  const {
    projects,
    currentProjectId,
    createProject,
    setCurrentProject,
    isReadonly,
    setReadonlyMode
  } = useProjectStore();

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const currentProject = projects.find(p => p.id === currentProjectId);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    createProject(newProjectName.trim());
    setNewProjectName('');
    setShowNewProject(false);
  };

  const toggleReadonlyDemo = () => {
    setReadonlyMode(!isReadonly());
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
        color: 'white',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <header
        style={{
          padding: '20px 32px',
          backgroundColor: '#16213E',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #E94560, #ff6b8a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}
          >
            🎨
          </div>
          <div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(90deg, #fff, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              ColorSync
            </h1>
            <p
              style={{
                fontSize: '12px',
                color: '#64748b',
                margin: '2px 0 0 0'
              }}
            >
              设计团队颜色协作工具
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0f1525',
              padding: '6px',
              borderRadius: '10px'
            }}
          >
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => setCurrentProject(project.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor:
                    project.id === currentProjectId ? '#E94560' : 'transparent',
                  color: project.id === currentProjectId ? 'white' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {project.name}
              </button>
            ))}
            {!showNewProject && (
              <button
                onClick={() => setShowNewProject(true)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px dashed #334155',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                + 新建
              </button>
            )}
          </div>

          {showNewProject && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                placeholder="项目名称"
                autoFocus
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #2a2a4a',
                  backgroundColor: '#0f1525',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none',
                  width: '140px'
                }}
              />
              <button
                onClick={handleCreateProject}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#E94560',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                创建
              </button>
              <button
                onClick={() => setShowNewProject(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #2a2a4a',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
            </div>
          )}

          <button
            onClick={toggleReadonlyDemo}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #2a2a4a',
              backgroundColor: isReadonly() ? '#1e3a2f' : 'transparent',
              color: isReadonly() ? '#4ade80' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isReadonly() ? '🔒 只读预览' : '👁 演示只读'}
          </button>
        </div>
      </header>

      {currentProject && (
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '0px',
            minHeight: 0
          }}
          className="main-layout"
        >
          <div
            style={{
              padding: '24px 32px',
              borderRight: '1px solid #1e293b',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            className="palette-panel"
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '20px',
                color: '#f1f5f9'
              }}
            >
              调色盘
              <span
                style={{
                  marginLeft: '10px',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: '#64748b'
                }}
              >
                {useProjectStore.getState().getCurrentProjectColors().length} 种颜色
              </span>
            </h2>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ColorGrid />
            </div>
          </div>

          <div
            style={{
              padding: '24px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              overflow: 'hidden'
            }}
            className="rules-panel"
          >
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <ColorRules />
            </div>
            <InviteLink />
          </div>
        </div>
      )}

      {!currentProject && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '20px',
            color: '#64748b'
          }}
        >
          <div style={{ fontSize: '64px' }}>🎨</div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#94a3b8' }}>
            开始创建你的第一个项目
          </h2>
          <p style={{ fontSize: '14px' }}>
            上传图片或输入色值，快速提取和管理项目颜色
          </p>
          <button
            onClick={() => setShowNewProject(true)}
            style={{
              marginTop: '12px',
              padding: '14px 32px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#E94560',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            创建项目
          </button>
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .main-layout {
            grid-template-columns: 1fr 420px !important;
          }
        }
        
        .palette-panel::-webkit-scrollbar,
        .rules-panel::-webkit-scrollbar {
          width: 6px;
        }
        .palette-panel::-webkit-scrollbar-track,
        .rules-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        .palette-panel::-webkit-scrollbar-thumb,
        .rules-panel::-webkit-scrollbar-thumb {
          background: #2a2a4a;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default App;
