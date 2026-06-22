import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import Layout from '@/components/Layout';
import ProjectList from '@/pages/ProjectList';
import Workspace from '@/pages/Workspace';
import SharePage from '@/pages/SharePage';
import type { TabType } from '@/types';

function AppContent() {
  const loadFromStorage = useProjectStore((s) => s.loadFromStorage);
  const [activeTab, setActiveTab] = useState<TabType>('sketches');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route
          element={
            <Layout activeTab={activeTab} onTabChange={setActiveTab} />
          }
        >
          <Route
            path="/projects/:id/workspace"
            element={<Workspace activeTab={activeTab} onTabChange={setActiveTab} />}
          />
        </Route>
        <Route path="/projects/:id/share/:token" element={<SharePage />} />
      </Routes>
    </Router>
  );
}

function ProjectListPage() {
  const loadFromStorage = useProjectStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div className="flex h-screen bg-[#ECF0F1]">
      <aside className="w-[60px] shrink-0 bg-[#2C3E50] flex flex-col items-center py-4">
        <div className="w-8 h-8 bg-[#3498DB] rounded-lg flex items-center justify-center text-white text-sm font-bold">
          插
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <ProjectList />
      </main>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
