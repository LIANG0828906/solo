import { useEffect } from 'react';
import WorldMap from './components/WorldMap';
import SpiceDetailPanel from './components/SpiceDetailPanel';
import DropZone from './components/DropZone';
import { useStore } from './store';

function FavoritesPanel() {
  const favorites = useStore((s) => s.favorites);
  const favoritesPanelOpen = useStore((s) => s.favoritesPanelOpen);
  const toggleFavoritesPanel = useStore((s) => s.toggleFavoritesPanel);
  const removeFavorite = useStore((s) => s.removeFavorite);
  const setDropZoneSpice = useStore((s) => s.setDropZoneSpice);

  const handleFavoriteClick = (item: typeof favorites[0]) => {
    setDropZoneSpice(0, item.spices[0]);
    setDropZoneSpice(1, item.spices[1]);
  };

  return (
    <div className="favorites-panel-wrapper">
      {favoritesPanelOpen && (
        <div className="favorites-panel">
          <div className="favorites-header">
            <span className="favorites-header-title">💗 我的收藏</span>
            <span style={{ fontSize: 11, color: '#888' }}>{favorites.length} 个组合</span>
          </div>
          <div className="favorites-list">
            {favorites.length === 0 ? (
              <div className="empty-favorites">
                还没有收藏任何香料组合
                <br />
                <span style={{ fontSize: 11, color: '#666' }}>在右侧融合分析区收藏组合</span>
              </div>
            ) : (
              favorites.map((item) => (
                <div
                  key={item.id}
                  className="favorite-item"
                  onClick={() => handleFavoriteClick(item)}
                >
                  <div className="favorite-item-row">
                    <div className="favorite-item-spice">
                      <span className="favorite-item-dot" style={{ background: item.spices[0].color }} />
                      {item.spices[0].name}
                    </div>
                    <span style={{ color: '#666', fontSize: 11 }}>×</span>
                    <div className="favorite-item-spice">
                      <span className="favorite-item-dot" style={{ background: item.spices[1].color }} />
                      {item.spices[1].name}
                    </div>
                    <button
                      className="favorite-item-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(item.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="favorite-item-meta">
                    <span className="favorite-item-culture">{item.cultureName}</span>
                    <span className="favorite-item-similarity">{item.similarity}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <button className="favorites-toggle-btn" onClick={toggleFavoritesPanel}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFF" stroke="none">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        {favorites.length > 0 && <span className="favorites-badge">{favorites.length}</span>}
      </button>
    </div>
  );
}

export default function App() {
  const loadFavorites = useStore((s) => s.loadFavorites);
  const selectedCulture = useStore((s) => s.selectedCulture);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <WorldMap />

      <div className="app-title">
        <div className="app-title-main">香料风味图谱</div>
        <div className="app-title-sub">Spice Flavor Atlas</div>
      </div>

      {selectedCulture && <SpiceDetailPanel />}

      <DropZone />

      <FavoritesPanel />
    </div>
  );
}
