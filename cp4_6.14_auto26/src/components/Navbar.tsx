import { useState, useEffect, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Palette, ArrowLeft } from 'lucide-react';

export const Navbar = memo(function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isDetailPage = location.pathname.startsWith('/exhibition/');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__container">
        <div className="navbar__left">
          {isDetailPage ? (
            <Link to="/" className="navbar__back">
              <ArrowLeft size={20} strokeWidth={2} />
              <span>返回展厅</span>
            </Link>
          ) : (
            <Link to="/" className="navbar__logo">
              <Palette size={26} strokeWidth={1.5} />
              <span className="navbar__brand">虚拟艺术展馆</span>
            </Link>
          )}
        </div>
        <div className="navbar__right">
          <span className="navbar__tagline">Virtual Art Gallery</span>
        </div>
      </div>
    </nav>
  );
});
