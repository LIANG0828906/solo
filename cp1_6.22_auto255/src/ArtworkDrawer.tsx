import { useState, useEffect, useCallback } from 'react';
import { Artwork } from './types';

interface ArtworkDrawerProps {
  exhibitionId: string;
  existingArtworkIds: string[];
  onClose: () => void;
  onAdded: () => void;
}

function ArtworkDrawer({ exhibitionId, existingArtworkIds, onClose, onAdded }: ArtworkDrawerProps) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch('/api/artworks')
      .then(res => res.json())
      .then(data => setArtworks(data))
      .catch(err => console.error('获取藏品列表失败:', err));
  }, []);

  const filteredArtworks = artworks.filter(
    a => !existingArtworkIds.includes(a.id) &&
      (a.name.includes(searchTerm) || a.code.includes(searchTerm))
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredArtworks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredArtworks.map(a => a.id)));
    }
  }, [filteredArtworks, selectedIds.size]);

  const handleConfirm = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/exhibitions/${exhibitionId}/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ artworkIds: Array.from(selectedIds) })
      });

      if (response.ok) {
        onAdded();
      }
    } catch (error) {
      console.error('添加展品失败:', error);
    } finally {
      setAdding(false);
    }
  }, [selectedIds, exhibitionId, onAdded]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <div className="drawer-overlay" onClick={handleBackdropClick}>
      <div className="drawer-content">
        <div className="drawer-header">
          <h2>藏品列表</h2>
          <button className="drawer-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="drawer-search">
          <input
            type="text"
            className="form-input"
            placeholder="搜索藏品名称或编号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="drawer-select-all">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filteredArtworks.length > 0 && selectedIds.size === filteredArtworks.length}
              onChange={handleSelectAll}
            />
            <span className="checkbox-custom"></span>
            全选 ({filteredArtworks.length} 件)
          </label>
          <span className="selected-count">已选 {selectedIds.size} 件</span>
        </div>

        <div className="drawer-artwork-list">
          {filteredArtworks.map((artwork) => (
            <div
              key={artwork.id}
              className={`artwork-row ${selectedIds.has(artwork.id) ? 'selected' : ''}`}
              onClick={() => toggleSelect(artwork.id)}
            >
              <div className={`check-icon ${selectedIds.has(artwork.id) ? 'show' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="20" height="20">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="artwork-thumb">
                <img src={artwork.thumbnail} alt={artwork.name} />
              </div>
              <div className="artwork-row-info">
                <div className="artwork-row-name">{artwork.name}</div>
                <div className="artwork-row-code">{artwork.code}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="drawer-footer">
          <button className="btn-cancel" onClick={onClose}>
            取消
          </button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={selectedIds.size === 0 || adding}
          >
            {adding ? '添加中...' : `添加 ${selectedIds.size} 件展品`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArtworkDrawer;
