import React, { useState, useCallback, useRef } from 'react';
import { useGalleryStore } from '@/store';
import { COLORS, ANIMATION } from '@/shared/styles';
import { X, Upload, Link } from 'lucide-react';

export default function WorkUploadModal() {
  const showWorkUpload = useGalleryStore((s) => s.showWorkUpload);
  const setShowWorkUpload = useGalleryStore((s) => s.setShowWorkUpload);
  const addWork = useGalleryStore((s) => s.addWork);

  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setImageUrl('');
    setTitle('');
    setDescription('');
    setPreviewUrl('');
    setError('');
    setIsDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    setShowWorkUpload(null);
    resetForm();
  }, [setShowWorkUpload, resetForm]);

  const validateUrl = (url: string): boolean => {
    return /^https?:\/\/.+\..+/.test(url);
  };

  const handleUrlSubmit = useCallback(() => {
    if (!imageUrl.trim()) {
      setError('请输入图片URL');
      return;
    }
    if (!validateUrl(imageUrl.trim())) {
      setError('请输入有效的图片URL');
      return;
    }
    if (!title.trim()) {
      setError('请输入作品标题');
      return;
    }
    setPreviewUrl(imageUrl.trim());
    setError('');
  }, [imageUrl, title]);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setError('请拖入图片文件');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setPreviewUrl(result);
        setImageUrl(result);
        setError('');
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setPreviewUrl(result);
        setImageUrl(result);
        setError('');
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (!previewUrl || !title.trim()) {
      setError('请先上传图片并填写标题');
      return;
    }
    addWork(showWorkUpload!, previewUrl, title.trim(), description.trim());
    handleClose();
  }, [previewUrl, title, description, showWorkUpload, addWork, handleClose]);

  if (!showWorkUpload) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content work-upload-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>上传作品</h3>
          <button className="modal-close" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {!previewUrl ? (
            <div className="upload-section">
              <div
                className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} />
                <p>拖拽图片到此处或点击选择</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="url-input-section">
                <div className="url-input-row">
                  <Link size={16} />
                  <input
                    type="text"
                    placeholder="或粘贴图片URL..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  />
                  <button className="url-submit-btn" onClick={handleUrlSubmit}>
                    确认
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="preview-section">
              <img
                src={previewUrl}
                alt="preview"
                className="preview-image"
                onError={() => {
                  setError('图片加载失败');
                  setPreviewUrl('');
                }}
              />
            </div>
          )}

          <div className="form-fields">
            <input
              type="text"
              placeholder="作品标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
            <textarea
              placeholder="作品简介（可选）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              rows={2}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            {previewUrl && (
              <button
                className="action-btn secondary"
                onClick={() => {
                  setPreviewUrl('');
                  setImageUrl('');
                }}
              >
                重新选择
              </button>
            )}
            <button
              className="action-btn primary"
              onClick={handleSubmit}
              disabled={!previewUrl || !title.trim()}
            >
              上传作品
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn ${ANIMATION.modalFadeIn}ms ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .work-upload-modal {
          width: 400px;
          max-width: 90vw;
        }
        .modal-content {
          background: ${COLORS.modalBg};
          border-radius: 12px;
          border: 1px solid ${COLORS.modalBorder};
          overflow: hidden;
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid ${COLORS.modalBorder};
        }
        .modal-header h3 {
          margin: 0;
          color: ${COLORS.text};
          font-size: 16px;
          font-weight: 600;
        }
        .modal-close {
          background: none;
          border: none;
          color: ${COLORS.textSecondary};
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
        }
        .modal-close:hover {
          color: ${COLORS.text};
        }
        .modal-body {
          padding: 20px;
        }
        .drop-zone {
          border: 2px dashed ${COLORS.modalBorder};
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          color: ${COLORS.textSecondary};
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          margin-bottom: 16px;
        }
        .drop-zone:hover,
        .drop-zone.drag-over {
          border-color: ${COLORS.success};
          background: rgba(107, 203, 119, 0.05);
        }
        .drop-zone p {
          margin: 8px 0 0;
          font-size: 13px;
        }
        .url-input-section {
          margin-bottom: 16px;
        }
        .url-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: ${COLORS.inputBg};
          border-radius: 8px;
          border: 1px solid ${COLORS.inputBorder};
          padding: 8px 12px;
          color: ${COLORS.textSecondary};
        }
        .url-input-row input {
          flex: 1;
          background: none;
          border: none;
          color: ${COLORS.text};
          font-size: 13px;
          outline: none;
        }
        .url-input-row input::placeholder {
          color: ${COLORS.textSecondary};
        }
        .url-submit-btn {
          background: ${COLORS.success};
          border: none;
          border-radius: 6px;
          color: ${COLORS.background};
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.2s;
        }
        .url-submit-btn:hover {
          transform: translateY(-1px);
        }
        .preview-section {
          margin-bottom: 16px;
          text-align: center;
        }
        .preview-image {
          max-width: 100%;
          max-height: 200px;
          border-radius: 4px;
          object-fit: contain;
        }
        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 12px;
        }
        .form-input,
        .form-textarea {
          width: 100%;
          background: ${COLORS.inputBg};
          border: 1px solid ${COLORS.inputBorder};
          border-radius: 8px;
          padding: 10px 14px;
          color: ${COLORS.text};
          font-size: 14px;
          outline: none;
          resize: none;
          box-sizing: border-box;
          font-family: inherit;
        }
        .form-input::placeholder,
        .form-textarea::placeholder {
          color: ${COLORS.textSecondary};
        }
        .form-input:focus,
        .form-textarea:focus {
          border-color: ${COLORS.highlight};
        }
        .form-textarea {
          font-size: 12px;
        }
        .form-error {
          color: ${COLORS.warning};
          font-size: 12px;
          margin-bottom: 12px;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .action-btn {
          padding: 8px 20px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }
        .action-btn:hover {
          transform: translateY(-2px);
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .action-btn.primary {
          background: ${COLORS.success};
          color: ${COLORS.background};
        }
        .action-btn.secondary {
          background: transparent;
          color: ${COLORS.textSecondary};
          border: 1px solid ${COLORS.modalBorder};
        }
        .action-btn.secondary:hover {
          border-color: ${COLORS.textSecondary};
          color: ${COLORS.text};
        }
      `}</style>
    </div>
  );
}
