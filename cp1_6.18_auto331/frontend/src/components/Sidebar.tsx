import { useAppStore } from '../store/useAppStore';
import { LANGUAGE_FAMILIES } from '../types';
import { hashStringToColor, getFamilyColor } from '../utils/helpers';

export default function Sidebar() {
  const user = useAppStore((state) => state.user);
  const filterFamily = useAppStore((state) => state.filterFamily);
  const setFilterFamily = useAppStore((state) => state.setFilterFamily);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const notes = useAppStore((state) => state.notes);

  const familyCounts: Record<string, number> = {};
  notes.forEach((note) => {
    const family = note.languageFamily || '其他';
    familyCounts[family] = (familyCounts[family] || 0) + 1;
  });

  const userColor = user ? hashStringToColor(user.username) : '#7C4DFF';
  const userInitial = user ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="user-avatar" style={{ background: userColor }}>
            {userInitial}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username || '访客'}</div>
            <div className="user-status">
              <span className="status-dot" />
              语音探索者
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="section-title">语系筛选</h3>
          <div className="family-tags">
            <button
              className={`tag ${!filterFamily ? 'active' : ''}`}
              onClick={() => setFilterFamily(null)}
            >
              全部
              <span className="tag-count">{notes.length}</span>
            </button>
            {LANGUAGE_FAMILIES.map((family) => {
              const count = familyCounts[family] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={family}
                  className={`tag ${filterFamily === family ? 'active' : ''}`}
                  onClick={() => setFilterFamily(filterFamily === family ? null : family)}
                  style={
                    filterFamily === family
                      ? { background: getFamilyColor(family) + '30', borderColor: getFamilyColor(family) }
                      : {}
                  }
                >
                  <span
                    className="tag-dot"
                    style={{ background: getFamilyColor(family) }}
                  />
                  {family}
                  <span className="tag-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="section-title">统计概览</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{notes.length}</div>
              <div className="stat-label">总笔记</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Object.keys(familyCounts).length}</div>
              <div className="stat-label">语系数</div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="footer-text">语音地图 v1.0</div>
        </div>
      </aside>

      <style>{`
        .sidebar {
          width: 300px;
          background: #2A2A3A;
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: calc(100vh - 40px);
          position: fixed;
          left: 20px;
          top: 20px;
          z-index: 100;
          transform: translateX(-120%);
          transition: transform 0.3s ease;
        }

        .sidebar.open {
          transform: translateX(0);
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 99;
        }

        @media (max-width: 768px) {
          .sidebar-overlay {
            display: block;
          }
        }

        @media (min-width: 769px) {
          .sidebar {
            transform: translateX(0);
            position: relative;
            left: 0;
            top: 0;
            height: calc(100vh - 40px);
            flex-shrink: 0;
          }
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          font-weight: 600;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          color: #E0E0E0;
          font-weight: 600;
          font-size: 16px;
        }

        .user-status {
          color: #B0B0B0;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: #00C853;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .sidebar-section {
          flex-shrink: 0;
        }

        .section-title {
          color: #B0B0B0;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .family-tags {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .family-tags::-webkit-scrollbar {
          width: 4px;
        }

        .family-tags::-webkit-scrollbar-track {
          background: transparent;
        }

        .family-tags::-webkit-scrollbar-thumb {
          background: #3D3D3D;
          border-radius: 2px;
        }

        .tag {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #3D3D3D;
          border: 1px solid transparent;
          border-radius: 20px;
          color: #B0B0B0;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .tag:hover {
          background: #4A4A5A;
          color: #E0E0E0;
        }

        .tag.active {
          color: white;
          font-weight: 500;
        }

        .tag-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .tag-count {
          margin-left: auto;
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .stat-card {
          background: #1E1E2E;
          border-radius: 12px;
          padding: 14px;
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #7C4DFF, #00BFFF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          color: #B0B0B0;
          font-size: 11px;
          margin-top: 4px;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .footer-text {
          color: #666;
          font-size: 11px;
          text-align: center;
        }
      `}</style>
    </>
  );
}
