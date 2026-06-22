import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import type { Project } from './types';
import { projectApi } from './api';
import ProjectList from './ProjectList';
import TaskBoard from './TaskBoard';
import './App.css';

function KanbanLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectApi.getAll().then(data => {
      setProjects(data);
      if (!projectId && data.length > 0) {
        navigate(`/project/${data[0].id}`, { replace: true });
      }
      setLoading(false);
    });
  }, [navigate, projectId]);

  const currentProject = projects.find(p => p.id === projectId);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <div className="kanban-app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>📋 团队看板</h1>
          <p className="sidebar-subtitle">项目列表</p>
        </div>
        <ProjectList
          projects={projects}
          currentId={projectId || ''}
          onSelect={(id) => navigate(`/project/${id}`)}
        />
      </aside>
      <main className="main-content">
        {currentProject ? (
          <TaskBoard project={currentProject} onProjectUpdate={setProjects} allProjects={projects} />
        ) : (
          <div className="empty-state">
            <p>请选择一个项目</p>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/project" replace />} />
      <Route path="/project" element={<KanbanLayout />} />
      <Route path="/project/:projectId" element={<KanbanLayout />} />
      <Route path="*" element={<Navigate to="/project" replace />} />
    </Routes>
  );
}

export default App;
