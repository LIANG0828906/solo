import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { create } from 'zustand';
import { dataManager, type DiaryEntry } from '../data/DataManager';

interface AppState {
  entries: DiaryEntry[];
  hasMore: boolean;
  page: number;
  loading: boolean;
  selectedTags: string[];
  allTags: { tag: string; count: number }[];
  showModal: boolean;
  showFullContent: DiaryEntry | null;
  expandedComments: Set<string>;
  likeAnimating: Set<string>;
  ripple: { x: number; y: number; id: number } | null;
  newEntryIds: Set<string>;
}

interface AppActions {
  init: () => Promise<void>;
  loadMore: () => Promise<void>;
  toggleTag: (tag: string) => Promise<void>;
  clearTags: () => Promise<void>;
  createDiary: (content: string, tags: string[]) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  addComment: (id: string, content: string) => Promise<void>;
  setShowModal: (show: boolean) => void;
  setShowFullContent: (entry: DiaryEntry | null) => void;
  toggleComments: (id: string) => void;
  setRipple: (ripple: { x: number; y: number; id: number } | null) => void;
  clearNewEntry: (id: string) => void;
}

const useStore = create<AppState & AppActions>((set, get) => ({
  entries: [],
  hasMore: true,
  page: 1,
  loading: false,
  selectedTags: [],
  allTags: [],
  showModal: false,
  showFullContent: null,
  expandedComments: new Set(),
  likeAnimating: new Set(),
  ripple: null,
  newEntryIds: new Set(),

  init: async () => {
    await dataManager.init();
    await dataManager.seedMockData();
    const [result, tags] = await Promise.all([
      dataManager.getDiaries(1, []),
      dataManager.getAllTags()
    ]);
    set({
      entries: result.entries,
      hasMore: result.hasMore,
      page: 1,
      allTags: tags
    });
  },

  loadMore: async () => {
    const { loading, hasMore, page, selectedTags, entries, newEntryIds } = get();
    if (loading || !hasMore) return;
    set({ loading: true });
    const nextPage = page + 1;
    const result = await dataManager.getDiaries(nextPage, selectedTags);
    const newIds = new Set(newEntryIds);
    result.entries.forEach(entry => newIds.add(entry.id));
    set({
      entries: [...entries, ...result.entries],
      hasMore: result.hasMore,
      page: nextPage,
      loading: false,
      newEntryIds: newIds
    });
  },

  toggleTag: async (tag: string) => {
    const { selectedTags } = get();
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    set({ selectedTags: newTags, loading: true });
    const result = await dataManager.getDiaries(1, newTags);
    set({
      entries: result.entries,
      hasMore: result.hasMore,
      page: 1,
      loading: false
    });
  },

  clearTags: async () => {
    set({ selectedTags: [], loading: true });
    const result = await dataManager.getDiaries(1, []);
    set({
      entries: result.entries,
      hasMore: result.hasMore,
      page: 1,
      loading: false
    });
  },

  createDiary: async (content: string, tags: string[]) => {
    const { selectedTags } = get();
    await dataManager.createDiary(content, tags);
    const [result, allTags] = await Promise.all([
      dataManager.getDiaries(1, selectedTags),
      dataManager.getAllTags()
    ]);
    set({
      entries: result.entries,
      hasMore: result.hasMore,
      page: 1,
      allTags,
      showModal: false
    });
  },

  toggleLike: async (id: string) => {
    const { entries, likeAnimating } = get();
    const newAnimating = new Set(likeAnimating);
    newAnimating.add(id);
    set({ likeAnimating: newAnimating });

    const updated = await dataManager.toggleLike(id);
    if (updated) {
      set({
        entries: entries.map(e => e.id === id ? updated : e)
      });
    }

    setTimeout(() => {
      const { likeAnimating: current } = get();
      const next = new Set(current);
      next.delete(id);
      set({ likeAnimating: next });
    }, 300);
  },

  addComment: async (id: string, content: string) => {
    const { entries } = get();
    const updated = await dataManager.addComment(id, content);
    if (updated) {
      set({
        entries: entries.map(e => e.id === id ? updated : e)
      });
    }
  },

  setShowModal: (show: boolean) => set({ showModal: show }),
  setShowFullContent: (entry: DiaryEntry | null) => set({ showFullContent: entry }),
  
  toggleComments: (id: string) => {
    const { expandedComments } = get();
    const next = new Set(expandedComments);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ expandedComments: next });
  },

  setRipple: (ripple) => set({ ripple }),

  clearNewEntry: (id: string) => {
    const { newEntryIds } = get();
    const next = new Set(newEntryIds);
    next.delete(id);
    set({ newEntryIds: next });
  }
}));

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#0F0F23',
    color: '#E0E0F0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    paddingBottom: 100
  },
  header: {
    padding: '24px 20px 16px',
    maxWidth: 1200,
    margin: '0 auto'
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #6C63FF, #4A4ADB)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0
  },
  subtitle: {
    color: '#8E8EA0',
    fontSize: 14,
    marginTop: 4
  },
  tagCloud: {
    backgroundColor: '#16162A',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center'
  },
  filterBar: {
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    padding: '8px 16px',
    marginTop: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 14
  },
  filterText: {
    color: '#B0B0D0'
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#8E8EA0',
    cursor: 'pointer',
    fontSize: 18,
    padding: '4px 8px',
    transition: 'color 0.2s'
  },
  masonryContainer: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '20px',
    position: 'relative'
  },
  masonryColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #2D2D4A',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    transition: 'border-color 0.25s ease-out, transform 0.25s ease-out, box-shadow 0.25s ease-out',
    cursor: 'pointer'
  },
  cardHover: {
    borderColor: '#6C63FF',
    transform: 'translateY(-4px)',
    boxShadow: '0 4px 16px rgba(108, 99, 255, 0.3)'
  },
  cardEnter: {
    animation: 'cardSlideIn 0.4s ease-out forwards'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '2px solid #6C63FF',
    objectFit: 'cover',
    flexShrink: 0
  },
  userInfo: {
    flex: 1,
    minWidth: 0
  },
  nickname: {
    fontWeight: 600,
    fontSize: 14,
    color: '#E0E0F0'
  },
  time: {
    fontSize: 12,
    color: '#8E8EA0',
    marginTop: 2
  },
  content: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#E0E0F0',
    marginBottom: 12,
    wordBreak: 'break-word'
  },
  readMore: {
    color: '#6C63FF',
    fontSize: 13,
    cursor: 'pointer',
    marginLeft: 4,
    transition: 'color 0.2s'
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12
  },
  tagPill: {
    backgroundColor: '#2D2D4A',
    borderRadius: 16,
    padding: '4px 12px',
    fontSize: 12,
    color: '#B0B0D0',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    border: '2px solid transparent'
  },
  tagPillSelected: {
    borderColor: '#FFD700'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTop: '1px solid #2D2D4A'
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontSize: 13,
    color: '#8E8EA0',
    transition: 'color 0.2s'
  },
  likeBtn: {
    color: '#555'
  },
  likeBtnLiked: {
    color: '#FF4757'
  },
  likeAnim: {
    animation: 'likeScale 0.3s ease-in-out'
  },
  commentSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #2D2D4A'
  },
  commentInput: {
    width: '100%',
    backgroundColor: '#2D2D4A',
    borderRadius: 8,
    border: '1px solid #3D3D5C',
    color: '#E0E0F0',
    padding: '10px 12px',
    fontSize: 13,
    outline: 'none',
    resize: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  commentList: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  commentItem: {
    backgroundColor: '#2D2D4A',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    color: '#B0B0D0'
  },
  commentContent: {
    color: '#E0E0F0',
    marginTop: 4
  },
  fab: {
    position: 'fixed',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6C63FF, #4A4ADB)',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(108, 99, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: 28,
    transition: 'transform 0.2s, box-shadow 0.2s',
    zIndex: 100,
    overflow: 'hidden'
  },
  fabHover: {
    transform: 'scale(1.1)',
    boxShadow: '0 6px 25px rgba(108, 99, 255, 0.6)'
  },
  ripple: {
    position: 'absolute',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: 'scale(0)',
    animation: 'rippleExpand 0.6s ease-out forwards',
    pointerEvents: 'none'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    animation: 'fadeIn 0.3s ease-out'
  },
  modal: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90vh',
    padding: 32,
    animation: 'slideUp 0.3s ease-out',
    overflowY: 'auto',
    boxSizing: 'border-box'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 20,
    color: '#E0E0F0'
  },
  textarea: {
    width: '100%',
    minHeight: 200,
    backgroundColor: '#2D2D4A',
    borderRadius: 8,
    border: '1px solid #3D3D5C',
    color: '#E0E0F0',
    padding: 12,
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    lineHeight: 1.6
  },
  textareaFocus: {
    borderColor: '#6C63FF'
  },
  tagInputArea: {
    marginTop: 16,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#2D2D4A',
    borderRadius: 8,
    border: '1px solid #3D3D5C',
    minHeight: 44,
    boxSizing: 'border-box'
  },
  tagInput: {
    flex: 1,
    minWidth: 100,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#E0E0F0',
    fontSize: 13,
    padding: '4px 8px'
  },
  removableTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3D3D5C',
    borderRadius: 16,
    padding: '4px 12px',
    fontSize: 12,
    color: '#B0B0D0'
  },
  removeTagBtn: {
    background: 'none',
    border: 'none',
    color: '#8E8EA0',
    cursor: 'pointer',
    fontSize: 14,
    padding: 0,
    lineHeight: 1,
    transition: 'color 0.2s'
  },
  submitBtn: {
    marginTop: 20,
    width: '100%',
    height: 48,
    background: 'linear-gradient(135deg, #6C63FF, #4A4ADB)',
    border: 'none',
    borderRadius: 8,
    color: 'white',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'filter 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  spinner: {
    width: 24,
    height: 24,
    border: '3px solid rgba(108, 99, 255, 0.2)',
    borderTopColor: '#6C63FF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  loadMoreSpinner: {
    display: 'flex',
    justifyContent: 'center',
    padding: 20
  },
  fullModal: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90vh',
    padding: 32,
    animation: 'slideUp 0.3s ease-out',
    overflowY: 'auto',
    boxSizing: 'border-box'
  },
  fullContent: {
    fontSize: 15,
    lineHeight: 1.8,
    color: '#E0E0F0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'none',
    border: 'none',
    color: '#8E8EA0',
    fontSize: 24,
    cursor: 'pointer',
    padding: 4,
    transition: 'color 0.2s'
  },
  tagCloudTag: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderRadius: 16,
    padding: '6px 14px',
    border: '2px solid transparent',
    display: 'inline-block'
  },
  tagCloudSelected: {
    borderColor: '#FFD700'
  },
  noMore: {
    textAlign: 'center',
    color: '#8E8EA0',
    padding: 20,
    fontSize: 13
  },
  emptyState: {
    textAlign: 'center',
    padding: 60,
    color: '#8E8EA0'
  }
};

