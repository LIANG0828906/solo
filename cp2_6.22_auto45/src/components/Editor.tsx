import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import DocumentView from './DocumentView';
import VersionPanel, { computeDiff } from './VersionPanel';
import type { User, Version, CursorPosition, DiffLine } from '../types';

interface EditorProps {
  documentId: string;
  currentUser: User;
}

interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

const Editor: React.FC<EditorProps> = ({ documentId, currentUser }) => {
  const [content, setContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [users, setUsers] = useState<Map<string, User & { online: boolean }>>(new Map());
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string>('');
  const [diffLines, setDiffLines] = useState<DiffLine[] | null>(null);
  const [remoteCursors, setRemoteCursors] = useState<CursorPosition[]>([]);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedByName, setLockedByName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [addedLines, setAddedLines] = useState<Set<number>>(new Set());
  const [currentLine, setCurrentLine] = useState<number>(0);
  const [conflictData, setConflictData] = useState<{
    serverContent: string;
    userContent: string;
    mergedContent: string;
  } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editMode, setEditMode] = useState<'edit' | 'diff'>('edit');
  const [showCreateVersionModal, setShowCreateVersionModal] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [iAmLockHolder, setIAmLockHolder] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const lastContentRef = useRef('');
  const lastEmitRef = useRef(0);
  const lastCursorEmitRef = useRef(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const addedLinesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const fetchVersions = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
        if (data.length > 0) {
          setCurrentVersionId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    }
  }, [documentId]);

  const fetchDocument = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocumentTitle(data.title);
        setInviteLink(data.inviteLink);
      }
    } catch (err) {
      console.error('Failed to fetch document:', err);
    }
  }, [documentId]);

  useEffect(() => {
    const socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WS] Connected to server');
      socket.emit('document:join', {
        documentId,
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
      });
    });

    socket.on('document:joined', (data) => {
      setContent(data.document.content);
      lastContentRef.current = data.document.content;
      setDocumentTitle(data.document.title);

      if (data.document.lockedBy && data.document.lockedBy !== currentUser.id) {
        setIsLocked(true);
      }

      const userMap = new Map<string, User & { online: boolean }>();
      data.users.forEach((u: any) => {
        if (u) {
          userMap.set(u.id, { ...u, online: true });
        }
      });
      if (!userMap.has(currentUser.id)) {
        userMap.set(currentUser.id, { ...currentUser, online: true });
      }
      setUsers(userMap);

      fetchVersions();
      fetchDocument();
    });

    socket.on('document:updated', (data) => {
      if (data.userId !== currentUser.id) {
        const oldLines = lastContentRef.current.split('\n');
        const newLines = data.content.split('\n');

        setContent(data.content);
        lastContentRef.current = data.content;

        const newAdded = new Set<number>();
        const maxLen = Math.max(oldLines.length, newLines.length);
        for (let i = 0; i < maxLen; i++) {
          if (i >= oldLines.length || oldLines[i] !== newLines[i]) {
            if (i < newLines.length) {
              newAdded.add(i);
            }
          }
        }
        if (newAdded.size > 0) {
          setAddedLines(newAdded);
          if (addedLinesTimerRef.current) {
            clearTimeout(addedLinesTimerRef.current);
          }
          addedLinesTimerRef.current = setTimeout(() => {
            setAddedLines(new Set());
          }, 1800);
        }

        addToast('info', `${data.userName} 更新了文档`);
      }
    });

    socket.on('document:rollback', (data) => {
      setContent(data.content);
      lastContentRef.current = data.content;
      setEditMode('edit');
      setSelectedVersion(null);
      setDiffLines(null);
      if (data.userId !== currentUser.id) {
        addToast('warning', `${data.userName} 将文档回滚到版本「${data.versionName}」`);
      } else {
        addToast('success', `已回滚到版本「${data.versionName}」`);
      }
    });

    socket.on('cursor:updated', (data) => {
      if (data.userId === currentUser.id) return;
      setRemoteCursors((prev) => {
        const filtered = prev.filter((c) => c.userId !== data.userId);
        return [...filtered, {
          userId: data.userId,
          name: data.name,
          color: data.color,
          cursor: data.cursor,
          selection: data.selection,
        }];
      });
    });

    socket.on('user:online', (user) => {
      setUsers((prev) => {
        const next = new Map(prev);
        next.set(user.id, { ...user, online: true });
        return next;
      });
      if (user.id !== currentUser.id) {
        addToast('success', `${user.name} 加入了文档`);
      }
    });

    socket.on('user:offline', (data) => {
      setUsers((prev) => {
        const next = new Map(prev);
        const u = next.get(data.userId);
        if (u) {
          next.set(data.userId, { ...u, online: false });
        }
        return next;
      });
      setRemoteCursors((prev) => prev.filter((c) => c.userId !== data.userId));
      if (data.userId !== currentUser.id) {
        addToast('warning', `${data.userName} 离开了文档`);
      }
    });

    socket.on('user:joined', (user) => {
      setUsers((prev) => {
        const next = new Map(prev);
        next.set(user.id, { ...user, online: false });
        return next;
      });
    });

    socket.on('user:roleChanged', (data) => {
      setUsers((prev) => {
        const next = new Map(prev);
        const u = next.get(data.userId);
        if (u) {
          u.role = data.role;
        }
        return next;
      });
      if (data.userId === currentUser.id) {
        addToast('info', `您的角色已被 ${data.changedBy} 修改为「${data.role === 'admin' ? '管理员' : data.role === 'editor' ? '编辑者' : '查看者'}」`);
      }
    });

    socket.on('document:locked', (data) => {
      if (data.userId !== currentUser.id) {
        setIsLocked(true);
        setLockedByName(data.userName);
        setIAmLockHolder(false);
        setLockCountdown(0);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        addToast('warning', `${data.userName} 锁定了文档进行编辑`);
      } else {
        setIAmLockHolder(true);
        setLockCountdown(30);
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          setLockCountdown((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    });

    socket.on('document:unlocked', (data) => {
      setIsLocked(false);
      setLockedByName('');
      setIAmLockHolder(false);
      setLockCountdown(0);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (data.userId !== currentUser.id) {
        addToast('info', `${data.userName} 释放了文档锁`);
      }
    });

    socket.on('document:lockDenied', (data) => {
      addToast('warning', `文档已被 ${data.lockedByName || '其他用户'} 锁定`);
    });

    socket.on('document:conflict', (data) => {
      setConflictData(data);
      addToast('error', '检测到编辑冲突，请选择处理方式');
    });

    socket.on('version:created', () => {
      fetchVersions();
    });

    socket.on('error', (err) => {
      addToast('error', err.message || '连接错误');
    });

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
    });

    return () => {
      socket.disconnect();
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (addedLinesTimerRef.current) {
        clearTimeout(addedLinesTimerRef.current);
      }
    };
  }, [documentId, currentUser, addToast, fetchVersions, fetchDocument]);

  useEffect(() => {
    heartbeatRef.current = setInterval(() => {
      if (socketRef.current?.connected && iAmLockHolder) {
        socketRef.current.emit('document:heartbeat', {
          documentId,
          userId: currentUser.id,
        });
        setLockCountdown(30);
      }
    }, 10000);
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [documentId, currentUser.id, iAmLockHolder]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);

    if (currentUser.role === 'viewer') return;

    const now = Date.now();
    if (now - lastEmitRef.current < 50) return;
    lastEmitRef.current = now;

    if (socketRef.current) {
      if (!iAmLockHolder) {
        socketRef.current.emit('document:lock', {
          documentId,
          userId: currentUser.id,
        });
      } else {
        socketRef.current.emit('document:heartbeat', {
          documentId,
          userId: currentUser.id,
        });
        setLockCountdown(30);
      }
    }

    setIsSaving(true);
    socketRef.current?.emit('document:edit', {
      documentId,
      userId: currentUser.id,
      content: newContent,
      changes: [],
    });
    lastContentRef.current = newContent;

    setTimeout(() => setIsSaving(false), 200);
  }, [documentId, currentUser.id, currentUser.role, iAmLockHolder]);

  const handleCursorChange = useCallback((cursor: { line: number; column: number }, selection?: { start: number; end: number }) => {
    setCurrentLine(cursor.line);
    const now = Date.now();
    if (now - lastCursorEmitRef.current < 80) return;
    lastCursorEmitRef.current = now;
    socketRef.current?.emit('cursor:update', {
      documentId,
      userId: currentUser.id,
      cursor,
      selection,
    });
  }, [documentId, currentUser.id]);

  const handleSelectVersion = useCallback((version: Version) => {
    setSelectedVersion(version);

    const prevIdx = versions.findIndex((v) => v.id === version.id) + 1;
    const prevVersion = prevIdx < versions.length ? versions[prevIdx] : null;

    if (prevVersion) {
      const diff = computeDiff(prevVersion.content, version.content);
      setDiffLines(diff);
      setEditMode('diff');
    } else {
      setDiffLines(null);
      setEditMode('diff');
    }
  }, [versions]);

  const handleCloseDiff = useCallback(() => {
    setSelectedVersion(null);
    setDiffLines(null);
    setEditMode('edit');
  }, []);

  const handleCreateVersion = useCallback(async (name: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          author: currentUser.name,
          authorId: currentUser.id,
        }),
      });
      if (response.ok) {
        addToast('success', `版本「${name}」创建成功`);
      } else if (response.status === 403) {
        addToast('error', '您没有创建版本的权限');
      }
    } catch (err) {
      addToast('error', '创建版本失败');
    }
  }, [documentId, currentUser, addToast]);

  const handleRollback = useCallback(async () => {
    if (!selectedVersion) return;
    try {
      const response = await fetch(`/api/documents/${documentId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: selectedVersion.id,
          userId: currentUser.id,
        }),
      });
      if (!response.ok && response.status === 403) {
        addToast('error', '您没有回滚权限');
      }
    } catch (err) {
      addToast('error', '回滚失败');
    }
  }, [documentId, selectedVersion, currentUser.id, addToast]);

  const handleChangeRole = useCallback(async (targetUserId: string, role: 'admin' | 'editor' | 'viewer') => {
    try {
      const response = await fetch(`/api/documents/${documentId}/users/${targetUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          adminId: currentUser.id,
        }),
      });
      if (!response.ok) {
        if (response.status === 403) {
          addToast('error', '只有管理员可以修改角色');
        }
      }
    } catch (err) {
      addToast('error', '修改角色失败');
    }
  }, [documentId, currentUser.id, addToast]);

  const handleCopyInvite = useCallback(() => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      addToast('success', '邀请令牌已复制');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [inviteLink, addToast]);

  const handleResolveConflict = useCallback((useMerged: boolean) => {
    if (!conflictData) return;
    const finalContent = useMerged ? conflictData.mergedContent : conflictData.userContent;
    setContent(finalContent);
    lastContentRef.current = finalContent;
    socketRef.current?.emit('document:edit', {
      documentId,
      userId: currentUser.id,
      content: finalContent,
      changes: [],
    });
    setConflictData(null);
    addToast('success', '冲突已解决');
  }, [conflictData, documentId, currentUser.id, addToast]);

  const diffStats = useMemo(() => {
    if (!diffLines) return { additions: 0, deletions: 0 };
    return {
      additions: diffLines.filter((d) => d.type === 'added').length,
      deletions: diffLines.filter((d) => d.type === 'removed').length,
    };
  }, [diffLines]);

  const isAdmin = currentUser.role === 'admin';
  const isEditor = currentUser.role === 'admin' || currentUser.role === 'editor';
  const canEdit = isEditor && !isLocked;

  const displayContent = editMode === 'diff' && selectedVersion ? selectedVersion.content : content;
  const usersArray = Array.from(users.values());
  const onlineCount = usersArray.filter((u) => u.online).length;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <button className="menu-btn" onClick={() => setMobileLeftOpen(!mobileLeftOpen)}>
            ☰
          </button>
          <span className="app-logo">📝</span>
          <span className="document-title">{documentTitle}</span>
          <div className="document-meta">
            {iAmLockHolder && lockCountdown > 0 && (
              <span className="meta-tag" style={{ background: 'rgba(255,140,66,0.15)', color: 'var(--accent)' }}>
                🔓 编辑锁 {lockCountdown}s
              </span>
            )}
            {isLocked && !iAmLockHolder && (
              <span className="meta-tag locked">
                🔒 {lockedByName || '其他用户'} 编辑中
              </span>
            )}
            <span className={`meta-tag ${isSaving ? 'saving' : 'saved'}`}>
              {isSaving ? '⏳ 同步中...' : '✓ 已同步'}
            </span>
          </div>
        </div>
        <div className="header-right">
          <button
            className="btn-secondary"
            onClick={() => {
              setRightCollapsed(!rightCollapsed);
              setMobileRightOpen(!mobileRightOpen);
            }}
          >
            👥 {onlineCount} 人在线
          </button>
          <div className="user-chip">
            <span className="user-color-dot" style={{ backgroundColor: currentUser.color }}></span>
            {currentUser.name}
            <span className={`user-role ${currentUser.role}`}>
              {currentUser.role === 'admin' ? '管理员' : currentUser.role === 'editor' ? '编辑' : '查看'}
            </span>
          </div>
          <button className="menu-btn" onClick={() => setMobileRightOpen(!mobileRightOpen)}>
            👤
          </button>
        </div>
      </header>

      {conflictData && (
        <div className="conflict-banner">
          <span className="conflict-text">⚠️ 检测到编辑冲突，您的修改与其他用户的编辑发生重叠</span>
          <div className="conflict-actions">
            <button className="btn-secondary" onClick={() => handleResolveConflict(false)}>
              保留我的
            </button>
            <button className="btn-accent" onClick={() => handleResolveConflict(true)}>
              合并内容
            </button>
          </div>
        </div>
      )}

      <div className="main-layout">
        <VersionPanel
          documentId={documentId}
          versions={versions}
          selectedVersionId={selectedVersion?.id || null}
          onSelectVersion={(v) => {
            handleSelectVersion(v);
            setMobileLeftOpen(false);
          }}
          onCreateVersion={handleCreateVersion}
          onRollback={handleRollback}
          isCollapsed={leftCollapsed}
          onToggleCollapse={() => {
            setLeftCollapsed(!leftCollapsed);
          }}
          currentVersionId={currentVersionId}
          mobileOpen={mobileLeftOpen}
          onCloseMobile={() => setMobileLeftOpen(false)}
        />

        {mobileLeftOpen && (
          <div
            style={{
              position: 'fixed',
              top: 53,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 49,
            }}
            onClick={() => setMobileLeftOpen(false)}
          />
        )}
        {leftCollapsed && (
          <button
            className="collapse-btn"
            onClick={() => setLeftCollapsed(false)}
            style={{ position: 'fixed', left: 10, top: 70, zIndex: 60, background: 'var(--surface)', boxShadow: 'var(--shadow-md)', padding: '8px 10px' }}
          >
            📜
          </button>
        )}

        <div className="editor-container">
          <div className="editor-toolbar">
            <div className="toolbar-left">
              {editMode === 'diff' && selectedVersion ? (
                <>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    🔍 差异预览：{selectedVersion.name}
                  </span>
                  <span className="diff-summary" style={{ margin: 0, padding: '4px 10px' }}>
                    <span className="additions">+{diffStats.additions}</span>
                    <span className="deletions">-{diffStats.deletions}</span>
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {canEdit ? '✏️ 编辑模式' : currentUser.role === 'viewer' ? '👁 只读模式' : isLocked ? `🔒 被 ${lockedByName} 锁定` : ''}
                </span>
              )}
            </div>
            <div className="toolbar-right">
              {editMode === 'diff' && selectedVersion && (
                <>
                  <button className="btn-secondary" onClick={handleCloseDiff}>
                    返回编辑
                  </button>
                  {isEditor && (
                    <button className="btn-danger" onClick={handleRollback}>
                      回滚到此版本
                    </button>
                  )}
                </>
              )}
              {editMode === 'edit' && isEditor && (
                <button
                  className="btn-accent"
                  onClick={() => setShowCreateVersionModal(true)}
                >
                  📌 保存版本
                </button>
              )}
            </div>
          </div>

          <div className="editor-main">
            <DocumentView
              content={displayContent}
              mode={editMode === 'diff' ? 'readonly' : 'edit'}
              remoteCursors={editMode === 'edit' ? remoteCursors : []}
              diffLines={diffLines || undefined}
              showDiff={editMode === 'diff'}
              onContentChange={canEdit ? handleContentChange : undefined}
              onCursorChange={canEdit ? handleCursorChange : undefined}
              disabled={!canEdit}
              addedLines={addedLines}
              currentLine={currentLine}
            />
          </div>
        </div>

        {mobileRightOpen && (
          <div
            style={{
              position: 'fixed',
              top: 53,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 49,
            }}
            onClick={() => setMobileRightOpen(false)}
          />
        )}

        <aside className={`sidebar-right ${rightCollapsed && !mobileRightOpen ? 'collapsed' : ''} ${mobileRightOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header" style={{ padding: 16 }}>
            <div className="sidebar-title" style={{ margin: 0 }}>
              👥 协作者
              <span className="section-count">{onlineCount}/{usersArray.length}</span>
            </div>
            {mobileRightOpen ? (
              <button className="collapse-btn" onClick={() => setMobileRightOpen(false)}>
                ✕
              </button>
            ) : (
              <button className="collapse-btn" onClick={() => setRightCollapsed(!rightCollapsed)}>
                ▶
              </button>
            )}
          </div>

          <div className="users-section">
            <div className="users-list">
              {usersArray.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <div className="empty-state-text">暂无协作者</div>
                </div>
              ) : (
                usersArray.map((user) => (
                  <div key={user.id} className="user-item">
                    <div className="user-avatar" style={{ backgroundColor: user.color }}>
                      {user.name.charAt(0)}
                      <span className={`user-online-indicator ${user.online ? '' : 'offline'}`}></span>
                    </div>
                    <div className="user-info">
                      <div className="user-name">
                        {user.name}
                        {user.id === currentUser.id && <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>(我)</span>}
                      </div>
                      <div className="user-status">
                        <span className={`user-role ${user.role}`}>
                          {user.role === 'admin' ? '管理员' : user.role === 'editor' ? '编辑者' : '查看者'}
                        </span>
                        <span style={{ marginLeft: 6 }}>
                          {user.online ? '● 在线' : '○ 离线'}
                        </span>
                      </div>
                    </div>
                    {isAdmin && user.id !== currentUser.id && (
                      <div className="user-actions">
                        <select
                          className="select-role"
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value as any)}
                        >
                          <option value="admin">管理员</option>
                          <option value="editor">编辑</option>
                          <option value="viewer">查看</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="invite-section">
              <div className="section-label">🔗 邀请协作</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                分享邀请令牌给团队成员
              </div>
              <div className="invite-link">
                <input
                  type="text"
                  className="invite-link-input"
                  value={inviteLink}
                  readOnly
                />
                <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={handleCopyInvite}>
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.5 }}>
                💡 受邀用户通过令牌加入后默认为「查看者」角色，您可在上方修改其权限
              </div>
            </div>
          )}

          {editMode === 'diff' && selectedVersion && diffLines && (
            <div className="diff-preview">
              <div className="diff-header">
                <span className="diff-title">📋 差异详情</span>
              </div>
              <div className="diff-summary">
                <span className="additions">+{diffStats.additions} 新增</span>
                <span className="deletions">-{diffStats.deletions} 删除</span>
              </div>
              <div className="diff-content">
                {diffLines.map((diff, idx) => (
                  <div key={idx} className={`diff-line ${diff.type}`}>
                    <span className="diff-line-num">{diff.lineNumber + 1}</span>
                    <span className="diff-line-content">{diff.content || '\u00A0'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {showCreateVersionModal && (
        <div className="modal-overlay" onClick={() => setShowCreateVersionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">📌 创建版本快照</h2>
            <div className="modal-body">
              <input
                type="text"
                className="modal-input"
                placeholder="输入版本名称（如：v1.0 完成初稿）"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newVersionName.trim()) {
                    handleCreateVersion(newVersionName.trim());
                    setNewVersionName('');
                    setShowCreateVersionModal(false);
                  }
                }}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateVersionModal(false)}>
                取消
              </button>
              <button
                className="btn-accent"
                onClick={() => {
                  if (newVersionName.trim()) {
                    handleCreateVersion(newVersionName.trim());
                    setNewVersionName('');
                    setShowCreateVersionModal(false);
                  }
                }}
                disabled={!newVersionName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
