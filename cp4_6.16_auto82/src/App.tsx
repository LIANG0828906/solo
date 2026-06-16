import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { BookOpen, BarChart3 } from 'lucide-react';
import ThemeList from '@/pages/ThemeList';
import WorkSubmitReview from '@/pages/WorkSubmitReview';
import WeeklyReport from '@/pages/WeeklyReport';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <nav className="sticky top-0 z-50 bg-parchment-light/90 backdrop-blur-sm border-b border-parchment-dark/30">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2 text-bark font-sans font-bold text-lg no-underline">
              <BookOpen className="w-5 h-5 text-ink" />
              <span>CritiqueCircle</span>
            </NavLink>
            <div className="flex items-center gap-1">
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                主题列表
              </NavLink>
              <NavLink to="/report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <BarChart3 className="w-4 h-4 inline mr-1" />
                周报统计
              </NavLink>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<ThemeList />} />
            <Route path="/theme/:id" element={<WorkSubmitReview />} />
            <Route path="/report" element={<WeeklyReport />} />
          </Routes>
        </main>

        <footer className="text-center py-6 text-bark-muted text-xs font-sans border-t border-parchment-dark/20 mt-12">
          CritiqueCircle · 匿名作品互评平台
        </footer>
      </div>
    </Router>
  );
}
