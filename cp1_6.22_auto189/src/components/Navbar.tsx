import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brush, Menu, X } from 'lucide-react';
import { useAppStore } from '../store';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { portfolios } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 px-6 flex items-center justify-between"
      style={{
        height: '60px',
        background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
      }}
    >
      <Link to="/" className="flex items-center gap-2 text-white no-underline">
        <Brush size={28} className="brush-icon" />
        <span className="text-xl font-bold tracking-wide">ArtConnect</span>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        <div className="relative group">
          <button className="text-white/90 hover:text-white transition-colors font-medium flex items-center gap-1">
            画集
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
            {portfolios.map((portfolio) => (
              <Link
                key={portfolio.id}
                to={`/portfolio/${portfolio.id}`}
                className="block px-4 py-3 text-gray-700 hover:bg-pink-50 transition-colors no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                {portfolio.name}
                <span className="text-xs text-gray-400 ml-2">{portfolio.workCount}件</span>
              </Link>
            ))}
          </div>
        </div>
        
        <Link to="/admin" className="text-white/90 hover:text-white transition-colors font-medium no-underline">
          管理
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={() => navigate('/admin')}
          className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
        >
          登录
        </button>
        <button
          className="px-5 py-2 text-sm font-medium text-pink-600 bg-white rounded-full hover:bg-pink-50 transition-colors btn-ripple"
          style={{ borderRadius: '20px' }}
        >
          注册
        </button>
      </div>

      <button
        className="md:hidden text-white p-2"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {mobileMenuOpen && (
        <div
          className="absolute top-full left-0 right-0 bg-white shadow-xl md:hidden fade-in"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <div className="p-4 space-y-3">
            <p className="text-sm font-medium text-gray-500 mb-2">画集</p>
            {portfolios.map((portfolio) => (
              <Link
                key={portfolio.id}
                to={`/portfolio/${portfolio.id}`}
                className="block px-3 py-2 text-gray-700 hover:bg-pink-50 rounded-lg no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                {portfolio.name}
                <span className="text-xs text-gray-400 ml-2">{portfolio.workCount}件</span>
              </Link>
            ))}
            <hr className="my-3 border-gray-200" />
            <Link
              to="/admin"
              className="block px-3 py-2 text-gray-700 hover:bg-pink-50 rounded-lg no-underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              管理面板
            </Link>
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 py-2 text-sm font-medium text-pink-600 border border-pink-200 rounded-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                登录
              </button>
              <button
                className="flex-1 py-2 text-sm font-medium text-white rounded-full"
                style={{ background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                注册
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
