import { useState, useEffect, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import RecipeCard from '../components/RecipeCard';
import { ListSkeleton, CardSkeleton } from '../components/Skeleton';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { getRecipes } from '../utils/api';
import type { Recipe } from '../types';

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [cuisine, setCuisine] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [searchKey, setSearchKey] = useState(Date.now());

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRecipes({
        page,
        keyword,
        cuisine: cuisine === 'all' ? undefined : cuisine,
        difficulty: difficulty === 'all' ? undefined : difficulty,
      });
      const pageSize = result.pageSize;
      const more = result.page * pageSize < result.total;
      if (page === 1) {
        setRecipes(result.recipes);
      } else {
        setRecipes((prev) => [...prev, ...result.recipes]);
      }
      setTotal(result.total);
      setHasMore(more);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, cuisine, difficulty]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleSearch = useCallback((kw: string, cu: string, di: string) => {
    setKeyword(kw);
    setCuisine(cu);
    setDifficulty(di);
    setPage(1);
    setRecipes([]);
    setHasMore(true);
    setSearchKey(Date.now());
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, loading]);

  const observerRef = useInfiniteScroll({
    callback: handleLoadMore,
    hasMore,
    loading,
  });

  const showEmpty = !loading && recipes.length === 0;

  return (
    <div className="app-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{
          fontSize: 42,
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: 8,
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          🍳 美味食谱
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-light)' }}>
          探索世界各地的美食，发现属于你的独特风味
        </p>
      </div>

      <SearchBar
        keyword={keyword}
        cuisine={cuisine as any}
        difficulty={difficulty as any}
        onSearch={handleSearch as any}
      />

      {loading && recipes.length === 0 ? (
        <ListSkeleton />
      ) : showEmpty ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h3 style={{ fontSize: 20, marginBottom: 8, color: 'var(--text)' }}>
            没有找到相关食谱
          </h3>
          <p style={{ color: 'var(--text-light)' }}>
            试试其他关键词或筛选条件吧
          </p>
        </div>
      ) : (
        <>
          <div key={searchKey} className="waterfall fade-in">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {loading && recipes.length > 0 && (
            <div className="waterfall fade-in" style={{ marginTop: 24 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={`loading-${i}`} />
              ))}
            </div>
          )}

          <div ref={observerRef} style={{ height: 40 }} />

          {!hasMore && recipes.length > 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-light)',
              fontSize: 14,
            }}>
              ✨ 已加载全部 {total} 个食谱 ✨
            </div>
          )}
        </>
      )}
    </div>
  );
}
