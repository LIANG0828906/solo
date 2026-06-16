import { useState } from 'react';
import { Artwork } from '@/data/types';
import { EventBus } from '@/data/EventBus';
import { X, Trash2, Plus } from 'lucide-react';

interface DetailModalProps {
  artwork: Artwork;
  eventBus: EventBus;
  onClose: () => void;
}

export default function DetailModal({ artwork, eventBus, onClose }: DetailModalProps) {
  const [currentArtwork, setCurrentArtwork] = useState<Artwork>(artwork);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showNewTagField, setShowNewTagField] = useState<'colorTags' | 'styleTags' | 'keywords' | null>(null);

  const getTagArray = (artwork: Artwork, key: 'colorTags' | 'styleTags' | 'keywords'): string[] => {
    return artwork[key];
  };

  const handleDeleteTag = (key: 'colorTags' | 'styleTags' | 'keywords', tag: string) => {
    const arr = getTagArray(currentArtwork, key).filter((t) => t !== tag);
    const updated = { ...currentArtwork, [key]: arr };
    setCurrentArtwork(updated);
    eventBus.emit('edit', { id: updated.id, updates: { [key]: arr } });
  };

  const handleAddTag = () => {
    if (!newTagInput.trim() || !showNewTagField) return;
    const key = showNewTagField;
    const arr = getTagArray(currentArtwork, key);
    if (arr.includes(newTagInput.trim())) {
      setNewTagInput('');
      return;
    }
    const newArr = [...arr, newTagInput.trim()];
    const updated = { ...currentArtwork, [key]: newArr };
    setCurrentArtwork(updated);
    eventBus.emit('edit', { id: updated.id, updates: { [key]: newArr } });
    setNewTagInput('');
    setShowNewTagField(null);
  };

  const handleDelete = () => {
    eventBus.emit('delete', currentArtwork.id);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-image-wrapper">
          <img src={currentArtwork.imageUrl} alt={currentArtwork.title} className="modal-image" />
        </div>

        <div className="modal-body">
          <h2 className="modal-title">{currentArtwork.title}</h2>
          <p className="modal-date">{formatDate(currentArtwork.createdAt)}</p>

          <div className="modal-tags-section">
            <div className="modal-tag-group">
              <span className="modal-tag-label">颜色</span>
              <div className="modal-tag-list">
                {currentArtwork.colorTags.map((color) => (
                  <span key={color} className="modal-color-tag">
                    <span className="modal-color-block" style={{ backgroundColor: color }} />
                    {color}
                    {isEditing && (
                      <button className="tag-remove-btn" onClick={() => handleDeleteTag('colorTags', color)}>
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && showNewTagField !== 'colorTags' && (
                  <button className="tag-add-btn" onClick={() => setShowNewTagField('colorTags')}>
                    <Plus size={12} />
                  </button>
                )}
                {isEditing && showNewTagField === 'colorTags' && (
                  <input
                    className="tag-input"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    onBlur={() => { setShowNewTagField(null); setNewTagInput(''); }}
                    placeholder="输入颜色值"
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="modal-tag-group">
              <span className="modal-tag-label">风格</span>
              <div className="modal-tag-list">
                {currentArtwork.styleTags.map((style) => (
                  <span key={style} className="modal-pill-tag">
                    {style}
                    {isEditing && (
                      <button className="tag-remove-btn" onClick={() => handleDeleteTag('styleTags', style)}>
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && showNewTagField !== 'styleTags' && (
                  <button className="tag-add-btn" onClick={() => setShowNewTagField('styleTags')}>
                    <Plus size={12} />
                  </button>
                )}
                {isEditing && showNewTagField === 'styleTags' && (
                  <input
                    className="tag-input"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    onBlur={() => { setShowNewTagField(null); setNewTagInput(''); }}
                    placeholder="输入风格"
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="modal-tag-group">
              <span className="modal-tag-label">关键词</span>
              <div className="modal-tag-list">
                {currentArtwork.keywords.map((kw) => (
                  <span key={kw} className="modal-pill-tag">
                    {kw}
                    {isEditing && (
                      <button className="tag-remove-btn" onClick={() => handleDeleteTag('keywords', kw)}>
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && showNewTagField !== 'keywords' && (
                  <button className="tag-add-btn" onClick={() => setShowNewTagField('keywords')}>
                    <Plus size={12} />
                  </button>
                )}
                {isEditing && showNewTagField === 'keywords' && (
                  <input
                    className="tag-input"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    onBlur={() => { setShowNewTagField(null); setNewTagInput(''); }}
                    placeholder="输入关键词后回车"
                    autoFocus
                  />
                )}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              className={`action-btn ${isEditing ? 'active' : ''}`}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? '完成编辑' : '编辑标签'}
            </button>
            <button className="action-btn danger" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={16} />
              删除作品
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <p className="confirm-text">确定要删除「{currentArtwork.title}」吗？</p>
              <p className="confirm-sub">此操作无法撤销</p>
              <div className="confirm-actions">
                <button className="confirm-cancel" onClick={() => setShowDeleteConfirm(false)}>
                  取消
                </button>
                <button className="confirm-delete" onClick={handleDelete}>
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
