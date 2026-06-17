import { useState } from 'react';
import { X, Trash2, Download, ChevronLeft, ChevronRight, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { GALLERY_PAGE_SIZE } from '@/types';
import type { Doodle } from '@/types';

export default function Gallery() {
  const {
    isGalleryOpen,
    setGalleryOpen,
    gallery,
    galleryPage,
    galleryTotal,
    setGalleryPage,
    loadDoodle,
    deleteDoodle,
    exportDoodle,
    currentDoodleId,
  } = useCanvasStore();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(galleryTotal / GALLERY_PAGE_SIZE));

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoodle(confirmDelete);
    } catch (err) {
      console.error('Delete failed:', err);
    }
    setConfirmDelete(null);
  };

  const handleCardContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setConfirmDelete(id);
  };

  return (
    <>
      <aside
        className={`gallery-drawer ${isGalleryOpen ? 'open' : ''}`}
      >
        <div className="gallery-header">
          <h3 className="gallery-title">
            <ImageIcon size={18} />
            画廊
            <span className="gallery-count">{galleryTotal}</span>
          </h3>
          <button
            className="gallery-close"
            onClick={() => setGalleryOpen(false)}
            title="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="gallery-body">
          {gallery.length === 0 ? (
            <div className="gallery-empty">
              <ImageIcon size={40} />
              <p>暂无作品</p>
              <span>完成创作后点击保存，作品将在此展示</span>
            </div>
          ) : (
            <div className="gallery-grid">
              {gallery.map((d: Doodle) => (
                <div
                  key={d.id}
                  className={`gallery-card ${currentDoodleId === d.id ? 'active' : ''}`}
                  onClick={() => loadDoodle(d.id)}
                  onContextMenu={(e) => handleCardContextMenu(e, d.id)}
                  title="点击加载到画布 · 右键删除"
                >
                  <div className="thumb-wrap">
                    {d.thumbnail ? (
                      <img src={d.thumbnail} alt={d.name} className="thumb-img" />
                    ) : (
                      <div className="thumb-empty" />
                    )}
                    <div className="card-overlay">
                      <div className="card-actions">
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            void exportDoodle(d.id);
                          }}
                          title="导出 JSON"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="action-btn danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(d.id);
                          }}
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card-info">
                    <div className="card-name" title={d.name}>{d.name}</div>
                    <div className="card-date">{formatDate(d.updatedAt)}</div>
                    <div className="card-meta">{d.strokes.length} 笔触</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {galleryTotal > GALLERY_PAGE_SIZE && (
          <div className="gallery-pagination">
            <button
              className="page-btn"
              disabled={galleryPage <= 1}
              onClick={() => void setGalleryPage(galleryPage - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="page-info">
              {galleryPage} / {totalPages}
            </span>
            <button
              className="page-btn"
              disabled={galleryPage >= totalPages}
              onClick={() => void setGalleryPage(galleryPage + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </aside>

      <div
        className={`gallery-backdrop ${isGalleryOpen ? 'visible' : ''}`}
        onClick={() => setGalleryOpen(false)}
      />

      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <AlertTriangle size={28} />
            </div>
            <h4 className="modal-title">确认删除作品？</h4>
            <p className="modal-desc">此操作不可撤销，删除后将无法恢复。</p>
            <div className="modal-actions">
              <button
                className="modal-btn secondary"
                onClick={() => setConfirmDelete(null)}
              >
                取消
              </button>
              <button
                className="modal-btn danger"
                onClick={() => void handleConfirmDelete()}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .gallery-drawer {
          position: fixed;
          top: 56px;
          right: 0;
          bottom: 0;
          width: 320px;
          background: #16213E;
          z-index: 90;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          border-left: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: -8px 0 30px rgba(0, 0, 0, 0.3);
        }
        .gallery-drawer.open {
          transform: translateX(0);
        }
        .gallery-backdrop {
          position: fixed;
          top: 56px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.35);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 80;
        }
        .gallery-backdrop.visible {
          opacity: 1;
          pointer-events: auto;
        }
        .gallery-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }
        .gallery-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }
        .gallery-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 20px;
          padding: 0 7px;
          font-size: 11px;
          font-weight: 600;
          color: #5eead4;
          background: rgba(94, 234, 212, 0.15);
          border-radius: 10px;
        }
        .gallery-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
        }
        .gallery-close:hover {
          transform: scale(1.05);
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }
        .gallery-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .gallery-body::-webkit-scrollbar {
          width: 6px;
        }
        .gallery-body::-webkit-scrollbar-track {
          background: transparent;
        }
        .gallery-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .gallery-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
        }
        .gallery-empty p {
          margin: 14px 0 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
        }
        .gallery-empty span {
          font-size: 12px;
          line-height: 1.6;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .gallery-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .gallery-card:hover {
          transform: scale(1.05);
          border-color: rgba(94, 234, 212, 0.35);
          box-shadow: 0 8px 24px rgba(94, 234, 212, 0.12);
          z-index: 2;
        }
        .gallery-card.active {
          border-color: rgba(94, 234, 212, 0.6);
          box-shadow: 0 0 0 2px rgba(94, 234, 212, 0.2);
        }
        .thumb-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 100 / 80;
          background: #1A1A2E;
          overflow: hidden;
        }
        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .thumb-empty {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #1A1A2E, #0f1530);
        }
        .card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%);
          opacity: 0;
          transition: opacity 0.25s ease;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          padding: 8px;
        }
        .gallery-card:hover .card-overlay {
          opacity: 1;
        }
        .card-actions {
          display: flex;
          gap: 6px;
        }
        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          color: #fff;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .action-btn:hover {
          transform: scale(1.08);
          background: rgba(255, 255, 255, 0.32);
        }
        .action-btn.danger:hover {
          background: rgba(239, 68, 68, 0.7);
        }
        .card-info {
          padding: 8px 10px;
        }
        .card-name {
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }
        .card-date {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 2px;
          font-family: 'Outfit', monospace;
        }
        .card-meta {
          font-size: 10px;
          color: rgba(94, 234, 212, 0.65);
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
        }
        .gallery-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 14px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }
        .page-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.75);
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
        }
        .page-btn:hover:not(:disabled) {
          transform: scale(1.05);
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .page-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .page-info {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          min-width: 50px;
          text-align: center;
        }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal {
          width: 320px;
          background: linear-gradient(180deg, #1a2244, #16213E);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 28px 24px;
          text-align: center;
          animation: modalIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        @keyframes modalIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .modal-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          margin-bottom: 16px;
        }
        .modal-title {
          margin: 0 0 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #fff;
        }
        .modal-desc {
          margin: 0 0 22px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.6;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
        }
        .modal-btn {
          flex: 1;
          padding: 10px 16px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 500;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .modal-btn:hover {
          transform: translateY(-1px);
        }
        .modal-btn.secondary {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.8);
        }
        .modal-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.14);
        }
        .modal-btn.danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
        }
        .modal-btn.danger:hover {
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
        }
      `}</style>
    </>
  );
}
