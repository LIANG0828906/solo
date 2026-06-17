import React, { useState } from 'react';
import { useStore, Artwork } from './store';

interface ArtworkModuleProps {
  galleryId: string;
  galleryName: string;
}

const ArtworkModule: React.FC<ArtworkModuleProps> = ({ galleryId, galleryName }) => {
  const { artworks, createArtwork } = useStore();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const galleryArtworks = artworks.filter((a) => a.galleryId === galleryId);

  const openUploadModal = () => {
    setFormTitle('');
    setFormArtist('');
    setFormImageUrl('');
    setFormDescription('');
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (!formTitle.trim() || !formArtist.trim()) return;
    const result = await createArtwork({
      galleryId,
      title: formTitle.trim(),
      artist: formArtist.trim(),
      imageUrl: formImageUrl.trim() || undefined,
      description: formDescription.trim() || undefined
    });
    if (result) {
      setShowUploadModal(false);
    }
  };

  return (
    <div className="artworks-section">
      <div className="section-header">
        <h2 className="section-title">展厅作品（{galleryArtworks.length}）</h2>
        <button className="btn-primary" onClick={openUploadModal}>
          + 上传艺术品
        </button>
      </div>

      {galleryArtworks.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">🖼️</div>
          <div className="empty-state-text">这个展厅还没有艺术品，快来上传吧！</div>
          <button className="btn-primary" onClick={openUploadModal}>上传艺术品</button>
        </div>
      ) : (
        <div className="artworks-grid">
          {galleryArtworks.map((artwork) => (
            <div
              key={artwork.id}
              className="artwork-item"
              onClick={() => setSelectedArtwork(artwork)}
            >
              <div className="artwork-thumbnail">
                <img src={artwork.imageUrl} alt={artwork.title} loading="lazy" />
              </div>
              <div className="artwork-info">
                <div className="artwork-title" title={artwork.title}>{artwork.title}</div>
                <div className="artwork-meta">
                  <span>{artwork.artist}</span>
                  <span className="booth-badge">{artwork.boothNumber}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">上传艺术品到「{galleryName}」</h2>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">作品标题（限30字）</label>
              <input
                type="text"
                className="form-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value.slice(0, 30))}
                placeholder="输入作品标题"
                maxLength={30}
              />
              <div className="char-count">{formTitle.length}/30</div>
            </div>
            <div className="form-group">
              <label className="form-label">作者</label>
              <input
                type="text"
                className="form-input"
                value={formArtist}
                onChange={(e) => setFormArtist(e.target.value)}
                placeholder="输入作者姓名"
              />
            </div>
            <div className="form-group">
              <label className="form-label">图片URL（可选，留空将使用随机图片）</label>
              <input
                type="text"
                className="form-input"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="form-group">
              <label className="form-label">作品描述（可选）</label>
              <textarea
                className="form-textarea"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="输入作品描述"
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowUploadModal(false)}>取消</button>
              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={!formTitle.trim() || !formArtist.trim()}
              >
                上传
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedArtwork && (
        <div className="modal-overlay" onClick={() => setSelectedArtwork(null)}>
          <div className="modal artwork-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">作品详情</h2>
              <button className="modal-close" onClick={() => setSelectedArtwork(null)}>×</button>
            </div>
            <img
              src={selectedArtwork.imageUrl}
              alt={selectedArtwork.title}
              className="artwork-large-image"
            />
            <h3 className="artwork-detail-title">{selectedArtwork.title}</h3>
            <div className="artwork-detail-meta">
              <span>作者：{selectedArtwork.artist}</span>
              <span>展位：<span className="booth-badge">{selectedArtwork.boothNumber}</span></span>
            </div>
            {selectedArtwork.description && (
              <div className="artwork-description">{selectedArtwork.description}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtworkModule;
