import { useEffect, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { storageManager } from '../modules/storageManager';
import type { Doodle } from '../types';

export default function Gallery() {
  const {
    isGalleryOpen,
    setGalleryOpen,
    doodles,
    setDoodles,
    appendDoodles,
    deleteDoodle,
    loadDoodle,
    galleryPage,
    setGalleryPage,
    galleryPageSize,
    currentDoodleId
  } = useCanvasStore();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [cssInjected, setCssInjected] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (cssInjected) return;
    const css = `
      @keyframes fs-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .fs-spinner {
        width: 32px; height: 32px;
        border: 3px solid rgba(78,205,196,0.2);
        border-top-color: #4ECDC4;
        border-radius: 50%;
        animation: fs-spin 0.8s linear infinite;
      }
      .fs-gallery-card {
        border-radius: 8px;
        background: rgba(255,255,255,0.04);
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
        border: 2px solid transparent;
      }
      .fs-gallery-card:hover {
        transform: scale(1.05);
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        z-index: 2;
      }
      .fs-gallery-card.active {
        border-color: #4ECDC4;
      }
      .fs-card-actions {
        position: absolute;
        top: 6px; left: 6px;
        display: flex; gap: 4px;
        opacity: 0;
        transition: opacity 0.25s ease;
        z-index: 3;
      }
      .fs-gallery-card:hover .fs-card-actions {
        opacity: 1;
      }
      .fs-icon-btn {
        width: 28px; height: 28px;
        border-radius: 6px; border: none;
        background: rgba(0,0,0,0.75);
        color: #fff; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(6px);
        transition: all 0.2s ease;
      }
      .fs-icon-btn:hover {
        background: rgba(0,0,0,0.9);
        transform: scale(1.1);
      }
      .fs-icon-btn.danger:hover {
        background: rgba(255, 107, 107, 0.85);
      }
      .fs-close-btn {
        width: 32px; height: 32px;
        border-radius: 8px; border: none;
        background: rgba(255,255,255,0.08);
        color: #fff; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s ease;
      }
      .fs-close-btn:hover {
        background: rgba(255,255,255,0.18);
        transform: rotate(90deg);
      }
      .fs-page-btn {
        width: 32px; height: 32px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.06);
        color: #fff; cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      }
      .fs-page-btn:hover:not(:disabled) {
        background: rgba(78,205,196,0.2);
        border-color: #4ECDC4;
        transform: scale(1.08);
      }
      .fs-page-btn:disabled {
        opacity: 0.4; cursor: not-allowed;
      }
      .fs-cancel-btn {
        flex: 1; padding: 10px 16px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.06);
        color: #fff; font-size: 13px;
        font-weight: 500; cursor: pointer;
        transition: all 0.2s ease;
      }
      .fs-cancel-btn:hover {
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.25);
      }
      .fs-confirm-btn {
        flex: 1; padding: 10px 16px;
        border-radius: 8px; border: none;
        background: linear-gradient(135deg, #FF6B6B, #FF8C42);
        color: #fff; font-size: 13px;
        font-weight: 600; cursor: pointer;
        transition: all 0.2s ease;
      }
      .fs-confirm-btn:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(255, 107, 107, 0.4);
      }
      .fs-load-more-btn {
        padding: 10px 20px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(78, 205, 196, 0.1);
        color: #fff;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .fs-load-more-btn:hover:not(:disabled) {
        background: rgba(78, 205, 196, 0.25);
        border-color: #4ECDC4;
        transform: translateY(-1px);
      }
      .fs-load-more-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .fs-pagination-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 8px 16px 4px;
      }
    `;
    const style = document.createElement('style');
    style.setAttribute('data-fs-gallery', 'true');
    style.textContent = css;
    document.head.appendChild(style);
    setCssInjected(true);
  }, [cssInjected]);

  useEffect(() => {
    if (!isGalleryOpen) return;

    const load = async () => {
      try {
        if (galleryPage === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const { doodles: pageData, total } = await storageManager.getDoodlesPaged(galleryPage, galleryPageSize);
        setTotalCount(total);
        setHasMore(galleryPage * galleryPageSize < total);

        if (galleryPage === 1) {
          setDoodles(pageData);
        } else {
          appendDoodles(pageData);
        }
      } catch (e) {
        console.error('Load gallery failed:', e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    load();
  }, [isGalleryOpen, galleryPage, galleryPageSize, setDoodles, appendDoodles]);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await storageManager.deleteDoodle(deleteConfirmId);
      deleteDoodle(deleteConfirmId);
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Delete doodle failed:', e);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleLoad = (doodle: Doodle) => {
    loadDoodle(doodle);
    setGalleryOpen(false);
  };

  const handleExport = async (e: React.MouseEvent, doodle: Doodle) => {
    e.stopPropagation();
    try {
      setExporting(true);
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = doodle.width;
      exportCanvas.height = doodle.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#1A1A2E';
      ctx.fillRect(0, 0, doodle.width, doodle.height);
      for (const stroke of doodle.strokes) {
        const modeMap: Record<string, GlobalCompositeOperation> = {
          normal: 'source-over',
          multiply: 'multiply',
          screen: 'screen',
          overlay: 'overlay'
        };
        ctx.globalCompositeOperation = modeMap[stroke.blendMode] || 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.fillStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (stroke.points.length === 1) {
          const p = stroke.points[0];
          ctx.beginPath();
          ctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        if (stroke.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const p = stroke.points[i];
          const next = stroke.points[i + 1];
          ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
        }
        const last = stroke.points[stroke.points.length - 1];
        const secondLast = stroke.points[stroke.points.length - 2];
        ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${doodle.name.replace(/[^\w\u4e00-\u9fa5]/g, '_')}.png`;
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / galleryPageSize));
  const startIdx = (galleryPage - 1) * galleryPageSize;
  const pagedDoodles = doodles.slice(startIdx, startIdx + galleryPageSize);

  return (
    <>
      <div
        style={{
          ...styles.overlay,
          opacity: isGalleryOpen ? 1 : 0,
          pointerEvents: isGalleryOpen ? 'auto' : 'none'
        }}
        onClick={() => setGalleryOpen(false)}
      />
      <div style={{ ...styles.drawer, transform: isGalleryOpen ? 'translateX(0)' : 'translateX(100%)' }}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>画廊</span>
            <span style={styles.countBadge}>{totalCount}</span>
          </div>
          <button className="fs-close-btn" onClick={() => setGalleryOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.emptyState}>
              <div className="fs-spinner" style={{ marginBottom: 16 }} />
              <p>加载中...</p>
            </div>
          ) : pagedDoodles.length === 0 ? (
            <div style={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>暂无作品</p>
              <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>在画布上绘制你的第一幅涂鸦吧</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {pagedDoodles.map((doodle) => (
                <div
                  key={doodle.id}
                  className={`fs-gallery-card ${doodle.id === currentDoodleId ? 'active' : ''}`}
                  onClick={() => handleLoad(doodle)}
                  onContextMenu={(e) => handleDeleteClick(e, doodle.id)}
                >
                  <div className="fs-card-actions">
                    <button
                      className="fs-icon-btn"
                      title="导出 PNG"
                      disabled={exporting}
                      onClick={(e) => handleExport(e, doodle)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                    <button
                      className="fs-icon-btn danger"
                      title="删除 (右键缩略图)"
                      onClick={(e) => handleDeleteClick(e, doodle.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  <div style={styles.thumbWrapper}>
                    <img src={doodle.thumbnail} alt={doodle.name} style={styles.thumbnail} draggable={false} />
                    {doodle.id === currentDoodleId && (
                      <div style={styles.activeBadge}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div style={styles.cardInfo}>
                    <div style={styles.cardName} title={doodle.name}>
                      {doodle.name}
                    </div>
                    <div style={styles.cardMeta}>
                      {doodle.strokes.length} 笔 · {new Date(doodle.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalCount > 0 && (
          <div style={styles.paginationWrapper}>
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  className="fs-page-btn"
                  disabled={galleryPage <= 1 || loadingMore}
                  onClick={() => setGalleryPage(galleryPage - 1)}
                >
                  ←
                </button>
                <span style={styles.pageLabel}>
                  {galleryPage} / {totalPages}
                </span>
                <button
                  className="fs-page-btn"
                  disabled={galleryPage >= totalPages || loadingMore}
                  onClick={() => setGalleryPage(galleryPage + 1)}
                >
                  →
                </button>
              </div>
            )}
            <div className="fs-pagination-row">
              <button
                className="fs-load-more-btn"
                disabled={!hasMore || loadingMore || loading}
                onClick={() => setGalleryPage(galleryPage + 1)}
              >
                {loadingMore ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'fs-spin 0.8s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    加载中...
                  </span>
                ) : hasMore ? (
                  '加载更多'
                ) : (
                  '已加载全部'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteConfirmId && (
        <div style={styles.modalOverlay} onClick={() => setDeleteConfirmId(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 style={styles.modalTitle}>确认删除</h3>
            <p style={styles.modalText}>删除后无法恢复，确定要删除这幅涂鸦吗？</p>
            <div style={styles.modalActions}>
              <button className="fs-cancel-btn" onClick={() => setDeleteConfirmId(null)}>
                取消
              </button>
              <button className="fs-confirm-btn" onClick={confirmDelete}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1500,
    transition: 'opacity 0.3s ease'
  },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 320,
    background: '#16213E',
    zIndex: 1600,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '-8px 0 32px rgba(0,0,0,0.4)'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    color: '#fff'
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 16,
    fontWeight: 600
  },
  countBadge: {
    marginLeft: 8,
    padding: '2px 8px',
    borderRadius: 10,
    background: 'rgba(78, 205, 196, 0.2)',
    color: '#4ECDC4',
    fontSize: 11,
    fontWeight: 600
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: 16
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.5)',
    padding: '60px 20px',
    textAlign: 'center'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12
  },
  thumbWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '5 / 4',
    background: '#1A1A2E',
    overflow: 'hidden'
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    userSelect: 'none'
  },
  activeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: '#4ECDC4',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
    zIndex: 1
  },
  cardInfo: {
    padding: '10px 12px',
    borderTop: '1px solid rgba(255,255,255,0.06)'
  },
  cardName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  cardMeta: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2
  },
  paginationWrapper: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: 12
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '12px 16px 4px',
    color: '#fff'
  },
  pageLabel: {
    fontSize: 12,
    opacity: 0.7
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modal: {
    width: 320,
    borderRadius: 12,
    background: '#16213E',
    padding: 24,
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    textAlign: 'center'
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(255, 107, 107, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#fff',
    marginBottom: 8
  },
  modalText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
    lineHeight: 1.5
  },
  modalActions: {
    display: 'flex',
    gap: 10
  }
};
