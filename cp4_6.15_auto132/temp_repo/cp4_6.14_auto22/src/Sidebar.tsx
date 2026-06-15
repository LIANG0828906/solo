import { useState } from 'react';
import type { Chapter, VersionSnapshot, User } from './types';

interface SidebarProps {
  chapters: Chapter[];
  activeChapterId: string | null;
  versions: VersionSnapshot[];
  selectedVersions: string[];
  onAddChapter: () => void;
  onRenameChapter: (id: string, title: string) => void;
  onDeleteChapter: (id: string) => void;
  onSelectChapter: (id: string) => void;
  onRestoreVersion: (versionId: string) => void;
  onToggleVersionSelect: (versionId: string) => void;
  onCompare: () => void;
  onExport: () => void;
  onlineUsers: User[];
  currentUserId: string;
  isMobileOpen: boolean;
}

function Sidebar({
  chapters,
  activeChapterId,
  versions,
  selectedVersions,
  onAddChapter,
  onRenameChapter,
  onDeleteChapter,
  onSelectChapter,
  onRestoreVersion,
  onToggleVersionSelect,
  onCompare,
  onExport,
  onlineUsers,
  currentUserId,
  isMobileOpen,
}: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartRename = (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(chapter.id);
    setRenameValue(chapter.title);
  };

  const handleFinishRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameChapter(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个章节吗？')) {
      onDeleteChapter(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleFinishRename(id);
    } else if (e.key === 'Escape') {
      setRenamingId(null);
      setRenameValue('');
    }
  };

  return (
    <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">章节列表</span>
        <button
          className="add-chapter-btn"
          onClick={onAddChapter}
          title="新建章节"
        >
          +
        </button>
      </div>

      <div className="chapter-list">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className={`chapter-item ${activeChapterId === chapter.id ? 'active' : ''}`}
            onClick={() => onSelectChapter(chapter.id)}
          >
            {renamingId === chapter.id ? (
              <input
                type="text"
                className="chapter-rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleFinishRename(chapter.id)}
                onKeyDown={(e) => handleKeyDown(e, chapter.id)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="chapter-item-title" title={chapter.title}>
                  {chapter.title}
                </span>
                <div className="chapter-item-actions">
                  <button
                    className="chapter-action-btn"
                    onClick={(e) => handleStartRename(chapter, e)}
                    title="重命名"
                  >
                    ✎
                  </button>
                  <button
                    className="chapter-action-btn"
                    onClick={(e) => handleDelete(chapter.id, e)}
                    title="删除"
                  >
                    🗑
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="online-users">
        <div className="online-users-title">
          在线用户 ({onlineUsers.length})
        </div>
        {onlineUsers.map((user) => (
          <div key={user.id} className="online-user">
            <span
              className="online-user-dot"
              style={{ backgroundColor: user.color }}
            />
            <span>
              {user.name}
              {user.id === currentUserId ? ' (我)' : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="version-section">
        <div className="version-section-title">版本历史</div>
        <div className="version-list">
          {versions.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#999', padding: '8px' }}>
              暂无版本记录
            </div>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="version-item"
                onClick={() => onRestoreVersion(version.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedVersions.includes(version.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleVersionSelect(version.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="version-info">
                  <div className="version-number">V{version.version}</div>
                  <div className="version-time">
                    {formatTime(version.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          className="compare-btn"
          onClick={onCompare}
          disabled={selectedVersions.length !== 2}
        >
          {selectedVersions.length === 2
            ? '对比版本'
            : `已选 ${selectedVersions.length}/2`}
        </button>
      </div>

      <button className="export-btn" onClick={onExport}>
        📥 导出剧本
      </button>
    </aside>
  );
}

export default Sidebar;
