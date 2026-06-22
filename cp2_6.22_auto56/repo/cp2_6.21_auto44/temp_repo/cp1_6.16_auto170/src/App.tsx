// 导入 React 核心库
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// 导入 DnD 相关依赖
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
// 导入组件
import BookShelf from './components/BookShelf';
import ExhibitionArea from './components/ExhibitionArea';
import HistoryPanel from './components/HistoryPanel';
import PosterGenerator from './components/PosterGenerator';

const App: React.FC = () => {
  // 响应式状态：判断是否为移动端
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 900);
  // 左侧抽屉状态
  const [leftDrawerOpen, setLeftDrawerOpen] = useState<boolean>(false);
  // 右侧抽屉状态
  const [rightDrawerOpen, setRightDrawerOpen] = useState<boolean>(false);
  // 海报生成器弹窗状态
  const [posterOpen, setPosterOpen] = useState<boolean>(false);

  // 检测是否为触摸设备
  const isTouchDevice = useMemo(() => {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }, []);

  // 根据设备类型选择合适的 DnD backend
  const backend = useMemo(() => {
    return isTouchDevice ? TouchBackend : HTML5Backend;
  }, [isTouchDevice]);

  // 处理窗口大小变化
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < 900;
    setIsMobile(mobile);
    // 切换到桌面端时自动关闭抽屉
    if (!mobile) {
      setLeftDrawerOpen(false);
      setRightDrawerOpen(false);
    }
  }, []);

  // 监听窗口 resize 事件
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    // 组件卸载时移除事件监听
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // 切换左侧抽屉
  const toggleLeftDrawer = () => {
    setLeftDrawerOpen(!leftDrawerOpen);
    if (rightDrawerOpen) setRightDrawerOpen(false);
  };

  // 切换右侧抽屉
  const toggleRightDrawer = () => {
    setRightDrawerOpen(!rightDrawerOpen);
    if (leftDrawerOpen) setLeftDrawerOpen(false);
  };

  // 遮罩层点击处理
  const handleOverlayClick = () => {
    setLeftDrawerOpen(false);
    setRightDrawerOpen(false);
  };

  return (
    <DndProvider backend={backend}>
      <div style={styles.appContainer}>
        {/* 顶部导航栏 */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            {isMobile && (
              <button 
                onClick={toggleLeftDrawer} 
                style={styles.menuButton}
                aria-label="打开书架"
              >
                ☰
              </button>
            )}
            <h1 style={styles.title}>独立书店书展策划工具</h1>
          </div>
          <div style={styles.headerRight}>
            <button 
              onClick={() => setPosterOpen(true)} 
              style={styles.actionButton}
            >
              生成海报
            </button>
            {isMobile && (
              <button 
                onClick={toggleRightDrawer} 
                style={styles.menuButton}
                aria-label="打开历史记录"
              >
                ⏱
              </button>
            )}
          </div>
        </header>

        {/* 主内容区域 */}
        <div style={styles.mainContent}>
          {/* 左侧面板 - 书架 */}
          <aside
            style={{
              ...styles.leftPanel,
              ...(isMobile
                ? {
                    transform: leftDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
                    position: 'fixed',
                    left: 0,
                    top: '60px',
                    bottom: 0,
                    zIndex: 100,
                  }
                : {}),
            }}
          >
            <BookShelf />
          </aside>

          {/* 中央展区 */}
          <main style={styles.centerArea}>
            <ExhibitionArea />
          </main>

          {/* 右侧面板 - 历史记录 */}
          <aside
            style={{
              ...styles.rightPanel,
              ...(isMobile
                ? {
                    transform: rightDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
                    position: 'fixed',
                    right: 0,
                    top: '60px',
                    bottom: 0,
                    zIndex: 100,
                  }
                : {}),
            }}
          >
            <HistoryPanel />
          </aside>
        </div>

        {/* 移动端遮罩层 */}
        {isMobile && (leftDrawerOpen || rightDrawerOpen) && (
          <div
            style={styles.overlay}
            onClick={handleOverlayClick}
          />
        )}

        {/* 海报生成器弹窗 */}
        <PosterGenerator 
          isOpen={posterOpen} 
          onClose={() => setPosterOpen(false)} 
        />
      </div>
    </DndProvider>
  );
};

// 样式定义
const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Noto Sans SC', sans-serif",
    overflow: 'hidden',
  },
  header: {
    height: '60px',
    backgroundColor: '#8B4513',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontFamily: "'Noto Serif SC', serif",
    fontWeight: 700,
  },
  menuButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  actionButton: {
    backgroundColor: '#D2691E',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Noto Sans SC', sans-serif",
    transition: 'background-color 0.2s',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  },
  leftPanel: {
    width: '320px',
    backgroundColor: '#F8F4E8',
    borderRight: '1px solid #E8E0D0',
    overflowY: 'auto',
    flexShrink: 0,
    transition: 'transform 0.3s ease-in-out',
  },
  centerArea: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    backgroundImage: `
      linear-gradient(to right, rgba(139, 69, 19, 0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(139, 69, 19, 0.1) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    overflow: 'auto',
    position: 'relative',
  },
  rightPanel: {
    width: '320px',
    backgroundColor: '#F9F6EE',
    borderLeft: '1px solid #E8E0D0',
    overflowY: 'auto',
    flexShrink: 0,
    transition: 'transform 0.3s ease-in-out',
  },
  overlay: {
    position: 'fixed',
    top: '60px',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 50,
    transition: 'opacity 0.3s ease-in-out',
  },
};

export default App;
