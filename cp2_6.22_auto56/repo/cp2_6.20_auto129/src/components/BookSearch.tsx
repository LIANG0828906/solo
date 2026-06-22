import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input, List, Avatar, Spin, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Book } from '../types';
import { bookApi } from '../api/bookApi';
import './BookSearch.css';

interface BookSearchProps {
  onSelect?: (book: Book) => void;
  placeholder?: string;
}

const BookSearch: React.FC<BookSearchProps> = ({ onSelect, placeholder = '搜索书籍名称或作者...' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchBooks = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const books = await bookApi.searchBooks(searchQuery);
      setResults(books);
    } catch (error) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchBooks(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchBooks]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (book: Book) => {
    setQuery(book.title);
    setShowDropdown(false);
    onSelect?.(book);
  };

  const handleFocus = () => {
    if (query.length >= 3 && results.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length >= 3) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  return (
    <div className="book-search" ref={searchRef}>
      <Input
        size="large"
        placeholder={placeholder}
        prefix={<SearchOutlined style={{ color: '#999' }} />}
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        className="book-search-input"
      />
      {showDropdown && (
        <div className="book-search-dropdown" ref={dropdownRef}>
          {loading ? (
            <div className="book-search-loading">
              <Spin size="small" />
              <span>搜索中...</span>
            </div>
          ) : results.length > 0 ? (
            <List
              dataSource={results}
              renderItem={(book) => (
                <List.Item
                  key={book.isbn}
                  onClick={() => handleSelect(book)}
                  className="book-search-item"
                >
                  <Avatar
                    shape="square"
                    size={48}
                    src={book.cover}
                    className="book-search-cover"
                  />
                  <div className="book-search-info">
                    <div className="book-search-title">{book.title}</div>
                    <div className="book-search-author">{book.author}</div>
                  </div>
                </List.Item>
              )}
            />
          ) : query.length >= 3 ? (
            <Empty description="未找到相关书籍" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default BookSearch;
