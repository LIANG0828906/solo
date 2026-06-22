import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { ProjectList } from './modules/project/ProjectList';
import { ProjectDetail } from './modules/project/ProjectDetail';
import { ActivityFeed } from './modules/activity/ActivityFeed';
import { useProjectStore } from './modules/project/store';
import { useActivityStore } from './modules/activity/store';
import { openDB } from './utils/db';
import { seedMockDataIfEmpty } from './utils/mockData';

function Header() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-logo">
          <div className="app-logo__icon">
            <Leaf size={24} color="#fff" />
          </div>
          <span className="app-logo__text">CommSpace</span>
        </div>
        <div className="app-header__subtitle">社区空间改造协作平台</div>
      </div>
    </header>
  );
}

function AppContent() {
  const projectStore = useProjectStore;
  const activityStore = useActivityStore;
  const hasInitRef = useRef(false);

  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    let mounted = true;

    async function initData() {
      try {
        await openDB();
        await seedMockDataIfEmpty();
        if (mounted) {
          await Promise.all([
            projectStore.getState().loadProjects(),
            activityStore.getState().loadAllData(),
          ]);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    }

    void initData();

    return () => {
      mounted = false;
    };
  }, [projectStore, activityStore]);

  return (
    <div className="app-layout">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <aside className="app-sidebar">
        <ActivityFeed />
      </aside>
    </div>
  );
}

export function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <div className="app-body">
          <AppContent />
        </div>
      </div>
    </Router>
  );
}
