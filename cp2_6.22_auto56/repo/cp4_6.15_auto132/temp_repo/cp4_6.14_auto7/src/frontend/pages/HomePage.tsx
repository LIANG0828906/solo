import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeCard from '../components/CodeCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import { snippetsApi } from '../api';
import type { CodeSnippet, PaginationResult } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const PAGE_SIZE = 12;

export default function HomePage() {
  const navigate = useNavigate();
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const initialFetchRef = useRef(false);

  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '200px',
    threshold: 0.1,
  });

  const fetchSnippets = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      setLoading(true);
      try {
        let result: PaginationResult<CodeSnippet>;
        if (keyword || selectedTags.length > 0) {
          result = await snippetsApi.search(keyword, selectedTags, pageNum, PAGE_SIZE);
        } else {
          result = await snippetsApi.getAll(pageNum, PAGE_SIZE);
        }

        if (reset) {
          setSnippets(result.items);
        } else {
          setSnippets((prev) => [...prev, ...result.items]);
        }
        setHasMore(result.hasMore);
        setTotal(result.total);
        setPage(pageNum);
      } catch (error) {
        console.error('Failed to fetch snippets:', error);
      } finally {
        setLoading(false);
      }
    },
    [keyword, selectedTags]
  );

  useEffect(() => {
    if (!initialFetchRef.current) {
      initialFetchRef.current = true;
      fetchSnippets(1, true);
    }
  }, []);

  useEffect(() => {
    if (initialFetchRef.current) {
      fetchSnippets(1, true);
    }
  }, [keyword, selectedTags, fetchSnippets]);

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      fetchSnippets(page + 1, false);
    }
  }, [isIntersecting, hasMore, loading, page, fetchSnippets]);

  const handleSearch = (kw: string, tags: string[]) => {
    setKeyword(kw);
    setSelectedTags(tags);
  };

  const handleCardClick = (id: string) => {
    navigate(`/snippet/${id}`);
  };

  return (
    <div className="page home-page">
      <div className="page-header">
        <h1 className="page-title">代码片段</h1>
        <p className="page-subtitle">共 {total} 个代码片段</p>
      </div>

      <SearchBar
        onSearch={handleSearch}
        keyword={keyword}
        selectedTags={selectedTags}
      />

      {loading && snippets.length === 0 ? (
        <div className="loading-state">加载中...</div>
      ) : snippets.length === 0 ? (
        <EmptyState
          message="暂无内容"
          subMessage={keyword || selectedTags.length > 0 ? '没有找到匹配的代码片段' : '快来添加第一个代码片段吧'}
        />
      ) : (
        <div className="snippet-grid">
          {snippets.map((snippet) => (
            <CodeCard
              key={snippet.id}
              snippet={snippet}
              onClick={() => handleCardClick(snippet.id)}
            />
          ))}
        </div>
      )}

      {hasMore && snippets.length > 0 && (
        <div ref={loadMoreRef} className="load-more">
          {loading && <div className="loading-spinner">加载更多...</div>}
        </div>
      )}

      {!hasMore && snippets.length > 0 && (
        <div className="no-more">— 已加载全部 —</div>
      )}
    </div>
  );
}
