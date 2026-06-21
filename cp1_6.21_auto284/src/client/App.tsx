import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Editor from './Editor';
import Sidebar from './Sidebar';
import { User, Comment, Version, CursorPosition } from './types';
import { getCurrentUser, getOtherUsers } from './users';

let socket: Socket | null = null;

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<CursorPosition[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  const documentId = 'doc-1';

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    socket = io({
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setSyncStatus('connected');
      socket?.emit('join-document', { documentId, userId: user.id, userName: user.name, userColor: user.color });
    });

    socket.on('disconnect', () => {
      setSyncStatus('disconnected');
    });

    socket.on('document-content', (data: { content: string }) => {
      setDocumentContent(data.content);
      setIsLoading(false);
    });

    socket.on('users-online', (users: User[]) => {
      setOnlineUsers(users);
    });

    socket.on('user-joined', (user: User) => {
      setOnlineUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    });

    socket.on('user-left', (userId: string) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userId));
      setRemoteCursors(prev => prev.filter(c => c.userId !== userId));
    });

    socket.on('content-update', (data: { content: string; userId: string }) => {
      if (data.userId !== user.id) {
        setDocumentContent(data.content);
      }
    });

    socket.on('cursor-update', (data: { userId: string; top: number; left: number }) => {
      if (data.userId !== user.id) {
        setRemoteCursors(prev => {
          const existing = prev.find(c => c.userId === data.userId);
          if (existing) {
            return prev.map(c => c.userId === data.userId ? { ...c, top: data.top, left: data.left } : c);
          }
          return [...prev, { userId: data.userId, top: data.top, left: data.left }];
        });
      }
    });

    socket.on('comment-added', (comment: Comment) => {
      setComments(prev => [comment, ...prev]);
    });

    socket.on('comments-list', (commentsList: Comment[]) => {
      setComments(commentsList);
    });

    socket.on('version-created', (version: Version) => {
      setVersions(prev => [version, ...prev]);
    });

    fetch(`/api/versions?documentId=${documentId}`)
      .then(res => res.json())
      .then(data => {
        setVersions(data.versions || []);
      })
      .catch(err => console.error('Failed to load versions:', err));

    return () => {
      socket?.disconnect();
    };
  }, []);

  const handleContentChange = useCallback((content: string) => {
    setDocumentContent(content);
    socket?.emit('content-change', { documentId, content });
  }, [documentId]);

  const handleCursorChange = useCallback((top: number, left: number) => {
    socket?.emit('cursor-change', { documentId, top, left });
  }, [documentId]);

  const handleSelection = useCallback((text: string) => {
    setSelectedText(text);
  }, []);

  const openCommentDrawer = useCallback(() => {
    setIsCommentDrawerOpen(true);
  }, []);

  const closeCommentDrawer = useCallback(() => {
    setIsCommentDrawerOpen(false);
  }, []);

  const handleAddComment = useCallback((content: string) => {
    if (!currentUser || !selectedText) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorColor: currentUser.color,
      content,
      selectedText,
      timestamp: Date.now(),
    };

    socket?.emit('add-comment', { documentId, comment: newComment });
    setComments(prev => [newComment, ...prev]);
    setIsCommentDrawerOpen(false);
    setSelectedText('');
  }, [currentUser, selectedText, documentId]);

  const handlePreviewVersion = useCallback((version: Version) => {
    setPreviewVersion(version);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewVersion(null);
  }, []);

  const handleRollbackVersion = useCallback((version: Version) => {
    if (!currentUser) return;
    
    setDocumentContent(version.content);
    socket?.emit('content-change', { documentId, content: version.content });
    
    const newVersion: Version = {
      id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `回滚至 ${formatTime(version.timestamp)}`,
      content: version.content,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorColor: currentUser.color,
      timestamp: Date.now(),
    };
    
    setVersions(prev => [newVersion, ...prev]);
    setPreviewVersion(null);
  }, [currentUser, documentId]);

  const handleSaveVersion = useCallback(() => {
    if (!currentUser) return;

    const newVersion: Version = {
      id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `版本 ${versions.length + 1}`,
      content: documentContent,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorColor: currentUser.color,
      timestamp: Date.now(),
    };

    socket?.emit('create-version', { documentId, version: newVersion });
    setVersions(prev => [newVersion, ...prev]);
  }, [currentUser, documentContent, versions.length, documentId]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || !currentUser) {
    return (
      <div className="app-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">
          <div className="app-title-icon">C</div>
          CodeCollabDoc
        </div>
        <div className="sync-status">
          <div className="sync-status-dot" style={{ background: syncStatus === 'connected' ? '#10B981' : syncStatus === 'connecting' ? '#F59E0B' : '#EF4444' }}></div>
          {syncStatus === 'connected' ? '已同步' : syncStatus === 'connecting' ? '连接中...' : '已断开'}
        </div>
        <div className="online-users">
          <span className="online-users-label">在线用户</span>
          {onlineUsers.map(user => (
            <div
              key={user.id}
              className="user-avatar"
              style={{ background: user.color }}
              title={user.name}
            >
              {user.avatar || user.name[0]}
              <div className="status-dot"></div>
            </div>
          ))}
        </div>
      </header>

      <div className="main-layout">
        <div className="editor-section">
          <Editor
            content={documentContent}
            onChange={handleContentChange}
            onCursorChange={handleCursorChange}
            onSelection={handleSelection}
            remoteCursors={remoteCursors}
            onlineUsers={onlineUsers}
            currentUserId={currentUser.id}
            previewVersion={previewVersion}
            onClosePreview={handleClosePreview}
            onRollback={handleRollbackVersion}
          />
        </div>

        <div className="sidebar-section">
          <Sidebar
            comments={comments}
            versions={versions}
            selectedText={selectedText}
            onAddComment={openCommentDrawer}
            onPreviewVersion={handlePreviewVersion}
            onSaveVersion={handleSaveVersion}
            formatTime={formatTime}
          />
        </div>
      </div>

      <div
        className={`overlay-backdrop ${isCommentDrawerOpen ? 'open' : ''}`}
        onClick={closeCommentDrawer}
      ></div>

      <div className={`comment-drawer ${isCommentDrawerOpen ? 'open' : ''}`}>
        <div className="comment-drawer-header">
          <div className="comment-drawer-title">添加评论</div>
          <button className="comment-drawer-close" onClick={closeCommentDrawer}>
            ✕
          </button>
        </div>
        <div className="comment-drawer-body">
          {selectedText && (
            <div className="comment-selected-text">
              「{selectedText}」
            </div>
          )}
          <CommentInput
            onSubmit={handleAddComment}
            currentUser={currentUser}
            otherUsers={getOtherUsers(currentUser.id)}
          />
        </div>
      </div>
    </div>
  );
}

