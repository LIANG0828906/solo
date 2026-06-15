import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { UserRole } from '../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const studentNav: NavItem[] = [
  {
    label: '仪表盘',
    path: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: '搜索教师',
    path: '/search',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: '我的日历',
    path: '/calendar',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

const teacherNav: NavItem[] = [
  {
    label: '课程安排',
    path: '/schedule',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v16H4z" />
        <path d="M4 9h16" />
        <path d="M9 4v16" />
      </svg>
    ),
  },
  {
    label: '我的日历',
    path: '/calendar',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

const navMap: Record<UserRole, NavItem[]> = {
  student: studentNav,
  teacher: teacherNav,
};

export default function Sidebar() {
  const { currentUser, setCurrentUser, mobileMenuOpen, setMobileMenuOpen } =
    useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = navMap[currentUser.role];

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleRoleSwitch = () => {
    if (currentUser.role === 'student') {
      setCurrentUser({
        id: 't1',
        name: '李明老师',
        role: 'teacher',
        avatar:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20male%20music%20teacher%20portrait%20headshot%20warm%20lighting&image_size=square',
      });
      navigate('/schedule');
    } else {
      setCurrentUser({
        id: 's1',
        name: '小明同学',
        role: 'student',
        avatar:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20male%20student%20portrait%20headshot%20warm%20lighting&image_size=square',
      });
      navigate('/dashboard');
    }
    setMobileMenuOpen(false);
  };

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 240,
        height: '100vh',
        backgroundColor: '#FFFBEB',
        borderRight: '1px solid #FDE68A',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transition: 'transform 0.3s ease',
      }}
      className={`sidebar-mobile${mobileMenuOpen ? ' sidebar-open' : ''}`}
    >
      <div
        style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid #FDE68A',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="#F59E0B"
          stroke="none"
        >
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
        </svg>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#1F2937',
            letterSpacing: 1,
          }}
        >
          音乐辅导
        </span>
      </div>

      <nav style={{ flex: 1, padding: '12px 0' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 15,
                color: isActive ? '#92400E' : '#1F2937',
                backgroundColor: isActive ? '#FEF3C7' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                position: 'relative',
                transition: 'background-color 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    '#FEF9E7';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'transparent';
                }
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 6,
                    bottom: 6,
                    width: 3,
                    borderRadius: '0 3px 3px 0',
                    backgroundColor: '#F59E0B',
                  }}
                />
              )}
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #FDE68A',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            fontSize: 13,
            color: '#92400E',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{currentUser.name}</span>
          <span
            style={{
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor:
                currentUser.role === 'student' ? '#DBEAFE' : '#FEE2E2',
              color:
                currentUser.role === 'student' ? '#1E40AF' : '#991B1B',
            }}
          >
            {currentUser.role === 'student' ? '学生' : '教师'}
          </span>
        </div>
        <button
          onClick={handleRoleSwitch}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #F59E0B',
            borderRadius: 6,
            backgroundColor: '#FFF',
            color: '#F59E0B',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              '#F59E0B';
            (e.currentTarget as HTMLButtonElement).style.color = '#FFF';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              '#FFF';
            (e.currentTarget as HTMLButtonElement).style.color = '#F59E0B';
          }}
        >
          切换为{currentUser.role === 'student' ? '教师' : '学生'}
        </button>
      </div>
    </aside>
  );
}
