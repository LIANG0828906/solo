import React, { useState } from 'react';
import { useArtworkStore } from '@/store/artworkStore';
import { GalleryItem } from '@/types';
import './Gallery.css';

interface GalleryProps {
  onPreview?: (item: GalleryItem) => void;
}

const Gallery: React.FC<GalleryProps> = ({ onPreview }) => {
  const gallery = useArtworkStore((state) => state.gallery);
  const deleteFromGallery = useArtworkStore((state) => state.deleteFromGallery);
  const loadFromGallery = useArtworkStore((state) => state.loadFromGallery);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    setTimeout(() => {
      deleteFromGallery(id);
      setDeletingId(null);
    }, 200);
  };

  const handleItemClick = (item: GalleryItem) => {
    setPreviewItem(item);
    if (onPreview) {
      onPreview(item);
    }
  };

  const handleLoad = () => {
    if (previewItem) {
      loadFromGallery(previewItem);
      setPreviewItem(null);
    }
  };

  const handleClosePreview = () => {
    setPreviewItem(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="gallery-container">
        <div className="gallery-header">
          <h3 className="gallery-title">我的收藏</h3>
          <span className="gallery-count">{gallery.length} 件作品</span>
        </div>
        
        <div className="gallery-scroll">
          {gallery.length === 0 ? (
            <div className="empty-gallery">
              <div className="empty-icon">🎨</div>
              <p>还没有作品，开始创作你的第一件NFT艺术品吧！</p>
            </div>
          ) : (
            <div className="gallery-items">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className={`gallery-item ${deletingId === item.id ? 'deleting' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="item-thumbnail"
                  />
                  <div className="item-info">
                    <div className="item-title">{item.title}</div>
                    <div className="item-meta">
                      <span>{item.artId}</span>
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(e, item.id)}
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {previewItem && (
        <div className="preview-overlay" onClick={handleClosePreview}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleClosePreview}>
              ×
            </button>
            <img
              src={previewItem.thumbnail}
              alt={previewItem.title}
              className="preview-image"
            />
            <div className="preview-info">
              <h3 className="preview-title">{previewItem.title}</h3>
              <p className="preview-author">作者：{previewItem.author}</p>
              <p className="preview-id">{previewItem.artId}</p>
              <p className="preview-date">{formatDate(previewItem.createdAt)}</p>
              <button className="load-btn" onClick={handleLoad}>
                加载到画布
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;
