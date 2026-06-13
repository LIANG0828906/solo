import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './Sidebar';
import Editor from './Editor';
import DiffViewer from './DiffViewer';
import type { Chapter, VersionSnapshot, User } from './types';

const SCRIPT_TITLE = '我的剧本';
const AUTO_SAVE_INTERVAL = 30000;

const mockUsers: User[] = [
  { id: 'user-1', name: '张三', color: '#e74c3c', cursorPosition: 0 },
  { id: 'user-2', name: '李四', color: '#3498db', cursorPosition: 0 },
  { id: 'user-3', name: '王五', color: '#2ecc71', cursorPosition: 0 },
];

function App() {
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

  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [diffHeight, setDiffHeight] = useState(300);
  const [showDownloadProgress, setShowDownloadProgress] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const lastAutoSaveRef = useRef<number>(Date.now());

  const activeChapter = chapters.find((c) => c.id === activeChapterId) || null;
  const currentUser = mockUsers[0];
  const remoteUsers = mockUsers.slice(1);

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
  }, [activeChapter, versions]);

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
  };

  const handleRenameChapter = (id: string, newTitle: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === id ? { ...ch, title: newTitle, updatedAt: Date.now() } : ch
      )
    );
  };

  const handleDeleteChapter = (id: string) => {
    if (chapters.length <= 1) {
      alert('至少保留一个章节');
      return;
    }
    setChapters((prev) => prev.filter((ch) => ch.id !== id));
    setVersions((prev) => prev.filter((v) => v.chapterId !== id));
    if (activeChapterId === id) {
      const remaining = chapters.filter((ch) => ch.id !== id);
      setActiveChapterId(remaining[0]?.id || null);
    }
  };

  const handleSelectChapter = (id: string) => {
    setActiveChapterId(id);
    setEditorKey((prev) => prev + 1);
    setShowDiff(false);
    setSelectedVersions([]);
    setSidebarOpen(false);
  };

  const handleContentChange = (content: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === activeChapterId
          ? { ...ch, content, updatedAt: Date.now() }
          : ch
      )
    );
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

    const totalSteps = 20;
    const stepDuration = 50;

    for (let i = 0; i <= totalSteps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
      setDownloadProgress(Math.round((i / totalSteps) * 100));
    }

    let content = `${SCRIPT_TITLE}\n${'='.repeat(SCRIPT_TITLE.length * 2)}\n\n`;

    chapters.forEach((chapter, index) => {
      content += `\n---\n\n`;
      content += `${chapter.title}\n`;
      content += `${'-'.repeat(chapter.title.length)}\n\n`;

      const textContent = chapter.content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
        .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '$1\n')
        .replace(/<b>(.*?)<\/b>/gi, '$1')
        .replace(/<strong>(.*?)<\/strong>/gi, '$1')
        .replace(/<i>(.*?)<\/i>/gi, '$1')
        .replace(/<em>(.*?)<\/em>/gi, '$1')
        .replace(/<u>(.*?)<\/u>/gi, '$1')
        .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, inner) => {
          return inner.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
        })
        .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, inner) => {
          let count = 1;
          return inner.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
            return `${count++}. ` + arguments[1] + '\n';
          });
        })
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '$1\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      content += textContent + '\n';
    });

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
        onlineUsers={mockUsers}
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
              remoteUsers={remoteUsers}
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
