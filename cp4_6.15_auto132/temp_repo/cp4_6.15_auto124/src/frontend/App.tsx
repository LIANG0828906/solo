import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, BookOpen, LayoutDashboard } from 'lucide-react';
import Home from './pages/Home';
import BookDetail from './pages/BookDetail';
import Admin from './pages/Admin';
import CartModal from './components/CartModal';
import { useStore } from './store/useStore';

function NavBar() {
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const count = useStore((s) => s.getCartCount());
  const bounceKey = useStore((s) => s.cartBounceKey);
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream-100/80 backdrop-blur-lg border-b border-cream-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tan-400 to-brown-700 flex items-center justify-center shadow-md">
              <BookOpen size={20} className="text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-brown-900 text-lg">暖光书店</div>
              <div className="text-[10px] text-brown-600 font-semibold tracking-wider">INDEPENDENT BOOKSTORE</div>
            </div>
          </Link>

          <nav className="flex items-center gap-2 md:gap-3">
            <Link
              to="/"
              className={`px-3 md:px-4 py-2 rounded-xl text-sm font-bold transition-colors
                ${!isAdmin ? 'bg-white text-brown-900 shadow-sm' : 'text-brown-700 hover:bg-white/60'}`}
            >
              书店首页
            </Link>
            <Link
              to="/admin"
              className={`px-3 md:px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5
                ${isAdmin ? 'bg-white text-brown-900 shadow-sm' : 'text-brown-700 hover:bg-white/60'}`}
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">管理后台</span>
            </Link>
            {!isAdmin && (
              <button
                key={bounceKey}
                onClick={() => setCartOpen(true)}
                className="relative w-10 h-10 rounded-xl bg-accent-500 hover:bg-accent-600 text-white flex items-center justify-center shadow-lg shadow-accent-500/30 transition-all active:scale-95"
                style={bounceKey > 0 ? { animation: 'bounceOnce 0.5s ease-out' } : undefined}
              >
                <style>{`
                  @keyframes bounceOnce {
                    0%,100% { transform: scale(1); }
                    30% { transform: scale(1.25); }
                    60% { transform: scale(0.92); }
                  }
                `}</style>
                <ShoppingCart size={18} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-white text-accent-600 text-[11px] font-extrabold flex items-center justify-center shadow-md">
                    {count}
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>
      </header>
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-100 font-sans">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">{children}</main>
      <footer className="border-t border-cream-200 bg-cream-50 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center text-brown-600 text-sm">
          <p className="font-bold text-brown-800">暖光书店 · 让阅读照亮生活</p>
          <p className="mt-1 opacity-80">© 2026 Independent Bookstore Management System</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
