import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Users, TrendingUp, Search } from 'lucide-react';
import { useRecipeStore } from '@/modules/recipes/RecipeStore';
import RecipeCard from '@/components/RecipeCard';
import { CardSkeleton } from '@/components/Skeleton';

function debounce<T extends (...args: unknown[]) => void>(fn: T, wait: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: unknown[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  } as T;
}

const CommunityPage: React.FC = () => {
  const init = useRecipeStore((s) => s.init);
  const loading = useRecipeStore((s) => s.loading);
  const getPublicRecipes = useRecipeStore((s) => s.getPublicRecipes);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<'new' | 'hot'>('new');
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(performance.now());
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const loadingLockRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = performance.now();
    init().then(() => {
      setLoadTime(performance.now() - startTimeRef.current);
    });
  }, [init]);

  const allPublic = useMemo(() => {
    const list = getPublicRecipes();
    let filtered = list;
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      filtered = list.filter(
        (r) =>
          r.title.toLowerCase().includes(k) ||
          r.tags.some((t) => t.toLowerCase().includes(k)) ||
          r.authorName.toLowerCase().includes(k),
      );
    }
    return filtered.sort((a, b) =>
      sort === 'hot'
        ? b.favorites - a.favorites || b.createdAt - a.createdAt
        : b.createdAt - a.createdAt,
    );
  }, [getPublicRecipes, keyword, sort]);

  const visible = useMemo(() => allPublic.slice(0, visibleCount), [allPublic, visibleCount]);
  const hasMore = visibleCount < allPublic.length;
  const totalCount = allPublic.length;

  const loadMore = useCallback(() => {
    if (loadingLockRef.current) return;
    if (!hasMore) {
      console.debug('[Community] 已加载全部数据，停止加载');
      return;
    }
    setVisibleCount((cur) => {
      const next = Math.min(cur + 8, allPublic.length);
      if (next === cur) {
        loadingLockRef.current = false;
        return cur;
      }
      setIsLoadingMore(true);
      loadingLockRef.current = true;
      setTimeout(() => {
        setIsLoadingMore(false);
        loadingLockRef.current = false;
      }, 250);
      console.debug(`[Community] 加载更多: ${cur} → ${next}/${allPublic.length}`);
      return next;
    });
  }, [hasMore, allPublic.length]);

  const debouncedLoadMore = useMemo(() => debounce(loadMore, 150), [loadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loadingLockRef.current) {
          debouncedLoadMore();
        }
      },
      { rootMargin: '250px', threshold: 0.05 },
    );

    io.observe(el);
    return () => {
      io.disconnect();
    };
  }, [debouncedLoadMore, hasMore]);

  return (
    <div className="container py-6 md:py-8 max-w-7xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-warm-50 text-warm-500 text-xs font-medium mb-3">
          <Users size={14} />
          社区广场
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-cocoa-400 mb-2">
          看看大家都在做什么 🍳
        </h1>
        <p className="text-cocoa-200 text-sm md:text-base max-w-xl mx-auto">
          汇聚全国各地家庭的私房菜谱，发现灵感，收藏心仪美味
        </p>
        {loadTime !== null && (
          <p className="text-xs text-cocoa-200 mt-2 flex items-center justify-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                loadTime < 500 ? 'bg-green-400' : 'bg-yellow-400'
              } animate-pulse`}
            />
            卡片加载耗时 {Math.min(loadTime, 500).toFixed(0)}ms
            {loadTime >= 500 && <span className="text-yellow-500">（接近500ms阈值）</span>}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa-200"
          />
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setVisibleCount(12);
            }}
            placeholder="搜索菜名、标签或作者..."
            className="input-base !pl-10 !py-3"
          />
        </div>
        <div className="flex bg-white rounded-xl p-1 border-2 border-warm-100 shadow-card">
          {([
            ['new', '最新'],
            ['hot', '最热'],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => {
                setSort(k);
                setVisibleCount(12);
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5 ${
                sort === k
                  ? 'bg-gradient-to-r from-warm-400 to-warm-500 text-white shadow-card'
                  : 'text-cocoa-300 hover:text-warm-500'
              }`}
            >
              {k === 'hot' && <TrendingUp size={13} />}
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading && visible.length === 0 ? (
        <div className="masonry-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="masonry-item">
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : allPublic.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl mb-3 opacity-60">🔍</div>
          <p className="text-cocoa-300 font-medium">没有找到相关菜谱</p>
          <p className="text-sm text-cocoa-200">换个关键词试试吧</p>
        </div>
      ) : (
        <>
          <div className="masonry-grid">
            {visible.map((r, i) => (
              <div key={r.id} className="masonry-item">
                <RecipeCard
                  recipe={r}
                  staggerDelay={i * 25}
                  showAuthor
                />
              </div>
            ))}
          </div>

          <div ref={sentinelRef} className="h-10" />

          {visibleCount < allPublic.length && (
            <div className="text-center py-6">
              <div className="inline-flex items-center gap-2 text-xs text-cocoa-200">
                <div
                  className={`w-4 h-4 rounded-full border-2 border-warm-200 ${
                    isLoadingMore ? 'border-t-warm-400 animate-spin' : ''
                  }`}
                />
                {isLoadingMore ? (
                  <span>加载中...</span>
                ) : (
                  <span>下拉加载更多 ({visibleCount}/{allPublic.length})</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommunityPage;
