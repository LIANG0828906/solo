import React from 'react';
import { useLibrary } from '@/context/LibraryContext';

type PageType = 'books' | 'plan' | 'board';

interface NavbarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Navbar({ currentPage, onPageChange, searchQuery, onSearchChange }: NavbarProps) {
  const { books } = useLibrary();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => onPageChange('books')}>
          <svg className="brand-logo" viewBox="0 0 32 32" width="32" height="32">
            <path d="M4 6C4 6 8 4 16 4C24 4 28 6 28 6V26C28 26 24 24 16 24C8 24 4 26 4 26V6Z" fill="none" stroke="#F5F0E8" strokeWidth="2"/>
            <line x1="16" y1="4" x2="16" y2="24" stroke="#F5F0E8" strokeWidth="1.5"/>
            <path d="M8 8C8 8 11 7 14 7" stroke="#D4A76A" strokeWidth="1" strokeLinecap="round"/>
            <path d="M8 12C8 12 11 11 14 11" stroke="#D4A76A" strokeWidth="1" strokeLinecap="round"/>
            <path d="M18 8C18 8 21 7 24 7" stroke="#D4A76A" strokeWidth="1" strokeLinecap="round"/>
            <path d="M18 12C18 12 21 11 24 11" stroke="#D4A76A" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          <span className="brand-text">藏书阁</span>
        </div>

        <div className="navbar-search">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索书名、作者..."
              className="search-input"
            />
          </div>
        </div>

        <div className="navbar-tabs">
          {([
            ['books', '藏书列表'],
            ['plan', '阅读计划'],
            ['board', '进度看板'],
          ] as [PageType, string][]).map(([key, label]) => (
            <button
              key={key}
              className={`nav-tab ${currentPage === key ? 'active' : ''}`}
              onClick={() => onPageChange(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="navbar-stats">
          <span className="stat-item">📚 {books.length}</span>
        </div>
      </div>
    </nav>
  );
}
