import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, Feather, Compass, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/modules/user/UserContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser } = useUser();
  const navigate = useNavigate();

  const navLinks = [
    { name: '探索', href: '/explore', icon: Compass },
    { name: '创作', href: '/create', icon: Feather },
    { name: '个人中心', href: '/profile', icon: User },
  ];

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    navigate(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/explore"
              className="flex items-center space-x-2 group"
            >
              <span className="text-2xl font-serif font-bold text-primary group-hover:text-primary-hover transition-colors">
                诗韵
              </span>
              <span className="text-sm font-cursive text-brown-400 hidden sm:block">
                社区
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="flex items-center space-x-1.5 text-brown-400 hover:text-foreground transition-colors duration-200 font-medium"
              >
                <link.icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <Link
                to="/profile"
                className="flex items-center space-x-3 group"
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{currentUser.nickname}</p>
                  <p className="text-xs text-brown-300">@{currentUser.username}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white font-medium shadow-soft group-hover:scale-105 transition-transform">
                  {currentUser.nickname.charAt(0)}
                </div>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors duration-200 shadow-soft"
              >
                <LogIn className="w-4 h-4" />
                <span>登录</span>
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-brown-400 hover:bg-cream-200 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 py-4 space-y-2 bg-background/95 backdrop-blur-md border-t border-brown-100">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.href)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-brown-400 hover:bg-cream-200 hover:text-foreground transition-colors duration-200"
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium">{link.name}</span>
            </button>
          ))}

          {currentUser ? (
            <Link
              to="/profile"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 border-t border-brown-100 mt-2 pt-4"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white font-medium">
                {currentUser.nickname.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{currentUser.nickname}</p>
                <p className="text-xs text-brown-300">@{currentUser.username}</p>
              </div>
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors duration-200 font-medium"
            >
              <LogIn className="w-5 h-5" />
              <span>登录</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
