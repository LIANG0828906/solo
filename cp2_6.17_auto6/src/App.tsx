import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import Editor from './modules/editor/Editor';
import CommentPanel from './modules/comment/CommentPanel';
import { useStore } from './store/useStore';

const SERVER_URL = 'http://localhost:3001';

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const setDocument = useStore((s) => s.setDocument);
  const setRevision = useStore((s) => s.setRevision);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const addOnlineUser = useStore((s) => s.addOnlineUser);
  const onlineUsers = useStore((s) => s.onlineUsers);
  const removeOnlineUser = useStore((s) => s.removeOnlineUser);
  const addCursor = useStore((s) => s.addCursor);
  const commentPanelOpen = useStore((s) => s.commentPanelOpen);
  const setCommentPanelOpen = useStore((s) => s.setCommentPanelOpen);
  const versionPanelOpen = useStore((s) => s.versionPanelOpen);
  const setVersionPanelOpen = useStore((s) => s.setVersionPanelOpen);
  const versionHistory = useStore((s) => s.versionHistory);
  const addVersion = useStore((s) => s.addVersion);
  const restoreVersion = useStore((s) => s.restoreVersion);
  const currentUser = useStore((s) => s.currentUser);
  const document = useStore((s) => s.document);

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('init', (data: any) => {
      setDocument(data.document);
      setRevision(data.revision);
      setCurrentUser(data.user);
      data.onlineUsers.forEach((u: any) => {
        addOnlineUser(u);
        addCursor({
          userId: u.id,
          userName: u.name,
          color: u.color,
          position: 0,
          lineNumber: 0,
        });
      });
    });

    newSocket.on('user-joined', (user: any) => {
      addOnlineUser(user);
      addCursor({
        userId: user.id,
        userName: user.name,
        color: user.color,
        position: 0,
        lineNumber: 0,
      });
    });

    newSocket.on('user-left', (data: any) => {
      removeOnlineUser(data.id);
    });

    newSocket.on('version-broadcast', (data: any) => {
      addVersion(data);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [setDocument, setRevision, setCurrentUser, addOnlineUser, removeOnlineUser, addCursor, addVersion]);

  useEffect(() => {
    if (!socket || !currentUser) return;

    const saveInterval = setInterval(() => {
      const version = {
        id: uuidv4(),
        timestamp: Date.now(),
        content: document,
        creator: currentUser.name,
      };
      socket.emit('version-save', version);
    }, 60000);

    return () => clearInterval(saveInterval);
  }, [socket, currentUser, document]);

  const handleRestoreVersion = useCallback((versionId: string) => {
    restoreVersion(versionId);
    setVersionPanelOpen(false);
  }, [restoreVersion, setVersionPanelOpen]);

  const formatVersionTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const toggleCommentPanel = () => {
    setCommentPanelOpen(!commentPanelOpen);
  };

  if (!socket) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1E1E1E',
          color: '#D4D4D4',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div>Connecting to CodeCollab server...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <div className="logo">CodeCollab</div>
          <div
            style={{
              fontSize: 12,
              color: isConnected ? '#2ECC71' : '#E74C3C',
            }}
          >
            {isConnected ? '● Connected' : '○ Disconnected'}
          </div>
        </div>
        <div className="header-right">
          <div className="online-users">
            {onlineUsers.map((user) => (
              <div key={user.id} className="online-user">
                <div
                  className="online-user-avatar"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="online-status-dot" />
                <span className="online-user-name">{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="main-content">
        <Editor socket={socket} />
        <CommentPanel
          socket={socket}
          isOpen={commentPanelOpen}
          onToggle={toggleCommentPanel}
        />
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <button
          className="version-btn"
          onClick={() => setVersionPanelOpen(!versionPanelOpen)}
        >
          🕒 History Versions
        </button>
        </div>
        <div className="toolbar-right">
          <span>
            {document.length} characters</span>
          <span>·</span>
          <span>{document.split('\n').length} lines</span>
          <span>·</span>
          <span>{onlineUsers.length} users online</span>
        </div>
      </div>

      {versionPanelOpen && (
        <div className="version-panel">
          <div className="version-panel-header">
            History Versions ({versionHistory.length})
          </div>
          <div className="version-list">
            {versionHistory.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  textAlign: 'center',
                  color: '#858585',
                  fontSize: 12,
                }}
              >
                No saved versions yet. Versions are saved automatically every 60 seconds.
              </div>
            ) : versionHistory.slice().reverse().map((version) => (
              <div
                key={version.id}
                className="version-item"
                onClick={() => handleRestoreVersion(version.id)}
              >
                <div className="version-item-header">
                  <span className="version-item-time">
                    {formatVersionTime(version.timestamp)}
                  </span>
                  <div className="version-item-creator">
                    <div
                      className="version-item-avatar"
                      style={{
                        backgroundColor: '#569CD6',
                      }}
                    >
                      {version.creator.charAt(0)}
                    </div>
                    {version.creator}
                  </div>
                </div>
                <div
                  style={{
                  fontSize: 11,
                  color: '#858585',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                >
                  {version.content.slice(0, 60)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
