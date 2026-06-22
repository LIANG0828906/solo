import React, { useState, useEffect } from 'react';
import { Inspiration, InspirationStatus, PRESET_TAGS, PRESET_STATUSES, TAG_COLORS } from '../types';
import { updateInspiration, deleteInspiration, createInspiration } from '../api';

interface InspirationDetailProps {
  inspiration: Inspiration | null;
  isNew?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const InspirationDetail: React.FC<InspirationDetailProps> = ({
  inspiration,
  isNew = false,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<InspirationStatus>('进行中');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (inspiration) {
      setTitle(inspiration.title);
      setContent(inspiration.content);
      setTags(inspiration.tags);
      setStatus(inspiration.status);
      setImages(inspiration.images || []);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setStatus('进行中');
      setImages([]);
    }
  }, [inspiration]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const data = { title, content, tags, status, images };
      if (isNew) {
        await createInspiration(data);
      } else if (inspiration) {
        await updateInspiration(inspiration.id, data);
      }
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!inspiration || !confirm('确定要删除这条灵感吗？')) return;
    try {
      await deleteInspiration(inspiration.id);
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
            {isNew ? '新建灵感' : '编辑灵感'}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给灵感起个标题..."
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label className="form-label">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="记录你的创意想法..."
              rows={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">标签</label>
            <div className="tag-editor">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-option ${tags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                  style={
                    tags.includes(tag)
                      ? {
                          backgroundColor: TAG_COLORS[tag]
                            ? `${TAG_COLORS[tag]}25`
                            : undefined,
                          borderColor: TAG_COLORS[tag] || undefined,
                          color: TAG_COLORS[tag] || undefined,
                        }
                      : undefined
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">状态</label>
            <div className="status-selector">
              {PRESET_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`status-option ${status === s ? 'selected' : ''}`}
                  onClick={() => setStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">图片附件</label>
            {images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      width: '80px',
                      height: '80px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={img}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        fontSize: '12px',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="输入图片URL..."
                style={{ flex: 1 }}
              />
              <button type="button" onClick={handleAddImage}>
                添加
              </button>
            </div>
          </div>

          <div className="modal-actions">
            {!isNew && (
              <button type="button" className="btn-danger" onClick={handleDelete}>
                删除
              </button>
            )}
            <button type="button" onClick={onClose}>
              取消
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || !title.trim() || !content.trim()}
              style={{
                opacity: saving || !title.trim() || !content.trim() ? 0.6 : 1,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspirationDetail;
