import { useState, useRef, useEffect } from 'react';
import type { Shot } from '../api';
import { shotApi } from '../api';
import '../styles/shotboard.css';

interface ShotEditorProps {
  shot: Shot;
  onClose: () => void;
  onSave: (data: Partial<Shot>) => Promise<void>;
}

function ShotEditor({ shot, onClose, onSave }: ShotEditorProps) {
  const [duration, setDuration] = useState(shot.duration);
  const [description, setDescription] = useState(shot.description);
  const [imageUrl, setImageUrl] = useState(shot.imageUrl);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        duration: Math.max(0.5, duration),
        description: description.slice(0, 200),
        imageUrl,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('图片大小不能超过5MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const result = await shotApi.uploadImage(reader.result as string, file.name);
          setImageUrl(result.imageUrl);
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : '上传失败');
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError('文件读取失败');
        setUploading(false);
      };
    } catch (err) {
      setUploadError('上传失败');
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
  };

  return (
    <div className="modal-overlay editor-overlay" onClick={onClose}>
      <div
        className="modal-content editor-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="editor-header">
          <h2 className="modal-title">编辑镜头 #{shot.shotIndex + 1}</h2>
          <button className="editor-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="editor-form">
          <div className="form-group">
            <label className="form-label">时长（秒）</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              className="form-input"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value) || 0.5)}
            />
            <span className="form-hint">最小 0.5 秒</span>
          </div>

          <div className="form-group">
            <label className="form-label">描述文字</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="输入镜头描述..."
              rows={4}
              maxLength={200}
            />
            <span className="form-hint">{description.length}/200</span>
          </div>

          <div className="form-group">
            <label className="form-label">缩略图</label>
            {imageUrl ? (
              <div className="image-preview-wrapper">
                <img src={imageUrl} alt="缩略图" className="image-preview" />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={handleRemoveImage}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                className="upload-area"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="uploading">
                    <div className="spinner"></div>
                    <span>上传中...</span>
                  </div>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p>点击或拖拽上传图片</p>
                    <span>支持 JPG、PNG，最大 5MB</span>
                  </>
                )}
              </div>
            )}
            {uploadError && <div className="upload-error">{uploadError}</div>}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="file-input-hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShotEditor;
