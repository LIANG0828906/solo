import { useState, useRef } from 'react';
import type { Capsule, MediaItem } from '../types';
import { useCapsuleStore } from '../store';
import './CapsuleForm.css';

interface CapsuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  editCapsule?: Capsule | null;
}

const MAX_TITLE_LENGTH = 50;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_MEDIA_COUNT = 5;

function generateMediaId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export default function CapsuleForm({ isOpen, onClose, editCapsule }: CapsuleFormProps) {
  const { addCapsule, updateCapsule } = useCapsuleStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(editCapsule?.title || '');
  const [content, setContent] = useState(editCapsule?.content || '');
  const [openDate, setOpenDate] = useState(() => {
    if (editCapsule) {
      const d = new Date(editCapsule.openDate);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const local = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  });
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(editCapsule?.mediaItems || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '请输入胶囊标题';
    } else if (title.length > MAX_TITLE_LENGTH) {
      newErrors.title = `标题不能超过${MAX_TITLE_LENGTH}字`;
    }

    if (!content.trim()) {
      newErrors.content = '请输入胶囊内容';
    }

    if (!openDate) {
      newErrors.openDate = '请选择开箱日期';
    } else if (new Date(openDate) <= new Date()) {
      newErrors.openDate = '开箱日期必须晚于当前时间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = MAX_MEDIA_COUNT - mediaItems.length;
    if (remainingSlots <= 0) {
      setErrors((prev) => ({ ...prev, media: `最多只能上传${MAX_MEDIA_COUNT}个文件` }));
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    let hasError = false;

    filesToProcess.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        hasError = true;
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      if (!isImage && !isAudio) {
        hasError = true;
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newItem: MediaItem = {
          id: generateMediaId(),
          type: isImage ? 'image' : 'audio',
          dataUrl,
          name: file.name,
          size: file.size,
        };
        setMediaItems((prev) => [...prev, newItem]);
      };
      reader.readAsDataURL(file);
    });

    if (hasError) {
      setErrors((prev) => ({
        ...prev,
        media: '仅支持图片和音频文件，单个文件不超过5MB',
      }));
    } else {
      setErrors((prev) => {
        const { media, ...rest } = prev;
        return rest;
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const capsuleData = {
        title: title.trim(),
        content: content.trim(),
        mediaItems,
        openDate: new Date(openDate).toISOString(),
      };

      if (editCapsule) {
        await updateCapsule(editCapsule.id, capsuleData);
      } else {
        await addCapsule(capsuleData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save capsule:', error);
      setErrors((prev) => ({ ...prev, submit: '保存失败，请重试' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2>{editCapsule ? '编辑胶囊' : '创建新胶囊'}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="capsule-form">
          <div className="form-group">
            <label htmlFor="title">
              标题 <span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给你的时光胶囊起个名字..."
              maxLength={MAX_TITLE_LENGTH}
              className={errors.title ? 'error' : ''}
            />
            <div className="input-footer">
              {errors.title ? (
                <span className="error-msg">{errors.title}</span>
              ) : (
                <span className="char-count">{title.length}/{MAX_TITLE_LENGTH}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content">
              内容 <span className="required">*</span>
              <span className="hint">（支持 Markdown）</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你想对将来说的话..."
              rows={6}
              className={errors.content ? 'error' : ''}
            />
            <div className="input-footer">
              {errors.content ? (
                <span className="error-msg">{errors.content}</span>
              ) : (
                <span className="char-count">{content.length} 字</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>
              媒体文件
              <span className="hint">（最多{MAX_MEDIA_COUNT}个，单个≤5MB）</span>
            </label>

            <div className="media-preview-grid">
              {mediaItems.map((item) => (
                <div key={item.id} className="media-preview-item">
                  {item.type === 'image' ? (
                    <img src={item.dataUrl} alt={item.name} loading="lazy" />
                  ) : (
                    <div className="audio-preview">
                      <span className="audio-icon">🎵</span>
                      <span className="audio-name">{item.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="remove-media-btn"
                    onClick={() => removeMedia(item.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {mediaItems.length < MAX_MEDIA_COUNT && (
                <button
                  type="button"
                  className="add-media-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="plus-icon">+</span>
                  <span>添加文件</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {errors.media && <span className="error-msg">{errors.media}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="openDate">
              开箱日期 <span className="required">*</span>
            </label>
            <input
              id="openDate"
              type="datetime-local"
              value={openDate}
              onChange={(e) => setOpenDate(e.target.value)}
              min={minDate()}
              className={errors.openDate ? 'error' : ''}
            />
            {errors.openDate && <span className="error-msg">{errors.openDate}</span>}
          </div>

          {errors.submit && (
            <div className="submit-error">{errors.submit}</div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel-form" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : editCapsule ? '保存修改' : '封存胶囊'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
