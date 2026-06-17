import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoemStore } from '@/stores/poemStore';
import type { SortType } from '@/types';
import './PoemList.css';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getSummary(content: string, maxLength = 30): string {
  const cleanContent = content.replace(/\s+/g, '');
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  return cleanContent.slice(0, maxLength) + '...';
}

const PAGE_SIZE = 12;

export function PoemList() {
  const navigate = useNavigate();
  const { poems, fetchPoems, deletePoem, getSortedAndFilteredPoems, isLoading } = usePoemStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('updatedAt');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchPoems();
  }, [fetchPoems]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setVisibleCount(PAGE_SIZE);
    }, 150);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const filteredPoems = useMemo(
    () => getSortedAndFilteredPoems(debouncedQuery, sortType),
    [debouncedQuery, sortType, poems, getSortedAndFilteredPoems]
  );

  const visiblePoems = useMemo(
    () => filteredPoems.slice(0, visibleCount),
    [filteredPoems, visibleCount]
  );

  const hasMore = visibleCount < filteredPoems.length;

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        setVisibleCount((prev) => prev + PAGE_SIZE);
      }
    },
    [hasMore, isLoading]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '100px',
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  const handleCreatePoem = () => {
    navigate('/editor');
  };

  const handleOpenPoem = (id: string) => {
    navigate(`/poem/${id}`);
  };

  const handleEditPoem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/editor/${id}`);
  };

  const handleDeletePoem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这首诗吗？')) {
      await deletePoem(id);
    }
  };

  return (
    <div className="poem-list-page">
      <header className="poem-list-header">
        <h1 className="app-title">WindWhisper</h1>
        <p className="app-subtitle">沉浸式诗歌创作</p>
      </header>

      <div className="poem-list-toolbar">
        <div className="search-container">
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
          value={sortType}
          onChange={(e) => {
            setSortType(e.target.value as SortType);
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <option value="updatedAt">最后编辑时间</option>
          <option value="createdAt">创建时间</option>
          <option value="title">标题字母</option>
        </select>

        <button className="create-btn" onClick={handleCreatePoem}>
          + 新建诗歌
        </button>
      </div>

      {isLoading && visiblePoems.length === 0 ? (
        <div className="loading-state">加载中...</div>
      ) : visiblePoems.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">暂无诗歌</p>
          <button className="create-btn-lg" onClick={handleCreatePoem}>
            开始创作
          </button>
        </div>
      ) : (
        <>
          <div className="poem-grid">
            {visiblePoems.map((poem) => (
              <div
                key={poem.id}
                className="poem-card"
                onClick={() => handleOpenPoem(poem.id)}
              >
                <div className="poem-card-content">
                  <h3 className="poem-card-title">{poem.title || '无题'}</h3>
                  <p className="poem-card-summary">{getSummary(poem.content) || '暂无内容'}</p>
                </div>
                <div className="poem-card-footer">
                  <span className="poem-card-time">
                    {formatDate(poem.updatedAt)}
                  </span>
                  <div className="poem-card-actions">
                    <button
                      className="card-action-btn edit-btn"
                      onClick={(e) => handleEditPoem(e, poem.id)}
                      title="编辑"
                    >
                      编辑
                    </button>
                    <button
                      className="card-action-btn delete-btn"
                      onClick={(e) => handleDeletePoem(e, poem.id)}
                      title="删除"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div ref={loadMoreRef} className="load-more-trigger">
              <div className="loading-spinner"></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
