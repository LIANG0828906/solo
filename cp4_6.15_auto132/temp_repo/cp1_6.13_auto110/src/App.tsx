import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FileBarChart } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Report from './pages/Report';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <header className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, #F5A623 0%, #E8941A 100%)', boxShadow: '0 4px 10px rgba(245, 166, 35, 0.35)' }}
              >
                🏠
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: '#2D2D2D' }}>家庭支出管理</h1>
                <p className="text-xs" style={{ color: '#6B7280' }}>轻松记账，智能汇总</p>
              </div>
            </div>
            <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
              <NavLink to="/" end className={({ isActive }) => `nav-link text-sm ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={16} />
                <span>看板</span>
              </NavLink>
              <NavLink to="/add" className={({ isActive }) => `nav-link text-sm ${isActive ? 'active' : ''}`}>
                <PlusCircle size={16} />
                <span>记账</span>
              </NavLink>
              <NavLink to="/report" className={({ isActive }) => `nav-link text-sm ${isActive ? 'active' : ''}`}>
                <FileBarChart size={16} />
                <span>报告</span>
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddExpense />} />
            <Route path="/report" element={<Report />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="no-print py-4 text-center text-xs" style={{ color: '#9CA3AF' }}>
          © {new Date().getFullYear()} 家庭支出管理 · 数据保存在本地浏览器
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
