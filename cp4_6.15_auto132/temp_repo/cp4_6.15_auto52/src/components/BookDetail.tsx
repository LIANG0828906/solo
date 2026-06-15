import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { formatDate } from '@/utils/priority';
import type { ReadingStatus } from '@/types';

export default function BookDetail() {
  const { books, selectedBookId, selectBook, updateBook, updateBookStatus, deleteBook } = useLibrary();
  const [noteText, setNoteText] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const book = books.find((b) => b.id === selectedBookId);

  useEffect(() => {
    if (book) {
      setNoteText(book.notes);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [book?.id]);

  useEffect(() => {
    if (book) {
      setNoteText(book.notes);
    }
  }, [book?.notes]);

  const handleSaveNote = useCallback(() => {
    if (!book) return;
    updateBook(book.id, { notes: noteText });
    setShowSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000);
  }, [book, noteText, updateBook]);

  const handleStatusChange = useCallback(
    (status: ReadingStatus) => {
      if (!book) return;
      updateBookStatus(book.id, status);
    },
    [book, updateBookStatus]
  );

  const handleDelete = useCallback(() => {
    if (!book) return;
    deleteBook(book.id);
  }, [book, deleteBook]);

  if (!book) return null;

  const statusOptions: { value: ReadingStatus; label: string }[] = [
    { value: 'want-to-read', label: '想读' },
    { value: 'reading', label: '在读' },
    { value: 'finished', label: '读完' },
  ];

  return (
    <>
      <div
        className={`detail-backdrop ${isVisible ? 'visible' : ''}`}
        onClick={() => selectBook(null)}
      />
      <div className={`detail-panel ${isVisible ? 'visible' : ''}`}>
        <div className="detail-header">
          <h3>书籍详情</h3>
          <button className="close-btn" onClick={() => selectBook(null)}>✕</button>
        </div>
        <div className="detail-content">
          <div className="detail-cover">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} />
            ) : (
              <div className="detail-cover-placeholder">
                <div className="detail-spine" />
                <span>{book.title.slice(0, 8)}</span>
              </div>
            )}
          </div>
          <h2 className="detail-title">{book.title}</h2>
          <p className="detail-author">{book.author}</p>
          <div className="detail-meta">
            {book.isbn && <span>ISBN: {book.isbn}</span>}
            {book.publishYear && <span>出版: {book.publishYear}</span>}
            <span>难度: {'★'.repeat(book.difficulty)}{'☆'.repeat(5 - book.difficulty)}</span>
            <span>添加: {formatDate(book.createdAt)}</span>
          </div>

          <div className="detail-status-section">
            <label>阅读状态</label>
            <div className="status-buttons">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`status-btn ${book.status === opt.value ? 'active' : ''}`}
                  onClick={() => handleStatusChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-notes-section">
            <label>阅读笔记</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="记录你的阅读心得..."
              className="notes-textarea"
              rows={6}
            />
            <button className="btn btn-primary btn-save-note" onClick={handleSaveNote}>
              保存笔记
            </button>
            <div className={`saved-toast ${showSaved ? 'visible' : ''}`}>
              <span className="saved-icon">✓</span> 已保存
            </div>
          </div>

          <div className="detail-actions">
            <button className="btn btn-danger" onClick={handleDelete}>
              删除此书
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
