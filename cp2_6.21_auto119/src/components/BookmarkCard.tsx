import React, { useMemo, useState, useRef, useCallback } from 'react';
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
  const keywordLength = keyword.length;

  const indices: number[] = [];
  let startIndex = 0;
  while (startIndex < lowerText.length) {
    const idx = lowerText.indexOf(lowerKeyword, startIndex);
    if (idx === -1) break;
    indices.push(idx);
    startIndex = idx + keywordLength;
  }

  if (indices.length === 0) return text;

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  indices.forEach((index, i) => {
    if (index > lastEnd) {
      parts.push(text.slice(lastEnd, index));
    }
    parts.push(
      <mark key={`${index}-${i}`} className={styles.highlight}>
        {text.slice(index, index + keywordLength)}
      </mark>
    );
    lastEnd = index + keywordLength;
  });

  if (lastEnd < text.length) {
    parts.push(text.slice(lastEnd));
  }

  return <>{parts}</>;
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
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (
        isDeleting &&
        (e.propertyName === 'transform' || e.propertyName === 'opacity')
      ) {
        if (cardRef.current && cardRef.current.classList.contains(styles.slideOut)) {
          deleteBookmark(bookmark.id);
        }
      }
    },
    [isDeleting, bookmark.id, deleteBookmark]
  );

  const handleClick = () => {
    if (isDeleting) return;
    setSelectedBookmark(bookmark);
    setShowDetailPanel(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isDeleting) return;
    setIsDeleting(true);
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

  const cardClassName = `${styles.card} ${isDeleting ? styles.slideOut : ''}`;

  return (
    <div
      ref={cardRef}
      className={cardClassName}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onTransitionEnd={handleTransitionEnd}
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
