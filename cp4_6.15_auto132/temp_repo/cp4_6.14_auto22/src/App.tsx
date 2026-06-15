import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './Sidebar';
import Editor from './Editor';
import DiffViewer from './DiffViewer';
import { generateUserId, getRandomColor, generateExportContent } from './utils';
import type { Chapter, VersionSnapshot, User, SyncMessage } from './types';

const SCRIPT_TITLE = '我的剧本';
const AUTO_SAVE_INTERVAL = 30000;
const CHANNEL_NAME = 'script-collab-sync';
const USER_TIMEOUT = 5000;

function App() {
  const getInitialUser = (): User => {
    const saved = localStorage.getItem('current-user');
    if (saved) {
      return JSON.parse(saved);
    }
    const newUser: User = {
      id: generateUserId(),
      name: `用户${Math.floor(Math.random() * 1000)}`,
      color: getRandomColor(),
      cursorPosition: 0,
      lastActive: Date.now(),
    };
    localStorage.setItem('current-user', JSON.stringify(newUser));
    return newUser;
  };

  const currentUserRef = useRef<User>(getInitialUser());

  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('script-chapters');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        id: uuidv4(),
        title: '第一幕：开场',
        content: '<h2>场景一：清晨的小镇</h2>\n<p><b>【场景描述】</b>阳光透过薄雾洒落在安静的小镇街道上，鸟儿在枝头鸣叫。</p>\n<p><i>（李明从左侧走上，手里拿着一份报纸）</i></p>\n<p><b>李明：</b>又是新的一天，希望今天能有好消息。</p>\n<p><b>【场景备注】</b>此处需要背景音乐，轻松愉悦的晨间旋律。</p>',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: uuidv4(),
        title: '第二幕：冲突',
        content: '<h2>场景二：咖啡馆内</h2>\n<p><b>【场景描述】</b>温馨的咖啡馆，几位客人正在闲聊。</p>\n<p><b>王芳：</b>你听说了吗？镇上要建新工厂了。</p>\n<p><b>张伟：</b>听说了，但我觉得这不是什么好事。</p>\n<ul><li>环境会受到影响</li><li>交通会更加拥堵</li></ul>',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  });

  const [activeChapterId, setActiveChapterId] = useState<string | null>(() => {
    const saved = localStorage.getItem('active-chapter-id');
    return saved || null;
  });

  const [versions, setVersions] = useState<VersionSnapshot[]>(() => {
    const saved = localStorage.getItem('script-versions');
    return saved ? JSON.parse(saved) : [];
  });

  const [onlineUsers, setOnlineUsers] = useState<Map<string, User>>(new Map());
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [diffHeight, setDiffHeight] = useState(300);
  const [showDownloadProgress, setShowDownloadProgress] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastAutoSaveRef = useRef<number>(Date.now());
  const lastContentSyncRef = useRef<number>(0);
  const isApplyingRemoteChangeRef = useRef(false);

  const activeChapter = chapters.find((c) => c.id === activeChapterId) || null;
  const currentUser = currentUserRef.current;

  const remoteUsers = Array.from(onlineUsers.values()).filter(
    (u) => u.id !== currentUser.id
  );

  useEffect(() => {
    if (chapters.length > 0 && !activeChapterId) {
      setActiveChapterId(chapters[0].id);
    }
  }, [chapters, activeChapterId]);

  useEffect(() => {
    localStorage.setItem('script-chapters', JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    localStorage.setItem('active-chapter-id', activeChapterId || '');
  }, [activeChapterId]);

  useEffect(() => {
    localStorage.setItem('script-versions', JSON.stringify(versions));
  }, [versions]);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    const sendMessage = (type: SyncMessage['type'], payload?: any) => {
      try {
        const message: SyncMessage = {
          type,
          senderId: currentUser.id,
          timestamp: Date.now(),
          payload,
        };
        channel.postMessage(message);
      } catch (e) {
        // ignore
      }
    };

    const handleMessage = (event: MessageEvent<SyncMessage>) => {
      const msg = event.data;
      if (msg.senderId === currentUser.id) return;

      switch (msg.type) {
        case 'hello':
          sendMessage('state-response', {
            chapters,
            versions,
            activeChapterId,
            user: currentUser,
          });
          setOnlineUsers((prev) => {
            const next = new Map(prev);
            if (msg.payload?.user) {
              next.set(msg.payload.user.id, {
                ...msg.payload.user,
                lastActive: Date.now(),
              });
            }
            return next;
          });
          break;

        case 'state-request':
          sendMessage('state-response', {
            chapters,
            versions,
            activeChapterId,
            user: currentUser,
          });
          break;

        case 'state-response':
          if (msg.payload?.chapters && chapters.length === 0) {
            isApplyingRemoteChangeRef.current = true;
            setChapters(msg.payload.chapters);
            setVersions(msg.payload.versions || []);
            if (msg.payload.activeChapterId) {
              setActiveChapterId(msg.payload.activeChapterId);
            }
            setTimeout(() => {
              isApplyingRemoteChangeRef.current = false;
            }, 100);
          }
          if (msg.payload?.user) {
            setOnlineUsers((prev) => {
              const next = new Map(prev);
              next.set(msg.payload.user.id, {
                ...msg.payload.user,
                lastActive: Date.now(),
              });
              return next;
            });
          }
          break;

        case 'content-update':
          if (msg.payload?.chapterId && msg.payload?.content !== undefined) {
            isApplyingRemoteChangeRef.current = true;
            setChapters((prev) =>
              prev.map((ch) =>
                ch.id === msg.payload.chapterId
                  ? { ...ch, content: msg.payload.content, updatedAt: msg.timestamp }
                  : ch
              )
            );
            if (msg.payload.chapterId === activeChapterId) {
              setEditorKey((prev) => prev + 1);
            }
            setTimeout(() => {
              isApplyingRemoteChangeRef.current = false;
            }, 50);
          }
          break;

        case 'cursor-update':
          if (msg.payload?.userId && msg.payload?.chapterId === activeChapterId) {
            setOnlineUsers((prev) => {
              const next = new Map(prev);
              const user = next.get(msg.payload.userId);
              if (user) {
                next.set(msg.payload.userId, {
                  ...user,
                  cursorPosition: msg.payload.position || 0,
                  selectionStart: msg.payload.selectionStart,
                  selectionEnd: msg.payload.selectionEnd,
                  lastActive: Date.now(),
                });
              }
              return next;
            });
          }
          break;

        case 'chapter-add':
          if (msg.payload?.chapter) {
            isApplyingRemoteChangeRef.current = true;
            setChapters((prev) => {
              if (prev.some((c) => c.id === msg.payload.chapter.id)) {
                return prev;
              }
              return [...prev, msg.payload.chapter];
            });
            setTimeout(() => {
              isApplyingRemoteChangeRef.current = false;
            }, 50);
          }
          break;

        case 'chapter-rename':
          if (msg.payload?.chapterId && msg.payload?.title) {
            isApplyingRemoteChangeRef.current = true;
            setChapters((prev) =>
              prev.map((ch) =>
                ch.id === msg.payload.chapterId
                  ? { ...ch, title: msg.payload.title, updatedAt: msg.timestamp }
                  : ch
              )
            );
            setTimeout(() => {
              isApplyingRemoteChangeRef.current = false;
            }, 50);
          }
          break;

        case 'chapter-delete':
          if (msg.payload?.chapterId) {
            isApplyingRemoteChangeRef.current = true;
            setChapters((prev) => prev.filter((ch) => ch.id !== msg.payload.chapterId));
            setVersions((prev) => prev.filter((v) => v.chapterId !== msg.payload.chapterId));
            if (activeChapterId === msg.payload.chapterId) {
              setActiveChapterId(null);
            }
            setTimeout(() => {
              isApplyingRemoteChangeRef.current = false;
            }, 50);
          }
          break;

        case 'version-add':
          if (msg.payload?.version) {
            setVersions((prev) => {
              if (prev.some((v) => v.id === msg.payload.version.id)) {
                return prev;
              }
              return [...prev, msg.payload.version];
            });
          }
          break;

        case 'user-join':
          if (msg.payload?.user) {
            setOnlineUsers((prev) => {
              const next = new Map(prev);
              next.set(msg.payload.user.id, {
                ...msg.payload.user,
                lastActive: Date.now(),
              });
              return next;
            });
          }
          break;

        case 'user-leave':
          if (msg.payload?.userId) {
            setOnlineUsers((prev) => {
              const next = new Map(prev);
              next.delete(msg.payload.userId);
              return next;
            });
          }
          break;
      }
    };

    channel.addEventListener('message', handleMessage);

    sendMessage('user-join', { user: currentUser });
    setTimeout(() => sendMessage('state-request'), 100);

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        for (const [id, user] of next) {
          if (now - (user.lastActive || 0) > USER_TIMEOUT) {
            next.delete(id);
          }
        }
        return next;
      });
    }, 1000);

    const heartbeatInterval = setInterval(() => {
      sendMessage('hello', { user: currentUser });
    }, 2000);

    const handleBeforeUnload = () => {
      const leaveMessage: SyncMessage = {
        type: 'user-leave',
        senderId: currentUser.id,
        timestamp: Date.now(),
        payload: { userId: currentUser.id },
      };
      try {
        channel.postMessage(leaveMessage);
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      const leaveMessage: SyncMessage = {
        type: 'user-leave',
        senderId: currentUser.id,
        timestamp: Date.now(),
        payload: { userId: currentUser.id },
      };
      try {
        channel.postMessage(leaveMessage);
      } catch (e) {
        // ignore
      }
      channel.removeEventListener('message', handleMessage);
      channel.close();
      clearInterval(cleanupInterval);
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const sendMessage = useCallback((type: SyncMessage['type'], payload?: any) => {
    if (channelRef.current) {
      const message: SyncMessage = {
        type,
        senderId: currentUser.id,
        timestamp: Date.now(),
        payload,
      };
      channelRef.current.postMessage(message);
    }
  }, [currentUser.id]);

  const createVersionSnapshot = useCallback(() => {
    if (!activeChapter) return;

    const chapterVersions = versions.filter((v) => v.chapterId === activeChapter.id);
    const nextVersion = chapterVersions.length + 1;

    const snapshot: VersionSnapshot = {
      id: uuidv4(),
      version: nextVersion,
      chapterId: activeChapter.id,
      content: activeChapter.content,
      timestamp: Date.now(),
    };

    setVersions((prev) => [...prev, snapshot]);
    sendMessage('version-add', { version: snapshot });
  }, [activeChapter, versions, sendMessage]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeChapter && Date.now() - lastAutoSaveRef.current >= AUTO_SAVE_INTERVAL) {
        createVersionSnapshot();
        lastAutoSaveRef.current = Date.now();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeChapter, createVersionSnapshot]);

  useEffect(() => {
    if (activeChapter) {
      lastAutoSaveRef.current = Date.now();
    }
  }, [activeChapter?.id]);

  const handleAddChapter = () => {
    const newChapter: Chapter = {
      id: uuidv4(),
      title: `新章节 ${chapters.length + 1}`,
      content: '<p>在这里开始编写...</p>',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChapters((prev) => [...prev, newChapter]);
    setActiveChapterId(newChapter.id);
    setEditorKey((prev) => prev + 1);
    sendMessage('chapter-add', { chapter: newChapter });
  };

  const handleRenameChapter = (id: string, newTitle: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === id ? { ...ch, title: newTitle, updatedAt: Date.now() } : ch
      )
    );
    sendMessage('chapter-rename', { chapterId: id, title: newTitle });
  };

  const handleDeleteChapter = (id: string) => {
    if (chapters.length <= 1) {
      alert('至少保留一个章节');
      return;
    }
    if (confirm('确定要删除这个章节吗？')) {
      setChapters((prev) => prev.filter((ch) => ch.id !== id));
      setVersions((prev) => prev.filter((v) => v.chapterId !== id));
      if (activeChapterId === id) {
        const remaining = chapters.filter((ch) => ch.id !== id);
        setActiveChapterId(remaining[0]?.id || null);
      }
      sendMessage('chapter-delete', { chapterId: id });
    }
  };

  const handleSelectChapter = (id: string) => {
    setActiveChapterId(id);
    setEditorKey((prev) => prev + 1);
    setShowDiff(false);
    setSelectedVersions([]);
    setSidebarOpen(false);
    sendMessage('chapter-select', { chapterId: id });
  };

  const handleContentChange = (content: string) => {
    if (isApplyingRemoteChangeRef.current) return;

    const now = Date.now();
    if (now - lastContentSyncRef.current < 100) return;
    lastContentSyncRef.current = now;

    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === activeChapterId
          ? { ...ch, content, updatedAt: Date.now() }
          : ch
      )
    );
    sendMessage('content-update', {
      chapterId: activeChapterId,
      content,
    });
  };

  const handleCursorUpdate = (position: number, selectionStart?: number, selectionEnd?: number) => {
    currentUserRef.current.cursorPosition = position;
    currentUserRef.current.selectionStart = selectionStart;
    currentUserRef.current.selectionEnd = selectionEnd;
    currentUserRef.current.lastActive = Date.now();

    setOnlineUsers((prev) => {
      const next = new Map(prev);
      next.set(currentUser.id, currentUserRef.current);
      return next;
    });

    sendMessage('cursor-update', {
      userId: currentUser.id,
      chapterId: activeChapterId,
      position,
      selectionStart,
      selectionEnd,
    });
  };

  const handleRestoreVersion = (versionId: string) => {
    const version = versions.find((v) => v.id === versionId);
    if (!version || !activeChapter) return;

    if (confirm(`确定要回滚到 V${version.version} 版本吗？`)) {
      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === version.chapterId
            ? { ...ch, content: version.content, updatedAt: Date.now() }
            : ch
        )
      );
      setEditorKey((prev) => prev + 1);

      sendMessage('content-update', {
        chapterId: version.chapterId,
        content: version.content,
      });

      lastAutoSaveRef.current = Date.now();
    }
  };

  const handleToggleVersionSelect = (versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      setShowDiff(true);
    }
  };

  const handleCloseDiff = () => {
    setShowDiff(false);
  };

  const handleExport = async () => {
    setShowDownloadProgress(true);
    setDownloadProgress(0);

    try {
      const exportChapters = chapters.map((ch) => ({
        title: ch.title,
        content: ch.content,
      }));

      const content = await generateExportContent(
        SCRIPT_TITLE,
        exportChapters,
        (progress) => {
          setDownloadProgress(progress);
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 300));
      setDownloadProgress(100);

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${SCRIPT_TITLE}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setShowDownloadProgress(false);
        setDownloadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Export failed:', error);
      setShowDownloadProgress(false);
      setDownloadProgress(0);
      alert('导出失败，请重试');
    }
  };

  const getChapterVersions = () => {
    if (!activeChapter) return [];
    return versions
      .filter((v) => v.chapterId === activeChapter.id)
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  const getDiffVersions = () => {
    const v1 = versions.find((v) => v.id === selectedVersions[0]);
    const v2 = versions.find((v) => v.id === selectedVersions[1]);
    return { v1, v2 };
  };

  const allUsers = [currentUser, ...remoteUsers];

  return (
    <div className="app-container">
      <button
        className="hamburger-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        chapters={chapters}
        activeChapterId={activeChapterId}
        versions={getChapterVersions()}
        selectedVersions={selectedVersions}
        onAddChapter={handleAddChapter}
        onRenameChapter={handleRenameChapter}
        onDeleteChapter={handleDeleteChapter}
        onSelectChapter={handleSelectChapter}
        onRestoreVersion={handleRestoreVersion}
        onToggleVersionSelect={handleToggleVersionSelect}
        onCompare={handleCompare}
        onExport={handleExport}
        onlineUsers={allUsers}
        currentUserId={currentUser.id}
        isMobileOpen={sidebarOpen}
      />

      <div className="main-content">
        {activeChapter ? (
          <>
            <Editor
              key={editorKey}
              content={activeChapter.content}
              chapterTitle={activeChapter.title}
              onChange={handleContentChange}
              onCursorUpdate={handleCursorUpdate}
              remoteUsers={remoteUsers}
              chapterId={activeChapterId}
            />

            {showDiff && (
              <DiffViewer
                oldVersion={getDiffVersions().v1?.content || ''}
                newVersion={getDiffVersions().v2?.content || ''}
                oldVersionLabel={getDiffVersions().v1 ? `V${getDiffVersions().v1?.version}` : ''}
                newVersionLabel={getDiffVersions().v2 ? `V${getDiffVersions().v2?.version}` : ''}
                height={diffHeight}
                onHeightChange={setDiffHeight}
                onClose={handleCloseDiff}
              />
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <div>点击左侧"新建章节"开始创作</div>
          </div>
        )}
      </div>

      {showDownloadProgress && (
        <div className="download-overlay">
          <div className="download-modal">
            <div className="progress-ring">
              <svg width="80" height="80" className="progress-ring-svg">
                <circle
                  className="progress-ring-bg"
                  stroke="#eee"
                  strokeWidth="6"
                  fill="transparent"
                  r="34"
                  cx="40"
                  cy="40"
                />
                <circle
                  className="progress-ring-circle"
                  stroke="#4a90d9"
                  strokeWidth="6"
                  fill="transparent"
                  r="34"
                  cx="40"
                  cy="40"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - downloadProgress / 100)}
                />
              </svg>
              <div className="progress-text">{downloadProgress}%</div>
            </div>
            <div className="download-text">正在导出剧本...</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
