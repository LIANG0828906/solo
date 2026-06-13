import { Link } from 'react-router-dom';
import { Home, User } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Home className="w-6 h-6 text-primary-500" />
          <span className="text-xl font-bold text-gray-900">社区活动</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            className="flex items-center gap-2 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="hidden md:inline">我的</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
