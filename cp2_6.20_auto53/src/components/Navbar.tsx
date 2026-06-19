import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Gavel,
  Heart,
  User,
  Bell,
} from 'lucide-react';
import { useAuctionStore } from '@/stores/auctionStore';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const menuItems: MenuItem[] = [
  { label: '发现', path: '/', icon: Compass },
  { label: '竞拍中', path: '/bidding', icon: Gavel },
  { label: '收藏', path: '/favorites', icon: Heart },
  { label: '个人中心', path: '/profile', icon: User },
];

export default function Navbar() {
  const location = useLocation();
  const notifications = useAuctionStore((s) => s.notifications);
  const clearNotifications = useAuctionStore((s) => s.clearNotifications);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getIsActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="h-screen flex flex-col border-r"
      style={{
        width: 220,
        background: 'rgba(26, 35, 50, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'rgba(201, 168, 76, 0.15)',
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-6 border-b"
        style={{ borderColor: 'rgba(201, 168, 76, 0.15)' }}
      >
        <h1
          className="text-xl font-bold tracking-widest"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            background: 'linear-gradient(135deg, #e8d48a 0%, #c9a84c 50%, #a58b34 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          LUXE 拍卖
        </h1>
        <button
          type="button"
          onClick={() => notifications > 0 && clearNotifications()}
          className="relative p-1.5 rounded-lg transition-colors"
          style={{ color: notifications > 0 ? '#c9a84c' : '#888' }}
        >
          <Bell size={18} />
          <AnimatePresence>
            {notifications > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  animation: 'blinkBadge 0.6s ease-in-out 3',
                  padding: '0 5px',
                }}
              >
                {notifications > 99 ? '99+' : notifications}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <div className="flex-1 py-6 px-3 flex flex-col gap-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = getIsActive(item.path);
          const isHovered = hoveredIndex === index;

          return (
            <Link
              key={item.path}
              to={item.path}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group"
              style={{
                background: isActive
                  ? 'rgba(201, 168, 76, 0.1)'
                  : isHovered
                  ? 'rgba(255, 255, 255, 0.04)'
                  : 'transparent',
                color: isActive ? '#c9a84c' : '#ccc',
              }}
            >
              <AnimatePresence>
                {(isActive || isHovered) && (
                  <motion.div
                    layoutId="nav-indicator"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: '60%' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                    style={{
                      background: 'linear-gradient(180deg, #e8d48a 0%, #c9a84c 50%, #a58b34 100%)',
                      boxShadow: '0 0 12px rgba(201, 168, 76, 0.6)',
                    }}
                  />
                )}
              </AnimatePresence>
              <Icon
                size={20}
                className="transition-transform duration-200"
                style={{
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                }}
              />
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div
        className="px-6 py-5 border-t text-xs"
        style={{
          borderColor: 'rgba(201, 168, 76, 0.15)',
          color: '#666',
        }}
      >
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          © 2026 LUXE Auctions
        </p>
        <p className="mt-1 tracking-wider">臻选稀世珍品</p>
      </div>
    </nav>
  );
}
