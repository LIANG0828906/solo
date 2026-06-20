import React from 'react';

export interface FavoriteItem {
  id: string;
  plantId: string;
  plantName: string;
  addedAt: string;
}

interface FavoritesProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteItem[];
  onSelectPlant: (plantId: string) => void;
}

const Favorites: React.FC<FavoritesProps> = ({
  isOpen,
  onClose,
  favorites,
  onSelectPlant,
}) => {
  return (
    <>
      <button className="favorites-fab" onClick={onClose} title="我的收藏">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>

      <div className={`favorites-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h3>我的收藏</h3>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          {favorites.length === 0 ? (
            <p className="empty-favorites">暂无收藏的植物</p>
          ) : (
            favorites.map(fav => (
              <div
                key={fav.id}
                className="favorite-card"
                onClick={() => {
                  onSelectPlant(fav.plantId);
                  onClose();
                }}
              >
                <div className="fav-thumb">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#4a90d9">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                  </svg>
                </div>
                <div className="fav-info">
                  <span className="fav-name">{fav.plantName}</span>
                  <span className="fav-date">
                    {new Date(fav.addedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isOpen && <div className="panel-backdrop" onClick={onClose} />}
    </>
  );
};

export default Favorites;
