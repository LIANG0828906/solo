import React, { useState, useCallback } from 'react';
import { useAppStore, GalleryItem } from '../store/useAppStore';

const GalleryBar: React.FC = () => {
  const { gallery, showGalleryModal, loadFromGallery, removeFromGallery, setShowGalleryModal, clearGallery } =
    useAppStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const displayItems = gallery.slice(0, 10);

  const handleItemClick = useCallback(
    (id: string) => {
      loadFromGallery(id);
    },
    [loadFromGallery]
  );

  const handleDownload = useCallback((item: GalleryItem) => {
    const link = document.createElement('a');
    link.download = `${item.title || '画作'}.png`;
    link.href = item.thumbnail;
    link.click();
  }, []);

  const handleClear = useCallback(() => {
    clearGallery();
    setShowClearConfirm(false);
  }, [clearGallery]);

  return (
    <>
      <div style={styles.galleryBar}>
        <div style={styles.scrollArea}>
          {displayItems.map((item) => (
            <div
              key={item.id}
              style={styles.thumbWrap}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleItemClick(item.id)}
            >
              <img src={item.thumbnail} alt={item.title} style={styles.thumbImg} />
              {hoveredId === item.id && (
                <div style={styles.thumbOverlay}>
                  <span style={styles.thumbTitle}>{item.title}</span>
                </div>
              )}
            </div>
          ))}
          {gallery.length === 0 && (
            <div style={styles.emptyHint}>暂无收藏作品</div>
          )}
        </div>
        <button style={styles.viewAllBtn} onClick={() => setShowGalleryModal(true)}>
          查看全部
        </button>
      </div>

      {showGalleryModal && (
        <div style={styles.modalOverlay} onClick={() => setShowGalleryModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>我的画廊</h3>
              <div style={styles.modalActions}>
                <button style={styles.clearAllBtn} onClick={() => setShowClearConfirm(true)}>
                  清空全部
                </button>
                <button style={styles.closeBtn} onClick={() => setShowGalleryModal(false)}>
                  ✕
                </button>
              </div>
            </div>
            <div style={styles.masonryGrid}>
              {gallery.map((item) => (
                <div key={item.id} style={styles.masonryCard}>
                  <img src={item.thumbnail} alt={item.title} style={styles.masonryImg} />
                  <div style={styles.masonryInfo}>
                    <div style={styles.masonryTitle}>{item.title}</div>
                    {item.annotation && (
                      <div style={styles.masonryAnnotation}>{item.annotation}</div>
                    )}
                  </div>
                  <div style={styles.masonryActions}>
                    <button
                      style={styles.masonryBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                    >
                      下载
                    </button>
                    <button
                      style={styles.masonryBtnDanger}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromGallery(item.id);
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {gallery.length === 0 && (
              <div style={styles.modalEmpty}>画廊空空如也，快去创作吧</div>
            )}
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div style={styles.confirmOverlay} onClick={() => setShowClearConfirm(false)}>
          <div style={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <p style={styles.confirmText}>确定要清空所有收藏吗？此操作不可撤销。</p>
            <div style={styles.confirmBtns}>
              <button style={styles.confirmCancel} onClick={() => setShowClearConfirm(false)}>
                取消
              </button>
              <button style={styles.confirmOk} onClick={handleClear}>
                确定清空
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  galleryBar: {
    width: 768,
    height: 120,
    background: '#2c3e50',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: 8,
    overflow: 'hidden',
  },
  scrollArea: {
    flex: 1,
    display: 'flex',
    gap: 8,
    overflowX: 'auto' as const,
    overflowY: 'hidden',
    padding: '8px 0',
    scrollbarWidth: 'thin',
    scrollbarColor: '#4a6070 transparent',
  },
  thumbWrap: {
    position: 'relative' as const,
    width: 88,
    height: 88,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  thumbOverlay: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  thumbTitle: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center' as const,
    fontFamily: '"KaiTi", serif',
  },
  emptyHint: {
    color: '#6a8090',
    fontSize: 13,
    padding: '0 20px',
    whiteSpace: 'nowrap' as const,
  },
  viewAllBtn: {
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease',
  },
  modalContent: {
    background: '#fff',
    borderRadius: 16,
    width: '90vw',
    maxWidth: 900,
    maxHeight: '80vh',
    overflow: 'auto',
    padding: 24,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    color: '#333',
    fontFamily: '"Ma Shan Zheng", serif',
    fontWeight: 'normal',
  },
  modalActions: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  clearAllBtn: {
    background: 'none',
    border: '1px solid #e05050',
    color: '#e05050',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    color: '#999',
    cursor: 'pointer',
    padding: '0 4px',
  },
  masonryGrid: {
    columns: 3,
    columnGap: 16,
  },
  masonryCard: {
    breakInside: 'avoid' as const,
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid #eee',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    background: '#fff',
  },
  masonryImg: {
    width: '100%',
    display: 'block',
  },
  masonryInfo: {
    padding: '10px 12px',
  },
  masonryTitle: {
    fontSize: 14,
    color: '#333',
    fontFamily: '"KaiTi", serif',
  },
  masonryAnnotation: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  masonryActions: {
    display: 'flex',
    gap: 8,
    padding: '0 12px 10px',
  },
  masonryBtn: {
    flex: 1,
    background: '#f5f5f0',
    border: '1px solid #ddd',
    borderRadius: 6,
    padding: '4px 0',
    fontSize: 12,
    color: '#555',
    cursor: 'pointer',
  },
  masonryBtnDanger: {
    flex: 1,
    background: '#fff5f5',
    border: '1px solid #f0c0c0',
    borderRadius: 6,
    padding: '4px 0',
    fontSize: 12,
    color: '#c05050',
    cursor: 'pointer',
  },
  modalEmpty: {
    textAlign: 'center' as const,
    color: '#999',
    fontSize: 15,
    padding: '40px 0',
  },
  confirmOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    animation: 'fadeIn 0.2s ease',
  },
  confirmBox: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    maxWidth: 360,
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  confirmText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
    lineHeight: 1.6,
  },
  confirmBtns: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
  },
  confirmCancel: {
    background: '#f5f5f0',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: '8px 20px',
    fontSize: 14,
    color: '#666',
    cursor: 'pointer',
  },
  confirmOk: {
    background: '#c05050',
    border: 'none',
    borderRadius: 8,
    padding: '8px 20px',
    fontSize: 14,
    color: '#fff',
    cursor: 'pointer',
  },
};

export default GalleryBar;
