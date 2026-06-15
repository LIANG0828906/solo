import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Painting } from './types';

function Favorites() {
  const [favorites, setFavorites] = useState<Painting[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem('favorites');
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch (error) {
        console.error('加载收藏失败:', error);
      }
    };

    loadFavorites();
    window.addEventListener('storage', loadFavorites);
    return () => window.removeEventListener('storage', loadFavorites);
  }, []);

  const removeFavorite = (e: React.MouseEvent, paintingId: string) => {
    e.stopPropagation();
    try {
      const newFavorites = favorites.filter(f => f.id !== paintingId);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
  };

  return (
    <div className="page-container fade-in">
      <h1 className="page-title">我的珍藏</h1>

      {favorites.length === 0 ? (
        <div className="favorites-empty">
          <div className="favorites-empty-icon">💝</div>
          <p className="favorites-empty-text">还没有收藏的画作</p>
          <p style={{ marginTop: '10px', fontSize: '14px', color: 'rgba(230,184,0,0.5)' }}>
            点击画作详情页的心形图标收藏喜欢的作品吧
          </p>
        </div>
      ) : (
        <div className="waterfall-grid">
          {favorites.map(painting => (
            <div key={painting.id} className="waterfall-item">
              <div
                className="painting-card favorite-card"
                onClick={() => navigate(`/painting/${painting.id}`)}
              >
                <button
                  className="favorite-remove-btn"
                  onClick={(e) => removeFavorite(e, painting.id)}
                  title="取消收藏"
                >
                  ×
                </button>
                <img
                  src={painting.imageUrl}
                  alt={painting.title}
                  className="painting-card-image"
                  loading="lazy"
                />
                <div className="painting-card-info">
                  <h3 className="painting-card-title">{painting.title}</h3>
                  <p className="painting-card-artist">{painting.artist}</p>
                  <span className="painting-card-emotion">{painting.emotion}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
