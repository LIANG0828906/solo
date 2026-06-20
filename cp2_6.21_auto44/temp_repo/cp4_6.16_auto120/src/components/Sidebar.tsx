import { useStore } from '../store';
import './Sidebar.css';

export function Sidebar() {
  const {
    folders,
    cards,
    setShowCreateModal,
    toggleKnowledgeNetwork,
    showKnowledgeNetwork,
    sidebarOpen,
    setSidebarOpen,
  } = useStore();

  const groupFoldersByDate = () => {
    const groups: { [key: string]: typeof folders } = {};
    const sortedFolders = [...folders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const folder of sortedFolders) {
      const date = new Date(folder.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(folder);
    }

    return groups;
  };

  const folderGroups = groupFoldersByDate();

  const formatDateLabel = (key: string) => {
    const [year, month] = key.split('-');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (parseInt(year) === currentYear && parseInt(month) === currentMonth) {
      return '本月';
    }
    if (parseInt(year) === currentYear && parseInt(month) === currentMonth - 1) {
      return '上月';
    }
    return `${year}年${parseInt(month)}月`;
  };

  const getCardCount = (folderId: string) => {
    return cards.filter((c) => c.folderId === folderId).length;
  };

  return (
    <>
      <button
        className={`sidebar-toggle ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <span className="sidebar-toggle-icon">☰</span>
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-glow" />

        <div className="sidebar-header">
          <div className="user-avatar">
            <span>✨</span>
          </div>
          <div className="user-info">
            <div className="user-name">灵感收藏家</div>
            <div className="user-desc">{cards.length} 个灵感碎片</div>
          </div>
        </div>

        <button
          className="new-inspiration-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="btn-icon">+</span>
          新建灵感
        </button>

        <button
          className={`knowledge-network-btn ${showKnowledgeNetwork ? 'active' : ''}`}
          onClick={toggleKnowledgeNetwork}
        >
          <span className="btn-icon">🕸️</span>
          知识网络
        </button>

        <div className="folders-section">
          <div className="folders-title">文件夹</div>
          <div className="folders-list">
            {Object.entries(folderGroups).map(([dateKey, folderList]) => (
              <div key={dateKey} className="folder-group">
                <div className="folder-group-title">{formatDateLabel(dateKey)}</div>
                {folderList.map((folder) => (
                  <div key={folder.id} className="folder-item">
                    <div
                      className="folder-dot"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span className="folder-name">{folder.name}</span>
                    <span className="folder-count">{getCardCount(folder.id)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="version">MemoMosaic v0.1</div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
