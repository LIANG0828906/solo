import React, { useState, useEffect, useCallback } from 'react';
import BookmarkCard from './BookmarkCard';
import FilterBar from './FilterBar';
import { fetchBookmarks, fetchTags } from './api';
import type { Bookmark } from './types';

const App: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const loadBookmarks = useCallback(async (search?: string, tag?: string | null) => {
    try {
      setLoading(true);
      const data = await fetchBookmarks(search, tag || undefined);
      setBookmarks(data);
      setAnimationKey(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [bookmarksData, tagsData] = await Promise.all([
          fetchBookmarks(),
          fetchTags(),
        ]);
        setBookmarks(bookmarksData);
        setTags(tagsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBookmarks(searchQuery, selectedTag);
    }, 50);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedTag, loadBookmarks]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleTagSelect = useCallback((tag: string | null) => {
    setSelectedTag(tag);
  }, []);

  const handleCardClick = useCallback((bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    setTimeout(() => setIsModalVisible(true), 10);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setTimeout(() => {
      setSelectedBookmark(null);
    }, 400);
  }, []);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalVisible) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isModalVisible, handleCloseModal]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">我的阅读书架</h1>
        <p className="app-subtitle">收藏、整理、阅读 — 让知识触手可及</p>
      </header>

      <FilterBar
        tags={tags}
        selectedTag={selectedTag}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onTagSelect={handleTagSelect}
      />

      <main>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <p className="empty-state-text">{error}</p>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <p className="empty-state-text">没有找到匹配的书签</p>
          </div>
        ) : (
          <div className="bookmarks-grid" key={animationKey}>
            {bookmarks.map((bookmark, index) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                index={index}
                onClick={() => handleCardClick(bookmark)}
              />
            ))}
          </div>
        )}
      </main>

      {selectedBookmark && (
        <>
          <div
            className={`modal-overlay ${isModalVisible ? 'visible' : ''}`}
            onClick={handleCloseModal}
          />
          <div
            className={`modal-content ${isModalVisible ? 'visible' : ''}`}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="modal-close"
              onClick={handleCloseModal}
              aria-label="关闭"
            >
              ×
            </button>
            <div className="modal-header">
              <img
                src={selectedBookmark.favicon}
                alt=""
                className="modal-favicon"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300d4ff"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.82l7 3.5v6.86l-7-3.5V9.82zm9 10.36v-6.86l7-3.5v6.86l-7 3.5z"/></svg>';
                }}
              />
              <div>
                <h2 className="modal-title">{selectedBookmark.title}</h2>
                <a
                  href={selectedBookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-url"
                >
                  {selectedBookmark.url}
                </a>
              </div>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">摘要</h3>
              <p className="modal-summary">{selectedBookmark.summary}</p>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">标签</h3>
              <div className="modal-tags">
                {selectedBookmark.tags.map(tag => (
                  <span key={tag} className="card-tag cyan">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {selectedBookmark.notes && (
              <div className="modal-section">
                <h3 className="modal-section-title">阅读笔记</h3>
                <div className="modal-notes">{selectedBookmark.notes}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default App;