const HeartIcon: React.FC<{ filled: boolean; style?: React.CSSProperties }> = ({ filled, style }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" style={style}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const TagCloud: React.FC = () => {
  const { allTags, selectedTags, toggleTag } = useStore();

  const getTagStyle = (tag: string, count: number): React.CSSProperties => {
    const maxCount = Math.max(...allTags.map(t => t.count), 1);
    const ratio = count / maxCount;
    const fontSize = 12 + ratio * 8;
    const opacity = 0.5 + ratio * 0.5;
    const isSelected = selectedTags.includes(tag);
    
    return {
      ...styles.tagCloudTag,
      ...(isSelected ? styles.tagCloudSelected : {}),
      fontSize,
      color: `rgba(108, 99, 255, ${opacity})`,
      fontWeight: isSelected ? 600 : 400
    };
  };

  if (allTags.length === 0) return null;

  return (
    <div style={styles.tagCloud}>
      {allTags.map(({ tag, count }) => (
        <span
          key={tag}
          style={getTagStyle(tag, count)}
          onClick={() => toggleTag(tag)}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
};

const FilterBar: React.FC = () => {
  const { selectedTags, clearTags } = useStore();

  if (selectedTags.length === 0) return null;

  return (
    <div style={styles.filterBar}>
      <span style={styles.filterText}>
        筛选：{selectedTags.map(t => `#${t}`).join('、')}
      </span>
      <button style={styles.clearBtn} onClick={clearTags}>✕</button>
    </div>
  );
};

const DiaryCard: React.FC<{ entry: DiaryEntry; isNew?: boolean }> = ({ entry, isNew }) => {
  const [hovered, setHovered] = useState(false);
  const { toggleLike, toggleComments, expandedComments, likeAnimating, setShowFullContent, addComment, clearNewEntry } = useStore();
  const [commentText, setCommentText] = useState('');
  const isExpanded = expandedComments.has(entry.id);
  const isLikeAnimating = likeAnimating.has(entry.id);
  const isLongContent = entry.content.length > 280;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(entry.id);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleComments(entry.id);
  };

  const handleReadMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullContent(entry);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (commentText.trim()) {
      addComment(entry.id, commentText.trim());
      setCommentText('');
    }
  };

  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (isNew && e.animationName === 'cardSlideIn') {
      clearNewEntry(entry.id);
    }
  };

  const cardStyle: React.CSSProperties = {
    ...styles.card,
    ...(hovered ? styles.cardHover : {}),
    ...(isNew ? styles.cardEnter : {})
  };

  const likeStyle: React.CSSProperties = {
    ...styles.actionBtn,
    ...styles.likeBtn,
    ...(entry.liked ? styles.likeBtnLiked : {}),
    ...(isLikeAnimating ? styles.likeAnim : {})
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleReadMore}
      onAnimationEnd={handleAnimationEnd}
    >
      <div style={styles.cardHeader}>
        <img src={entry.avatar} alt={entry.nickname} style={styles.avatar} />
        <div style={styles.userInfo}>
          <div style={styles.nickname}>{entry.nickname}</div>
          <div style={styles.time}>{formatRelativeTime(entry.createdAt)}</div>
        </div>
      </div>

      <div style={styles.content}>
        {isLongContent ? (
          <>
            {truncateText(entry.content, 280)}
            <span style={styles.readMore}>查看全文</span>
          </>
        ) : (
          entry.content
        )}
      </div>

      {entry.tags.length > 0 && (
        <div style={styles.tagsContainer}>
          {entry.tags.map(tag => (
            <span key={tag} style={styles.tagPill}>#{tag}</span>
          ))}
        </div>
      )}

      <div style={styles.actions}>
        <button style={likeStyle} onClick={handleLike}>
          <HeartIcon filled={entry.liked} />
          <span>{entry.likes}</span>
        </button>
        <button style={{ ...styles.actionBtn, color: '#8E8EA0' }} onClick={handleCommentClick}>
          <CommentIcon />
          <span>{entry.comments.length}</span>
        </button>
      </div>

      {isExpanded && (
        <div style={styles.commentSection} onClick={e => e.stopPropagation()}>
          <form onSubmit={handleSubmitComment}>
            <textarea
              style={styles.commentInput}
              placeholder="写下你的评论..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              rows={2}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment(e);
                }
              }}
            />
          </form>
          {entry.comments.length > 0 && (
            <div style={styles.commentList}>
              {entry.comments.map(comment => (
                <div key={comment.id} style={styles.commentItem}>
                  <div style={{ color: '#8E8EA0', fontSize: 11 }}>
                    {formatRelativeTime(comment.createdAt)}
                  </div>
                  <div style={styles.commentContent}>{comment.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Masonry: React.FC<{ entries: DiaryEntry[]; newEntryIds: Set<string> }> = ({ entries, newEntryIds }) => {
  const [columns, setColumns] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setColumns(1);
      } else if (width < 1024) {
        setColumns(2);
      } else {
        setColumns(3);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const columnItems = useMemo(() => {
    const cols: DiaryEntry[][] = Array.from({ length: columns }, () => []);
    const heights = Array(columns).fill(0);

    entries.forEach(entry => {
      const shortest = heights.indexOf(Math.min(...heights));
      cols[shortest].push(entry);
      const estimatedHeight = 200 + Math.ceil(entry.content.length / 30) * 16 + entry.tags.length * 28;
      heights[shortest] += estimatedHeight + 16;
    });

    return cols;
  }, [entries, columns]);

  if (entries.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
        <div>还没有日记，点击右下角按钮写第一篇吧！</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        gap: 16
      }}
    >
      {columnItems.map((col, colIndex) => (
        <div key={colIndex} style={{ ...styles.masonryColumn, flex: 1 }}>
          {col.map(entry => (
            <DiaryCard key={entry.id} entry={entry} isNew={newEntryIds.has(entry.id)} />
          ))}
        </div>
      ))}
    </div>
  );
};

const CreateModal: React.FC = () => {
  const { showModal, setShowModal, createDiary } = useStore();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!showModal) {
      setContent('');
      setTags([]);
      setTagInput('');
      setSubmitting(false);
    }
  }, [showModal]);

  if (!showModal) return null;

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim();
      if (!tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await createDiary(content.trim(), tags);
    
    setSubmitting(false);
  };

  return (
    <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button 
          style={styles.closeBtn} 
          onClick={() => setShowModal(false)}
        >
          ✕
        </button>
        <h2 style={styles.modalTitle}>写日记</h2>
        
        <textarea
          style={{ ...styles.textarea, ...(focused ? styles.textareaFocus : {}) }}
          placeholder="今天发生了什么？支持Markdown语法..."
          value={content}
          onChange={e => setContent(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        <div style={styles.tagInputArea}>
          {tags.map((tag, index) => (
            <span key={index} style={styles.removableTag}>
              #{tag}
              <button 
                style={styles.removeTagBtn} 
                onClick={() => removeTag(index)}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#FF4757'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = '#8E8EA0'}
              >
                ✕
              </button>
            </span>
          ))}
          <input
            style={styles.tagInput}
            type="text"
            placeholder={tags.length === 0 ? '输入标签，按回车添加...' : ''}
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
        </div>

        <button
          style={{
            ...styles.submitBtn,
            ...(submitting || !content.trim() ? styles.submitBtnDisabled : {})
          }}
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          onMouseEnter={e => {
            if (!submitting && content.trim()) {
              (e.target as HTMLElement).style.filter = 'brightness(1.1)';
            }
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.filter = 'brightness(1)';
          }}
        >
          {submitting ? (
            <div style={styles.spinner} />
          ) : (
            '发布'
          )}
        </button>
      </div>
    </div>
  );
};

const FullContentModal: React.FC = () => {
  const { showFullContent, setShowFullContent } = useStore();

  if (!showFullContent) return null;

  return (
    <div style={styles.modalOverlay} onClick={() => setShowFullContent(null)}>
      <div style={styles.fullModal} onClick={e => e.stopPropagation()}>
        <button 
          style={styles.closeBtn} 
          onClick={() => setShowFullContent(null)}
        >
          ✕
        </button>
        
        <div style={styles.cardHeader}>
          <img src={showFullContent.avatar} alt={showFullContent.nickname} style={styles.avatar} />
          <div style={styles.userInfo}>
            <div style={styles.nickname}>{showFullContent.nickname}</div>
            <div style={styles.time}>{formatRelativeTime(showFullContent.createdAt)}</div>
          </div>
        </div>

        <div style={styles.fullContent}>{showFullContent.content}</div>

        {showFullContent.tags.length > 0 && (
          <div style={{ ...styles.tagsContainer, marginTop: 20 }}>
            {showFullContent.tags.map(tag => (
              <span key={tag} style={styles.tagPill}>#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FloatingActionButton: React.FC = () => {
  const [hovered, setHovered] = useState(false);
  const { setShowModal, ripple, setRipple } = useStore();
  const btnRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const handleClick = (e: React.MouseEvent) => {
    const btn = btnRef.current;
    if (!btn) return;
    
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++rippleIdRef.current;
    
    setRipple({ x, y, id });
    setShowModal(true);
    
    setTimeout(() => {
      setRipple(null);
    }, 600);
  };

  const fabStyle: React.CSSProperties = {
    ...styles.fab,
    ...(hovered ? styles.fabHover : {})
  };

  return (
    <button
      ref={btnRef}
      style={fabStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {ripple && (
        <span
          key={ripple.id}
          style={{
            ...styles.ripple,
            left: ripple.x - 28,
            top: ripple.y - 28,
            width: 56,
            height: 56
          }}
        />
      )}
      +
    </button>
  );
};

const LoadMoreSpinner: React.FC = () => {
  const { loading, hasMore } = useStore();

  if (loading) {
    return (
      <div style={styles.loadMoreSpinner}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!hasMore) {
    return (
      <div style={styles.noMore}>— 已经到底啦 —</div>
    );
  }

  return null;
};

const App: React.FC = () => {
  const { init, loadMore, entries, loading, newEntryIds } = useStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      init();
    }
  }, [init]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, loading]);

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.title}>MicroBlog</h1>
        <p style={styles.subtitle}>记录每一个瞬间</p>
        <TagCloud />
        <FilterBar />
      </div>

      <div style={styles.masonryContainer}>
        <Masonry entries={entries} newEntryIds={newEntryIds} />
        <div ref={loadMoreRef}>
          <LoadMoreSpinner />
        </div>
      </div>

      <FloatingActionButton />
      <CreateModal />
      <FullContentModal />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes likeScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes rippleExpand {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        @keyframes cardSlideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #16162A;
        }
        ::-webkit-scrollbar-thumb {
          background: #3D3D5C;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #6C63FF;
        }
        @media (max-width: 768px) {
          .tag-cloud-mobile {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