function CommentInput({ onSubmit, currentUser, otherUsers }: {
  onSubmit: (content: string) => void;
  currentUser: User;
  otherUsers: User[];
}) {
  const [content, setContent] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredUsers = otherUsers.filter(user =>
    user.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '@') {
      setShowMentionDropdown(true);
      setMentionFilter('');
    } else if (e.key === 'Escape') {
      setShowMentionDropdown(false);
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (showMentionDropdown) {
        setShowMentionDropdown(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = value.substring(lastAtIndex + 1);
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setShowMentionDropdown(true);
        setMentionFilter(afterAt);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (user: User) => {
    const lastAtIndex = content.lastIndexOf('@');
    const beforeAt = content.substring(0, lastAtIndex);
    const newContent = beforeAt + `@${user.name} `;
    setContent(newContent);
    setShowMentionDropdown(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content);
      setContent('');
    }
  };

  return (
    <>
      <div className="comment-input-wrapper">
        {showMentionDropdown && filteredUsers.length > 0 && (
          <div className="mention-dropdown">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="mention-item"
                onClick={() => handleMentionSelect(user)}
              >
                <div className="mention-item-avatar" style={{ background: user.color }}>
                  {user.avatar || user.name[0]}
                </div>
                <div className="mention-item-name">{user.name}</div>
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          className="comment-input"
          placeholder="输入评论内容，使用 @ 提及他人..."
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="comment-drawer-footer">
        <button className="btn btn-secondary" onClick={() => setContent('')}>
          清空
        </button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!content.trim()}>
          发送评论
        </button>
      </div>
    </>
  );
}

export default App;
