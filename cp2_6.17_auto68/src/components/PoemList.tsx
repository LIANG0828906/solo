import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoemStore, Poem } from '../stores/poemStore';

type SortOption = 'createdAt' | 'updatedAt' | 'title';

const PAGE_SIZE = 12;

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

const PoemList: React.FC = () => {
  const navigate = useNavigate();
  const { poems, dbReady, initDB, createPoem, deletePoem } = usePoemStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dbReady) {
      initDB();
    }
  }, [dbReady, initDB]);

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

  const handleCreateNew = async () => {
    const poem = await createPoem();
    navigate(`/editor/${poem.id}`);
  };

  const handleCardClick = (poem: Poem) => {
    if (deletingId === poem.id) return;
    navigate(`/poem/${poem.id}`);
  };

  const handleEdit = (e: React.MouseEvent, poem: Poem) => {
    e.stopPropagation();
    navigate(`/editor/${poem.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, poem: Poem) => {
    e.stopPropagation();
    const confirmed = window.confirm(`确定删除诗歌《${poem.title}》吗？此操作不可撤销。`);
    if (confirmed) {
      setDeletingId(poem.id);
      await deletePoem(poem.id);
      setDeletingId(null);
    }
  };

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
        <div className="poem-grid">
          {visiblePoems.map((poem) => (
            <div
              key={poem.id}
              className={`poem-card ${deletingId === poem.id ? 'deleting' : ''}`}
              onClick={() => handleCardClick(poem)}
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
                      onClick={(e) => handleEdit(e, poem)}
                    >
                      ✏️
                    </button>
                    <button
                      className="card-btn card-btn-delete"
                      title="删除"
                      onClick={(e) => handleDelete(e, poem)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
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

export default PoemList;
