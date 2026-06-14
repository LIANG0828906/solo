import { useState, useRef, useEffect } from 'react';
import { useAudioEngine } from '@hooks/useAudioEngine';

interface MenuBarProps {
  onUploadClick: () => void;
}

export function MenuBar({ onUploadClick }: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { addTrack } = useAudioEngine();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleNewProject = () => {
    setActiveMenu(null);
  };

  const handleAddTrack = () => {
    addTrack();
    setActiveMenu(null);
  };

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = ripple.style.height = '10px';

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 300);
  };

  const menuItemStyle = {
    padding: '8px 16px',
    cursor: 'pointer',
    color: '#e2e8f0',
    fontSize: '13px',
    transition: 'background-color 0.15s ease',
  };

  const menuItemHoverStyle = {
    ':hover': {
      backgroundColor: '#334155',
    },
  };

  return (
    <div
      ref={menuRef}
      style={{
        height: '48px',
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => toggleMenu('file')}
            style={{
              padding: '6px 12px',
              color: activeMenu === 'file' ? '#a855f7' : '#e2e8f0',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '4px',
              transition: 'background-color 0.15s ease, color 0.15s ease',
              backgroundColor: activeMenu === 'file' ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (activeMenu) {
                setActiveMenu('file');
              }
            }}
          >
            文件
          </button>
          {activeMenu === 'file' && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                minWidth: '160px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                padding: '4px 0',
                animation: 'slideInDown 150ms ease-out',
              }}
            >
              <div style={menuItemStyle} onClick={handleNewProject}>
                新建项目
              </div>
              <div style={menuItemStyle} onClick={onUploadClick}>
                导入音频...
              </div>
              <div style={menuItemStyle} onClick={handleAddTrack}>
                添加轨道
              </div>
              <div
                style={{
                  height: '1px',
                  backgroundColor: '#334155',
                  margin: '4px 0',
                }}
              />
              <div style={{ ...menuItemStyle, color: '#64748b' }}>
                导出混音...
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => toggleMenu('edit')}
            style={{
              padding: '6px 12px',
              color: activeMenu === 'edit' ? '#a855f7' : '#e2e8f0',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '4px',
              transition: 'background-color 0.15s ease, color 0.15s ease',
              backgroundColor: activeMenu === 'edit' ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
            }}
          >
            编辑
          </button>
          {activeMenu === 'edit' && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                minWidth: '180px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                padding: '4px 0',
              }}
            >
              <div style={{ ...menuItemStyle, color: '#64748b' }}>撤销</div>
              <div style={{ ...menuItemStyle, color: '#64748b' }}>重做</div>
              <div
                style={{
                  height: '1px',
                  backgroundColor: '#334155',
                  margin: '4px 0',
                }}
              />
              <div style={menuItemStyle}>剪切 (Ctrl+X)</div>
              <div style={menuItemStyle}>复制 (Ctrl+C)</div>
              <div style={menuItemStyle}>粘贴 (Ctrl+V)</div>
              <div style={menuItemStyle}>删除选中</div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => toggleMenu('view')}
            style={{
              padding: '6px 12px',
              color: activeMenu === 'view' ? '#a855f7' : '#e2e8f0',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '4px',
              transition: 'background-color 0.15s ease, color 0.15s ease',
              backgroundColor: activeMenu === 'view' ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
            }}
          >
            视图
          </button>
          {activeMenu === 'view' && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                minWidth: '160px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                padding: '4px 0',
              }}
            >
              <div style={{ ...menuItemStyle, color: '#64748b' }}>放大</div>
              <div style={{ ...menuItemStyle, color: '#64748b' }}>缩小</div>
              <div style={{ ...menuItemStyle, color: '#64748b' }}>适应窗口</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onUploadClick}
          onMouseDown={createRipple}
          className="ripple"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'background-color 0.15s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          上传音频
        </button>
      </div>

      <style>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
