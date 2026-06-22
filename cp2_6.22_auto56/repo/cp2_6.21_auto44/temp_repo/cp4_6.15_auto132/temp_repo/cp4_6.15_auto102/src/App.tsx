import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Wallet, Sparkles } from 'lucide-react';
import HomePage from '@/pages/HomePage';
import AddItemPage from '@/pages/AddItemPage';
import ItemDetailPage from '@/pages/ItemDetailPage';
import WalletPage from '@/pages/WalletPage';
import Sidebar from '@/components/Sidebar';
import { useStore } from '@/store';

function Navbar() {
  const location = useLocation();
  const user = useStore((s) => s.user);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 gradient-primary shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 text-white no-underline">
            <Sparkles className="w-6 h-6" />
            <span className="font-display font-bold text-lg tracking-wide">校园漂流</span>
          </Link>

          <div className="hidden sm:flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
            <input
              type="text"
              placeholder="搜索闲置好物..."
              className="bg-transparent text-white placeholder-white/70 text-sm px-3 py-1 w-48 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/add"
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 no-underline ${
                isActive('/add')
                  ? 'bg-white text-primary'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">发布</span>
            </Link>

            <Link
              to="/wallet"
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 no-underline ${
                isActive('/wallet')
                  ? 'bg-white text-primary'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">{user.points}</span>
            </Link>

            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white text-sm font-bold">
                {user.name.charAt(0)}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function BottomNav() {
  const location = useLocation();
  const user = useStore((s) => s.user);

  const tabs = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/add', icon: PlusCircle, label: '发布' },
    { path: '/wallet', icon: Wallet, label: `钱包 ${user.points}` },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-0.5 text-xs no-underline transition-colors duration-200 ${
                active ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-surface font-body">
        <Sidebar />
        <div className="md:ml-52">
          <Navbar />
          <main className="pb-16 sm:pb-0">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/add" element={<AddItemPage />} />
              <Route path="/item/:id" element={<ItemDetailPage />} />
              <Route path="/wallet" element={<WalletPage />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </div>
    </Router>
  );
}
