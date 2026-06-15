import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, User, Home } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: '首页', icon: Home },
    { path: '/profile', label: '个人中心', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-cream/95 backdrop-blur-md border-b border-wood/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 btn-press">
            <div className="w-10 h-10 bg-gradient-to-br from-warmOrange to-warmOrangeDark rounded-xl flex items-center justify-center shadow-soft">
              <BookOpen className="text-white" size={22} />
            </div>
            <span className="font-serif font-bold text-xl text-[#3D2B1F]">书换书</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium transition-all duration-200
                  ${isActive(link.path)
                    ? 'bg-warmOrange/10 text-warmOrangeDark'
                    : 'text-[#3D2B1F]/70 hover:bg-creamDark hover:text-[#3D2B1F]'
                  }
                `}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            ))}
            <button className="btn-press ml-3 px-5 py-2 bg-warmOrange text-white rounded-xl font-medium shadow-soft hover:bg-warmOrangeDark transition-colors">
              + 发布课本
            </button>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden btn-press p-2 rounded-xl text-[#3D2B1F] hover:bg-creamDark transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className={`md:hidden hamburger-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="py-3 space-y-1 border-t border-wood/10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`
                  btn-press flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${isActive(link.path)
                    ? 'bg-warmOrange/10 text-warmOrangeDark'
                    : 'text-[#3D2B1F]/70 hover:bg-creamDark'
                  }
                `}
              >
                <link.icon size={20} />
                {link.label}
              </Link>
            ))}
            <button className="btn-press w-full mt-2 px-4 py-3 bg-warmOrange text-white rounded-xl font-medium shadow-soft">
              + 发布课本
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
