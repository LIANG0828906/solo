import React, { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, Settings, LogOut } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useStore } from '@/store/useStore';
import { mockStudents, mockTeacher } from '@/utils/mockData';

export const TopNav: React.FC = () => {
  const { currentUser, switchUser, assignments } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const pendingAssignments = assignments.filter(
    (a) => a.status === 'submitted'
  ).length;

  const hasUnread = pendingAssignments > 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userList = [
    mockTeacher,
    ...mockStudents.map((s) => ({
      id: s.id,
      name: s.name,
      role: 'student' as const,
      avatar: s.avatar,
      email: `${s.id}@tunetracker.com`,
    })),
  ];

  return (
    <header
      className="fixed top-0 right-0 left-0 md:left-[240px] h-16 z-30"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(232, 223, 214, 0.5)',
      }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-text-primary">
            {currentUser?.role === 'teacher' ? '教师工作台' : '我的学习'}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={twMerge(
                'p-2.5 rounded-xl transition-all duration-fast',
                'hover:bg-bg-hover text-text-secondary hover:text-text-primary',
                'relative'
              )}
            >
              <Bell size={20} />
              {hasUnread && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full pulse-dot" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-card shadow-card-hover border border-border-color overflow-hidden animate-scale-in origin-top-right">
                <div className="px-4 py-3 border-b border-border-color">
                  <h3 className="font-semibold text-text-primary">通知</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {pendingAssignments > 0 ? (
                    <div className="p-4">
                      <div className="text-sm text-text-secondary">
                        有 <span className="text-accent font-medium">{pendingAssignments}</span> 份作业等待批改
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-text-muted text-sm">
                      暂无新通知
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl hover:bg-bg-hover transition-all duration-fast"
            >
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-[42px] h-[42px] rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-text-primary">
                  {currentUser?.name}
                </div>
                <div className="text-xs text-text-muted">
                  {currentUser?.role === 'teacher' ? '教师' : '学生'}
                </div>
              </div>
              <ChevronDown
                size={16}
                className={twMerge(
                  'text-text-muted transition-transform duration-fast',
                  showUserMenu && 'rotate-180'
                )}
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-card shadow-card-hover border border-border-color overflow-hidden animate-scale-in origin-top-right">
                <div className="px-4 py-3 border-b border-border-color bg-bg-primary/50">
                  <div className="text-sm font-medium text-text-primary">
                    切换用户
                  </div>
                </div>
                <div className="py-1 max-h-64 overflow-y-auto">
                  {userList.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user);
                        setShowUserMenu(false);
                      }}
                      className={twMerge(
                        'w-full px-4 py-2.5 flex items-center gap-3 text-left transition-all duration-fast',
                        currentUser?.id === user.id
                          ? 'bg-accent-light text-accent'
                          : 'hover:bg-bg-hover text-text-primary'
                      )}
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {user.role === 'teacher' ? '教师' : '学生'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-border-color py-1">
                  <button className="w-full px-4 py-2.5 flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all duration-fast">
                    <Settings size={18} />
                    <span className="text-sm">设置</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
