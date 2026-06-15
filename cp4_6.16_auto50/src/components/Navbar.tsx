import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Package, BarChart3, Menu, X, Shield, ShieldOff } from 'lucide-react';
import { useSwapStore } from '@/store/swapStore';
import { cn } from '@/utils/helpers';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = useSwapStore(state => state.isAdmin);
  const toggleAdmin = useSwapStore(state => state.toggleAdmin);

  const navItems = [
    { path: '/', label: '仪表盘', icon: Home },
    { path: '/items', label: '物品列表', icon: Package },
  ];

  const getNavLinkStyle = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative',
      isActive
        ? 'text-[#E8A87C] bg-[#FFF1D0]'
        : 'text-gray-600 hover:text-[#E8A87C] hover:bg-[#FFF1D0]/50'
    );

  return (
    <>
      <motion.nav
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 z-40"
      >
        <div className="p-6 border-b border-gray-100">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8A87C] to-[#41B3A3] flex items-center justify-center">
              <BarChart3 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">SwapTrail</h1>
              <p className="text-xs text-gray-500">闲置物品流转追踪</p>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 py-6 px-3">
          {navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={getNavLinkStyle}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#E8A87C] rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleAdmin}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200',
              isAdmin
                ? 'bg-[#41B3A3] text-white hover:bg-[#36998a]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {isAdmin ? (
              <>
                <Shield size={18} />
                <span className="text-sm font-medium">管理员模式</span>
              </>
            ) : (
              <>
                <ShieldOff size={18} />
                <span className="text-sm font-medium">普通模式</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.nav>

      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E8A87C] to-[#41B3A3] flex items-center justify-center">
            <BarChart3 size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-800">SwapTrail</span>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleAdmin}
            className={cn(
              'p-2 rounded-lg',
              isAdmin ? 'bg-[#41B3A3] text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            {isAdmin ? <Shield size={18} /> : <ShieldOff size={18} />}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-gray-100 text-gray-600"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-64 h-full bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8A87C] to-[#41B3A3] flex items-center justify-center">
                    <BarChart3 size={22} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-800">SwapTrail</h1>
                    <p className="text-xs text-gray-500">闲置物品流转追踪</p>
                  </div>
                </div>
              </div>

              <div className="py-6 px-3">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={getNavLinkStyle}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="mobile-nav-underline"
                            className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#E8A87C] rounded-full"
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
