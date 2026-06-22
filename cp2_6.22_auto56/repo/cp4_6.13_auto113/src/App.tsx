import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useStore } from '@/store';
import TagSidebar from './TagSidebar';
import CardList from './CardList';
import CardEditor from './CardEditor';
import CardDetail from './CardDetail';
import { Plus, Search } from 'lucide-react';

function FadeWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(timer);
  }, [location.pathname, location.key]);

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const load = useStore((s) => s.load);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const searchQuery = useStore((s) => s.searchQuery);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-beige flex">
      <TagSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-olive text-white px-6 py-3 flex items-center justify-between shadow-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-olive-light rounded-lg transition-colors lg:hidden"
              aria-label="切换侧边栏"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="font-serif text-xl font-bold tracking-wide">
              知识卡片
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-lighter opacity-70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索卡片..."
                className="bg-olive-light/40 text-white placeholder:text-olive-lighter/60 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 w-48 transition-all focus:w-64"
              />
            </div>
            <a
              href="/new"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              新建卡片
            </a>
          </div>
        </header>

        <main className="flex-1 p-6">
          <FadeWrapper>
            <Routes>
              <Route path="/" element={<CardList />} />
              <Route path="/new" element={<CardEditor />} />
              <Route path="/card/:id/edit" element={<CardEditor />} />
              <Route path="/card/:id" element={<CardDetail />} />
            </Routes>
          </FadeWrapper>
        </main>
      </div>
    </div>
  );
}
