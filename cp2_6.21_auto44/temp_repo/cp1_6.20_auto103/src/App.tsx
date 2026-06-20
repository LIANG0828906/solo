import { useState, useCallback, useMemo, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { NotificationPanel } from './components/NotificationPanel';
import { useWebSocket } from './hooks/useWebSocket';
import type { ToolType, CanvasElement, DrawPath, Note, NotificationItem, Comment } from './types';
import { Bell } from 'lucide-react';

function App() {
  const [currentTool, setCurrentTool] = useState<ToolType>('brush');
  const [currentColor, setCurrentColor] = useState('#ff6b6b');
  const [brushSize, setBrushSize] = useState(4);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selfId, setSelfId] = useState('');
  const [selfUsername, setSelfUsername] = useState('');
  const [selfColor, setSelfColor] = useState('#64b5f6');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(true);
  const [viewTarget, setViewTarget] = useState<{ x: number; y: number } | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const handleInit = useCallback((data: any) => {
    setSelfId(data.selfId || '');
    setSelfUsername(data.selfUsername || '');
    setSelfColor(data.selfColor || '#64b5f6');
    setElements(data.elements || []);
  }, []);

  const handleElementAdd = useCallback((element: CanvasElement) => {
    setElements((prev) => [...prev, element]);
  }, []);

  const handleElementUpdate = useCallback((element: CanvasElement) => {
    setElements((prev) =>
      prev.map((el) => (el.id === element.id ? { ...el, ...element } : el))
    );
  }, []);

  const handleLike = useCallback((data: { elementId: string; userId: string; count: number; liked: boolean }) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== data.elementId) return el;
        const likes = data.liked
          ? [...el.likes, data.userId]
          : el.likes.filter((uid) => uid !== data.userId);
        return { ...el, likes: Array.from(new Set(likes)) };
      })
    );
  }, []);

  const handleComment = useCallback((data: { elementId: string; comment: Comment }) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== data.elementId) return el;
        return { ...el, comments: [...el.comments, data.comment] };
      })
    );
  }, []);

  const handleNotification = useCallback((notification: NotificationItem) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 50));
  }, []);

  const ws = useWebSocket({
    onInit: handleInit,
    onElementAdd: handleElementAdd,
    onElementUpdate: handleElementUpdate,
    onLike: handleLike,
    onComment: handleComment,
    onNotification: handleNotification
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDrawComplete = useCallback(
    (pathData: Omit<DrawPath, 'id' | 'userId' | 'likes' | 'comments' | 'type'>) => {
      ws.sendDraw(pathData);
    },
    [ws]
  );

  const handleAddNote = useCallback(
    (x: number, y: number) => {
      ws.sendAddNote({ x, y });
    },
    [ws]
  );

  const handleUpdateNote = useCallback(
    (id: string, updates: Partial<Note>) => {
      ws.sendUpdateNote({ id, ...updates });
    },
    [ws]
  );

  const handleLikeElement = useCallback(
    (elementId: string) => {
      ws.sendLike(elementId);
    },
    [ws]
  );

  const handleCommentElement = useCallback(
    (elementId: string, text: string) => {
      ws.sendComment(elementId, text);
    },
    [ws]
  );

  const handleNavigateToElement = useCallback((elementId: string) => {
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    let x: number, y: number;
    if (element.type === 'note') {
      x = element.x + element.width / 2;
      y = element.y + element.height / 2;
    } else if (element.points.length > 0) {
      const points = element.points;
      x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    } else {
      return;
    }

    setViewTarget({ x, y });
    setTimeout(() => setViewTarget(null), 600);
  }, [elements]);

  const shouldShowPanel = useMemo(() => {
    return windowWidth >= 1024 ? notificationOpen : false;
  }, [windowWidth, notificationOpen]);

  const showFloatingButton = useMemo(() => {
    return windowWidth < 1024;
  }, [windowWidth]);

  return (
    <div style={styles.app}>
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <span style={styles.appTitle}>🎨 团队创意画布</span>
        </div>
        <div style={styles.topBarCenter}>
          <span style={styles.userInfo}>
            <span style={{ ...styles.userDot, backgroundColor: selfColor }} />
            {selfUsername || '加载中...'}
          </span>
        </div>
        <div style={styles.topBarRight}>
          <span style={{ ...styles.connectionStatus, color: ws.connected ? '#4caf50' : '#ff9800' }}>
            {ws.connected ? '● 已连接' : '○ 连接中...'}
          </span>
        </div>
      </div>

      <div style={styles.mainContent}>
        <Toolbar
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          currentColor={currentColor}
          onColorChange={setCurrentColor}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
        />

        <Canvas
          elements={elements}
          currentTool={currentTool}
          currentColor={currentColor}
          brushSize={brushSize}
          selfId={selfId}
          selfUsername={selfUsername}
          onDrawComplete={handleDrawComplete}
          onAddNote={handleAddNote}
          onUpdateNote={handleUpdateNote}
          onLike={handleLikeElement}
          onComment={handleCommentElement}
          viewTarget={viewTarget}
        />

        {shouldShowPanel && (
          <NotificationPanel
            notifications={notifications}
            isOpen={shouldShowPanel}
            onClose={() => setNotificationOpen(false)}
            onNavigateToElement={handleNavigateToElement}
          />
        )}
      </div>

      {showFloatingButton && (
        <button
          style={styles.floatingButton}
          onClick={() => setNotificationOpen(!notificationOpen)}
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span style={styles.notificationBadge}>{notifications.length}</span>
          )}
        </button>
      )}

      {showFloatingButton && notificationOpen && (
        <div style={styles.mobileNotificationOverlay}>
          <NotificationPanel
            notifications={notifications}
            isOpen={true}
            onClose={() => setNotificationOpen(false)}
            onNavigateToElement={handleNavigateToElement}
          />
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#121212',
    overflow: 'hidden'
  },
  topBar: {
    height: 48,
    backgroundColor: '#1e1e1e',
    borderBottom: '1px solid #2a2a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    flexShrink: 0
  },
  topBarLeft: {
    width: 200,
    display: 'flex',
    alignItems: 'center'
  },
  appTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e0e0e0'
  },
  topBarCenter: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#aaa'
  },
  userDot: {
    width: 10,
    height: 10,
    borderRadius: '50%'
  },
  topBarRight: {
    width: 200,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  connectionStatus: {
    fontSize: 12
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    minHeight: 0
  },
  floatingButton: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: '50%',
    backgroundColor: '#64b5f6',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(100, 181, 246, 0.4)',
    transition: 'transform 250ms ease, box-shadow 250ms ease',
    zIndex: 1000
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff5252',
    color: 'white',
    fontSize: 10,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px'
  },
  mobileNotificationOverlay: {
    position: 'fixed',
    top: 48,
    right: 0,
    bottom: 0,
    width: 280,
    zIndex: 999,
    boxShadow: '-4px 0 20px rgba(0,0,0,0.3)'
  }
};

export default App;
