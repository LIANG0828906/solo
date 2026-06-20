import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Pill } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '仪表板', icon: Home },
    { path: '/prescription', label: '抓药', icon: Pill },
  ];

  return (
    <nav className="w-full bg-gradient-to-b from-[#8d6e63] to-[#5d4037] py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#c9a96e] flex items-center justify-center shadow-md">
              <span className="text-[#3e2723] font-bold text-lg">藥</span>
            </div>
            <h1 className="text-2xl font-bold text-[#f5efe0] traditional-font">
              回春堂药铺
            </h1>
          </div>

          <div className="flex items-center gap-2 relative">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative w-[120px] py-3 px-4 flex flex-col items-center justify-center rounded-t-lg transition-all duration-300 hover:bg-[#c9a96e]/20 group"
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`w-5 h-5 mb-1 transition-colors ${
                        isActive ? 'text-[#d4a373]' : 'text-[#f5efe0]/70 group-hover:text-[#f5efe0]'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium transition-colors ${
                        isActive ? 'text-[#d4a373]' : 'text-[#f5efe0]/70 group-hover:text-[#f5efe0]'
                      }`}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute bottom-0 w-[60px] h-1 bg-[#d4a373] rounded-full"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
