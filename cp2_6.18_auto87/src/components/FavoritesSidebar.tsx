import React, { useState, useEffect, useCallback } from 'react';
import { useLandmarkStore } from '../store/landmarkStore';
import { getCityName } from '../utils/helpers';
import { StarIcon, CloseIcon, TrashIcon, ChevronDownIcon } from './Icons';

const debounce = <T extends (...args: unknown[]) => void>(func: T, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const FavoritesSidebar: React.FC = () => {
  const {
    favoriteLandmarks,
    setShowFavoritesSidebar,
    toggleFavorite,
    clearFavorites,
    setSelectedLandmark,
  } = useLandmarkStore();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    const debouncedCheckMobile = debounce(checkMobile, 150);
    checkMobile();
    window.addEventListener('resize', debouncedCheckMobile);
    return () => window.removeEventListener('resize', debouncedCheckMobile);
  }, []);

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

  const handleClose = useCallback(() => {
    setShowFavoritesSidebar(false);
  }, [setShowFavoritesSidebar]);

  return (
    <div
      className={`favorites-sidebar ${isMobile ? 'favorites-sidebar-mobile' : ''}`}
    >
      {isMobile && (
        <div
          className="drawer-handle"
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '12px 0 8px 0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              backgroundColor: 'var(--color-text-muted)',
              borderRadius: 2,
              marginBottom: 6,
            }}
          />
          <ChevronDownIcon
            style={{ width: 18, height: 18, color: 'var(--color-text-muted)' }}
          />
        </div>
      )}
      <div className="favorites-sidebar-header">
        <div className="favorites-sidebar-title">
          <StarIcon filled style={{ width: 20, height: 20, color: 'var(--color-highlight)' }} />
          我的收藏 ({favoriteLandmarks.length})
        </div>
        {!isMobile && (
          <button
            className="favorites-sidebar-close"
            onClick={handleClose}
            title="关闭"
          >
            <CloseIcon style={{ width: 20, height: 20 }} />
          </button>
        )}
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
