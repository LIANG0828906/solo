import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface NavbarProps {
  onMenuClick: () => void;
}

function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-[60px] bg-nord-navbar text-white z-40 flex items-center justify-between px-6 shadow-md">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="菜单"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold tracking-wide">书驿站</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="w-10 h-10 rounded-full bg-nord-accent flex items-center justify-center cursor-pointer text-nord-bg font-semibold">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <button
            onClick={handleLogout}
            className="absolute right-0 top-full mt-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap hover:bg-gray-100"
          >
            退出登录
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
