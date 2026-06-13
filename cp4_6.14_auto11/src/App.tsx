import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from '@/shared/components/Navigation';
import OkrBoard from '@/modules/okr/components/OkrBoard';
import ReportPage from '@/modules/report/components/ReportPage';
import { useOkrStore } from '@/store/useOkrStore';

export default function App() {
  const quarters = useOkrStore((s) => s.quarters);
  const defaultQuarter = quarters[0]?.id || 'q2-2026';

  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden bg-gray-50 md:flex-row flex-col">
        <Navigation />
        <main className="flex-1 overflow-hidden md:overflow-hidden flex flex-col min-w-0">
          <Routes>
            <Route path="/" element={<Navigate to={`/okr/${defaultQuarter}`} replace />} />
            <Route path="/okr/:quarterId" element={<OkrBoard />} />
            <Route path="/report/:quarterId" element={<ReportPage />} />
            <Route path="*" element={<Navigate to={`/okr/${defaultQuarter}`} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
