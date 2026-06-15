import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { BookOpen, Calendar, User, Library, Menu, X, ChevronRight } from 'lucide-react';
import BookList from '@/pages/BookList';
import BookDetail from '@/pages/BookDetail';
import Events from '@/pages/Events';
import { cn } from '@/lib/utils';

function NavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-warm-white border-b border-latte/50 shadow-soft z-50 flex items-center px-6 backdrop-blur-sm bg-opacity-95">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-card bg-gradient-to-br from-forest to-forest-light flex items-center justify-center shadow-soft">
          <BookOpen className="w-5 h-5 text-warm-white" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold text-espresso leading-none">书香汇</h1>
          <p className="text-[11px] text-coffee mt-0.5">读书会管理平台</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream border border-latte/40">
          <User className="w-4 h-4 text-forest" />
          <span className="text-sm text-espresso font-medium">林墨（管理员）</span>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  const location = useLocation();
  const navItems = [
    { to: '/', label: '书籍库', icon: Library },
    { to: '/events', label: '活动安排', icon: Calendar },
  ];

  return (
    <aside className="fixed top-16 left-0 bottom-0 w-56 bg-warm-white border-r border-latte/40 flex flex-col z-40">
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            item.to === '/' ? location.pathname === '/' || location.pathname.startsWith('/book/') :
            location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'group flex items-center gap-3 px-4 py-3 rounded-card text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-forest/10 text-forest shadow-soft'
                  : 'text-coffee hover:bg-cream hover:text-espresso'
              )}
            >
              <Icon className={cn('w-4 h-4 transition-transform duration-200', isActive ? 'scale-110' : 'group-hover:scale-105')} />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="ml-auto w-3.5 h-3.5" />}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-latte/40">
        <div className="p-3 rounded-card bg-gradient-to-br from-forest/10 to-forest-pale/30 border border-forest/20">
          <p className="text-xs font-medium text-espresso mb-1">今日小记</p>
          <p className="text-[11px] text-coffee leading-relaxed">
            读书是与灵魂的对话，愿每一次翻开书页，都能遇见更好的自己。
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-cream">
        <NavBar />
        <Sidebar />
        <main className="pt-16 pl-56 min-h-screen">
          <div className="p-8 max-w-[1600px] mx-auto">
            <Routes>
              <Route path="/" element={<BookList />} />
              <Route path="/book/:id" element={<BookDetail />} />
              <Route path="/book/:id/topic/:topicId" element={<BookDetail />} />
              <Route path="/events" element={<Events />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
