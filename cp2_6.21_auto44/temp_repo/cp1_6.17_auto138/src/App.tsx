import React from 'react';
import { useStore, Gallery } from './store';
import GalleryModule from './GalleryModule';
import ArtworkModule from './ArtworkModule';
import ReviewModule from './ReviewModule';

type View = 'galleries';

const App: React.FC = () => {
  const { currentGallery, setCurrentGallery, fetchGalleryDetail, loading } = useStore();
  const [view, setView] = React.useState<View>('galleries');

  const openGallery = async (gallery: Gallery) => {
    setCurrentGallery(gallery);
    await fetchGalleryDetail(gallery.id);
  };

  const backToGalleries = () => {
    setCurrentGallery(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日创建`;
  };

  const renderStars = (rating: number) => {
    const full = Math.round(rating);
    return (
      <span className="rating-stars-static" style={{ fontSize: 16 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`star-static ${i <= full ? 'filled' : 'empty'}`} style={{ fontSize: 16 }}>
            ★
          </span>
        ))}
      </span>
    );
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-title">🖼 虚拟艺术画廊</div>
        <div className="navbar-nav">
          <button
            className={`nav-btn ${currentGallery === null ? 'active' : ''}`}
            onClick={backToGalleries}
          >
            画廊列表
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          {currentGallery === null ? (
            <GalleryModule onOpenGallery={openGallery} />
          ) : (
            <div className="gallery-detail">
              <div className="breadcrumb">
                <span className="breadcrumb-link" onClick={backToGalleries}>
                  ← 返回画廊列表
                </span>
              </div>

              {loading ? (
                <div className="loading">加载中...</div>
              ) : (
                <>
                  <div
                    className="gallery-detail-header"
                    style={{
                      borderLeft: `6px solid ${currentGallery.themeColor}`
                    }}
                  >
                    <div className="gallery-info">
                      <h1>{currentGallery.name}</h1>
                      <div className="gallery-info-meta">
                        <span className="theme-tag">
                          <span
                            className="theme-color-dot"
                            style={{ background: currentGallery.themeColor }}
                          />
                          {currentGallery.themeName}
                        </span>
                        <span style={{ fontSize: 14, color: '#888' }}>
                          {formatDate(currentGallery.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#333', marginBottom: 6 }}>
                        {(currentGallery.averageRating || 0) > 0
                          ? (currentGallery.averageRating || 0).toFixed(1)
                          : '—'}
                      </div>
                      {renderStars(currentGallery.averageRating || 0)}
                      <div style={{ fontSize: 13, color: '#999', marginTop: 6 }}>
                        {currentGallery.reviewCount || 0} 条评论
                      </div>
                    </div>
                  </div>

                  <ArtworkModule
                    galleryId={currentGallery.id}
                    galleryName={currentGallery.name}
                  />

                  <ReviewModule galleryId={currentGallery.id} />
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default App;
