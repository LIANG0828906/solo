import React from 'react';
import { useLandmarkStore } from '../store/landmarkStore';
import { getCityName } from '../utils/helpers';
import { StarIcon, CloseIcon, TrashIcon } from './Icons';

const FavoritesSidebar: React.FC = () => {
  const {
    favoriteLandmarks,
    setShowFavoritesSidebar,
    toggleFavorite,
    clearFavorites,
    setSelectedLandmark,
  } = useLandmarkStore();

  const handleCardClick = (landmarkId: string, cityId: string) => {
    const { currentCityId, setCurrentCity } = useLandmarkStore.getState();
    if (currentCityId !== cityId) {
      setCurrentCity(cityId);
    }
    setTimeout(() => {
      setSelectedLandmark(landmarkId);
    }, 100);
    setShowFavoritesSidebar(false);
  };

  const handleRemoveFavorite = (e: React.MouseEvent, landmarkId: string) => {
    e.stopPropagation();
    toggleFavorite(landmarkId);
  };

  return (
    <div className="favorites-sidebar">
      <div className="favorites-sidebar-header">
        <div className="favorites-sidebar-title">
          <StarIcon filled style={{ width: 20, height: 20, color: 'var(--color-highlight)' }} />
          我的收藏 ({favoriteLandmarks.length})
        </div>
        <button
          className="favorites-sidebar-close"
          onClick={() => setShowFavoritesSidebar(false)}
          title="关闭"
        >
          <CloseIcon style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {favoriteLandmarks.length > 0 && (
        <button
          className="favorites-clear"
          onClick={clearFavorites}
        >
          <TrashIcon style={{ width: 14, height: 14, display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          清空所有收藏
        </button>
      )}

      <div className="favorites-list">
        {favoriteLandmarks.length === 0 ? (
          <div className="favorites-empty">
            <StarIcon filled className="favorites-empty-icon" />
            <p>还没有收藏任何地标</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>点击详情页的星形图标即可收藏</p>
          </div>
        ) : (
          favoriteLandmarks.map((landmark) => (
            <div
              key={landmark.id}
              className="favorite-card"
              onClick={() => handleCardClick(landmark.id, landmark.cityId)}
            >
              <button
                className="favorite-card-remove"
                onClick={(e) => handleRemoveFavorite(e, landmark.id)}
                title="取消收藏"
              >
                <TrashIcon style={{ width: 14, height: 14 }} />
              </button>
              <div
                className="favorite-card-image"
                style={{ backgroundImage: `url(${landmark.imageUrl})` }}
              />
              <div className="favorite-card-body">
                <div className="favorite-card-name">{landmark.name}</div>
                <div className="favorite-card-city">{getCityName(landmark.cityId)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FavoritesSidebar;
