import { useState, useMemo, useRef, useEffect } from 'react';
import { PhotoData, TAGS } from '../utils/photoData';
import PhotoCard from './PhotoCard';

interface GalleryProps {
  photos: PhotoData[];
  selectedPhotoIds: string[];
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
  onPhotoClick: (photo: PhotoData, e: React.MouseEvent) => void;
  onEnterCompare: () => void;
  onCancelSelection: () => void;
  compareModeAvailable: boolean;
}

export default function Gallery({
  photos,
  selectedPhotoIds,
  selectedTags,
  onTagToggle,
  onPhotoClick,
  onEnterCompare,
  onCancelSelection,
  compareModeAvailable,
}: GalleryProps) {
  const tagContainerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(5);

  const filteredPhotos = useMemo(() => {
    if (selectedTags.length === 0) return photos;
    return photos.filter(photo =>
      photo.tags.some(tag => selectedTags.includes(tag))
    );
  }, [photos, selectedTags]);

  const visiblePhotos = useMemo(() => {
    return filteredPhotos.slice(0, 50);
  }, [filteredPhotos]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setColumns(2);
      } else if (width < 1024) {
        setColumns(3);
      } else {
        setColumns(5);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const galleryColumns = useMemo(() => {
    const cols: PhotoData[][] = Array.from({ length: columns }, () => []);
    const colHeights = Array(columns).fill(0);

    visiblePhotos.forEach((photo) => {
      let shortestCol = 0;
      let shortestHeight = colHeights[0];
      
      for (let i = 1; i < columns; i++) {
        if (colHeights[i] < shortestHeight) {
          shortestHeight = colHeights[i];
          shortestCol = i;
        }
      }
      
      cols[shortestCol].push(photo);
      colHeights[shortestCol] += photo.height / photo.width;
    });

    return cols;
  }, [visiblePhotos, columns]);

  const scrollTags = (direction: 'left' | 'right') => {
    if (!tagContainerRef.current) return;
    const scrollAmount = 200;
    tagContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <div className="tag-filter-bar">
        <button
          className="tag-scroll-btn"
          onClick={() => scrollTags('left')}
          aria-label="向左滚动"
        >
          ‹
        </button>
        <div className="tag-container" ref={tagContainerRef}>
          <span
            className={`tag-pill ${selectedTags.length === 0 ? 'active' : ''}`}
            style={{
              background: selectedTags.length === 0 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              color: '#e0e0e0',
            }}
            onClick={() => {
              if (selectedTags.length > 0) {
                selectedTags.forEach(t => onTagToggle(t));
              }
            }}
          >
            全部
          </span>
          {TAGS.map((tag) => (
            <span
              key={tag.id}
              className={`tag-pill ${selectedTags.includes(tag.id) ? 'active' : ''}`}
              style={{
                background: selectedTags.includes(tag.id) ? tag.color : 'rgba(255, 255, 255, 0.08)',
                color: selectedTags.includes(tag.id)
                  ? (tag.id === 'street' || tag.id === 'macro') ? '#1a1a1a' : '#fff'
                  : '#e0e0e0',
              }}
              onClick={() => onTagToggle(tag.id)}
            >
              {tag.name}
            </span>
          ))}
        </div>
        <button
          className="tag-scroll-btn"
          onClick={() => scrollTags('right')}
          aria-label="向右滚动"
        >
          ›
        </button>
      </div>

      {selectedPhotoIds.length > 0 && (
        <div className="compare-bar">
          <span className="compare-bar-text">
            已选择 <strong>{selectedPhotoIds.length}</strong> 张照片
            {selectedPhotoIds.length >= 2 && selectedPhotoIds.length <= 4 && '（可以进行比较）'}
            {selectedPhotoIds.length > 4 && '（最多选择4张）'}
          </span>
          <button
            className="compare-btn"
            onClick={onEnterCompare}
            disabled={!compareModeAvailable}
          >
            比较
          </button>
          <button
            className="cancel-compare-btn"
            onClick={onCancelSelection}
          >
            取消选择
          </button>
        </div>
      )}

      <div className="gallery-wrapper">
        <div className="gallery">
          {galleryColumns.map((col, colIndex) => (
            <div key={colIndex} className="gallery-column">
              {col.map((photo) => {
                const originalIndex = photos.findIndex(p => p.id === photo.id);
                return (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    index={originalIndex}
                    allPhotos={photos}
                    isSelected={selectedPhotoIds.includes(photo.id)}
                    isEntering={true}
                    isExiting={false}
                    onClick={(e) => onPhotoClick(photo, e)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {filteredPhotos.length > 50 && (
        <div className="end-indicator">
          共 {filteredPhotos.length} 张照片，显示前 50 张
        </div>
      )}
    </>
  );
}
