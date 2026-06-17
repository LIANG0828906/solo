import { useMapStore } from '../stores/useMapStore';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../stores/useMapStore';
import './Sidebar.css';

export function Sidebar() {
  const showSidebar = useMapStore((state) => state.showSidebar);
  const collections = useMapStore((state) => state.collections);
  const loadCollection = useMapStore((state) => state.loadCollection);
  const toggleSidebar = useMapStore((state) => state.toggleSidebar);
  const deleteCollection = useMapStore((state) => state.deleteCollection);
  const addCollection = useMapStore((state) => state.addCollection);
  const markers = useMapStore((state) => state.markers);
  const mapCenter = useMapStore((state) => state.mapCenter);
  const mapZoom = useMapStore((state) => state.mapZoom);

  const handleSaveCurrent = () => {
    const title = prompt('请输入攻略名称:', '我的旅行攻略');
    if (title && title.trim()) {
      addCollection({
        title: title.trim(),
        thumbnail: '',
        markers: JSON.parse(JSON.stringify(markers)),
        center: [...mapCenter] as [number, number],
        zoom: mapZoom,
      });
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个收藏吗？')) {
      deleteCollection(id);
    }
  };

  return (
    <>
      {showSidebar && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
      <div className={`sidebar ${showSidebar ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>我的收藏</h2>
          <button className="sidebar-close" onClick={toggleSidebar}>
            ✕
          </button>
        </div>

        <button className="save-current-btn" onClick={handleSaveCurrent}>
          <span className="save-icon">+</span>
          保存当前攻略
        </button>

        <div className="collections-list">
          {collections.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>暂无收藏的攻略</p>
              <span>点击上方按钮保存当前地图状态</span>
            </div>
          ) : (
            collections.map((collection) => (
              <div
                key={collection.id}
                className="collection-card"
                onClick={() => loadCollection(collection.id)}
              >
                <div className="collection-thumbnail">
                  <div className="thumbnail-placeholder">
                    <svg viewBox="0 0 280 120" className="thumbnail-svg">
                      <rect width="280" height="120" fill="#E8E8F0" />
                      {collection.markers.slice(0, 5).map((m, i) => {
                        const x = 30 + (i * 50) % 220;
                        const y = 30 + Math.floor(i / 5) * 40;
                        return (
                          <circle
                            key={m.id}
                            cx={x}
                            cy={y}
                            r={6}
                            fill={CATEGORY_COLORS[m.category]}
                          />
                        );
                      })}
                      {collection.markers.length > 1 && (
                        <path
                          d={collection.markers.slice(0, 5).map((m, i) => {
                            const x = 30 + (i * 50) % 220;
                            const y = 30 + Math.floor(i / 5) * 40;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          stroke="#6C63FF"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="4 3"
                          opacity="0.6"
                        />
                      )}
                    </svg>
                  </div>
                  <div className="marker-count-badge">
                    {collection.markers.length} 个地点
                  </div>
                </div>

                <div className="collection-info">
                  <h3 className="collection-title">{collection.title}</h3>
                  <div className="collection-meta">
                    <span className="collection-date">
                      {new Date(collection.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                    <div className="collection-categories">
                      {['food', 'attraction', 'hotel', 'shopping'].map((cat) => {
                        const hasCategory = collection.markers.some(
                          (m) => m.category === cat
                        );
                        if (!hasCategory) return null;
                        return (
                          <span
                            key={cat}
                            className="cat-dot-small"
                            style={{ backgroundColor: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] }}
                            title={cat}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  className="delete-collection-btn"
                  onClick={(e) => handleDelete(e, collection.id)}
                  title="删除收藏"
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
