import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { CommitData, FileChange, HighlightState } from '../types';

interface ActivityTimelineProps {
  commits: CommitData[];
  highlight: HighlightState;
  setHighlight: React.Dispatch<React.SetStateAction<HighlightState>>;
}

const AVATAR_COLORS = [
  '#00d2ff', '#10b981', '#fbbf24', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const ITEM_HEIGHT = 90;
const VIRTUAL_THRESHOLD = 100;
const MAX_VISIBLE_ITEMS = 20;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getAvatarColor(author: string): string {
  let hash = 0;
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(author: string): string {
  const parts = author.split(/[\s.-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return author.slice(0, 2).toUpperCase();
}

const TimelineItem: React.FC<{
  commit: CommitData;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  style?: React.CSSProperties;
}> = ({ commit, index, isExpanded, onToggle, style }) => {
  const [isHovered, setIsHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [commit.files, isExpanded]);

  const shaShort = commit.sha.slice(0, 7);
  const avatarColor = getAvatarColor(commit.author);
  const initials = getInitials(commit.author);
  const formattedDate = formatDate(commit.date);

  return (
    <div
      className="activity-timeline-item"
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="activity-timeline-left">
        <div
          className="activity-timeline-line"
          style={{
            backgroundColor: isHovered ? '#00d2ff' : '#0f3460',
            width: isHovered ? '3px' : '2px'
          }}
        />
        <div className="activity-timeline-dot" />
      </div>

      <div className="activity-timeline-content" onClick={onToggle}>
        <div className="activity-timeline-header">
          <div
            className="activity-avatar"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
          <div className="activity-timeline-main">
            <div className="activity-timeline-top">
              <span className="activity-sha mono">{shaShort}</span>
              <span className="activity-author">{commit.author}</span>
              <span className="activity-file-count">
                {commit.files.length} 个文件
              </span>
            </div>
            <div className="activity-timeline-date">{formattedDate}</div>
            <div className="activity-timeline-message">{commit.message}</div>
          </div>
          <div className="activity-expand-icon" style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}>
            ▼
          </div>
        </div>

        <div
          className="activity-files-container"
          style={{
            height: isExpanded ? `${contentHeight}px` : '0px',
            transition: 'height 0.2s ease',
            overflow: 'hidden'
          }}
        >
          <div ref={contentRef} className="activity-files-list">
            {commit.files.map((file: FileChange, fileIndex: number) => (
              <div key={fileIndex} className="activity-file-item">
                <span className="activity-file-name">{file.filename}</span>
                <div className="activity-file-stats">
                  <span className="activity-additions">+{file.additions}</span>
                  <span className="activity-deletions">-{file.deletions}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .activity-timeline-item {
          display: flex;
          position: relative;
          padding-bottom: 20px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-radius: 8px;
        }

        .activity-timeline-item:hover {
          background-color: rgba(0, 210, 255, 0.05);
        }

        .activity-timeline-left {
          position: relative;
          width: 40px;
          flex-shrink: 0;
        }

        .activity-timeline-line {
          position: absolute;
          left: 19px;
          top: 24px;
          bottom: -20px;
          transition: all 0.2s ease;
        }

        .activity-timeline-item:last-child .activity-timeline-line {
          display: none;
        }

        .activity-timeline-dot {
          position: absolute;
          left: 12px;
          top: 8px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #00d2ff;
          border: 3px solid #16213e;
          z-index: 1;
          transition: all 0.2s ease;
        }

        .activity-timeline-item:hover .activity-timeline-dot {
          box-shadow: 0 0 10px rgba(0, 210, 255, 0.6);
          transform: scale(1.1);
        }

        .activity-timeline-content {
          flex: 1;
          padding-left: 10px;
        }

        .activity-timeline-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .activity-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a1a2e;
          font-weight: 600;
          font-size: 13px;
          flex-shrink: 0;
        }

        .activity-timeline-main {
          flex: 1;
          min-width: 0;
        }

        .activity-timeline-top {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .activity-sha {
          color: #00d2ff;
          font-size: 13px;
          font-weight: 500;
        }

        .activity-author {
          color: #e0e0e0;
          font-size: 14px;
          font-weight: 500;
        }

        .activity-file-count {
          color: #9ca3af;
          font-size: 12px;
          background-color: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: 10px;
        }

        .activity-timeline-date {
          color: #9ca3af;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .activity-timeline-message {
          color: #e0e0e0;
          font-size: 14px;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .activity-expand-icon {
          color: #9ca3af;
          font-size: 12px;
          padding: 4px;
          flex-shrink: 0;
        }

        .activity-files-container {
          margin-top: 12px;
          margin-left: 48px;
        }

        .activity-files-list {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 12px;
          border-left: 3px solid #00d2ff;
        }

        .activity-file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .activity-file-item:last-child {
          border-bottom: none;
        }

        .activity-file-name {
          color: #e0e0e0;
          font-size: 13px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 12px;
        }

        .activity-file-stats {
          display: flex;
          gap: 12px;
          flex-shrink: 0;
        }

        .activity-additions {
          color: #10b981;
          font-size: 13px;
          font-weight: 500;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }

        .activity-deletions {
          color: #ef4444;
          font-size: 13px;
          font-weight: 500;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }

        @media (max-width: 768px) {
          .activity-sha,
          .activity-author,
          .activity-timeline-message,
          .activity-file-name,
          .activity-additions,
          .activity-deletions {
            font-size: 14px;
          }

          .activity-timeline-left {
            width: 32px;
          }

          .activity-timeline-line {
            left: 15px;
          }

          .activity-timeline-dot {
            left: 8px;
          }

          .activity-avatar {
            width: 32px;
            height: 32px;
            font-size: 12px;
          }

          .activity-files-container {
            margin-left: 44px;
          }
        }
      `}</style>
    </div>
  );
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ commits, highlight, setHighlight }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());

  const filteredCommits = useMemo(() => {
    return commits
      .filter((commit) => {
        if (highlight.date && !commit.date.startsWith(highlight.date)) return false;
        if (highlight.author && commit.author !== highlight.author) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [commits, highlight]);

  const sortedCommits = filteredCommits;

  const useVirtualScroll = sortedCommits.length > VIRTUAL_THRESHOLD;

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const toggleExpand = useCallback((sha: string) => {
    setExpandedCommits(prev => {
      const next = new Set(prev);
      if (next.has(sha)) {
        next.delete(sha);
      } else {
        next.add(sha);
      }
      return next;
    });
  }, []);

  const handleItemClick = useCallback((commit: CommitData) => {
    setHighlight({
      date: commit.date.split('T')[0],
      author: commit.author,
    });
  }, [setHighlight]);

  const visibleCommits = useMemo(() => {
    if (!useVirtualScroll) {
      return sortedCommits.map((commit, index) => ({
        commit,
        index,
        offset: 0
      }));
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 5);
    const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + 10;
    const endIndex = Math.min(
      sortedCommits.length,
      startIndex + Math.min(visibleCount, MAX_VISIBLE_ITEMS)
    );

    return sortedCommits.slice(startIndex, endIndex).map((commit, i) => ({
      commit,
      index: startIndex + i,
      offset: startIndex * ITEM_HEIGHT
    }));
  }, [sortedCommits, scrollTop, containerHeight, useVirtualScroll]);

  const totalHeight = useVirtualScroll ? sortedCommits.length * ITEM_HEIGHT : 'auto';

  return (
    <div className="activity-timeline-wrapper">
      <div className="activity-timeline-header-section">
        <h3 className="activity-timeline-title">提交活动时间线</h3>
        <span className="activity-timeline-count">
          共 {sortedCommits.length} 条记录
          {(highlight.date || highlight.author) && (
            <button
              className="clear-filter-btn"
              onClick={() => setHighlight({ date: null, author: null })}
            >
              清除筛选
            </button>
          )}
          {useVirtualScroll && <span className="virtual-badge">虚拟滚动已启用</span>}
        </span>
      </div>
      <div
        ref={containerRef}
        className="activity-timeline-scroll-container"
        onScroll={handleScroll}
      >
        <div
          className="activity-timeline-inner"
          style={{
            height: totalHeight,
            position: useVirtualScroll ? 'relative' : 'static',
            paddingTop: useVirtualScroll ? 0 : '10px'
          }}
        >
          {visibleCommits.map(({ commit, index, offset }) => {
            const isHighlighted =
              highlight.date === commit.date.split('T')[0] ||
              highlight.author === commit.author;

            return (
              <div
                key={commit.sha}
                className={isHighlighted ? 'timeline-item-highlighted' : ''}
                onClick={() => handleItemClick(commit)}
                style={useVirtualScroll ? {
                  position: 'absolute',
                  top: offset + index * ITEM_HEIGHT,
                  left: 0,
                  right: 0,
                  height: ITEM_HEIGHT
                } : undefined}
              >
                <TimelineItem
                  commit={commit}
                  index={index}
                  isExpanded={expandedCommits.has(commit.sha)}
                  onToggle={(e) => {
                    e.stopPropagation();
                    toggleExpand(commit.sha);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .activity-timeline-wrapper {
          background-color: rgba(22, 33, 62, 0.6);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .activity-timeline-header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(0, 210, 255, 0.15);
          flex-shrink: 0;
        }

        .activity-timeline-title {
          color: #e0e0e0;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .activity-timeline-count {
          color: #9ca3af;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .virtual-badge {
          background-color: rgba(0, 210, 255, 0.15);
          color: #00d2ff;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .activity-timeline-scroll-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 10px 20px 20px;
          min-height: 0;
        }

        .activity-timeline-inner {
          width: 100%;
        }

        @media (max-width: 768px) {
          .activity-timeline-header-section {
            padding: 12px 15px;
          }

          .activity-timeline-title {
            font-size: 14px;
          }

          .activity-timeline-count {
            font-size: 12px;
          }

          .activity-timeline-scroll-container {
            padding: 10px 15px 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default ActivityTimeline;
