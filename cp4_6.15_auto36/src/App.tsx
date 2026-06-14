import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Repeat2, User } from 'lucide-react';
import { HomePage } from './HomePage';
import { ItemDetail } from './ItemDetail';
import { MyExchanges } from './MyExchanges';
import { PublishPage } from './PublishPage';
import { RegisterPage } from './RegisterPage';
import { cn } from './utils';
import { useNavigate } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const showNav = !['/register', '/publish'].includes(location.pathname) && !location.pathname.startsWith('/item/');

  if (!showNav) return null;

  const navItems = [
    { key: 'home', label: '交换圈', icon: Home, path: '/' },
    { key: 'publish', label: '发布', icon: PlusCircle, path: '/publish' },
    { key: 'exchanges', label: '我的交换', icon: Repeat2, path: '/my-exchanges' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 z-40">
      <div className="max-w-2xl mx-auto flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex-1 py-3 flex flex-col items-center gap-1 transition-all duration-200',
                active ? 'text-orange-500' : 'text-gray-400'
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6 transition-transform duration-200',
                  active && 'scale-110'
                )}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const AppContent = () => {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/my-exchanges" element={<MyExchanges />} />
        <Route path="/publish" element={<PublishPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
