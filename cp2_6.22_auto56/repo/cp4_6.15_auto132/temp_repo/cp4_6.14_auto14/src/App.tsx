import React, { createContext, useContext, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shirt, Palette, Calendar, Plus } from 'lucide-react';
import { useWardrobeStore } from '@/store';
import ClosetGrid from '@/closet/ClosetGrid';
import OutfitCreator from '@/outfit/OutfitCreator';
import OutfitCalendar from '@/calendar/OutfitCalendar';
import type { WardrobeStore } from '@/store';

const WardrobeContext = createContext<WardrobeStore | null>(null);

export function useWardrobeContext(): WardrobeStore {
  const context = useContext(WardrobeContext);
  if (!context) {
    throw new Error('useWardrobeContext must be used within a WardrobeProvider');
  }
  return context;
}

interface WardrobeProviderProps {
  children: ReactNode;
}

function WardrobeProvider({ children }: WardrobeProviderProps): JSX.Element {
  const store = useWardrobeStore();
  return (
    <WardrobeContext.Provider value={store}>
      {children}
    </WardrobeContext.Provider>
  );
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  { path: '/', label: '衣橱', icon: <Shirt className="w-5 h-5" /> },
  { path: '/outfit', label: '穿搭', icon: <Palette className="w-5 h-5" /> },
  { path: '/calendar', label: '日历', icon: <Calendar className="w-5 h-5" /> },
];

function Sidebar(): JSX.Element {
  const location = useLocation();

  return (
    <aside
      className="bg-white border-r border-gray-100 flex flex-col"
      style={{ width: '240px', borderRadius: '12px 0 0 12px' }}
    >
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Shirt className="w-6 h-6 text-blue-500" />
          我的衣橱
        </h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
          style={{ borderRadius: '12px' }}
        >
          <Plus className="w-5 h-5" />
          添加衣物
        </button>
      </div>
    </aside>
  );
}

function MainContent(): JSX.Element {
  return (
    <main className="flex-1 overflow-auto">
      <Routes>
        <Route path="/" element={<ClosetGrid />} />
        <Route path="/outfit" element={<OutfitCreator />} />
        <Route path="/calendar" element={<OutfitCalendar />} />
      </Routes>
    </main>
  );
}

function AppLayout(): JSX.Element {
  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: '#f5f5f0', fontFamily: "'Noto Sans SC', sans-serif" }}
    >
      <Sidebar />
      <MainContent />
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <WardrobeProvider>
        <AppLayout />
      </WardrobeProvider>
    </BrowserRouter>
  );
}
