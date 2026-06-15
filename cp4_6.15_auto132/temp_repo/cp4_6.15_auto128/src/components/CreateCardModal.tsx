import { useState, useRef, useEffect } from 'react';
import type { PublicCardData } from '../types';
import '../styles/CreateCardModal.css';

interface CreateCardModalProps {
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; imageUrl?: string }) => Promise<PublicCardData>;
}

export default function CreateCardModal({ onClose, onSubmit }: CreateCardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<{ title?: string; description?: string; imageUrl?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    titleRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, submitting]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = '请输入灵感标题';
    } else if (trimmedTitle.length > 50) {
      newErrors.title = '标题最多50个字符';
    }

    if (description.length > 200) {
      newErrors.description = '描述最多200个字符';
    }

    if (imageUrl.trim()) {
      try {
        const parsed = new URL(imageUrl.trim());
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          newErrors.imageUrl = '仅支持HTTP/HTTPS协议';
        }
      } catch {
        newErrors.imageUrl = '图片URL格式无效';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      });
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !submitting) {
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      ref={backdropRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-container animate-scale-in">
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          disabled={submitting}
          aria-label="关闭"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            ✨ 发布新灵感
          </h2>
          <p className="modal-subtitle">分享你的活动创意，让团队一起来投票！</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          <div className="form-group">
            <label htmlFor="card-title" className="form-label">
              标题 <span className="required">*</span>
              <span className="char-count">{title.length}/50</span>
            </label>
            <input
              id="card-title"
              ref={titleRef}
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="简洁有力地描述你的活动想法"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              maxLength={60}
              disabled={submitting}
            />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="card-desc" className="form-label">
              详细描述
              <span className="char-count">{description.length}/200</span>
            </label>
            <textarea
              id="card-desc"
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              placeholder="补充活动的具体内容、目标人群、预期效果等..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              rows={4}
              maxLength={250}
              disabled={submitting}
            />
            {errors.description && <div className="form-error">{errors.description}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="card-image" className="form-label">
              配图URL（可选）
            </label>
            <input
              id="card-image"
              type="url"
              className={`form-input ${errors.imageUrl ? 'error' : ''}`}
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (errors.imageUrl) setErrors((prev) => ({ ...prev, imageUrl: undefined }));
              }}
              disabled={submitting}
            />
            {errors.imageUrl && <div className="form-error">{errors.imageUrl}</div>}

            {imageUrl.trim() && !errors.imageUrl && (
              <div className="image-preview">
                <img
                  src={imageUrl.trim()}
                  alt="预览"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="preview-label">图片预览</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" />
                  发布中...
                </>
              ) : (
                '🚀 发布灵感'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
