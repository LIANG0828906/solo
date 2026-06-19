import { useState, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../store';
import { Photo, PrintSize, SIZE_NAMES, SIZE_PRICES } from '../types';

interface PhotoGalleryProps {
  activeTab: 'all' | 'favorites';
  onUpload: (files: File[]) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`favorite-icon ${active ? 'active' : ''}`}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function PhotoGallery({ activeTab, onUpload, showToast }: PhotoGalleryProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    photos,
    favoriteIds,
    toggleFavorite,
    openEditor,
    addToCart
  } = useAppStore();

  const displayedPhotos = useMemo(() => {
    if (activeTab === 'favorites') {
      return photos.filter(p => favoriteIds.has(p.id));
    }
    return photos;
  }, [photos, favoriteIds, activeTab]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) onUpload(files);
  }, [onUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onUpload(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [onUpload]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFavoriteClick = useCallback((e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    toggleFavorite(photoId);
  }, [toggleFavorite]);

  const handlePhotoClick = useCallback((photo: Photo) => {
    openEditor(photo);
  }, [openEditor]);

  const handleQuickAdd = useCallback((e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation();
    const size: PrintSize = '6inch';
    addToCart(photo, size, 1);
    showToast(`已加入购物车：${SIZE_NAMES[size]} ×1 (¥${SIZE_PRICES[size].toFixed(2)})`);
  }, [addToCart, showToast]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${mins}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          {activeTab === 'all' ? '📸 全部作品' : '❤️ 我的收藏'}
        </h1>
        <p className="page-subtitle">
          {activeTab === 'all'
            ? '上传您的爱宠照片，为它们挑选喜欢的风格并下单冲印'
            : '您收藏的精选照片，点击可进入编辑'}
        </p>
      </div>

      {activeTab === 'all' && (
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="upload-icon">📤</div>
          <div className="upload-title">拖拽照片到此处，或点击选择文件</div>
          <div className="upload-hint">支持 JPG/PNG 格式，单张不超过 5MB，可多选上传</div>
          <input
            ref={fileInputRef}
            type="file"
            className="upload-input"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            multiple
            onChange={handleFileChange}
          />
        </div>
      )}

      {displayedPhotos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{activeTab === 'all' ? '📷' : '💔'}</div>
          <div className="empty-state-text">
            {activeTab === 'all'
              ? '还没有照片，快去上传您的第一组作品吧！'
              : '还没有收藏的照片，快去挑选喜欢的作品吧！'}
          </div>
        </div>
      ) : (
        <div className="gallery-container">
          {displayedPhotos.map(photo => {
            const isFav = favoriteIds.has(photo.id);
            const ratio = photo.width && photo.height ? photo.height / photo.width : 1;

            return (
              <div key={photo.id} className="photo-card">
                <div className="photo-image-wrapper" style={{ aspectRatio: `1 / ${ratio}` }}>
                  <img
                    className="photo-image"
                    src={photo.thumbnailUrl}
                    alt={photo.filename}
                    loading="lazy"
                    style={{ aspectRatio: `1 / ${ratio}` }}
                    onClick={() => handlePhotoClick(photo)}
                  />

                  <button
                    className={`favorite-btn ${isFav ? 'active' : ''}`}
                    onClick={(e) => handleFavoriteClick(e, photo.id)}
                    aria-label={isFav ? '取消收藏' : '收藏'}
                    title={isFav ? '取消收藏' : '收藏'}
                  >
                    <HeartIcon active={isFav} />
                  </button>

                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAdd(e, photo);
                    }}
                    aria-label="加入购物车"
                    title="快速加入购物车 (6寸×1)"
                  >
                    ＋
                  </button>
                </div>
                <div className="photo-info">
                  <span className="photo-date">{formatDate(photo.uploadTime)}</span>
                  <span>{photo.width}×{photo.height}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;
