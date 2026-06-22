import { useEffect, useState, memo } from 'react';
import { X, Upload } from 'lucide-react';
import {
  MAX_EXHIBITION_NAME,
  MAX_THEME_LENGTH,
} from '@/data/mockData';

interface CreateExhibitionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; theme: string; coverUrl: string }) => void;
}

export const CreateExhibitionModal = memo(function CreateExhibitionModal({ open, onClose, onSubmit }: CreateExhibitionModalProps) {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setName('');
      setTheme('');
      setCoverUrl('');
      setErrors({});
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedTheme = theme.trim();
    const trimmedCover = coverUrl.trim();

    if (!trimmedName) newErrors.name = '请输入展厅名称';
    else if (trimmedName.length > MAX_EXHIBITION_NAME) newErrors.name = `名称最多${MAX_EXHIBITION_NAME}字`;

    if (!trimmedTheme) newErrors.theme = '请输入主题描述';
    else if (trimmedTheme.length > MAX_THEME_LENGTH) newErrors.theme = `描述最多${MAX_THEME_LENGTH}字`;

    if (!trimmedCover) newErrors.coverUrl = '请输入封面图片URL';
    else if (!/^https?:\/\/.+/i.test(trimmedCover)) newErrors.coverUrl = '请输入有效的URL';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      theme: theme.trim(),
      coverUrl: coverUrl.trim(),
    });
  };

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal create-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="关闭">
          <X size={22} strokeWidth={2} />
        </button>

        <div className="create-modal__header">
          <h2 className="create-modal__title">创建新展厅</h2>
          <p className="create-modal__subtitle">为您的艺术收藏打造专属空间</p>
        </div>

        <form className="create-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-field__label">
              展厅名称 <span className="form-field__required">*</span>
              <span className="form-field__hint">（{name.trim().length}/{MAX_EXHIBITION_NAME}）</span>
            </label>
            <input
              type="text"
              className={`form-field__input ${errors.name ? 'has-error' : ''}`}
              placeholder="请输入展厅名称（最多20字）"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_EXHIBITION_NAME))}
              maxLength={MAX_EXHIBITION_NAME}
            />
            {errors.name && <p className="form-field__error">{errors.name}</p>}
          </div>

          <div className="form-field">
            <label className="form-field__label">
              主题描述 <span className="form-field__required">*</span>
              <span className="form-field__hint">（{theme.trim().length}/{MAX_THEME_LENGTH}）</span>
            </label>
            <textarea
              className={`form-field__textarea ${errors.theme ? 'has-error' : ''}`}
              placeholder="描述展厅的主题与风格（最多200字）"
              rows={4}
              value={theme}
              onChange={(e) => setTheme(e.target.value.slice(0, MAX_THEME_LENGTH))}
              maxLength={MAX_THEME_LENGTH}
            />
            {errors.theme && <p className="form-field__error">{errors.theme}</p>}
          </div>

          <div className="form-field">
            <label className="form-field__label">
              封面图片URL <span className="form-field__required">*</span>
            </label>
            <div className="form-field__input-wrapper">
              <Upload size={18} className="form-field__icon" />
              <input
                type="text"
                className={`form-field__input form-field__input--with-icon ${errors.coverUrl ? 'has-error' : ''}`}
                placeholder="https://example.com/cover.jpg"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
              />
            </div>
            {errors.coverUrl && <p className="form-field__error">{errors.coverUrl}</p>}
            {coverUrl.trim() && !errors.coverUrl && (
              <div className="form-field__preview">
                <img src={coverUrl.trim()} alt="封面预览" />
              </div>
            )}
          </div>

          <div className="create-form__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn--primary">
              创建展厅
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
