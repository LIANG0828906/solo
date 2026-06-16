import { useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { Book } from '../types';
import { database } from '../db/database';
import { getCategoryColor } from '../utils/colors';
import { Loader2, AlertCircle } from 'lucide-react';

interface SwapRequestProps {
  isOpen: boolean;
  onClose: () => void;
  targetBook: Book | null;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function SwapRequest({
  isOpen,
  onClose,
  targetBook,
  onSuccess,
  onError,
}: SwapRequestProps) {
  const currentUser = database.getCurrentUser();
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMyBooks(database.getAvailableBooksByUserId(currentUser.id));
      setSelectedBookId('');
    }
  }, [isOpen, currentUser.id]);

  if (!targetBook) return null;

  const targetOwner = database.getUserById(targetBook.ownerId);
  const targetCoverColor = getCategoryColor(targetBook.category);

  const handleSubmit = async () => {
    if (!selectedBookId) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      database.createSwapRequest({
        requesterId: currentUser.id,
        recipientId: targetBook.ownerId,
        requestedBookId: targetBook.id,
        offeredBookId: selectedBookId,
      });
      onSuccess();
    } catch (e) {
      onError(e instanceof Error ? e.message : '发送失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="发起交换请求"
      maxWidth="500px"
    >
      <div className="swap-request">
        <div className="swap-target">
          <h4 className="swap-section-title">对方的书籍</h4>
          <div className="swap-book-preview">
            <div
              className="swap-book-cover"
              style={{ backgroundColor: targetCoverColor }}
            >
              <span className="swap-book-category">{targetBook.category}</span>
            </div>
            <div className="swap-book-info">
              <h5 className="swap-book-title">{targetBook.title}</h5>
              <p className="swap-book-author">{targetBook.author}</p>
              <p className="swap-book-owner">所有者：{targetOwner?.username}</p>
            </div>
          </div>
        </div>

        <div className="swap-divider">
          <div className="swap-arrow">⟷</div>
        </div>

        <div className="swap-offer">
          <h4 className="swap-section-title">选择你的交换书籍</h4>
          {myBooks.length === 0 ? (
            <div className="swap-empty">
              <AlertCircle size={20} />
              <span>你还没有可交换的书籍，请先去添加并设置为可交换状态</span>
            </div>
          ) : (
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="swap-select"
            >
              <option value="">请选择一本书...</option>
              {myBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  《{book.title}》- {book.author} ({book.category})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="swap-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || myBooks.length === 0 || !selectedBookId}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spinner" />
                发送中...
              </>
            ) : (
              '发送请求'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
