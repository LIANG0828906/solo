import { useState } from 'react';
import { useAppContext } from './App';
import { Book } from './types';

const cssStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  @keyframes zoomOut {
    from { transform: scale(1); opacity: 1; }
    to { transform: scale(0); opacity: 0; }
  }
  .book-card-exit {
    animation: zoomOut 0.3s ease-in-out forwards;
  }
  .modal-overlay {
    animation: fadeIn 0.2s ease-out;
  }
  .modal-content {
    animation: slideUp 0.3s ease-out;
  }
  .primary-btn {
    background-color: #6366F1;
    color: white;
    border: none;
    border-radius: 8px;
    padding: '10px 20px';
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }
  .primary-btn:hover {
    background-color: #818CF8;
  }
  .primary-btn:active {
    transform: scale(0.95);
  }
  .delete-btn {
    background-color: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .delete-btn:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }
  .delete-btn:active {
    transform: scale(0.95);
  }
  .form-input {
    width: 100%;
    height: 40px;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    padding: 0 12px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .form-input:focus {
    border-color: #6366F1;
  }
`;

export default function BookManager() {
  const { books, addBook, deleteBook } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', author: '', isbn: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddBook = async () => {
    if (!formData.title || !formData.author || !formData.isbn) {
      alert('请填写所有字段');
      return;
    }
    try {
      await addBook(formData.title, formData.author, formData.isbn);
      setFormData({ title: '', author: '', isbn: '' });
      setShowModal(false);
    } catch (error) {
      alert('添加图书失败');
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteBook = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete);
    const book = books.find((b) => b.id === confirmDelete);
    if (book?.isBorrowed) {
      alert('该书正在借阅中，无法删除');
      setConfirmDelete(null);
      setDeletingId(null);
      return;
    }
    setTimeout(async () => {
      try {
        await deleteBook(confirmDelete);
      } catch (error) {
        alert('删除图书失败');
      } finally {
        setConfirmDelete(null);
        setDeletingId(null);
      }
    }, 300);
  };

  return (
    <>
      <style>{cssStyles}</style>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>我的藏书</h2>
          <button
            className="primary-btn"
            style={styles.addButton}
            onClick={() => setShowModal(true)}
          >
            + 添加图书
          </button>
        </div>

        <div style={styles.grid}>
          {books.map((book) => (
            <div
              key={book.id}
              className={deletingId === book.id ? 'book-card-exit' : ''}
              style={styles.card}
            >
              {book.isBorrowed && (
                <div style={styles.borrowedBadge}>BORROWED</div>
              )}
              <button
                className="delete-btn"
                style={styles.deleteButton}
                onClick={() => handleDeleteClick(book.id)}
                title="删除图书"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
                  <path d="M10 11v6M14 11v6"></path>
                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              <div style={{ ...styles.cover, backgroundColor: book.color }}>
                <span style={styles.coverText}>📖</span>
              </div>
              <div style={styles.cardContent}>
                <h3 style={styles.bookTitle} title={book.title}>{book.title}</h3>
                <p style={styles.bookMeta}>作者：{book.author}</p>
                <p style={styles.bookMeta}>ISBN：{book.isbn}</p>
              </div>
            </div>
          ))}
        </div>

        {books.length === 0 && (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>暂无图书，点击右上角添加第一本图书吧</p>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          style={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-content"
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>添加新图书</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>书名</label>
              <input
                className="form-input"
                type="text"
                placeholder="请输入书名"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>作者</label>
              <input
                className="form-input"
                type="text"
                placeholder="请输入作者"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>ISBN</label>
              <input
                className="form-input"
                type="text"
                placeholder="请输入ISBN"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              />
            </div>
            <div style={styles.modalButtons}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowModal(false)}
              >
                取消
              </button>
              <button
                className="primary-btn"
                style={styles.confirmButton}
                onClick={handleAddBook}
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          className="modal-overlay"
          style={styles.modalOverlay}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="modal-content"
            style={{ ...styles.modalContent, maxWidth: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>确认删除</h3>
            <p style={styles.confirmText}>确定要删除这本图书吗？此操作不可撤销。</p>
            <div style={styles.modalButtons}>
              <button
                style={styles.cancelButton}
                onClick={() => setConfirmDelete(null)}
              >
                取消
              </button>
              <button
                className="primary-btn"
                style={{ ...styles.confirmButton, backgroundColor: '#EF4444' }}
                onClick={confirmDeleteBook}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1E293B',
  },
  addButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '0',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  cover: {
    width: '100%',
    height: '160px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: {
    fontSize: '48px',
  },
  borrowedBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#EF4444',
    color: 'white',
    fontSize: '12px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '6px',
    zIndex: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    zIndex: 1,
  },
  cardContent: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  bookTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1E293B',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  bookMeta: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#64748B',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px 16px 0 0',
    padding: '32px',
    width: '100%',
    maxWidth: '500px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  confirmButton: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  confirmText: {
    fontSize: '15px',
    color: '#475569',
    lineHeight: 1.6,
  },
};
