import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { BookForm } from './BookForm';
import { useBookStore } from './BookManager';
import type { BookFormData } from '../../shared/types';
import { getStatusLabel, getExchangeModeLabel } from '../../shared/utils';
import { useAuthStore } from '../user/UserManager';
import { Navigate } from 'react-router-dom';

export function AdminBookManager() {
  const isAdmin = useAuthStore((state) => state.isAdmin());
  const books = useBookStore((state) => state.books);
  const newBookId = useBookStore((state) => state.newBookId);
  const addBook = useBookStore((state) => state.addBook);
  const updateBook = useBookStore((state) => state.updateBook);
  const deleteBook = useBookStore((state) => state.deleteBook);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<{ id: string; data: BookFormData } | null>(null);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (data: BookFormData) => {
    if (editingBook) {
      updateBook(editingBook.id, data);
    } else {
      addBook(data);
    }
    setEditingBook(null);
  };

  const handleEdit = (book: { id: string; data: BookFormData }) => {
    setEditingBook(book);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这本图书吗？')) {
      deleteBook(id);
    }
  };

  const handleAddNew = () => {
    setEditingBook(null);
    setIsFormOpen(true);
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title" style={{ margin: 0 }}>图书管理</h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <Plus size={18} />
          上架新书
        </button>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>暂无图书，点击上方按钮上架第一本图书</p>
        </div>
      ) : (
        <div className="admin-table">
          <div className="admin-table-header admin-table-row">
            <span>图书信息</span>
            <span>类别</span>
            <span>库存</span>
            <span>交换方式</span>
            <span>状态</span>
            <span>操作</span>
          </div>
          {books.map((book) => (
            <div
              key={book.id}
              className={`admin-table-row ${book.id === newBookId ? 'new-item' : ''}`}
            >
              <div>
                <div className="admin-book-title">{book.title}</div>
                <div className="admin-book-author">{book.author}</div>
              </div>
              <span>{book.category}</span>
              <span>{book.availableQuantity} / {book.totalQuantity}</span>
              <span>{getExchangeModeLabel(book.exchangeMode)}</span>
              <span>
                <span className={`status-tag ${book.status}`}>
                  {getStatusLabel(book.status)}
                </span>
              </span>
              <div className="admin-actions">
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={() => handleEdit({ id: book.id, data: book })}
                >
                  <Edit2 size={14} />
                  编辑
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={() => handleDelete(book.id)}
                >
                  <Trash2 size={14} />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="add-book-btn" onClick={handleAddNew}>
        <Plus size={24} />
      </button>

      <BookForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBook(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingBook?.data}
      />
    </div>
  );
}
