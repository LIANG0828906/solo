import React, { useState, useEffect } from 'react';
import { useTabContext } from '@/context/TabContext';
import { bookmarks } from '@/data/bookmarks';
import { MAX_TABS } from '@/utils/tabUtils';
import './BookmarkManager.css';

const BookmarkManager: React.FC = () => {
  const { state, dispatch } = useTabContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBookmarkClick = (url: string, name: string) => {
    if (state.tabs.length >= MAX_TABS) {
      alert(`最多只能打开 ${MAX_TABS} 个标签页`);
      return;
    }
    dispatch({ type: 'ADD_TAB', payload: { url, title: name } });
    setIsOpen(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <button
        className={`menu-btn ${isMobile ? 'mobile' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="打开书签管理器"
      >
        <div className="menu-icon">
          <span />
          <span />
          <span />
        </div>
        {isMobile && <span className="menu-label">书签</span>}
      </button>

      {isOpen && (
        <div className="bookmark-overlay" onClick={handleOverlayClick}>
          <div className="bookmark-sidebar">
            <div className="sidebar-header">
              <h2>书签</h2>
              <button
                className="close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="关闭书签管理器"
              >
                ×
              </button>
            </div>
            <div className="bookmark-list">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bookmark-card"
                  onClick={() => handleBookmarkClick(bookmark.url, bookmark.name)}
                >
                  <div className="bookmark-favicon">
                    <img
                      src={bookmark.favicon}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=32`;
                      }}
                    />
                  </div>
                  <div className="bookmark-info">
                    <span className="bookmark-name">{bookmark.name}</span>
                    <span className="bookmark-url">{bookmark.url}</span>
                  </div>
                  <div className="bookmark-arrow">→</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(BookmarkManager);
