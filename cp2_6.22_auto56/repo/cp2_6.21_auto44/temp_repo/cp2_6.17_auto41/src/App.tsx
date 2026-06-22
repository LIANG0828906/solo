import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import KanbanBoard from '@/components/KanbanBoard';
import ReportPage from '@/components/ReportPage';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';
import TaskEditPanel from '@/components/TaskEditPanel';
import { useStore } from '@/stores/useStore';

export default function App() {
  const initStore = useStore(s => s.initStore);
  const initialized = useStore(s => s.initialized);
  const selectedTaskId = useStore(s => s.selectedTaskId);
  const location = useLocation();
  const isKanbanPage = location.pathname === '/';

  useEffect(() => {
    initStore();
  }, [initStore]);

  if (!initialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#2C3E50' }}>
        <div style={{ fontSize: '18px' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <NavBar />
      <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
        {isKanbanPage && <Sidebar />}
        <main style={{ flex: 1, overflow: 'auto', padding: '24px', backgroundColor: '#F0F3F5' }}>
          <Routes>
            <Route path="/" element={<KanbanBoard />} />
            <Route path="/report" element={<ReportPage />} />
          </Routes>
        </main>
      </div>
      {selectedTaskId && <TaskEditPanel />}
    </div>
  );
}
