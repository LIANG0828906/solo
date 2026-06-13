import { useEffect, useState, memo } from 'react';
import { X, Upload } from 'lucide-react';
import { MAX_ARTWORK_TITLE } from '@/data/mockData';

interface CreateArtworkModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    artist: string;
    description: string;
    imageUrl: string;
  }) => void;
}

export const CreateArtworkModal = memo(function CreateArtworkModal({ open, onClose, onSubmit }: CreateArtworkModalProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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
      setTitle('');
      setArtist('');
      setDescription('');
      setImageUrl('');
      setErrors({});
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const t = title.trim();
    const a = artist.trim();
    const d = description.trim();
    const u = imageUrl.trim();

    if (!t) newErrors.title = '请输入作品标题';
    else if (t.length > MAX_ARTWORK_TITLE) newErrors.title = `标题最多${MAX_ARTWORK_TITLE}字`;

    if (!a) newErrors.artist = '请输入艺术家姓名';

    if (!d) newErrors.description = '请输入作品描述';

    if (!u) newErrors.imageUrl = '请输入作品图片URL';
    else if (!/^https?:\/\/.+/i.test(u)) newErrors.imageUrl = '请输入有效的URL';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      artist: artist.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
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
          <h2 className="create-modal__title">添加新作品</h2>
          <p className="create-modal__subtitle">为展厅注入新的艺术灵感</p>
        </div>

        <form className="create-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-field__label">
              作品标题 <span className="form-field__required">*</span>
              <span className="form-field__hint">（{title.trim().length}/{MAX_ARTWORK_TITLE}）</span>
            </label>
            <input
              type="text"
              className={`form-field__input ${errors.title ? 'has-error' : ''}`}
              placeholder="请输入作品标题（最多30字）"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_ARTWORK_TITLE))}
              maxLength={MAX_ARTWORK_TITLE}
            />
            {errors.title && <p className="form-field__error">{errors.title}</p>}
          </div>

          <div className="form-field">
            <label className="form-field__label">
              艺术家 <span className="form-field__required">*</span>
            </label>
            <input
              type="text"
              className={`form-field__input ${errors.artist ? 'has-error' : ''}`}
              placeholder="请输入艺术家姓名"
              value={artist}
              onChange={(e) => setArtist(e.target.value.slice(0, 50))}
              maxLength={50}
            />
            {errors.artist && <p className="form-field__error">{errors.artist}</p>}
          </div>

          <div className="form-field">
            <label className="form-field__label">
              作品描述 <span className="form-field__required">*</span>
            </label>
            <textarea
              className={`form-field__textarea ${errors.description ? 'has-error' : ''}`}
              placeholder="描述作品的创作理念、灵感来源..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              maxLength={500}
            />
            {errors.description && <p className="form-field__error">{errors.description}</p>}
          </div>

          <div className="form-field">
            <label className="form-field__label">
              作品图片URL <span className="form-field__required">*</span>
            </label>
            <div className="form-field__input-wrapper">
              <Upload size={18} className="form-field__icon" />
              <input
                type="text"
                className={`form-field__input form-field__input--with-icon ${errors.imageUrl ? 'has-error' : ''}`}
                placeholder="https://example.com/artwork.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            {errors.imageUrl && <p className="form-field__error">{errors.imageUrl}</p>}
            {imageUrl.trim() && !errors.imageUrl && (
              <div className="form-field__preview">
                <img src={imageUrl.trim()} alt="作品预览" />
              </div>
            )}
          </div>

          <div className="create-form__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn--primary">
              添加作品
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
