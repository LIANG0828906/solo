import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Calendar, Disc3, Users, Menu, X } from 'lucide-react';

const navItems = [
  { to: '/', label: '排练日历', Icon: Calendar },
  { to: '/repertoire', label: '曲目库', Icon: Disc3 },
  { to: '/members', label: '成员', Icon: Users },
];

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        height: 56,
        backgroundColor: 'rgba(26, 35, 126, 0.85)',
        borderBottom: '1px solid rgba(255,213,79,0.2)',
      }}
    >
      <div className="max-w-[1000px] mx-auto h-full flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div whileHover={{ rotate: 15 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Music size={22} style={{ color: '#FFD54F' }} />
          </motion.div>
          <span
            className="text-white font-semibold tracking-wide"
            style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 17 }}
          >
            和声社 · 排练管理
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-colors duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-white/70 hover:text-white'
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { backgroundColor: 'rgba(255,213,79,0.15)', boxShadow: 'inset 0 -2px 0 #FFD54F' }
                    : {}
                }
              >
                <Icon size={15} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden text-white p-2 -mr-2"
          aria-label="菜单"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden"
            style={{ backgroundColor: 'rgba(26, 35, 126, 0.97)' }}
          >
            {navItems.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `px-6 py-3 flex items-center gap-3 text-sm ${
                      isActive ? 'text-white' : 'text-white/70'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive ? { backgroundColor: 'rgba(255,213,79,0.1)' } : {}
                  }
                >
                  <Icon size={16} style={{ color: '#FFD54F' }} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
