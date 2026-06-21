import React, { useMemo, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { Bookmark } from '@/types';
import { useBookmarkStore } from '@/store';
import styles from './BookmarkCard.module.css';

interface BookmarkCardProps {
  bookmark: Bookmark;
  searchKeyword: string;
}

const highlightText = (text: string, keyword: string): React.ReactNode => {
  if (!keyword.trim()) return text;

  const lowerKeyword = keyword.toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(lowerKeyword);

  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className={styles.highlight}>
        {text.slice(index, index + keyword.length)}
      </mark>
      {text.slice(index + keyword.length)}
    </>
  );
};

const truncateUrl = (url: string, maxLength: number = 50): string => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    const pathname = urlObj.pathname;
    const full = hostname + pathname;
    if (full.length <= maxLength) return full;
    return hostname.slice(0, maxLength - 3) + '...';
  } catch {
    return url.length > maxLength ? url.slice(0, maxLength - 3) + '...' : url;
  }
};

export const BookmarkCard: React.FC<BookmarkCardProps> = React.memo(({ bookmark, searchKeyword }) => {
  const setSelectedBookmark = useBookmarkStore((state) => state.setSelectedBookmark);
  const setShowDetailPanel = useBookmarkStore((state) => state.setShowDetailPanel);
  const deleteBookmark = useBookmarkStore((state) => state.deleteBookmark);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClick = () => {
    if (isDeleting) return;
    setSelectedBookmark(bookmark);
    setShowDetailPanel(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setTimeout(() => {
      deleteBookmark(bookmark.id);
    }, 300);
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const displayTitle = useMemo(
    () => highlightText(bookmark.title, searchKeyword),
    [bookmark.title, searchKeyword]
  );

  const displayUrl = useMemo(
    () => highlightText(truncateUrl(bookmark.url), searchKeyword),
    [bookmark.url, searchKeyword]
  );

  return (
    <div
      className={`${styles.card} ${isDeleting ? styles.deleting : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <button
        className={styles.deleteBtn}
        onClick={handleDelete}
        aria-label="删除书签"
        title="删除书签"
      >
        <X size={16} />
      </button>

      <button
        className={styles.openLinkBtn}
        onClick={handleOpenLink}
        aria-label="打开链接"
        title="在新标签页打开"
      >
        <ExternalLink size={14} />
      </button>

      <h3 className={styles.title} title={bookmark.title}>
        {displayTitle}
      </h3>

      <p className={styles.url} title={bookmark.url}>
        {displayUrl}
      </p>

      <div className={styles.tags}>
        {bookmark.categories.map((category) => (
          <span key={category} className={styles.tag}>
            {category}
          </span>
        ))}
      </div>
    </div>
  );
});

BookmarkCard.displayName = 'BookmarkCard';
