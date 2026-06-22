import { useState, useEffect, useMemo } from 'react';
import { artworks, type Artwork } from '../data/galleryData';
import AnnotationPanel from './AnnotationPanel';

const ArtGallery = () => {
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(artworks[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (selectedArtwork) {
      setImageLoaded(false);
      const preload = new Image();
      preload.src = selectedArtwork.imageUrl;
      preload.onload = () => setImageLoaded(true);
      setImageKey((k) => k + 1);
    }
  }, [selectedArtwork?.id]);

  const filteredArtworks = useMemo(() => {
    if (!searchQuery.trim()) return artworks;
    const q = searchQuery.trim().toLowerCase();
    return artworks.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q) ||
        a.style.toLowerCase().includes(q) ||
        a.era.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleThumbnailClick = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#faf8f5',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    },
    mobileContainer: {
      padding: '16px',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '32px',
    },
    title: {
      fontSize: '32px',
      fontWeight: 700,
      color: '#333',
      marginBottom: '8px',
      letterSpacing: '0.5px',
    },
    subtitle: {
      fontSize: '14px',
      color: '#888',
    },
    searchWrap: {
      maxWidth: '480px',
      margin: '0 auto 32px',
      position: 'relative' as const,
    },
    searchInput: {
      width: '100%',
      padding: '12px 44px 12px 20px',
      fontSize: '14px',
      border: '1.5px solid #ccc',
      borderRadius: '20px',
      outline: 'none',
      background: '#fff',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      color: '#333',
    },
    clearButton: {
      position: 'absolute' as const,
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '24px',
      height: '24px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: '#aaa',
      fontSize: '18px',
      fontWeight: 400,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      transition: 'background 0.2s ease, color 0.2s ease',
    },
    mainContent: {
      display: 'flex',
      gap: '24px',
      alignItems: 'flex-start',
      justifyContent: 'center',
      position: 'relative' as const,
    },
    mainContentMobile: {
      flexDirection: 'column' as const,
      alignItems: 'stretch',
    },
    leftSection: {
      flex: 1,
      maxWidth: '900px',
      minWidth: 0,
    },
    imageViewSection: {
      marginBottom: '32px',
    },
    imageContainer: {
      background: '#fff',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      marginBottom: '20px',
      minHeight: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageWrap: {
      maxWidth: '100%',
      maxHeight: '600px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageWrapMobile: {
      maxHeight: 'none',
    },
    largeImage: {
      maxWidth: '100%',
      maxHeight: '600px',
      width: 'auto',
      height: 'auto',
      objectFit: 'contain' as const,
      display: 'block',
      borderRadius: '4px',
      opacity: imageLoaded ? 1 : 0,
      transition: 'opacity 0.5s ease',
    },
    largeImageMobile: {
      maxHeight: 'none',
      maxWidth: '100%',
    },
    loadingPlaceholder: {
      width: '100%',
      height: '300px',
      background: '#f0f0f0',
      borderRadius: '4px',
      display: imageLoaded ? 'none' : 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#aaa',
      fontSize: '14px',
    },
    noSelection: {
      color: '#888',
      fontSize: '14px',
    },
    infoPanel: {
      background: '#fff',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      gap: '12px 20px',
      fontSize: '14px',
      color: '#333',
    },
    infoLabel: {
      fontWeight: 500,
      color: '#777',
      textAlign: 'right' as const,
    },
    infoValue: {
      fontWeight: 400,
      color: '#333',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#333',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '1px solid #f0f0f0',
    },
    thumbnailSection: {
      marginTop: '8px',
    },
    thumbGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '16px',
    },
    thumbGridMobile: {
      gridTemplateColumns: '1fr',
      gap: '12px',
    },
    noResults: {
      textAlign: 'center' as const,
      padding: '40px 20px',
      color: '#999',
      fontSize: '14px',
      background: '#fff',
      borderRadius: '8px',
    },
    rightPanelWrap: {
      flexShrink: 0,
      position: 'sticky' as const,
      top: '20px',
    },
    rightPanelWrapMobile: {
      position: 'static' as const,
      width: '100%',
    },
  };

  const thumbStyles = {
    card: (isSelected: boolean) => ({
      position: 'relative' as const,
      width: '100%',
      height: '200px',
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'pointer',
      border: isSelected ? '2px solid #4a90d9' : '2px solid transparent',
      boxShadow: isSelected ? '0 4px 16px rgba(74, 144, 217, 0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      animation: 'fadeIn 0.3s ease forwards',
      opacity: 0,
    }),
    img: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      transition: 'transform 0.2s ease',
    },
    overlay: {
      position: 'absolute' as const,
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      textAlign: 'center' as const,
      opacity: 0,
      transition: 'opacity 0.2s ease',
    },
    overlayText: {
      color: '#fff',
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: 1.3,
    },
  };

  return (
    <div style={{ ...styles.container, ...(isMobile ? styles.mobileContainer : {}) }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      <header style={styles.header}>
        <h1 style={styles.title}>🎨 艺境画廊</h1>
        <p style={styles.subtitle}>探索经典艺术，留下你的鉴赏笔记</p>
      </header>

      <div style={styles.searchWrap}>
        <input
          type="text"
          placeholder="搜索画作..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            ...styles.searchInput,
            borderColor: searchFocused ? '#4a90d9' : '#ccc',
            boxShadow: searchFocused ? '0 0 0 3px rgba(74,144,217,0.12)' : 'none',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
              e.currentTarget.style.color = '#666';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#aaa';
            }}
            style={styles.clearButton}
            aria-label="清除搜索"
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ ...styles.mainContent, ...(isMobile ? styles.mainContentMobile : {}) }}>
        <div style={styles.leftSection}>
          <section style={styles.imageViewSection}>
            <div style={styles.imageContainer}>
              {selectedArtwork ? (
                <div
                  style={{
                    ...styles.imageWrap,
                    ...(isMobile ? styles.imageWrapMobile : {}),
                  }}
                >
                  <div key={imageKey} style={styles.loadingPlaceholder}>
                    加载中...
                  </div>
                  <img
                    key={`img-${imageKey}`}
                    src={selectedArtwork.imageUrl}
                    alt={selectedArtwork.name}
                    onLoad={() => setImageLoaded(true)}
                    style={{
                      ...styles.largeImage,
                      ...(isMobile ? styles.largeImageMobile : {}),
                    }}
                  />
                </div>
              ) : (
                <div style={styles.noSelection}>请选择一幅画作查看大图</div>
              )}
            </div>

            {selectedArtwork && (
              <div style={styles.infoPanel}>
                <h2 style={styles.sectionTitle}>作品信息</h2>
                <div style={styles.infoGrid}>
                  <span style={styles.infoLabel}>名称</span>
                  <span style={styles.infoValue}>{selectedArtwork.name}</span>
                  <span style={styles.infoLabel}>艺术家</span>
                  <span style={styles.infoValue}>{selectedArtwork.artist}</span>
                  <span style={styles.infoLabel}>创作年份</span>
                  <span style={styles.infoValue}>{selectedArtwork.year}年</span>
                  <span style={styles.infoLabel}>尺寸</span>
                  <span style={styles.infoValue}>{selectedArtwork.dimensions}</span>
                  <span style={styles.infoLabel}>风格</span>
                  <span style={styles.infoValue}>{selectedArtwork.style}</span>
                  <span style={styles.infoLabel}>年代</span>
                  <span style={styles.infoValue}>{selectedArtwork.era}</span>
                </div>
              </div>
            )}
          </section>

          <section style={styles.thumbnailSection}>
            <h2 style={styles.sectionTitle}>画作列表</h2>
            {filteredArtworks.length === 0 ? (
              <div style={styles.noResults}>
                没有找到匹配"{searchQuery}"的画作
              </div>
            ) : (
              <div
                style={{
                  ...styles.thumbGrid,
                  ...(isMobile ? styles.thumbGridMobile : {}),
                }}
              >
                {filteredArtworks.map((artwork, idx) => {
                  const isSelected = selectedArtwork?.id === artwork.id;
                  const cardId = `thumb-${artwork.id}`;

                  return (
                    <div
                      key={artwork.id}
                      id={cardId}
                      style={{
                        ...thumbStyles.card(isSelected),
                        animationDelay: `${Math.min(idx * 30, 300)}ms`,
                      }}
                      onClick={() => handleThumbnailClick(artwork)}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        (el.firstElementChild as HTMLElement).style.transform =
                          'scale(1.05)';
                        (el.children[1] as HTMLElement).style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget;
                        (el.firstElementChild as HTMLElement).style.transform =
                          'scale(1)';
                        (el.children[1] as HTMLElement).style.opacity = '0';
                      }}
                    >
                      <img
                        src={artwork.imageUrl}
                        alt={artwork.name}
                        loading="lazy"
                        style={thumbStyles.img}
                      />
                      <div style={thumbStyles.overlay}>
                        <span style={thumbStyles.overlayText}>{artwork.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div
          style={{
            ...styles.rightPanelWrap,
            ...(isMobile ? styles.rightPanelWrapMobile : {}),
          }}
        >
          <AnnotationPanel artworkId={selectedArtwork?.id || null} />
        </div>
      </div>
    </div>
  );
};

export default ArtGallery;
