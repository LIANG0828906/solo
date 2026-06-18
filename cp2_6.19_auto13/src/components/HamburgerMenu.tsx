import { NavLink } from 'react-router-dom';
import { Home, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const navLinks = [
    { to: '/', label: '首页', icon: Home },
    { to: '/search', label: '搜索', icon: Search },
  ];

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <div
        className={