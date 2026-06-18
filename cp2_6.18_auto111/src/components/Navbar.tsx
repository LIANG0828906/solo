import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, LogOut, FileText, Calendar } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useDebounce } from '@/hooks/useDebounce';
import { getInitials, getNameColor } from '@/utils/helpers';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setSearchQuery, searchQuery } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (!localSearch) {
          setIsExpanded(false);
        }
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [localSearch]);

  const handleSearchClick = () => {
    setIsExpanded(true);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-6 h-6 rounded-md bg-[#6366f1] flex items-center justify-center mr-2">
            <span className="text-white text-xs font-bold">CC</span>
          </div>
          <span className="text-lg font-semibold text-gray-800 hidden sm:block">
            CommunityCanvas
          </span>
        </div>

        <div
          ref={searchRef}
          className="relative"
          onClick={handleSearchClick}
        >
          <div
            className={`
              flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-lg
              transition-all duration-300 ease-out
              ${isExpanded || isFocused ? 'w-[350px]' : 'w-[200px]'}
              ${isFocused ? 'border-indigo-400 ring-2 ring-indigo-100' : ''}
            `}
          >
            <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="搜索公告或活动..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="
                flex-1 bg-transparent border-none outline-none
                px-3 py-2 text-sm text-gray-700 placeholder-gray-400
              "
            />
            {localSearch && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalSearch('');
                }}
                className="mr-2 text-gray-400 hover:text-gray-600 text-sm"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="relative" ref={userMenuRef}>
          {currentUser && (
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                style={{ backgroundColor: getNameColor(currentUser.name) }}
              >
                {getInitials(currentUser.name)}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
          )}

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 animate-fade-in z-50">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/my');
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <FileText className="w-4 h-4 mr-2 text-gray-400" />
                我的公告
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/my?tab=activities');
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                我的活动
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
