import React, { useState, useEffect } from 'react';
import { useStore, Gallery } from './store';

interface GalleryModuleProps {
  onOpenGallery: (gallery: Gallery) => void;
}

const GalleryModule: React.FC<GalleryModuleProps> = ({ onOpenGallery }) => {
  const { galleries, themes, fetchGalleries, fetchThemes, createGallery, updateGallery, deleteGallery, loading } = useStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [deletingGallery, setDeletingGallery] = useState<Gallery | null>(null);

  const [formName, setFormName] = useState('');
  const [formTheme, setFormTheme] = useState(0);

  useEffect(() => {
    fetchGalleries();
    fetchThemes();
  }, [fetchGalleries, fetchThemes]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  const openCreateModal = () => {
    setFormName('');
    setFormTheme(0);
    setShowCreateModal(true);
  };

  const openEditModal = (gallery: Gallery) => {
    setEditingGallery(gallery);
    setFormName(gallery.name);
    const idx = themes.findIndex((t) => t.name === gallery.themeName);
    setFormTheme(idx >= 0 ? idx : 0);
    setShowEditModal(true);
  };

  const openDeleteModal = (gallery: Gallery) => {
    setDeletingGallery(gallery);
    setShowDeleteModal(true);
  };

  const handleCreate = async () => {
    if (!formName.trim() || themes.length === 0) return;
    const theme = themes[formTheme];
    const result = await createGallery({
      name: formName.trim(),
      themeName: theme.name,
      themeColor: theme.color
    });
    if (result) {
      setShowCreateModal(false);
    }
  };

  const handleEdit = async () => {
    if (!editingGallery || !formName.trim() || themes.length === 0) return;
    const theme = themes[formTheme];
    const result = await updateGallery(editingGallery.id, {
      name: formName.trim(),
      themeName: theme.name,
      themeColor: theme.color
    });
    if (result) {
      setShowEditModal(false);
      setEditingGallery(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingGallery) return;
    const result = await deleteGallery(deletingGallery.id);
    if (result) {
      setShowDeleteModal(false);
      setDeletingGallery(null);
    }
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderStars = (rating: number) => {
    const full = Math.round(rating);
    return (
      <span className="rating-stars-static">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`star-static ${i <= full ? 'filled' : 'empty'}`}>
            ★
          </span>
        ))}
      </span>
    );
  };

  const ThemeModal = ({ isEdit }: { isEdit: boolean }) => (
    <div className="modal-overlay" onClick={() => {
      isEdit ? setShowEditModal(false) : setShowCreateModal(false);
      setEditingGallery(null);
    }}>
      <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '编辑画廊' : '创建画廊'}</h2>
          <button
            className="modal-close"
            onClick={() => {
              isEdit ? setShowEditModal(false) : setShowCreateModal(false);
              setEditingGallery(null);
            }}
          >
            ×
          </button>
        </div>
        <div className="form-group">
          <label className="form-label">画廊名称（限20字）</label>
          <input
            type="text"
            className="form-input"
            value={formName}
            onChange={(e) => setFormName(e.target.value.slice(0, 20))}
            placeholder="输入画廊名称"
            maxLength={20}
          />
          <div className="char-count">{formName.length}/20</div>
        </div>
        <div className="form-group">
          <label className="form-label">选择颜色主题</label>
          <div className="themes-grid">
            {themes.map((theme, idx) => (
              <div
                key={theme.name}
                className={`theme-option ${idx === formTheme ? 'selected' : ''}`}
                onClick={() => setFormTheme(idx)}
              >
                <div className="theme-swatch" style={{ background: theme.color }} />
                <span className="theme-name">{theme.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button
            className="btn-secondary"
            onClick={() => {
              isEdit ? setShowEditModal(false) : setShowCreateModal(false);
              setEditingGallery(null);
            }}
          >
            取消
          </button>
          <button
            className="btn-primary"
            onClick={isEdit ? handleEdit : handleCreate}
            disabled={!formName.trim()}
          >
            {isEdit ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">画廊列表</h1>
        <button className="btn-primary" onClick={openCreateModal}>
          + 创建画廊
        </button>
      </div>

      {loading && galleries.length === 0 ? (
        <div className="loading">加载中...</div>
      ) : galleries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎨</div>
          <div className="empty-state-text">还没有创建任何画廊，快来创建你的第一个虚拟展厅吧！</div>
          <button className="btn-primary" onClick={openCreateModal}>创建画廊</button>
        </div>
      ) : (
        <div className="galleries-grid">
          {galleries.map((gallery) => (
            <div
              key={gallery.id}
              className="gallery-card"
              style={{ borderLeft: `4px solid ${gallery.themeColor}` }}
              onClick={() => onOpenGallery(gallery)}
            >
              <div className="card-actions" onClick={stopPropagation}>
                <button
                  className="card-action-btn"
                  title="编辑"
                  onClick={() => openEditModal(gallery)}
                >
                  ✎
                </button>
                <button
                  className="card-action-btn delete"
                  title="删除"
                  onClick={() => openDeleteModal(gallery)}
                >
                  🗑
                </button>
              </div>
              <div className="gallery-card-header">
                <h3 className="gallery-name">{gallery.name}</h3>
              </div>
              <div className="theme-tag">
                <span className="theme-color-dot" style={{ background: gallery.themeColor }} />
                {gallery.themeName}
              </div>
              <div className="gallery-meta">
                <span className="gallery-date">{formatDate(gallery.createdAt)}</span>
                <div className="gallery-stats">
                  <span>🖼 {gallery.artworkCount || 0}</span>
                  <span title={gallery.averageRating?.toFixed(1)}>
                    {gallery.reviewCount! > 0 ? renderStars(gallery.averageRating || 0) : '—'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && <ThemeModal isEdit={false} />}
      {showEditModal && <ThemeModal isEdit={true} />}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => { setShowDeleteModal(false); setDeletingGallery(null); }}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">确认删除</h3>
            <p className="confirm-message">
              确定要删除画廊「<strong>{deletingGallery?.name}</strong>」吗？此操作将同时删除该画廊的所有艺术品和关联评论，且无法恢复。
            </p>
            <div className="form-actions" style={{ marginTop: 0 }}>
              <button
                className="btn-secondary"
                onClick={() => { setShowDeleteModal(false); setDeletingGallery(null); }}
              >
                取消
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryModule;
