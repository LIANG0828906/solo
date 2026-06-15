import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/store';
import Sidebar from '@/components/Sidebar';
import GlobalStatsPanel from '@/components/GlobalStatsPanel';
import QuestionManager from '@/components/QuestionManager';
import StudentSubmission from '@/components/StudentSubmission';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import RecordList from '@/components/RecordList';

export default function App() {
  const { loadFromStorage, sidebarCollapsed } = useStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const mainMargin = sidebarCollapsed
    ? 'md:ml-[64px]'
    : 'md:ml-[64px] lg:ml-[220px]';

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-[#f0fdfa] to-[#b2dfdb]">
        <Sidebar />
        <main className={`transition-all duration-300 ease-out ${mainMargin} px-4 sm:px-6 lg:px-8 py-4 md:py-6 pt-20 md:pt-6`}>
          <GlobalStatsPanel />
          <Routes>
            <Route path="/" element={<Navigate to="/questions" replace />} />
            <Route path="/questions" element={<QuestionManager />} />
            <Route path="/submit" element={<StudentSubmission />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/records" element={<RecordList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
