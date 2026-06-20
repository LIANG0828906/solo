import React, { useEffect, useRef, useState } from 'react';
import { Archive, StickyNote, Settings, FolderPlus, Image, FileText, Link } from 'lucide-react';
import { useStore } from '@/store/useStore';

const Sidebar: React.FC = () => {
  const sidebarVisible = useStore((state) => state.sidebarVisible);
  const setSidebarVisible = useStore((state) => state.setSidebarVisible);
  const setOrganizerPanelVisible = useStore((state) => state.setOrganizerPanelVisible);
  const addNote = useStore((state) => state.addNote);
  const icons = useStore((state) => state.icons);
  const organizerPanelVisible = useStore((state) => state.organizerPanelVisible);

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredOnEdge, setHoveredOnEdge] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX < 10 && !sidebarVisible) {
        if (!hoveredOnEdge) {
          setHoveredOnEdge(true);
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          hoverTimeoutRef.current = setTimeout(() => {
            setSidebarVisible(true);
          }, 200);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [sidebarVisible, hoveredOnEdge, setSidebarVisible]);

  const handleMouseLeave = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    leaveTimeoutRef.current = setTimeout(() => {
      setSidebarVisible(false);
      setHoveredOnEdge(false);
    }, 300);
  };

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
  };

  const handleOrganizerClick = () => {
    setOrganizerPanelVisible(!organizerPanelVisible);
    setSidebarVisible(false);
  };

  const handleAddNote = () => {
    const colors = ['yellow', 'blue', 'pink', 'green'] as const;
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    addNote({
      title: '',
      content: '',
      color: randomColor,
      x: Math.random() * 400 + 200,
      y: Math.random() * 300 + 150,
    });
    setSidebarVisible(false);
  };

  const handleCreateFolder = () => {
    const selectedIconId = useStore.getState().selectedIconId;
    const iconIds = selectedIconId ? [selectedIconId] : [];
    useStore.getState().createFolder('新建文件夹', iconIds);
    setSidebarVisible(false);
  };

  const stats = {
    total: icons.length,
    folders: icons.filter((i) => i.type === 'folder').length,
    documents: icons.filter((i) => i.type === 'document').length,
    apps: icons.filter((i) => i.type === 'app').length,
    links: icons.filter((i) => i.type === 'link').length,
  };

  return (
    <>
      <div className="sidebar-trigger" />
      <div
        className={`sidebar ${sidebarVisible ? 'visible' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="sidebar-header">
          <div className="sidebar-title">桌面整理</div>
          <div className="sidebar-subtitle">高效管理你的数字桌面</div>
        </div>

        <div
          className={`sidebar-item ${organizerPanelVisible ? 'active' : ''}`}
          onClick={handleOrganizerClick}
        >
          <Archive size={20} />
          <span>自动归类</span>
        </div>

        <div className="sidebar-item" onClick={handleAddNote}>
          <StickyNote size={20} />
          <span>新建便签</span>
        </div>

        <div className="sidebar-item" onClick={handleCreateFolder}>
          <FolderPlus size={20} />
          <span>新建文件夹</span>
        </div>

        <div className="sidebar-item">
          <Settings size={20} />
          <span>设置</span>
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            padding: '20px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              opacity: 0.7,
              marginBottom: '12px',
            }}
          >
            桌面统计
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#6b9ac4',
                }}
              />
              <span>应用 {stats.apps}</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#8fb98f',
                }}
              />
              <span>文件夹 {stats.folders}</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#e6b87d',
                }}
              />
              <span>文档 {stats.documents}</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#c48fb1',
                }}
              />
              <span>链接 {stats.links}</span>
            </div>
          </div>
          <div
            style={{
              marginTop: '12px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            总计 {stats.total} 个图标
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
