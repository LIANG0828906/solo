import React, { useState, useRef, useEffect } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { searchBuiltInBooks } from '@/data/mockBooks';
import type { BuiltInBook } from '@/types';

interface BookFormProps {
  onClose: () => void;
}

export default function BookForm({ onClose }: BookFormProps) {
  const { addBook } = useLibrary();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publishYear, setPublishYear] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [suggestions, setSuggestions] = useState<BuiltInBook[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (value.trim().length > 0) {
      const results = searchBuiltInBooks(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (book: BuiltInBook) => {
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn);
    setPublishYear(String(book.publishYear));
    setDifficulty(book.difficulty);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    addBook({
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim() || undefined,
      publishYear: publishYear ? parseInt(publishYear) : undefined,
      coverUrl: coverUrl.trim() || undefined,
      difficulty,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="book-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="book-form-header">
          <h3>添加藏书</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="book-form-body">
          <div className="form-group autocomplete-group">
            <label>书名 *</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (title.trim() && suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="输入书名，自动联想内置图书库..."
              className="form-input"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown" ref={suggestionsRef}>
                {suggestions.map((book, index) => (
                  <div
                    key={book.isbn}
                    className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSelectSuggestion(book)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="suggestion-title">{book.title}</div>
                    <div className="suggestion-meta">{book.author} · {book.publishYear}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>作者 *</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="作者姓名"
              className="form-input"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>ISBN</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978..."
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>出版年份</label>
              <input
                type="number"
                value={publishYear}
                onChange={(e) => setPublishYear(e.target.value)}
                placeholder="2024"
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label>封面图片链接</label>
            <input
              type="text"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>阅读难度系数：{difficulty}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              className="form-range"
            />
            <div className="range-labels">
              <span>简单</span><span>困难</span>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim() || !author.trim()}>
              添加藏书
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
