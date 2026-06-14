import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from './context';
import { BookStorage } from './BookStorage';
import type { Book, ValidationResult } from './types';

const BookForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshBooks, showToast } = useApp();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    totalPages: '',
    currentPage: '',
    publishYear: '',
    coverUrl: '',
    readingStatus: 'unread' as Book['readingStatus']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isClosing, setIsClosing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      const book = BookStorage.getBook(id);
      if (book) {
        setFormData({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          category: book.category,
          totalPages: book.totalPages.toString(),
          currentPage: book.currentPage.toString(),
          publishYear: book.publishYear?.toString() || '',
          coverUrl: book.coverUrl,
          readingStatus: book.readingStatus
        });
      } else {
        showToast('图书不存在', 'error');
        navigate('/');
      }
    }
  }, [isEdit, id, navigate, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const bookData: Partial<Book> = {
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn,
      category: formData.category,
      totalPages: parseInt(formData.totalPages),
      currentPage: parseInt(formData.currentPage) || 0,
      publishYear: formData.publishYear ? parseInt(formData.publishYear) : undefined,
      coverUrl: formData.coverUrl,
      readingStatus: formData.readingStatus
    };

    const result: ValidationResult = BookStorage.validateBook(bookData);
    setErrors(result.errors);
    return result.isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      showToast('请检查表单填写是否正确', 'error');
      return;
    }

    const bookData = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      isbn: formData.isbn.trim(),
      category: formData.category.trim(),
      totalPages: parseInt(formData.totalPages),
      currentPage: parseInt(formData.currentPage) || 0,
      publishYear: formData.publishYear ? parseInt(formData.publishYear) : new Date().getFullYear(),
      coverUrl: formData.coverUrl.trim(),
      readingStatus: formData.readingStatus
    };

    if (isEdit && id) {
      BookStorage.updateBook(id, bookData);
      showToast('图书更新成功！');
    } else {
      BookStorage.addBook(bookData);
      showToast('图书添加成功！');
    }

    refreshBooks();
    handleClose();
  };

  const handleDelete = () => {
    if (id) {
      BookStorage.deleteBook(id);
      refreshBooks();
      showToast('图书已删除', 'success');
      setShowDeleteConfirm(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      navigate('/');
    }, 280);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className={`modal ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '编辑图书' : '添加图书'}</h2>
          <button className="modal-close" onClick={handleClose} aria-label="关闭">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label required">书名</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                placeholder="请输入书名"
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label className="form-label required">作者</label>
              <input
                type="text"
                name="author"
                className="form-input"
                value={formData.author}
                onChange={handleChange}
                placeholder="请输入作者"
              />
              {errors.author && <div className="form-error">{errors.author}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">ISBN</label>
                <input
                  type="text"
                  name="isbn"
                  className="form-input"
                  value={formData.isbn}
                  onChange={handleChange}
                  placeholder="ISBN-10 或 ISBN-13"
                />
                {errors.isbn && <div className="form-error">{errors.isbn}</div>}
              </div>

              <div className="form-group">
                <label className="form-label required">分类</label>
                <input
                  type="text"
                  name="category"
                  className="form-input"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="如：文学、科技、历史"
                  list="category-list"
                />
                <datalist id="category-list">
                  {BookStorage.getAllCategories().map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                {errors.category && <div className="form-error">{errors.category}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">总页数</label>
                <input
                  type="number"
                  name="totalPages"
                  className="form-input"
                  value={formData.totalPages}
                  onChange={handleChange}
                  placeholder="请输入总页数"
                  min="1"
                />
                {errors.totalPages && <div className="form-error">{errors.totalPages}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">当前页数</label>
                <input
                  type="number"
                  name="currentPage"
                  className="form-input"
                  value={formData.currentPage}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
                {errors.currentPage && <div className="form-error">{errors.currentPage}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">出版年份</label>
                <input
                  type="number"
                  name="publishYear"
                  className="form-input"
                  value={formData.publishYear}
                  onChange={handleChange}
                  placeholder={new Date().getFullYear().toString()}
                  min="1000"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="form-group">
                <label className="form-label required">阅读状态</label>
                <select
                  name="readingStatus"
                  className="form-select"
                  value={formData.readingStatus}
                  onChange={handleChange}
                >
                  <option value="unread">未读</option>
                  <option value="reading">在读</option>
                  <option value="finished">已读</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">封面图片 URL</label>
              <input
                type="url"
                name="coverUrl"
                className="form-input"
                value={formData.coverUrl}
                onChange={handleChange}
                placeholder="https://example.com/cover.jpg"
              />
            </div>

            {formData.coverUrl && (
              <div className="form-group">
                <label className="form-label">封面预览</label>
                <img
                  src={formData.coverUrl}
                  alt="封面预览"
                  style={{
                    width: 120,
                    height: 160,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            {isEdit && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                删除
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div 
            className="modal" 
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">确认删除</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>确定要删除这本图书吗？相关的阅读记录也会被删除，此操作不可恢复。</p>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={handleDelete}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookForm;
