import { useState, useEffect, useRef } from 'react';
import { X, Edit2, Trash2, Calendar, ZoomIn } from 'lucide-react';
import { useExhibitStore } from '../store';
import './ExhibitModal.css';

function ExhibitModal() {
  const { isModalOpen, selectedExhibit, closeModal, openForm, removeExhibit, toggleTag } = useExhibitStore();
  const [imageError, setImageError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isImageZoomed) {
          setIsImageZoomed(false);
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          closeModal();
        }
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [closeModal, isImageZoomed, showDeleteConfirm]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (showDeleteConfirm) {
        setShowDeleteConfirm(false);
      } else {
        closeModal();
      }
    }
  };

  const handleEdit = () => {
    if (selectedExhibit) {
      openForm(selectedExhibit);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedExhibit) {
      await removeExhibit(selectedExhibit.id);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isModalOpen || !selectedExhibit) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container" ref={modalRef}>
        <button className="modal-close-btn" onClick={closeModal} aria-label="关闭">
          <X size={20} />
        </button>

        <div className="modal-content">
          <div className="modal-image-section">
            <div
              className={`modal-image-wrapper ${isImageZoomed ? 'zoomed' : ''}`}
              onClick={() => !imageError && setIsImageZoomed(!isImageZoomed)}
            >
              {imageError ? (
                <div className="modal-placeholder">
                  <ZoomIn size={48} className="placeholder-icon-large" />
                  <span>暂无图片</span>
                </div>
              ) : (
                <>
                  <img
                    src={selectedExhibit.imageUrl}
                    alt={selectedExhibit.title}
                    className="modal-image"
                    onError={() => setImageError(true)}
                  />
                  <div className="zoom-hint">
                    <ZoomIn size={16} />
                    <span>点击放大</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="modal-info-section">
            <h2 className="modal-title">{selectedExhibit.title}</h2>

            <div className="modal-date">
              <Calendar size={16} />
              <span>{formatDate(selectedExhibit.createdAt)}</span>
            </div>

            <p className="modal-description">{selectedExhibit.description}</p>

            <div className="modal-tags-section">
              <h4 className="modal-section-label">标签</h4>
              <div className="modal-tags">
                {selectedExhibit.tags.map((tag) => (
                  <button
                    key={tag}
                    className="modal-tag"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTag(tag);
                      closeModal();
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleEdit}>
                <Edit2 size={18} />
                <span>编辑</span>
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={18} />
                <span>删除</span>
              </button>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-content">
              <h3 className="confirm-title">确认删除</h3>
              <p className="confirm-message">确定要删除这件展品吗？此操作无法撤销。</p>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  取消
                </button>
                <button className="btn btn-danger" onClick={confirmDelete}>
                  删除
                </button>
              </div>
            </div>
          </div>
        )}

        {isImageZoomed && !imageError && (
          <div className="image-zoom-overlay" onClick={() => setIsImageZoomed(false)}>
            <img src={selectedExhibit.imageUrl} alt={selectedExhibit.title} className="zoomed-image" />
            <button className="zoom-close-btn" onClick={() => setIsImageZoomed(false)}>
              <X size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExhibitModal;
