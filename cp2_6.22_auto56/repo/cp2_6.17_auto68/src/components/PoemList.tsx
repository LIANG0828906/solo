import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoemStore, Poem } from '../stores/poemStore';

type SortOption = 'createdAt' | 'updatedAt' | 'title';

const PAGE_SIZE = 12;
const CARD_WIDTH = 320;
const COLUMN_GAP = 20;

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getSummary = (content: string, maxLen: number = 30): string => {
  const plain = content.replace(/[#*`_\[\]()>\-\n]/g, '').trim();
  if (plain.length <= maxLen) return plain || '（空白）';
  return plain.slice(0, maxLen) + '...';
};

interface PoemCardProps {
  poem: Poem;
  isDeleting: boolean;
  onCardClick: (poem: Poem) => void;
  onEdit: (e: React.MouseEvent, poem: Poem) => void;
  onDelete: (e: React.MouseEvent, poem: Poem) => void;
  onHeightMeasure?: (id: string, height: number) => void;
}

const PoemCard = memo(function PoemCard({
  poem,
  isDeleting,
  onCardClick,
  onEdit,
  onDelete,
  onHeightMeasure
}: PoemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current && onHeightMeasure) {
      const height = cardRef.current.offsetHeight;
      onHeightMeasure(poem.id, height);
    }
  }, [poem.id, onHeightMeasure]);

  return (
    <div
      ref={cardRef}
      className={`poem-card ${isDeleting ? 'deleting' : ''}`}
      onClick={() => onCardClick(poem)}
    >
      <div className="card-inner">
        <h3 className="poem-card-title">{poem.title}</h3>
        <p className="poem-card-summary">{getSummary(poem.content)}</p>
        <div className="poem-card-footer">
          <span className="card-time">🕒 {formatDate(poem.updatedAt)}</span>
          <div className="card-actions">
            <button
              className="card-btn card-btn-edit"
              title="编辑"
              onClick={(e) => onEdit(e, poem)}
            >
              ✏️
            </button>
            <button
              className="card-btn card-btn-delete"
              title="删除"
              onClick={(e) => onDelete(e, poem)}
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

interface MasonryColumnProps {
  poems: Poem[];
  deletingId: string | null;
  onCardClick: (poem: Poem) => void;
  onEdit: (e: React.MouseEvent, poem: Poem) => void;
  onDelete: (e: React.MouseEvent, poem: Poem) => void;
}

const MasonryColumn = memo(function MasonryColumn({
  poems,
  deletingId,
  onCardClick,
  onEdit,
  onDelete
}: MasonryColumnProps) {
  return (
    <div className="masonry-column">
      {poems.map((poem) => (
        <PoemCard
          key={poem.id}
          poem={poem}
          isDeleting={deletingId === poem.id}
          onCardClick={onCardClick}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});

const PoemList: React.FC = () => {
  const navigate = useNavigate();
  const { poems, dbReady, initDB, createPoem, deletePoem } = usePoemStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [columnCount, setColumnCount] = useState(3);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculateColumnCount = useCallback(() => {
    if (!containerRef.current) return 3;
    const containerWidth = containerRef.current.offsetWidth;
    const availableWidth = containerWidth + COLUMN_GAP;
    const cols = Math.floor(availableWidth / (CARD_WIDTH + COLUMN_GAP));
    return Math.max(1, cols);
  }, []);

  useEffect(() => {
    if (!dbReady) {
      initDB();
    }
  }, [dbReady, initDB]);

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      resizeTimerRef.current = setTimeout(() => {
        const cols = calculateColumnCount();
        setColumnCount(cols);
      }, 150);
    };

    const cols = calculateColumnCount();
    setColumnCount(cols);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
    };
  }, [calculateColumnCount]);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setVisibleCount(PAGE_SIZE);
    }, 150);
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  const filteredPoems = useMemo(() => {
    let result = [...poems];
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'zh-CN');
      }
      return b[sortBy] - a[sortBy];
    });
    return result;
  }, [poems, debouncedQuery, sortBy]);

  const visiblePoems = useMemo(() => {
    return filteredPoems.slice(0, visibleCount);
  }, [filteredPoems, visibleCount]);

  const masonryColumns = useMemo(() => {
    const columns: Poem[][] = Array.from({ length: columnCount }, () => []);
    const columnHeights = Array(columnCount).fill(0);

    for (const poem of visiblePoems) {
      let shortestIndex = 0;
      for (let i = 1; i < columnHeights.length; i++) {
        if (columnHeights[i] < columnHeights[shortestIndex]) {
          shortestIndex = i;
        }
      }
      columns[shortestIndex].push(poem);

      const contentLen = getSummary(poem.content).length;
      const estimatedHeight = 240 + Math.max(0, contentLen - 30) * 4;
      columnHeights[shortestIndex] += estimatedHeight + 24;
    }

    return columns;
  }, [visiblePoems, columnCount]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && visibleCount < filteredPoems.length) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredPoems.length));
      }
    },
    [visibleCount, filteredPoems.length]
  );

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '100px',
      threshold: 0.1
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver, visiblePoems.length]);

  const handleCreateNew = useCallback(async () => {
    const poem = await createPoem();
    navigate(`/editor/${poem.id}`);
  }, [createPoem, navigate]);

  const handleCardClick = useCallback(
    (poem: Poem) => {
      if (deletingId === poem.id) return;
      navigate(`/poem/${poem.id}`);
    },
    [deletingId, navigate]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent, poem: Poem) => {
      e.stopPropagation();
      navigate(`/editor/${poem.id}`);
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent, poem: Poem) => {
      e.stopPropagation();
      const confirmed = window.confirm(`确定删除诗歌《${poem.title}》吗？此操作不可撤销。`);
      if (confirmed) {
        setDeletingId(poem.id);
        await deletePoem(poem.id);
        setDeletingId(null);
      }
    },
    [deletePoem]
  );

  return (
    <div className="poem-list-container">
      <div className="list-header">
        <h1 className="page-title">
          <span className="title-accent">我的</span>诗集
        </h1>
        <button className="btn-create" onClick={handleCreateNew}>
          <span className="btn-icon">✍️</span> 新作一首
        </button>
      </div>

      <div className="list-controls">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="搜索诗歌标题..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as SortOption);
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <option value="updatedAt">按编辑时间</option>
          <option value="createdAt">按创建时间</option>
          <option value="title">按标题字母</option>
        </select>
      </div>

      <div className="result-info">
        共 <strong>{filteredPoems.length}</strong> 首诗歌
        {debouncedQuery && `（匹配「${debouncedQuery}」）`}
      </div>

      {filteredPoems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <p className="empty-text">
            {debouncedQuery ? '没有找到匹配的诗歌' : '还没有诗歌，开始创作你的第一首诗吧'}
          </p>
          {!debouncedQuery && (
            <button className="btn-create btn-create-large" onClick={handleCreateNew}>
              <span className="btn-icon">✨</span> 立即创作
            </button>
          )}
        </div>
      ) : (
        <div ref={containerRef} className="masonry-container">
          {masonryColumns.map((colPoems, colIndex) => (
            <MasonryColumn
              key={colIndex}
              poems={colPoems}
              deletingId={deletingId}
              onCardClick={handleCardClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="load-sentinel">
        {visibleCount < filteredPoems.length && (
          <div className="loading-more">
            <div className="mini-spinner"></div>
            <span>加载更多...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(PoemList);
