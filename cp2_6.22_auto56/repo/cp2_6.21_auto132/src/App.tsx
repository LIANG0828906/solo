import { useEffect, useState } from 'react';
import useProjectStore from './store/useProjectStore';
import SyncStatusBar from './components/SyncStatusBar';
import ProjectBoard from './pages/ProjectBoard';
import TermEditor from './pages/TermEditor';

export default function App() {
  const { currentUser, login, fetchUsers, fetchProjects, currentProject, setCurrentProject, connectSocket, disconnectSocket } = useProjectStore();
  const [name, setName] = useState('');
  const [view, setView] = useState<'kanban' | 'terms'>('kanban');

  useEffect(() => {
    const saved = localStorage.getItem('tc_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        useProjectStore.setState({ currentUser: user });
      } catch {}
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchProjects().then(() => {
        const { projects } = useProjectStore.getState();
        if (projects.length === 0) {
          login(currentUser.name);
        }
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentProject) {
      connectSocket(currentProject.id);
      return () => disconnectSocket();
    }
  }, [currentProject?.id]);

  if (!currentUser) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h1>Translation Collab</h1>
          <p>在线翻译项目协作与术语管理</p>
          <form
            onSubmit={async e => {
              e.preventDefault();
              if (name.trim()) {
                await login(name.trim());
              }
            }}
          >
            <input
              type="text"
              placeholder="输入你的名字"
              value={name}
              onChange={e => setName(e.target.value)}
              className="login-input"
            />
            <button type="submit" className="btn btn-primary">
              进入
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <SyncStatusBar />
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title" onClick={() => { setCurrentProject(null); }}>
            Translation Collab
          </h1>
          {currentProject && (
            <span className="breadcrumb">
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{currentProject.name}</span>
            </span>
          )}
        </div>
        <div className="header-right">
          {currentProject && (
            <nav className="tab-nav">
              <button
                className={`tab-btn ${view === 'kanban' ? 'active' : ''}`}
                onClick={() => setView('kanban')}
              >
                任务看板
              </button>
              <button
                className={`tab-btn ${view === 'terms' ? 'active' : ''}`}
                onClick={() => setView('terms')}
              >
                术语编辑器
              </button>
            </nav>
          )}
          <div className="user-badge">
            <img src={currentUser.avatar} alt="" className="avatar-sm" />
            <span>{currentUser.name}</span>
          </div>
        </div>
      </header>
      <main className="app-main">
        {!currentProject ? (
          <ProjectBoard />
        ) : view === 'kanban' ? (
          <ProjectBoard />
        ) : (
          <TermEditor />
        )}
      </main>
    </div>
  );
}
