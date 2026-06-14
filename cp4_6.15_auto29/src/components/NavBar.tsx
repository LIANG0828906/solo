import { NavLink } from 'react-router-dom';
import { Home, PlusSquare, User } from 'lucide-react';

export default function NavBar() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 px-4 py-2 text-xs transition-colors duration-300 ${
      isActive ? 'text-morandi-blue' : 'text-morandi-brown hover:text-morandi-blue'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-morandi-white border-t border-morandi-gray shadow-[0_-2px_12px_rgba(124,152,166,0.08)]">
      <div className="max-w-4xl mx-auto flex justify-around items-center h-16">
        <NavLink to="/" className={navLinkClass}>
          <Home size={22} strokeWidth={1.8} />
          <span>浏览</span>
        </NavLink>
        <NavLink to="/publish" className={navLinkClass}>
          <PlusSquare size={22} strokeWidth={1.8} />
          <span>发布</span>
        </NavLink>
        <NavLink to="/profile" className={navLinkClass}>
          <User size={22} strokeWidth={1.8} />
          <span>我的</span>
        </NavLink>
      </div>
    </nav>
  );
}
