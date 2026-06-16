import { useState, memo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, LayoutDashboard, Kanban as KanbanIcon, Menu, X } from 'lucide-react';
import { ProjectList } from '@/components/ProjectList';
import { Dashboard } from '@/components/Dashboard';
import { Kanban } from '@/components/Kanban';
import { Calendar as CalendarComponent } from '@/components/Calendar';
import { cn } from '@/lib/utils';

const NavItem = memo(function NavItem({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof Calendar;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300',
          'hover:bg-primary/10',
          isActive
            ? 'bg-primary/15 text-primary font-medium'
            : 'text-gray-600 hover:text-primary'
        )
      }
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </NavLink>
  );
});

const Sidebar = memo(function Sidebar() {
  return (
    <div className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-primary">项目管理中心</h1>
        <p className="text-xs text-gray-400 mt-1">多项目进度管理平台</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <NavItem to="/" icon={LayoutDashboard} label="仪表盘" />
        <NavItem to="/kanban" icon={KanbanIcon} label="项目看板" />
        <NavItem to="/calendar" icon={Calendar} label="发布日历" />
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
            管
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">管理员</p>
            <p className="text-xs text-gray-400 truncate">admin@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
});

const MobileHeader = memo(function MobileHeader({
  menuOpen,
  onMenuToggle,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-primary text-white z-50 flex items-center px-4">
      <button onClick={onMenuToggle} className="p-2 -ml-2">
        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      <h1 className="flex-1 text-center font-bold">项目管理中心</h1>
      <div className="w-10" />
    </div>
  );
});

const MobileSidebar = memo(function MobileSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-14 left-0 bottom-0 w-64 bg-white z-50 lg:hidden"
          >
            <Sidebar />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

const DashboardPage = memo(function DashboardPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      <Dashboard />
    </div>
  );
});

const KanbanPage = memo(function KanbanPage() {
  return (
    <div className="flex-1 flex overflow-hidden">
      <ProjectList className="hidden md:block" />
      <Kanban />
    </div>
  );
});

const CalendarPage = memo(function CalendarPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <CalendarComponent />
    </div>
  );
});

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="h-screen flex bg-surface overflow-hidden">
      <MobileHeader menuOpen={mobileMenuOpen} onMenuToggle={handleMenuToggle} />
      <MobileSidebar isOpen={mobileMenuOpen} onClose={handleCloseMenu} />

      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col lg:pt-0 pt-14 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/kanban" element={<KanbanPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
