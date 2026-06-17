import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Upload, Plus } from 'lucide-react';
import { useProjectStore } from './store';
import type { FormErrors } from '../../types';
import { validateImageFile, fileToBase64 } from '../../utils/format';

interface ProjectFormProps {
  onClose: () => void;
}

export function ProjectForm({ onClose }: ProjectFormProps) {
  const addProject = useProjectStore((state) => state.addProject);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validate = useCallback(() => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = '请输入项目名称';
    } else if (title.length > 50) {
      newErrors.title = '项目名称不能超过50字';
    }

    if (!description.trim()) {
      newErrors.description = '请输入项目描述';
    } else if (description.length > 500) {
      newErrors.description = '项目描述不能超过500字';
    }

    if (images.length < 2) {
      newErrors.images = '请上传至少2张对比图片';
    } else if (images.length > 4) {
      newErrors.images = '最多上传4张图片';
    }

    return newErrors;
  }, [title, description, images.length]);

  useEffect(() => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    errorTimerRef.current = setTimeout(() => {
      const newErrors = validate();
      setErrors((prev) => {
        const hasChanged =
          JSON.stringify(prev) !== JSON.stringify(newErrors);
        return hasChanged ? newErrors : prev;
      });
    }, 80);

    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, [title, description, images, validate]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const remainingSlots = 4 - images.length;
      const filesToProcess = files.slice(0, remainingSlots);

      for (const file of filesToProcess) {
        const validationError = validateImageFile(file);
        if (validationError) {
          setErrors((prev) => ({ ...prev, images: validationError }));
          continue;
        }
        try {
          const preview = await fileToBase64(file);
          setImages((prev) => [...prev, { file, preview }]);
        } catch {
          setErrors((prev) => ({ ...prev, images: '图片处理失败' }));
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [images.length]
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors = validate();
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      setIsSubmitting(true);
      try {
        const base64Images = images.map((img) => img.preview);
        await addProject({
          title: title.trim(),
          description: description.trim(),
          images: base64Images,
        });
        onClose();
      } catch (error) {
        console.error('Failed to create project:', error);
        setErrors((prev) => ({ ...prev, title: '创建项目失败，请重试' }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [title, description, images, addProject, onClose, validate]
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>创建新项目</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <form className="project-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              项目名称 <span className="required">*</span>
              <span className="char-count">{title.length}/50</span>
            </label>
            <input
              id="title"
              type="text"
              className={`form-input ${errors.title ? 'form-input--error' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入项目名称（最长50字）"
              maxLength={50}
            />
            {errors.title && (
              <p className="form-error">{errors.title}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              项目描述 <span className="required">*</span>
              <span className="char-count">{description.length}/500</span>
            </label>
            <textarea
              id="description"
              className={`form-textarea ${
                errors.description ? 'form-textarea--error' : ''
              }`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请描述改造方案、背景、效果等（最多500字）"
              maxLength={500}
              rows={5}
            />
            {errors.description && (
              <p className="form-error">{errors.description}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              改造对比图片 <span className="required">*</span>
              <span className="char-count">{images.length}/4</span>
            </label>
            <div className="image-upload-grid">
              {images.map((img, index) => (
                <div key={index} className="image-preview">
                  <img src={img.preview} alt={`预览${index + 1}`} />
                  <button
                    type="button"
                    className="image-preview__remove"
                    onClick={() => removeImage(index)}
                    aria-label="移除图片"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <label className="image-upload-btn">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    onChange={handleFileSelect}
                    hidden
                  />
                  <div className="image-upload-btn__inner">
                    <Plus size={24} color="#999" />
                    <Upload size={20} color="#999" />
                    <span>上传图片</span>
                    <span className="image-upload-btn__hint">
                      JPG/PNG，每张≤2MB
                    </span>
                  </div>
                </label>
              )}
            </div>
            {errors.images && (
              <p className="form-error">{errors.images}</p>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '创建中...' : '创建项目'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
