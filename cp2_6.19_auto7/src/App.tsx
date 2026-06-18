import React, { useState, useEffect, useCallback, useRef } from 'react';
import { annotationManager, AnnotationType, User, CommentThread } from './utils/annotationManager';
import PDFViewer from './components/PDFViewer';
import AnnotationPanel from './components/AnnotationPanel';
import CommentThreadPanel from './components/CommentThread';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [currentTool, setCurrentTool] = useState<AnnotationType>('pen');
  const [currentColor, setCurrentColor] = useState('#607d8b');
  const [users, setUsers] = useState<User[]>([]);
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [highlightedThreadId, setHighlightedThreadId] = useState<string | null>(null);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [, forceUpdate] = useState(0);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const updateData = () => {
      setUsers(annotationManager.getUsers());
      setThreads(annotationManager.getThreadsByPage(currentPage));
      forceUpdate((n) => n + 1);
    };

    updateData();
    const unsubscribe = annotationManager.subscribe(updateData);
    return unsubscribe;
  }, [currentPage]);

  const handleAddSimulatedUser = useCallback(() => {
    annotationManager.addSimulatedUser();
  }, []);

  const handleSimulateComment = useCallback(() => {
    const users = annotationManager.getUsers().filter((u) => !u.isTeacher);
    if (users.length === 0) {
      annotationManager.addSimulatedUser();
    }

    const delay = 1000 + Math.random() * 1000;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      annotationManager.addSimulatedComment(currentPage);
    }, delay);
  }, [currentPage]);

  const handleAddUser = useCallback(() => {
    handleAddSimulatedUser();
    handleSimulateComment();
  }, [handleAddSimulatedUser, handleSimulateComment]);

  const handleThreadClick = useCallback((threadId: string) => {
    setHighlightedThreadId(threadId);
    annotationManager.markThreadRead(threadId);
  }, []);

  const handleAnchorClick = useCallback(
    (threadId: string) => {
      setHighlightedThreadId(threadId);
      annotationManager.markThreadRead(threadId);
      if (isMobile) {
        setRightDrawerOpen(true);
      }
    },
    [isMobile]
  );

  const teacher = annotationManager.getCurrentTeacher();

  return (
    <div style={styles.app}>
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          {isMobile && (
            <button style={styles.menuButton} onClick={() => setLeftDrawerOpen(true)}>
              ☰
            </button>
          )}
          <h1 style={styles.title}>课件标注协作工具</h1>
        </div>
        <div style={styles.topBarRight}>
          <button style={styles.addUserButton} onClick={handleAddUser}>
            <span style={styles.addUserIcon}>+</span>
            添加模拟用户
          </button>
          <div style={styles.userAvatars}>
            {users.slice(-5).map((user) => (
              <div key={user.id} style={styles.userAvatar} title={user.name}>
                {user.avatar}
              </div>
            ))}
          </div>
          <div style={styles.currentUser}>
            <span style={styles.currentUserAvatar}>{teacher.avatar}</span>
            <span style={styles.currentUserName}>{teacher.name}</span>
          </div>
          {isMobile && (
            <button style={styles.menuButton} onClick={() => setRightDrawerOpen(true)}>
              💬
            </button>
          )}
        </div>
      </div>

      <div style={styles.mainContent}>
        {!isMobile && (
          <div style={styles.leftPanel}>
            <AnnotationPanel
              currentTool={currentTool}
              currentColor={currentColor}
              onToolChange={setCurrentTool}
              onColorChange={setCurrentColor}
            />
          </div>
        )}

        {isMobile && leftDrawerOpen && (
          <>
            <div style={styles.overlay} onClick={() => setLeftDrawerOpen(false)} />
            <div style={{ ...styles.leftPanel, ...styles.drawerLeft }}>
              <AnnotationPanel
                currentTool={currentTool}
                currentColor={currentColor}
                onToolChange={(tool) => {
                  setCurrentTool(tool);
                  setLeftDrawerOpen(false);
                }}
                onColorChange={(color) => {
                  setCurrentColor(color);
                }}
              />
            </div>
          </>
        )}

        <div style={styles.pdfContainer}>
          <PDFViewer
            currentPage={currentPage}
            currentTool={currentTool}
            currentColor={currentColor}
            highlightedThreadId={highlightedThreadId}
            onPageChange={setCurrentPage}
            onNumPages={setNumPages}
            onAnchorClick={handleAnchorClick}
          />
          <div style={styles.pageIndicator}>
            第 {currentPage} / {numPages || '-'} 页
          </div>
        </div>

        {!isMobile && (
          <div style={styles.rightPanel}>
            <CommentThreadPanel
              threads={threads}
              highlightedThreadId={highlightedThreadId}
              currentUser={teacher}
              onThreadClick={handleThreadClick}
              onHighlightChange={setHighlightedThreadId}
            />
          </div>
        )}

        {isMobile && rightDrawerOpen && (
          <>
            <div style={styles.overlay} onClick={() => setRightDrawerOpen(false)} />
            <div style={{ ...styles.rightPanel, ...styles.drawerRight }}>
              <CommentThreadPanel
                threads={threads}
                highlightedThreadId={highlightedThreadId}
                currentUser={teacher}
                onThreadClick={handleThreadClick}
                onHighlightChange={setHighlightedThreadId}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  topBar: {
    height: '56px',
    backgroundColor: '#ffffff',
    borderBottom: '2px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    flexShrink: 0,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
  },
  menuButton: {
    width: '36px',
    height: '36px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#f0f0f0',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease-out',
  },
  addUserButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease-out',
  },
  addUserIcon: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  userAvatars: {
    display: 'flex',
    alignItems: 'center',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    marginLeft: '-8px',
    border: '2px solid #ffffff',
  },
  currentUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingLeft: '12px',
    borderLeft: '1px solid #e0e0e0',
  },
  currentUserAvatar: {
    fontSize: '24px',
  },
  currentUserName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  },
  leftPanel: {
    width: '280px',
    backgroundColor: '#ffffff',
    borderRight: '2px solid #e0e0e0',
    flexShrink: 0,
    overflowY: 'auto',
  },
  rightPanel: {
    width: '320px',
    backgroundColor: '#ffffff',
    borderLeft: '2px solid #e0e0e0',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  pdfContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'auto',
    padding: '20px',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '6px 16px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#ffffff',
    borderRadius: '20px',
    fontSize: '13px',
  },
  drawerLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    zIndex: 100,
    animation: 'slideInLeft 0.3s ease-out',
  },
  drawerRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',
    zIndex: 100,
    animation: 'slideInRight 0.3s ease-out',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 99,
  },
};

export default App;
