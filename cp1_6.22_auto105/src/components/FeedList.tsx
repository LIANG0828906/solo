import React from 'react';
import { Source } from '../api';

interface FeedListProps {
  sources: Source[];
  onSourceClick: (sourceId: string) => void;
  newSourceId?: string | null;
}

const typeColors: Record<string, string> = {
  rss: '#F97316',
  youtube: '#EF4444',
  podcast: '#8B5CF6',
};

const typeLabels: Record<string, string> = {
  rss: 'RSS博客',
  youtube: 'YouTube频道',
  podcast: '播客',
};

const FeedList: React.FC<FeedListProps> = ({ sources, onSourceClick, newSourceId }) => {
  const renderIcon = (type: string, color: string) => {
    switch (type) {
      case 'rss':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
            <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z" />
          </svg>
        );
      case 'youtube':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
            <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
          </svg>
        );
      case 'podcast':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="feed-grid">
      {sources.map((source, index) => {
        const color = typeColors[source.type] || '#3B82F6';
        const isNew = source.id === newSourceId;

        return (
          <div
            key={source.id}
            onClick={() => onSourceClick(source.id)}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              position: 'relative',
              animation: isNew ? 'fadeIn 0.3s ease-out' : 'none',
              animationDelay: isNew ? '0s' : undefined,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: color,
                color: 'white',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                minWidth: '28px',
                textAlign: 'center',
                animation: source.unreadCount > 0 ? 'bounceScale 0.2s ease-out' : 'none',
              }}
              key={source.unreadCount}
            >
              {source.unreadCount}
            </div>

            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              {renderIcon(source.type, color)}
            </div>

            <div
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '4px',
              }}
            >
              {source.name}
            </div>
            <div
              style={{
                fontSize: '0.8125rem',
                color: '#6B7280',
              }}
            >
              {typeLabels[source.type] || source.type}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeedList;
