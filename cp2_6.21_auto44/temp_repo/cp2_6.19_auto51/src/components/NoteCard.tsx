import React from 'react';
import { Note } from '@/types';

const tagColorCache = new Map<string, string>();

function getTagColor(tag: string): string {
  if (tagColorCache.has(tag)) return tagColorCache.get(tag)!;
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  const color = `hsl(${h}, 65%, 55%)`;
  tagColorCache.set(tag, color);
  return color;
}

function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}个月前`;
  const years = Math.floor(months / 12);
  return `${years}年前`;
}

function stripMarkdown(content: string): string {
  return content
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^[*\-+]\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  isNew?: boolean;
  isHidden?: boolean;
  isFilteredOut?: boolean;
  animationIndex?: number;
}

const NoteCard = React.forwardRef<HTMLDivElement, NoteCardProps>(
  (
    {
      note,
      onClick,
      isNew = false,
      isHidden = false,
      isFilteredOut = false,
      animationIndex = 0,
    },
    ref
  ) => {
    const summary = stripMarkdown(note.content).slice(0, 120);

    const classNames = ['note-card'];
    const styles: React.CSSProperties = {};

    if (isNew) {
      classNames.push('note-card-fly-in');
    } else if (isFilteredOut) {
      classNames.push('note-card-filter-out');
    } else if (isHidden) {
      classNames.push('note-card-hidden');
    } else {
      classNames.push('note-card-staggered');
      styles.animationDelay = `${animationIndex * 0.05}s`;
    }

    return (
      <div
        ref={ref}
        className={classNames.join(' ')}
        style={styles}
        onClick={() => !isFilteredOut && !isHidden && onClick(note)}
      >
        <div className="note-card-tags">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="note-tag-badge"
              style={{
                backgroundColor: getTagColor(tag) + '20',
                color: getTagColor(tag),
                borderColor: getTagColor(tag) + '40',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="note-card-title">{note.title}</h3>
        {summary && <p className="note-card-summary">{summary}</p>}
        <div className="note-card-time">{getRelativeTime(note.createdAt)}</div>
      </div>
    );
  }
);

NoteCard.displayName = 'NoteCard';

export default NoteCard;
export { getTagColor, getRelativeTime };
