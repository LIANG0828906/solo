import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sun, Moon, BarChart3 } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/morning', label: '晨间', icon: Sun },
  { to: '/evening', label: '晚间', icon: Moon },
  { to: '/dashboard', label: '仪表盘', icon: BarChart3 },
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    `nav-link flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:text-[var(--color-gold)] ${isActive ? 'active text-[var(--color-gold)]' : 'text-white/70'}`;

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <style>{`
        .nav-link::after {
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 0 !important;
        }
        .nav-link:hover::after,
        .nav-link.active::after {
          width: 100% !important;
        }
      `}</style>

      <nav className="glass-navbar fixed top-0 left-0 right-0 z-30 flex h-[60px] items-center justify-between px-4">
        <div className="hidden md:flex flex-1 items-center justify-center gap-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClassName}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <button
          className={`flex flex-col items-center justify-center gap-[6px] md:hidden ${drawerOpen ? 'hamburger-open' : ''}`}
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-label="菜单"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      {drawerOpen && (
        <div className="drawer-overlay" onClick={closeDrawer} />
      )}

      <div className={`drawer-panel ${drawerOpen ? 'drawer-open' : ''}`}>
        <div className="flex flex-col gap-4 mt-8">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClassName} onClick={closeDrawer}>
              <Icon size={20} />
              <span className="text-lg">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
