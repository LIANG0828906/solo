import React, { useState, useCallback } from 'react';
import { useLending } from '../LendingModule/LendingContext';
import { debounce } from '../utils/helpers';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  onToggleSidebar: () => void;
  onToggleAdmin: () => void;
  showAdmin: boolean;
}

export default function Navbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  onToggleSidebar,
  onToggleAdmin,
  showAdmin,
}: NavbarProps) {
  const { currentUser, records, loginUser, logout, isLoading } = useLending();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearchChange(value);
    }, 300),
    [onSearchChange]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const activeCount = records.filter(
    (r) => r.status === 'borrowed' || r.status === 'reserved'
  ).length;

  const userOptions = [
    { id: 'user-001', name: '张三（读者）', role: 'reader' },
    { id: 'user-002', name: '李四（读者）', role: 'reader' },
    { id: 'admin-001', name: '王管理员', role: 'admin' },
  ];

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '64px',
        backgroundColor: '#1E293B',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        borderBottom: '1px solid #334155',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div>
          <h1
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#F8FAFC',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            智慧书屋
          </h1>
          <p
            style={{
              fontSize: '11px',
              color: '#64748B',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Smart Library
          </p>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: 'center',
          maxWidth: '800px',
          margin: '0 auto',
        }}
        className="nav-search-container"
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
          }}
          className="nav-search-wrapper"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isSearchFocused ? '#6366F1' : '#64748B'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              transition: 'stroke 0.2s ease',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="搜索书名、作者、ISBN..."
            defaultValue={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 40px',
              backgroundColor: '#1E293B',
              border: `2px solid ${isSearchFocused ? '#6366F1' : '#334155'}`,
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '14px',
              transition: 'border-color 0.2s ease',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#334155',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#475569';
                e.currentTarget.style.color = '#F8FAFC';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#334155';
                e.currentTarget.style.color = '#94A3B8';
              }}
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{
            padding: '8px 32px 8px 12px',
            backgroundColor: '#1E293B',
            border: '2px solid #334155',
            borderRadius: '8px',
            color: '#F8FAFC',
            fontSize: '14px',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            transition: 'all 0.2s ease',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
          className="nav-category-select"
        >
          <option value="all" style={{ backgroundColor: '#1E293B' }}>
            全部分类
          </option>
          {categories.map((cat) => (
            <option key={cat} value={cat} style={{ backgroundColor: '#1E293B' }}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {currentUser?.role === 'admin' && (
          <button
            onClick={onToggleAdmin}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: showAdmin ? '#6366F1' : '#334155',
              borderRadius: '8px',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              if (!showAdmin) e.currentTarget.style.backgroundColor = '#475569';
            }}
            onMouseOut={(e) => {
              if (!showAdmin) e.currentTarget.style.backgroundColor = '#334155';
            }}
            className="admin-toggle-btn"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span className="admin-btn-text">图书管理</span>
          </button>
        )}

        <button
          onClick={onToggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#334155',
            borderRadius: '8px',
            color: '#F8FAFC',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#475569')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
          className="sidebar-toggle-btn"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          {activeCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                backgroundColor: '#EF4444',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {activeCount}
            </span>
          )}
          <span className="sidebar-btn-text">我的借阅</span>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 4px 4px 10px',
              backgroundColor: 'transparent',
              borderRadius: '8px',
              color: '#F8FAFC',
              border: '1px solid transparent',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#334155';
              e.currentTarget.style.borderColor = '#475569';
            }}
            onMouseOut={(e) => {
              if (!showUserMenu) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: currentUser
                  ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                  : '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              {isLoading ? (
                <div
                  className="loading-spinner"
                  style={{ width: '16px', height: '16px', borderWidth: '2px' }}
                />
              ) : currentUser ? (
                currentUser.name.charAt(0)
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <span
              style={{
                maxWidth: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              className="user-name-text"
            >
              {currentUser?.name || '登录'}
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s ease',
              }}
              className="user-menu-arrow"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showUserMenu && (
            <>
              <div
                onClick={() => setShowUserMenu(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: -1,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '200px',
                  backgroundColor: '#1E293B',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  overflow: 'hidden',
                  animation: 'slideUp 0.2s ease-out',
                }}
              >
                {currentUser && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #334155',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#F8FAFC',
                        margin: 0,
                        marginBottom: '2px',
                      }}
                    >
                      {currentUser.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                      {currentUser.email}
                    </p>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '6px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          currentUser.role === 'admin' ? '#6366F1' : '#334155',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}
                    >
                      {currentUser.role === 'admin' ? '管理员' : '读者'}
                    </span>
                  </div>
                )}
                <div style={{ padding: '4px' }}>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#64748B',
                      padding: '8px 12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    切换用户
                  </p>
                  {userOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        loginUser(opt.id);
                        setShowUserMenu(false);
                      }}
                      disabled={currentUser?.id === opt.id || isLoading}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor:
                          currentUser?.id === opt.id ? '#334155' : 'transparent',
                        color:
                          currentUser?.id === opt.id ? '#6366F1' : '#F8FAFC',
                        border: 'none',
                        cursor:
                          currentUser?.id === opt.id ? 'default' : 'pointer',
                        fontSize: '13px',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseOver={(e) => {
                        if (currentUser?.id !== opt.id)
                          e.currentTarget.style.backgroundColor = '#334155';
                      }}
                      onMouseOut={(e) => {
                        if (currentUser?.id !== opt.id)
                          e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background:
                            opt.role === 'admin'
                              ? 'linear-gradient(135deg, #F59E0B, #EF4444)'
                              : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '12px',
                        }}
                      >
                        {opt.name.charAt(0)}
                      </div>
                      {opt.name}
                    </button>
                  ))}
                </div>
                {currentUser && (
                  <>
                    <div
                      style={{
                        height: '1px',
                        backgroundColor: '#334155',
                        margin: '4px 8px',
                      }}
                    />
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      style={{
                        width: 'calc(100% - 8px)',
                        margin: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        color: '#EF4444',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
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
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      退出登录
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .nav-search-wrapper { max-width: 200px !important; }
          .nav-category-select { padding: 8px 28px 8px 8px !important; font-size: 12px !important; }
          .sidebar-btn-text, .admin-btn-text, .user-name-text { display: none !important; }
          .user-menu-arrow { display: none !important; }
        }
        @media (max-width: 640px) {
          .nav-search-container { gap: 6px !important; }
          .nav-search-wrapper { max-width: 140px !important; }
          .nav-category-select { max-width: 110px; font-size: 11px !important; }
        }
      `}</style>
    </nav>
  );
}
