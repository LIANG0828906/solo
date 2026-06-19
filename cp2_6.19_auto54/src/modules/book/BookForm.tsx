import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import type { BookFormData, BookCategory, BookExchangeMode } from '../../shared/types';
import { validateBookForm } from '../../shared/utils';

interface BookFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookFormData) => void;
  initialData?: Partial<BookFormData>;
}

const CATEGORIES: BookCategory[] = ['小说', '非小说', '技术', '艺术'];
const EXCHANGE_MODES: Array<{ value: BookExchangeMode; label: string }> = [
  { value: 'exchange_only', label: '仅交换' },
  { value: 'borrow_only', label: '仅借阅' },
  { value: 'both', label: '两者均可' },
];

export function BookForm({ isOpen, onClose, onSubmit, initialData }: BookFormProps) {
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    category: '小说',
    isbn: '',
    totalQuantity: 1,
    exchangeMode: 'both',
    borrowPeriodDays: 14,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isClosing, setIsClosing] = useState(false);
  const errorRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: '',
        author: '',
        category: '小说',
        isbn: '',
        totalQuantity: 1,
        exchangeMode: 'both',
        borrowPeriodDays: 14,
        ...initialData,
      });
    } else {
      setFormData({
        title: '',
        author: '',
        category: '小说',
        isbn: '',
        totalQuantity: 1,
        exchangeMode: 'both',
        borrowPeriodDays: 14,
      });
    }
    setErrors({});
    setIsClosing(false);
  }, [isOpen, initialData]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleChange = (field: keyof BookFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateBookForm(formData as unknown as Record<string, unknown>);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      setTimeout(() => {
        const element = errorRefs.current[firstErrorField];
        if (element) {
          element.classList.add('error');
          element.classList.add('shake');
          setTimeout(() => {
            element.classList.remove('shake');
          }, 500);
        }
      }, 50);
      return;
    }

    onSubmit(formData);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initialData ? '编辑图书' : '上架新图书'}</h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">书名 *</label>
            <input
              ref={(el) => { errorRefs.current.title = el; }}
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="请输入书名"
            />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">作者 *</label>
            <input
              ref={(el) => { errorRefs.current.author = el; }}
              type="text"
              className={`form-input ${errors.author ? 'error' : ''}`}
              value={formData.author}
              onChange={(e) => handleChange('author', e.target.value)}
              placeholder="请输入作者"
            />
            {errors.author && <div className="form-error">{errors.author}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">类别 *</label>
              <select
                ref={(el) => { errorRefs.current.category = el; }}
                className={`form-input ${errors.category ? 'error' : ''}`}
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value as BookCategory)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <div className="form-error">{errors.category}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">ISBN *</label>
              <input
                ref={(el) => { errorRefs.current.isbn = el; }}
                type="text"
                className={`form-input ${errors.isbn ? 'error' : ''}`}
                value={formData.isbn}
                onChange={(e) => handleChange('isbn', e.target.value)}
                placeholder="请输入 ISBN"
              />
              {errors.isbn && <div className="form-error">{errors.isbn}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">库存数量 *</label>
              <input
                ref={(el) => { errorRefs.current.totalQuantity = el; }}
                type="number"
                min="1"
                className={`form-input ${errors.totalQuantity ? 'error' : ''}`}
                value={formData.totalQuantity}
                onChange={(e) => handleChange('totalQuantity', parseInt(e.target.value) || 0)}
              />
              {errors.totalQuantity && <div className="form-error">{errors.totalQuantity}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">借阅期限（天）*</label>
              <input
                ref={(el) => { errorRefs.current.borrowPeriodDays = el; }}
                type="number"
                min="1"
                className={`form-input ${errors.borrowPeriodDays ? 'error' : ''}`}
                value={formData.borrowPeriodDays}
                onChange={(e) => handleChange('borrowPeriodDays', parseInt(e.target.value) || 0)}
              />
              {errors.borrowPeriodDays && <div className="form-error">{errors.borrowPeriodDays}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">交换方式 *</label>
            <select
              ref={(el) => { errorRefs.current.exchangeMode = el; }}
              className={`form-input ${errors.exchangeMode ? 'error' : ''}`}
              value={formData.exchangeMode}
              onChange={(e) => handleChange('exchangeMode', e.target.value as BookExchangeMode)}
            >
              {EXCHANGE_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
            {errors.exchangeMode && <div className="form-error">{errors.exchangeMode}</div>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              {initialData ? '保存修改' : '确认上架'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
