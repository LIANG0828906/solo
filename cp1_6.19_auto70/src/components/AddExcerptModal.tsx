import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineX } from 'react-icons/hi';
import type { BookCategory, Excerpt } from '../types';

interface AddExcerptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    bookTitle: string;
    author: string;
    content: string;
    annotation: string;
    category: BookCategory;
  }) => void;
  editingExcerpt?: Excerpt | null;
}

const CATEGORIES: BookCategory[] = ['文学', '科技', '历史', '哲学', '心理'];

interface FormErrors {
  bookTitle?: string;
  author?: string;
  content?: string;
}

export function AddExcerptModal({
  isOpen,
  onClose,
  onSubmit,
  editingExcerpt,
}: AddExcerptModalProps) {
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [annotation, setAnnotation] = useState('');
  const [category, setCategory] = useState<BookCategory>('文学');
  const [errors, setErrors] = useState<FormErrors>({});
  const [shakeField, setShakeField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingExcerpt) {
        setBookTitle(editingExcerpt.bookTitle);
        setAuthor(editingExcerpt.author);
        setContent(editingExcerpt.content);
        setAnnotation(editingExcerpt.annotation);
        setCategory(editingExcerpt.category);
      } else {
        setBookTitle('');
        setAuthor('');
        setContent('');
        setAnnotation('');
        setCategory('文学');
      }
      setErrors({});
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, editingExcerpt]);

  const triggerShake = (field: string) => {
    setShakeField(field);
    setTimeout(() => setShakeField(null), 300);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!bookTitle.trim()) {
      newErrors.bookTitle = '请输入书名';
      triggerShake('bookTitle');
    }
    if (!author.trim()) {
      newErrors.author = '请输入作者';
      triggerShake('author');
    }
    if (!content.trim()) {
      newErrors.content = '请输入摘录原文';
      triggerShake('content');
    } else if (content.length > 500) {
      newErrors.content = '原文不能超过500字';
      triggerShake('content');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ bookTitle, author, content, annotation, category });
    if (!editingExcerpt) onClose();
    else onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal__header">
          <h2>{editingExcerpt ? '编辑书摘' : '添加书摘'}</h2>
          <button className="modal__close" onClick={onClose} aria-label="关闭">
            <HiOutlineX size={20} />
          </button>
        </div>
        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>书名</label>
            <input
              type="text"
              className={`form-input ${errors.bookTitle ? 'form-input--error' : ''} ${
                shakeField === 'bookTitle' ? 'form-input--shake' : ''
              }`}
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="例如：百年孤独"
            />
            {errors.bookTitle && <span className="form-error">{errors.bookTitle}</span>}
          </div>

          <div className="form-row">
            <label>作者</label>
            <input
              type="text"
              className={`form-input ${errors.author ? 'form-input--error' : ''} ${
                shakeField === 'author' ? 'form-input--shake' : ''
              }`}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="例如：加西亚·马尔克斯"
            />
            {errors.author && <span className="form-error">{errors.author}</span>}
          </div>

          <div className="form-row">
            <label>类别</label>
            <div className="category-selector">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`category-btn ${category === cat ? 'category-btn--active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label>
              摘录原文 <span className="char-count">{content.length}/500</span>
            </label>
            <textarea
              className={`form-input form-textarea ${errors.content ? 'form-input--error' : ''} ${
                shakeField === 'content' ? 'form-input--shake' : ''
              }`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在此粘贴或输入书摘原文…"
              rows={5}
            />
            {errors.content && <span className="form-error">{errors.content}</span>}
          </div>

          <div className="form-row">
            <label>随想批注（可选）</label>
            <textarea
              className="form-input form-textarea"
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
              placeholder="记录你的随想、感悟…"
              rows={3}
            />
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn--primary">
              {editingExcerpt ? '保存修改' : '添加书摘'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
