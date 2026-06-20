import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Editor from './Editor';
import socketClient from './socketClient';
import type { DocumentMeta, VersionSnapshot, User, DocumentState } from '../../shared/types';

type View = 'list' | 'editor';

export default function App() {
  const [view, setView] = useState<View>('list');
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [docContent, setDocContent] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  useEffect(() => {
    const storedUserId = localStorage.getItem('collab_user_id');
    const storedUserName = localStorage.getItem('collab_user_name');
    const userId = storedUserId || uuidv4();
    const userName = storedUserName || `用户${Math.floor(Math.random() * 10000)}`;

    if (!storedUserId) {
      localStorage.setItem('collab_user_id', userId);
    }
    if (!storedUserName) {
      localStorage.setItem('collab_user_name', userName);
    }

    setCurrentUser({
      id: userId,
      name: userName,
      color: '',
      avatar: userName.slice(0, 2).toUpperCase(),
    });

    socketClient.connect().catch(err => {
      console.error('Failed to connect socket:', err);
    });

    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const fetchVersions = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/versions`);
      const data = await res.json();
      setVersions(data);
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    }
  };

  const createDocument = async () => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '未命名文档' }),
      });
      const doc = await res.json();
      await fetchDocuments();
      openDocument(doc.id);
    } catch (err) {
      console.error('Failed to create document:', err);
    }
  };

  const deleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个文档吗？')) return;
    try {
      await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      await fetchDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const openDocument = async (docId: string) => {
    setIsLoading(true);
    setCurrentDocId(docId);

    try {
      const res = await fetch(`/api/documents/${docId}`);
      if (res.ok) {
        const doc = await res.json();
        setDocTitle(doc.title);
        setDocContent(doc.content || '');
      } else {
        setDocTitle('文档');
        setDocContent('');
      }
    } catch {
      setDocTitle('文档');
      setDocContent('');
    }

    if (currentUser && socketClient.isConnected()) {
      socketClient.joinDocument(docId, currentUser.id, currentUser.name);
    }

    await fetchVersions(docId);
    setView('editor');
    setIsLoading(false);
    setIsMobileMenuOpen(false);
  };

  const goBack = () => {
    setView('list');
    setCurrentDocId(null);
    setOnlineUsers([]);
  };

  const handleSave = () => {
    socketClient.saveDocument('手动保存');
  };

  const handleRestoreVersion = (versionId: string) => {
    if (!confirm('确定要恢复到此版本吗？当前编辑内容将被覆盖。')) return;
    socketClient.restoreVersion(versionId);
  };

  const handleRename = async () => {
    if (!currentDocId || !tempTitle.trim()) return;
    try {
      await fetch(`/api/documents/${currentDocId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: tempTitle.trim() }),
      });
      setDocTitle(tempTitle.trim());
      setEditingTitle(false);
      await fetchDocuments();
    } catch (err) {
      console.error('Failed to rename document:', err);
    }
  };

  useEffect(() => {
    if (!currentDocId) return;

    const unsub1 = socketClient.on('doc:joined', ({ document, currentUser: user }: { document: DocumentState; currentUser: User }) => {
      setDocTitle(document.title);
      setDocContent(document.content);
      setCurrentUser(user);
      setOnlineUsers(document.onlineUsers);
    });

    const unsub2 = socketClient.on('doc:users-update', (users: User[]) => {
      setOnlineUsers(users);
    });

    const unsub3 = socketClient.on('doc:user-joined', (user: User) => {
      setOnlineUsers(prev => {
        if (prev.find(u => u.id === user.id)) return prev;
        return [...prev, user];
      });
    });

    const unsub4 = socketClient.on('doc:user-left', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userId));
    });

    const unsub5 = socketClient.on('doc:new-version', (snapshot: VersionSnapshot) => {
      setVersions(prev => {
        const exists = prev.find(v => v.id === snapshot.id);
        if (exists) return prev;
        return [snapshot, ...prev];
      });
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [currentDocId]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLen: number) => {
    if (!text) return '';
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
  };

  if (view === 'list') {
    return (
      <div className="app-container">
        <header className="toolbar">
          <div className="toolbar-left">
            <h1 className="logo">协同写作</h1>
          </div>
          <div className="toolbar-right">
            <button className="btn-primary" onClick={createDocument}>
              + 新建文档
            </button>
          </div>
        </header>
        <main className="main-content list-view">
          <h2 className="page-title">我的文档</h2>
          {documents.length === 0 ? (
            <div className="empty-state">
              <p>暂无文档</p>
              <button className="btn-primary" onClick={createDocument}>创建第一个文档</button>
            </div>
          ) : (
            <div className="document-grid">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="document-card"
                  onClick={() => openDocument(doc.id)}
                >
                  <div className="doc-card-header">
                    <h3 className="doc-title">{doc.title}</h3>
                    <button
                      className="btn-delete"
                      onClick={(e) => deleteDocument(doc.id, e)}
                      title="删除文档"
                    >
                      ×
                    </button>
                  </div>
                  <p className="doc-preview">{truncateText('', 100)}</p>
                  <div className="doc-meta">
                    <span className="doc-time">{formatTime(doc.lastEditedAt)}</span>
                    <span className="doc-collaborators">
                      <span className="collab-dot" />
                      {doc.collaborators} 人在线
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; color: #1f2937; }
          .app-container { min-height: 100vh; display: flex; flex-direction: column; }
          .toolbar { display: flex; justify-content: space-between; align-items: center; padding: 0 24px; height: 56px; background: #1e3a5f; color: white; }
          .toolbar-left .logo { font-size: 18px; font-weight: 600; }
          .btn-primary { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: background 0.2s; }
          .btn-primary:hover { background: #2563eb; }
          .main-content { flex: 1; padding: 24px; max-width: 1200px; margin: 0 auto; width: 100%; }
          .page-title { font-size: 24px; font-weight: 600; margin-bottom: 24px; }
          .empty-state { text-align: center; padding: 60px 0; color: #6b7280; }
          .empty-state p { margin-bottom: 16px; font-size: 16px; }
          .document-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
          .document-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; cursor: pointer; transition: box-shadow 0.2s, border-color 0.2s; }
          .document-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: #d1d5db; }
          .doc-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
          .doc-title { font-size: 16px; font-weight: 600; color: #1f2937; flex: 1; }
          .btn-delete { background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer; padding: 0 4px; line-height: 1; }
          .btn-delete:hover { color: #ef4444; }
          .doc-preview { color: #6b7280; font-size: 14px; margin-bottom: 12px; min-height: 42px; line-height: 1.5; }
          .doc-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #9ca3af; }
          .doc-collaborators { display: flex; align-items: center; gap: 4px; }
          .collab-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
          @media (max-width: 768px) {
            .toolbar { padding: 0 16px; }
            .main-content { padding: 16px; }
            .document-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="toolbar">
        <div className="toolbar-left">
          <button className="btn-back" onClick={goBack}>
            ← 返回
          </button>
          {editingTitle ? (
            <input
              className="title-input"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
              autoFocus
            />
          ) : (
            <h1
              className="doc-title-main"
              onClick={() => { setTempTitle(docTitle); setEditingTitle(true); }}
              title="点击重命名"
            >
              {docTitle}
            </h1>
          )}
        </div>
        <div className="toolbar-right">
          <div className="online-users">
            {onlineUsers.slice(0, 4).map(user => (
              <div
                key={user.id}
                className="user-avatar"
                style={{ background: user.color || '#3b82f6' }}
                title={user.name}
              >
                {user.avatar}
              </div>
            ))}
            {onlineUsers.length > 4 && (
              <div className="user-avatar more" title={`还有 ${onlineUsers.length - 4} 人`}>
                +{onlineUsers.length - 4}
              </div>
            )}
            <span className="user-count">{onlineUsers.length} 人在线</span>
          </div>
          <button className="btn-save" onClick={handleSave}>
            保存版本
          </button>
          <button
            className="btn-menu-mobile"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            ☰
          </button>
        </div>
      </header>

      <main className="editor-layout">
        <div className="editor-main">
          {isLoading ? (
            <div className="loading">加载中...</div>
          ) : currentDocId && currentUser ? (
            <Editor
              docId={currentDocId}
              userId={currentUser.id}
              userName={currentUser.name}
              initialContent={docContent}
              onContentChange={setDocContent}
            />
          ) : null}
        </div>

        <aside className={`version-panel ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <h3 className="version-title">版本历史</h3>
          <div className="version-timeline">
            {versions.length === 0 ? (
              <p className="empty-versions">暂无版本记录</p>
            ) : (
              versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`version-card ${index === 0 ? 'latest' : ''}`}
                  onClick={() => handleRestoreVersion(version.id)}
                >
                  <div className="version-time">{formatTime(version.timestamp)}</div>
                  <div className="version-label">{version.label || '快照'}</div>
                  <div className="version-editor">by {version.editorName}</div>
                  <div className="version-preview">{truncateText(version.content, 60)}</div>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>

      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; color: #1f2937; }
        .app-container { min-height: 100vh; display: flex; flex-direction: column; }
        .toolbar { display: flex; justify-content: space-between; align-items: center; padding: 0 24px; height: 56px; background: #1e3a5f; color: white; position: sticky; top: 0; z-index: 100; }
        .toolbar-left { display: flex; align-items: center; gap: 16px; }
        .btn-back { background: none; border: none; color: white; cursor: pointer; font-size: 14px; padding: 4px 8px; }
        .btn-back:hover { opacity: 0.8; }
        .doc-title-main { font-size: 16px; font-weight: 600; cursor: pointer; }
        .doc-title-main:hover { opacity: 0.8; }
        .title-input { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 4px 8px; border-radius: 4px; font-size: 16px; font-weight: 600; outline: none; }
        .toolbar-right { display: flex; align-items: center; gap: 12px; }
        .online-users { display: flex; align-items: center; gap: -4px; }
        .user-avatar { width: 28px; height: 28px; border-radius: 50%; color: white; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; border: 2px solid #1e3a5f; margin-left: -6px; }
        .user-avatar:first-child { margin-left: 0; }
        .user-avatar.more { background: #6b7280; }
        .user-count { margin-left: 12px; font-size: 12px; opacity: 0.8; }
        .btn-save { background: #3b82f6; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
        .btn-save:hover { background: #2563eb; }
        .btn-menu-mobile { display: none; background: none; border: none; color: white; font-size: 20px; cursor: pointer; }
        .editor-layout { flex: 1; display: flex; height: calc(100vh - 56px); overflow: hidden; }
        .editor-main { flex: 1; padding: 24px; overflow: hidden; display: flex; flex-direction: column; }
        .version-panel { width: 280px; background: white; border-left: 1px solid #e5e7eb; padding: 20px; overflow-y: auto; }
        .version-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #1f2937; }
        .version-timeline { display: flex; flex-direction: column; gap: 12px; }
        .version-card { padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; transition: all 0.2s; position: relative; }
        .version-card:hover { border-color: #3b82f6; background: #f0f7ff; }
        .version-card.latest { border-color: #10b981; background: #f0fdf4; }
        .version-time { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .version-label { font-size: 13px; font-weight: 600; color: #1f2937; margin-bottom: 4px; }
        .version-editor { font-size: 12px; color: #9ca3af; margin-bottom: 6px; }
        .version-preview { font-size: 12px; color: #6b7280; line-height: 1.4; }
        .empty-versions { text-align: center; color: #9ca3af; font-size: 13px; padding: 20px 0; }
        .loading { text-align: center; padding: 40px; color: #6b7280; }
        .mobile-overlay { display: none; position: fixed; top: 56px; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); z-index: 90; }
        @media (max-width: 768px) {
          .toolbar { padding: 0 16px; }
          .user-count { display: none; }
          .btn-save { display: none; }
          .btn-menu-mobile { display: block; }
          .editor-main { padding: 12px; }
          .version-panel { position: fixed; right: -280px; top: 56px; bottom: 0; z-index: 95; transition: right 0.3s; box-shadow: -2px 0 8px rgba(0,0,0,0.1); }
          .version-panel.mobile-open { right: 0; }
          .mobile-overlay { display: block; }
        }
      `}</style>
    </div>
  );
}
