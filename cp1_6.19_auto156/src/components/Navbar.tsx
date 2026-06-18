import React from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  mobileMenuOpen: boolean;
  onToggleMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ mobileMenuOpen, onToggleMenu }) => {
  return (
    <nav className="navbar">
      <button className="hamburger" onClick={onToggleMenu} aria-label="菜单">
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <span className="navbar-title">🌱 社区花园管理</span>
    </nav>
  );
};
