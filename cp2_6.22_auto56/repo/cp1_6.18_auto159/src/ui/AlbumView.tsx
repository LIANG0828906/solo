import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useImageStore } from '@/stores/imageStore';

const AlbumView: React.FC = () => {
  const {
    images,
    albums,
    carouselOpen,
    carouselIndex,
    carouselAlbumId,
    addAlbum,
    toggleAlbum,
    addImageToAlbum,
    reorderAlbumImages,
    openCarousel,
    closeCarousel,
    setCarouselIndex,
  } = useImageStore();

  const [dragOverAlbumId, setDragOverAlbumId] = useState<string | null>(null);
  const [draggingThumb, setDraggingThumb] = useState<{ albumId: string; index: number } | null>(null);
  const [dragOverThumbIdx, setDragOverThumbIdx] = useState<number | null>(null);
  const [dragOverThumbAlbumId, setDragOverThumbAlbumId] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState<number>(0);

  const handleAlbumDragOver = (e: React.DragEvent<HTMLDivElement>, albumId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverAlbumId(albumId);
  };

  const handleAlbumDragLeave = () => {
    setDragOverAlbumId(null);
  };

  const handleAlbumDrop = (e: React.DragEvent<HTMLDivElement>, albumId: string) => {
    e.preventDefault();
    setDragOverAlbumId(null);
    const imageId = e.dataTransfer.getData('imageId');
    if (imageId) {
      addImageToAlbum(imageId, albumId);
    }
  };

  const handleThumbDragStart = (e: React.DragEvent<HTMLDivElement>, albumId: string, index: number) => {
    setDraggingThumb({ albumId, index });
    e.dataTransfer.effectAllowed = 'move';
    const album = albums.find((a) => a.id === albumId);
    const imgId = album?.imageIds[index];
    if (imgId) e.dataTransfer.setData('imageId', imgId);
  };

  const handleThumbDragOver = (e: React.DragEvent<HTMLDivElement>, albumId: string, index: number) => {
    e.preventDefault();
    setDragOverThumbIdx(index);
    setDragOverThumbAlbumId(albumId);
  };

  const handleThumbDrop = (e: React.DragEvent<HTMLDivElement>, toAlbumId: string, toIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggingThumb && draggingThumb.albumId === toAlbumId) {
      reorderAlbumImages(toAlbumId, draggingThumb.index, toIndex);
    } else {
      const imageId = e.dataTransfer.getData('imageId');
      if (imageId) {
        addImageToAlbum(imageId, toAlbumId, toIndex);
      }
    }

    setDraggingThumb(null);
    setDragOverThumbIdx(null);
    setDragOverThumbAlbumId(null);
  };

  const handleThumbDragEnd = () => {
    setDraggingThumb(null);
    setDragOverThumbIdx(null);
    setDragOverThumbAlbumId(null);
  };

  const handleAddAlbum = () => {
    const name = prompt('请输入新相册名称：');
    if (name && name.trim()) {
      addAlbum(name.trim());
    }
  };

  const goPrev = useCallback(() => {
    setSlideDir(-1);
    setCarouselIndex(carouselIndex - 1);
  }, [carouselIndex, setCarouselIndex]);

  const goNext = useCallback(() => {
    setSlideDir(1);
    setCarouselIndex(carouselIndex + 1);
  }, [carouselIndex, setCarouselIndex]);

  useEffect(() => {
    if (!carouselOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') closeCarousel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [carouselOpen, goPrev, goNext, closeCarousel]);

  const currentAlbum = albums.find((a) => a.id === carouselAlbumId);
  const carouselImageId = currentAlbum?.imageIds[carouselIndex];
  const carouselImage = images.find((img) => img.id === carouselImageId);

  const getSlideTransform = (offset: number) => {
    if (offset === 0) return 'translateX(0) scale(1)';
    if (slideDir === 1 && offset === -1) return 'translateX(-110%) scale(0.95)';
    if (slideDir === -1 && offset === 1) return 'translateX(110%) scale(0.95)';
    if (slideDir === 1 && offset === 0) return 'translateX(0) scale(1)';
    if (slideDir === -1 && offset === 0) return 'translateX(0) scale(1)';
    if (slideDir === 1 && offset === 1) return 'translateX(110%) scale(0.95)';
    if (slideDir === -1 && offset === -1) return 'translateX(-110%) scale(0.95)';
    return 'translateX(0) scale(1)';
  };

  return (
    <div className="album-view">
      <div className="album-header">
        <div className="section-title" style={{ marginBottom: 0 }}>
          相册分类
        </div>
        <button type="button" className="add-album-btn" onClick={handleAddAlbum}>
          + 添加标签
        </button>
      </div>

      <div className="album-list">
        {albums.map((album) => (
          <div
            key={album.id}
            className={`album-item ${dragOverAlbumId === album.id ? 'dragover' : ''}`}
            onDragOver={(e) => handleAlbumDragOver(e, album.id)}
            onDragLeave={handleAlbumDragLeave}
            onDrop={(e) => handleAlbumDrop(e, album.id)}
          >
            <div className="album-header-item" onClick={() => toggleAlbum(album.id)}>
              <div className="album-title">
                📁 {album.name}
                <span className="album-count">{album.imageIds.length}</span>
              </div>
              <button type="button" className="album-toggle">
                {album.expanded ? '▲' : '▼'}
              </button>
            </div>
            <div className={`album-content ${album.expanded ? '' : 'collapsed'}`}>
              {album.imageIds.length === 0 ? (
                <div className="album-empty">拖拽图片到此处添加</div>
              ) : (
                <div className="album-grid">
                  {album.imageIds.map((imgId, idx) => {
                    const img = images.find((i) => i.id === imgId);
                    if (!img) return null;
                    const isDragging =
                      draggingThumb?.albumId === album.id && draggingThumb.index === idx;
                    const isDragOver =
                      dragOverThumbAlbumId === album.id && dragOverThumbIdx === idx && !isDragging;
                    return (
                      <div
                        key={imgId}
                        className={`album-thumb ${isDragging ? 'dragging' : ''} ${
                          isDragOver ? 'drag-over' : ''
                        }`}
                        onClick={() => openCarousel(album.id, idx)}
                        draggable
                        onDragStart={(e) => handleThumbDragStart(e, album.id, idx)}
                        onDragOver={(e) => handleThumbDragOver(e, album.id, idx)}
                        onDragLeave={() => {}}
                        onDrop={(e) => handleThumbDrop(e, album.id, idx)}
                        onDragEnd={handleThumbDragEnd}
                        title={`${img.name} - 点击查看`}
                      >
                        <img
                          src={img.processedDataUrl ?? img.dataUrl}
                          alt={img.name}
                          className="album-thumb-img"
                          draggable={false}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {carouselOpen && currentAlbum && carouselImage && (
        <div className="carousel-overlay" onClick={closeCarousel}>
          <button
            type="button"
            className="carousel-close"
            onClick={(e) => {
              e.stopPropagation();
              closeCarousel();
            }}
          >
            ✕
          </button>

          <button
            type="button"
            className="carousel-nav prev"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-nav next"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          >
            ›
          </button>

          <div className="carousel-container" onClick={(e) => e.stopPropagation()}>
            {[-1, 0, 1].map((offset) => {
              const total = currentAlbum.imageIds.length;
              let idx = carouselIndex + offset;
              if (idx < 0) idx += total;
              if (idx >= total) idx -= total;
              const id = currentAlbum.imageIds[idx];
              const img = images.find((i) => i.id === id);
              if (!img) return null;
              return (
                <div
                  key={`${id}-${offset}`}
                  className="carousel-slide"
                  style={{
                    transform: getSlideTransform(offset),
                    opacity: offset === 0 ? 1 : offset === slideDir ? 0.3 : 0,
                    pointerEvents: offset === 0 ? 'auto' : 'none',
                    zIndex: offset === 0 ? 2 : 1,
                  }}
                >
                  <img src={img.processedDataUrl ?? img.dataUrl} alt={img.name} />
                </div>
              );
            })}
          </div>

          <div className="carousel-info" onClick={(e) => e.stopPropagation()}>
            <strong>{currentAlbum.name}</strong>
            {carouselIndex + 1} / {currentAlbum.imageIds.length}
            <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
              · {carouselImage.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumView;
