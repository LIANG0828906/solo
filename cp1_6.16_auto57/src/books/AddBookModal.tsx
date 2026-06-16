import { useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { Book, CATEGORIES } from '../types';
import { Loader2 } from 'lucide-react';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (book: Omit<Book, 'id' | 'createdAt'>) => void;
  editingBook?: Book | null;
}

export function AddBookModal({ isOpen, onClose, onSave, editingBook }: AddBookModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingBook) {
      setTitle(editingBook.title);
      setAuthor(editingBook.author);
      setCategory(editingBook.category);
      setIsAvailable(editingBook.isAvailable);
    } else {
      setTitle('');
      setAuthor('');
      setCategory(CATEGORIES[0]);
      setIsAvailable(true);
    }
  }, [editingBook, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    onSave({
      title: title.trim(),
      author: author.trim(),
      category,
      ownerId: editingBook?.ownerId || '',
      isAvailable,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBook ? '编辑书籍' : '添加新书'}
      maxWidth="450px"
    >
      <form onSubmit={handleSubmit} className="add-book-form">
        <div className="form-group">
          <label className="form-label">书名 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder="请输入书名"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">作者 *</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="form-input"
            placeholder="请输入作者"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">分类</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-input"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            <span>设置为可交换状态</span>
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !title.trim() || !author.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spinner" />
                保存中...
              </>
            ) : editingBook ? (
              '保存修改'
            ) : (
              '添加书籍'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
