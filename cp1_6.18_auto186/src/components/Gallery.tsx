import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../stores/useStore';
import PhotoModal from './PhotoModal';
import { Loader } from 'lucide-react';

const categories = [
  { key: 'all', label: '全部' },
  { key: 'portrait', label: '人像' },
  { key: 'landscape', label: '风光' },
  { key: 'still_life', label: '静物' }
];

const categoryColors: Record<string, string> = {
  portrait: '人像',
  landscape: '风光',
  still_life: '静物'
};

export default function Gallery() {
  const { photos, loading, activeCategory, fetchPhotos, setActiveCategory, modalPhotoIndex, setModalPhotoIndex } = useStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos(activeCategory);
  }, [activeCategory, fetchPhotos]);

  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'all') return photos;
    return photos.filter(p => p.category === activeCategory);
  }, [photos, activeCategory]);

  const columns = useMemo(() => {
    const result: typeof photos[] = [[], [], [], []];
    filteredPhotos.forEach((p, i) => {
      result[i % 4].push(p);
    });
    return result.filter(col => col.length > 0);
  }, [filteredPhotos]);

  return (
    <div className="gallery-page page">
      <div className="container">
        <div className="gallery-header">
          <h1 className="page-title">精选作品集</h1>
          <p className="page-subtitle">捕捉光影，定格美好瞬间</p>
        </div>

        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.key}
              className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader size={32} className="spin" />
            <span>加载中...</span>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="empty-state">
            <p>该分类下暂无作品</p>
          </div>
        ) : (
          <div className="masonry-grid">
            {columns.map((column, colIdx) => (
              <div key={colIdx} className="masonry-column">
                {column.map(photo => (
                  <div
                    key={photo.id}
                    className="photo-card glass-card"
                    onClick={() => {
                      const idx = filteredPhotos.findIndex(p => p.id === photo.id);
                      setModalPhotoIndex(idx);
                    }}
                    onMouseEnter={() => setHoveredId(photo.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="photo-wrapper">
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.title}
                        loading="lazy"
                        className="photo-img"
                      />
                      <div className={`photo-overlay ${hoveredId === photo.id ? 'show' : ''}`}>
                        <span className="photo-category">{categoryColors[photo.category]}</span>
                        <h3 className="photo-title">{photo.title}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalPhotoIndex !== null && (
        <PhotoModal
          photos={filteredPhotos}
          currentIndex={modalPhotoIndex}
          onClose={() => setModalPhotoIndex(null)}
          onPrev={() => setModalPhotoIndex(Math.max(0, modalPhotoIndex - 1))}
          onNext={() => setModalPhotoIndex(Math.min(filteredPhotos.length - 1, modalPhotoIndex + 1))}
        />
      )}

      <style>{`
        .gallery-header {
          margin-bottom: 24px;
        }
        .category-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .category-tab {
          padding: 8px 20px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid var(--color-border);
          font-size: 14px;
          font-weight: 500;
          color: var(--color-primary);
          transition: all var(--transition);
        }
        .category-tab:hover {
          border-color: var(--color-accent);
          color: var(--color-accent);
        }
        .category-tab.active {
          background: var(--color-accent);
          color: #fff;
          border-color: var(--color-accent);
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 0;
          color: #999;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .empty-state {
          text-align: center;
          padding: 80px 0;
          color: #999;
          font-size: 16px;
        }
        .masonry-grid {
          display: flex;
          gap: 16px;
        }
        .masonry-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .photo-card {
          overflow: hidden;
          cursor: pointer;
          padding: 0;
        }
        .photo-wrapper {
          position: relative;
          overflow: hidden;
        }
        .photo-img {
          width: 100%;
          display: block;
          object-fit: cover;
          border-radius: var(--radius-md);
          transition: transform 0.5s ease;
        }
        .photo-card:hover .photo-img {
          transform: scale(1.05);
        }
        .photo-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(44, 62, 80, 0.85), transparent 50%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 16px;
          opacity: 0;
          transition: opacity var(--transition);
          border-radius: var(--radius-md);
        }
        .photo-overlay.show {
          opacity: 1;
        }
        .photo-category {
          display: inline-block;
          padding: 3px 10px;
          background: var(--color-accent);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          border-radius: 20px;
          margin-bottom: 8px;
          align-self: flex-start;
        }
        .photo-title {
          color: #fff;
          font-size: 18px;
          font-family: var(--font-display);
          font-weight: 600;
        }
        @media (max-width: 1024px) {
          .masonry-grid { flex-wrap: wrap; }
          .masonry-column { flex: 1 1 calc(50% - 8px); min-width: 280px; }
        }
        @media (max-width: 768px) {
          .masonry-column { flex: 1 1 100%; }
          .category-tab { padding: 6px 14px; font-size: 13px; }
        }
      `}</style>
    </div>
  );
}
