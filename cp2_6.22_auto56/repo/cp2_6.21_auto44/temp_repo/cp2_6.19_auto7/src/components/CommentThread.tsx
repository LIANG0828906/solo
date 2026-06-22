import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CommentThread, User, Comment } from '../utils/annotationManager';
import { annotationManager } from '../utils/annotationManager';

interface CommentThreadPanelProps {
  threads: CommentThread[];
  highlightedThreadId: string | null;
  currentUser: User;
  onThreadClick: (threadId: string) => void;
  onHighlightChange: (threadId: string | null) => void;
}

interface VirtualListProps {
  threads: CommentThread[];
  highlightedThreadId: string | null;
  currentUser: User;
  onThreadClick: (threadId: string) => void;
  onHighlightChange: (threadId: string | null) => void;
}

const ITEM_HEIGHT_ESTIMATE = 200;
const BUFFER_ITEMS = 3;

const CommentCard: React.FC<{
  comment: Comment;
  isNew: boolean;
  index: number;
}> = ({ comment, isNew, index }) => {
  return (
    <div
      style={{
        ...styles.commentCard,
        opacity: 0,
        animation: `fadeInScale 0.3s ease-out ${index * 0.05}s forwards`,
      }}
    >
      <div style={styles.commentAvatar}>{comment.authorAvatar}</div>
      <div style={styles.commentContent}>
        <div style={styles.commentHeader}>
          <span style={styles.commentAuthor}>{comment.authorName}</span>
          {isNew && <span style={styles.newBadge}>新</span>}
        </div>
        <p style={styles.commentText}>{comment.content}</p>
        <span style={styles.commentTime}>
          {new Date(comment.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};

const ThreadItem: React.FC<{
  thread: CommentThread;
  index: number;
  isHighlighted: boolean;
  currentUser: User;
  onToggle: () => void;
  onCommentSubmit: (content: string) => void;
}> = ({ thread, index, isHighlighted, currentUser, onToggle, onCommentSubmit }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const hasUnread = thread.comments.some((c) => c.isNew);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim()) {
        onCommentSubmit(inputValue.trim());
        setInputValue('');
      }
    },
    [inputValue, onCommentSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  useEffect(() => {
    if (!thread.isCollapsed) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    }
  }, [thread.isCollapsed]);

  const threadNumber = index + 1;

  return (
    <div
      style={{
        ...styles.threadItem,
        ...(isHighlighted ? styles.threadItemHighlighted : {}),
      }}
    >
      <div style={styles.threadHeader} onClick={onToggle}>
        <div style={styles.threadHeaderLeft}>
          {hasUnread && <div style={styles.unreadDot} />}
          <div style={styles.threadAnchorBadge}>#{threadNumber}</div>
          <span style={styles.threadCount}>{thread.comments.length} 条评论</span>
        </div>
        <span
          style={{
            ...styles.expandIcon,
            transform: thread.isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </div>

      <div
        ref={contentRef}
        style={{
          ...styles.threadContent,
          maxHeight: thread.isCollapsed ? '0px' : '1000px',
          opacity: thread.isCollapsed ? 0 : 1,
        }}
      >
        <div style={styles.commentsList}>
          {thread.comments.map((comment, idx) => (
            <CommentCard key={comment.id} comment={comment} isNew={comment.isNew} index={idx} />
          ))}
        </div>

        <form style={styles.commentInputForm} onSubmit={handleSubmit}>
          <div style={styles.inputAvatar}>{currentUser.avatar}</div>
          <input
            ref={inputRef}
            type="text"
            style={styles.commentInput}
            placeholder="添加评论..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" style={styles.sendButton} disabled={!inputValue.trim()}>
            发送
          </button>
        </form>
      </div>
    </div>
  );
};

const VirtualThreadList: React.FC<VirtualListProps> = ({
  threads,
  highlightedThreadId,
  currentUser,
  onThreadClick,
  onHighlightChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const threadHeights = useMemo(() => {
    return threads.map((thread) => {
      const baseHeight = 52;
      if (thread.isCollapsed) return baseHeight;
      const commentsHeight = thread.comments.length * 72 + 48;
      return baseHeight + commentsHeight + 20;
    });
  }, [threads]);

  const { startIndex, endIndex, topOffsets } = useMemo(() => {
    const offsets: number[] = [];
    let current = 0;
    for (const h of threadHeights) {
      offsets.push(current);
      current += h;
    }
    const totalHeight = current;

    let startIdx = 0;
    for (let i = 0; i < offsets.length; i++) {
      if (offsets[i] + threadHeights[i] >= scrollTop - 100) {
        startIdx = Math.max(0, i - BUFFER_ITEMS);
        break;
      }
    }

    let endIdx = threadHeights.length - 1;
    const visibleBottom = scrollTop + containerHeight + 100;
    for (let i = startIdx; i < offsets.length; i++) {
      if (offsets[i] > visibleBottom) {
        endIdx = Math.min(threadHeights.length - 1, i + BUFFER_ITEMS);
        break;
      }
    }

    return {
      startIndex: startIdx,
      endIndex: endIdx,
      topOffsets: offsets,
      totalHeight,
    };
  }, [threadHeights, scrollTop, containerHeight]);

  const totalHeight = useMemo(() => {
    return threadHeights.reduce((sum, h) => sum + h, 0);
  }, [threadHeights]);

  const visibleThreads = useMemo(() => {
    return threads.slice(startIndex, endIndex + 1).map((thread, idx) => ({
      thread,
      index: startIndex + idx,
      top: topOffsets[startIndex + idx],
      height: threadHeights[startIndex + idx],
    }));
  }, [threads, startIndex, endIndex, topOffsets, threadHeights]);

  useEffect(() => {
    if (highlightedThreadId && containerRef.current) {
      const threadIdx = threads.findIndex((t) => t.id === highlightedThreadId);
      if (threadIdx >= 0) {
        const targetTop = topOffsets[threadIdx];
        containerRef.current.scrollTo({
          top: targetTop - 20,
          behavior: 'smooth',
        });
        setTimeout(() => {
          onHighlightChange(null);
        }, 1000);
      }
    }
  }, [highlightedThreadId, threads, topOffsets, onHighlightChange]);

  const handleToggle = useCallback(
    (threadId: string) => {
      annotationManager.toggleThreadCollapse(threadId);
      annotationManager.markThreadRead(threadId);
      onThreadClick(threadId);
    },
    [onThreadClick]
  );

  const handleCommentSubmit = useCallback(
    (threadId: string, content: string) => {
      annotationManager.addComment(threadId, {
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        content,
      });
    },
    [currentUser]
  );

  return (
    <div ref={containerRef} style={styles.threadsContainer} onScroll={handleScroll}>
      <div style={{ ...styles.threadsSpacer, height: totalHeight }}>
        {visibleThreads.map(({ thread, index, top, height }) => (
          <div
            key={thread.id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${top}px)`,
              height: height,
            }}
          >
            <ThreadItem
              thread={thread}
              index={index}
              isHighlighted={highlightedThreadId === thread.id}
              currentUser={currentUser}
              onToggle={() => handleToggle(thread.id)}
              onCommentSubmit={(content) => handleCommentSubmit(thread.id, content)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const CommentThreadPanel: React.FC<CommentThreadPanelProps> = ({
  threads,
  highlightedThreadId,
  currentUser,
  onThreadClick,
  onHighlightChange,
}) => {
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>批注线程</h3>
        <span style={styles.countBadge}>{threads.length} 个批注</span>
      </div>

      {threads.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>💬</div>
          <p style={styles.emptyText}>暂无批注</p>
          <p style={styles.emptySubtext}>右键点击标注添加批注</p>
        </div>
      ) : (
        <VirtualThreadList
          threads={threads}
          highlightedThreadId={highlightedThreadId}
          currentUser={currentUser}
          onThreadClick={onThreadClick}
          onHighlightChange={onHighlightChange}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  countBadge: {
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  threadsContainer: {
    flex: 1,
    overflowY: 'auto',
    position: 'relative',
  },
  threadsSpacer: {
    position: 'relative',
    width: '100%',
  },
  threadItem: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s ease-out',
  },
  threadItemHighlighted: {
    backgroundColor: '#e3f2fd',
  },
  threadHeader: {
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.15s ease-out',
  },
  threadHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#f44336',
    flexShrink: 0,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  threadAnchorBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#f44336',
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadCount: {
    fontSize: '13px',
    color: '#666',
  },
  expandIcon: {
    fontSize: '10px',
    color: '#999',
    transition: 'transform 0.2s ease-out',
  },
  threadContent: {
    overflow: 'hidden',
    transition: 'max-height 0.2s ease-out, opacity 0.2s ease-out',
    padding: '0 16px 12px',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  commentCard: {
    display: 'flex',
    gap: '10px',
    padding: '10px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  commentAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  },
  commentContent: {
    flex: 1,
    minWidth: 0,
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px',
  },
  commentAuthor: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
  },
  newBadge: {
    fontSize: '10px',
    backgroundColor: '#f44336',
    color: 'white',
    padding: '1px 5px',
    borderRadius: '4px',
    fontWeight: 500,
  },
  commentText: {
    fontSize: '13px',
    color: '#444',
    lineHeight: '1.4',
    margin: '0 0 4px 0',
    wordBreak: 'break-word',
  },
  commentTime: {
    fontSize: '11px',
    color: '#999',
  },
  commentInputForm: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  inputAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    flexShrink: 0,
  },
  commentInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '20px',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.15s ease-out',
  },
  sendButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '16px',
    backgroundColor: '#1565c0',
    color: 'white',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease-out',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: '#999',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#666',
    margin: '0 0 4px 0',
  },
  emptySubtext: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
  },
};

export default CommentThreadPanel;
