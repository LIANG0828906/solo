import React, { useEffect, useState } from 'react';

type Role = 'annotator' | 'reviewer' | 'admin';

interface SidebarProps {
  role: Role;
  activeModule: string;
  onModuleChange: (m: string) => void;
  currentUser: string;
  onLogout: () => void;
}

interface MenuItem {
  key: string;
  label: string;
  icon: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeModule,
  onModuleChange,
  currentUser,
  onLogout,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getMenuItems = (): MenuItem[] => {
    if (role === 'annotator') {
      return [{ key: 'annotation', label: '标注任务', icon: '📝' }];
    }
    if (role === 'reviewer') {
      return [{ key: 'review', label: '审核任务', icon: '✅' }];
    }
    return [
      { key: 'annotation', label: '标注任务', icon: '📝' },
      { key: 'review', label: '审核任务', icon: '✅' },
      { key: 'dashboard', label: '数据看板', icon: '📊' },
    ];
  };

  const menuItems = getMenuItems();
  const roleLabel = role === 'annotator' ? '标注员' : role === 'reviewer' ? '审核员' : '管理员';
  const firstLetter = currentUser.charAt(0).toUpperCase();

  if (isMobile) {
    return (
      <div
        style={{
          backgroundColor: '#37474F',
          height: 56,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff',
          }}
        >
          众包标注看板
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onModuleChange(item.key)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 4,
                backgroundColor: activeModule === item.key ? '#455A64' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: activeModule === item.key ? '#fff' : '#B0BEC5',
                borderLeft: activeModule === item.key ? '3px solid #42A5F5' : 'none',
                paddingLeft: activeModule === item.key ? 0 : 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                transition: 'background-color 0.2s',
              }}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
          <div
            onClick={onLogout}
            title="退出登录"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#546E7A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              marginLeft: 8,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {firstLetter}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#37474F',
        width: 240,
        height: '100vh',
        padding: '20px 0',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#fff',
          padding: '0 24px 20px',
          borderBottom: '1px solid #455A64',
        }}
      >
        众包标注看板
      </div>

      <nav style={{ marginTop: 12 }}>
        {menuItems.map((item) => {
          const isActive = activeModule === item.key;
          return (
            <div
              key={item.key}
              onClick={() => onModuleChange(item.key)}
              style={{
                padding: '12px 24px',
                paddingLeft: isActive ? '21px' : '24px',
                cursor: 'pointer',
                color: isActive ? '#fff' : '#B0BEC5',
                borderLeft: isActive ? '3px solid #42A5F5' : 'none',
                fontWeight: isActive ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'background-color 0.2s',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#455A64';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 14 }}>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          padding: '16px 24px',
          borderTop: '1px solid #455A64',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#546E7A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              flexShrink: 0,
              fontSize: 14,
            }}
          >
            {firstLetter}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                color: '#fff',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentUser}
            </div>
            <div style={{ fontSize: 12, color: '#90A4AE' }}>{roleLabel}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #546E7A',
              borderRadius: 4,
              padding: '4px 10px',
              color: '#B0BEC5',
              cursor: 'pointer',
              fontSize: 12,
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#455A64';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            退出
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
