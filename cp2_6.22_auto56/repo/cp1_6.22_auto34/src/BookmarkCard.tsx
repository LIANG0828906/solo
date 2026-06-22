import React, { useMemo } from 'react';
import type { Bookmark } from './types';

interface BookmarkCardProps {
  bookmark: Bookmark;
  index: number;
  onClick: () => void;
}

const TAG_COLORS = ['cyan', 'amber', 'pink', 'green', 'purple'] as const;

function getTagColorClass(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, index, onClick }) => {
  const tagColors = useMemo(
    () => bookmark.tags.map(tag => getTagColorClass(tag)),
    [bookmark.tags]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="bookmark-card"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="card-header">
        <img
          src={bookmark.favicon}
          alt=""
          className="favicon"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300d4ff"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.82l7 3.5v6.86l-7-3.5V9.82zm9 10.36v-6.86l7-3.5v6.86l-7 3.5z"/></svg>';
          }}
        />
        <h3 className="card-title">{bookmark.title}</h3>
      </div>
      <p className="card-summary">{bookmark.summary}</p>
      <div className="card-tags">
        {bookmark.tags.map((tag, i) => (
          <span key={tag} className={`card-tag ${tagColors[i]}`}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BookmarkCard;
