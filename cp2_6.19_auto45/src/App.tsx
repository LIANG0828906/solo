import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { FileText, LineChart, Sparkles } from 'lucide-react';
import ProposalManager from '@/modules/proposal/ProposalManager';
import TrackingDashboard from '@/modules/tracking/TrackingDashboard';
import ProposalDetail from '@/modules/tracking/ProposalDetail';
import { ToastContainer } from '@/hooks/useToast';

function TopBar() {
  return (
    <header className="ff-topbar">
      <div className="ff-topbar__inner">
        <div className="ff-brand">
          <div className="ff-brand__mark">
            <Sparkles size={18} />
          </div>
          <span className="ff-brand__name">FreelanceFlow</span>
        </div>
        <nav className="ff-nav">
          <NavLink to="/proposal" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <FileText size={16} />
              提案编辑器
            </span>
          </NavLink>
          <NavLink to="/tracking" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <LineChart size={16} />
              追踪仪表盘
            </span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="ff-app-shell">
        <TopBar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/proposal" replace />} />
            <Route path="/proposal" element={<ProposalManager />} />
            <Route path="/proposal/:id" element={<ProposalManager />} />
            <Route path="/tracking" element={<TrackingDashboard />} />
            <Route path="/tracking/:id" element={<ProposalDetail />} />
            <Route path="*" element={<Navigate to="/proposal" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
