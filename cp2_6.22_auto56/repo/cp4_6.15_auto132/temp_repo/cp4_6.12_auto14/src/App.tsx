import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Scissors, LayoutDashboard } from 'lucide-react';
import CustomerOrders from './pages/CustomerOrders';
import VendorDashboard from './pages/VendorDashboard';

function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDashboard = location.pathname === '/dashboard';

  const links = [
    { to: '/', label: '客户订单', icon: Scissors },
    { to: '/dashboard', label: '工作室后台', icon: LayoutDashboard },
  ];

  return (
    <nav className="bg-[#5D4037] text-[#D4A574] shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B4513] flex items-center justify-center text-white font-bold text-sm">
              匠
            </div>
            <span className="text-lg font-semibold tracking-wide">匠心皮具工作室</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active =
                (link.to === '/' && !isDashboard) ||
                (link.to === '/dashboard' && isDashboard);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    active
                      ? 'bg-[#8B4513] text-[#D4A574] shadow-inner'
                      : 'hover:bg-[#6D4C41] hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <button
            className="md:hidden p-2 rounded-md hover:bg-[#6D4C41] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="菜单"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#4E342E] border-t border-[#6D4C41]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active =
                (link.to === '/' && !isDashboard) ||
                (link.to === '/dashboard' && isDashboard);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                    active
                      ? 'bg-[#8B4513] text-[#D4A574]'
                      : 'text-[#D4A574] hover:bg-[#6D4C41] hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F5F0E1]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Routes>
            <Route path="/" element={<CustomerOrders />} />
            <Route path="/dashboard" element={<VendorDashboard />} />
            <Route path="/orders/:id" element={<CustomerOrders />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
