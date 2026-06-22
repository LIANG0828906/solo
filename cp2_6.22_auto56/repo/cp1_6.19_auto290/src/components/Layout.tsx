import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Home,
  Image,
  MessageSquare,
  GitCompare,
  Package,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import type { TabType } from '@/types';

const TAB_ITEMS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'sketches', label: '草图浏览', icon: <Image size={16} /> },
  { key: 'annotations', label: '批注面板', icon: <MessageSquare size={16} /> },
  { key: 'versions', label: '版本对比', icon: <GitCompare size={16} /> },
  { key: 'delivery', label: '交付清单', icon: <Package size={16} /> },
];

interface LayoutProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Layout({ activeTab, onTabChange }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const collapsed = sidebarCollapsed || isMobile;

  const handleNewProject = useCallback(() => {
    navigate('/projects');
  }, [navigate]);

  const handleHome = useCallback(() => {
    navigate('/projects');
  }, [navigate]);

  const isWorkspace = location.pathname.includes('/workspace');

  return (
    <div className="flex h-screen overflow-hidden bg-[#ECF0F1]">
      <aside
        className="flex flex-col shrink-0 transition-all duration-300 bg-[#2C3E50] text-white"
        style={{ width: collapsed ? 60 : 240 }}
      >
        <div className="flex items-center justify-between px-3 py-4 border-b border-white/10">
          {!collapsed && (
            <span className="text-sm font-semibold tracking-wide truncate">
              插画批注交付
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors duration-200 hidden md:flex"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <button
          onClick={handleNewProject}
          className="flex items-center gap-2 px-3 py-2.5 mx-2 mt-3 rounded-md bg-[#3498DB] hover:bg-[#2980B9] transition-colors duration-200 text-sm font-medium"
        >
          <Plus size={16} />
          {!collapsed && <span>新建项目</span>}
        </button>

        <button
          onClick={handleHome}
          className="flex items-center gap-2 px-3 py-2.5 mx-2 mt-1 rounded-md hover:bg-white/10 transition-colors duration-200 text-sm"
        >
          <Home size={16} />
          {!collapsed && <span>回到首页</span>}
        </button>

        <div className="mt-4 flex-1 overflow-y-auto px-2 space-y-0.5">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}/workspace`)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors duration-200 ${
                currentProjectId === p.id
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Image size={14} className="shrink-0" />
              {!collapsed && (
                <span className="truncate">{p.name}</span>
              )}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {isWorkspace && (
          <>
            {isMobile ? (
              <div className="px-4 py-3 border-b border-[#BDC3C7] bg-white">
                <select
                  value={activeTab}
                  onChange={(e) => onTabChange(e.target.value as TabType)}
                  className="w-full px-3 py-2 rounded-md border border-[#BDC3C7] text-sm bg-white focus:border-[#3498DB] focus:outline-none transition-colors duration-200"
                >
                  {TAB_ITEMS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-6 py-2.5 border-b border-[#BDC3C7] bg-white">
                {TAB_ITEMS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => onTabChange(t.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      activeTab === t.key
                        ? 'bg-[#3498DB] text-white'
                        : 'text-[#2C3E50] hover:bg-[#ECF0F1]'
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
