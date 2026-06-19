import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navLinks = [
    {
      label: '登记',
      hasDropdown: true,
      items: [
        { label: '失物登记', to: '/lost' },
        { label: '拾物登记', to: '/found' },
      ],
    },
    { label: '匹配', to: '/matches', hasDropdown: false },
    { label: '我的记录', to: '/records', hasDropdown: false },
  ];

  return (
    <>
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 bg-white"
        style={{
          height: '56px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center">
            <Search size={22} color="#4FC3F7" />
            <Heart size={22} color="#4FC3F7" fill="#4FC3F7" style={{ marginLeft: '-8px' }} />
          </div>
          <span className="font-semibold text-base" style={{ color: '#333' }}>
            校园失物招领
          </span>
        </Link>

        <div className="hidden max-[480px]:hidden">
          <ul className="flex items-center gap-8">
            {navLinks.map((link) => (
              <li
                key={link.label}
                className="relative"
                onMouseEnter={() => link.hasDropdown && setIsDropdownOpen(true)}
                onMouseLeave={() => link.hasDropdown && setIsDropdownOpen(false)}
              >
                {link.hasDropdown ? (
                  <button
                    className="flex items-center gap-1 text-sm text-gray-700 relative py-1 nav-link"
                    style={{ cursor: 'pointer' }}
                  >
                    {link.label}
                    <ChevronDown size={14} />
                    <span className="nav-underline" />
                  </button>
                ) : (
                  <Link
                    to={link.to!}
                    className="text-sm text-gray-700 relative py-1 nav-link"
                  >
                    {link.label}
                    <span className="nav-underline" />
                  </Link>
                )}

                {link.hasDropdown && (
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute top-full left-0 mt-2 py-2 bg-white rounded-lg shadow-lg min-w-[120px]"
                        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      >
                        {link.items!.map((item) => (
                          <li key={item.label}>
                            <Link
                              to={item.to}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                )}
              </li>
            ))}
          </ul>
        </div>

        <button
          className="hidden max-[480px]:block p-1"
          onClick={() => setIsMenuOpen(true)}
          style={{ color: '#333' }}
        >
          <Menu size={24} />
        </button>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/50 max-[480px]:block"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl max-[480px]:block"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Search size={20} color="#4FC3F7" />
                  <Heart size={20} color="#4FC3F7" fill="#4FC3F7" style={{ marginLeft: '-6px' }} />
                  <span className="font-semibold text-sm" style={{ color: '#333' }}>
                    校园失物招领
                  </span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-1">
                  <X size={20} />
                </button>
              </div>
              <ul className="p-4 space-y-2">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    {link.hasDropdown ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-500 py-2">{link.label}</div>
                        <ul className="pl-4 space-y-1">
                          {link.items!.map((item) => (
                            <li key={item.label}>
                              <Link
                                to={item.to}
                                className={cn(
                                  'block py-2 text-sm text-gray-700 rounded-lg px-3',
                                  'hover:bg-gray-50 transition-colors'
                                )}
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <Link
                        to={link.to!}
                        className={cn(
                          'block py-2 px-3 text-sm text-gray-700 rounded-lg',
                          'hover:bg-gray-50 transition-colors'
                        )}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .nav-link {
          position: relative;
          display: inline-block;
        }
        .nav-underline {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background-color: #4FC3F7;
          transform: translateX(-50%);
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-link:hover .nav-underline {
          width: 100%;
        }
      `}</style>
    </>
  );
}
