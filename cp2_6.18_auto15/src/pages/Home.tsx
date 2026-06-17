import { useState } from 'react';
import { useTaskStore } from '@/store/taskStore';
import ProjectCard from '@/components/ProjectCard';

export default function Home() {
  const projects = useTaskStore((state) => state.projects);
  const addProject = useTaskStore((state) => state.addProject);
  const setCurrentProject = useTaskStore((state) => state.setCurrentProject);

  const [newProjectName, setNewProjectName] = useState('');

  const handleAddProject = () => {
    const name = newProjectName.trim();
    if (!name) return;
    addProject(name);
    setNewProjectName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddProject();
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          height: 56,
          background: '#FFFFFF',
          boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: '#333333' }}>
          TaskFlow
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入项目名称"
            style={{
              width: 300,
              background: '#F0F0F5',
              border: '1px solid #D0D0D8',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 14,
              outline: 'none',
              color: '#333333',
            }}
          />
          <button
            onClick={handleAddProject}
            style={{
              background: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#005BBF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#007AFF';
            }}
          >
            添加项目
          </button>
        </div>
      </header>

      <main style={{ padding: 32 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: '#333333',
            marginBottom: 24,
          }}
        >
          我的项目
        </h2>

        {projects.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#999999',
              fontSize: 16,
            }}
          >
            暂无项目，在上方输入框创建你的第一个项目吧
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setCurrentProject(project.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
