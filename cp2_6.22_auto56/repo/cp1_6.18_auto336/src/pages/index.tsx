import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLetterStore } from '@/store';
import type { Letter, LettersResponse } from '@/types';
import TagBar from '@/components/TagBar';
import LetterCard from '@/components/LetterCard';
import RecommendationBar from '@/components/RecommendationBar';
import type { FavoriteResponse } from '@/types';

const INITIAL_LIMIT = 20;
const LOAD_MORE_LIMIT = 10;

export default function HomePage() {
  const {
    letters,
    tag,
    favorites,
    loading,
    nextCursor,
    hasMore,
    setLetters,
    addLetters,
    toggleFavorite,
    setTag,
    setLoading,
    initFavorites,
  } = useLetterStore();

  const [recommendations, setRecommendations] = useState<Letter[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const [listKey, setListKey] = useState(0);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchLetters = useCallback(
    async (cursor?: number, limit = INITIAL_LIMIT, currentTag?: string | null) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        if (cursor) params.set('cursor', String(cursor));
        if (currentTag) params.set('tag', currentTag);

        const res = await fetch(`/api/letters?${params.toString()}`);
        const data: LettersResponse = await res.json();

        if (cursor) {
          addLetters(data.letters, data.nextCursor, data.hasMore);
        } else {
          setLetters(data.letters, data.nextCursor, data.hasMore);
        }
      } catch (err) {
        console.error('Failed to fetch letters:', err);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [addLetters, setLetters, setLoading]
  );

  const fetchRecommendations = useCallback(async () => {
    setRecLoading(true);
    try {
      const res = await fetch('/api/recommend');
      const data = await res.json();
      setRecommendations(data.letters || []);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setRecLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await fetch('/api/favorites');
      const data = await res.json();
      if (data.ids) initFavorites(data.ids);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    }
  }, [initFavorites]);

  const handleFavorite = useCallback(
    async (letterId: number) => {
      try {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ letterId }),
        });
        const data: FavoriteResponse = await res.json();
        toggleFavorite(letterId, data.favoritesCount);
        fetchRecommendations();
      } catch (err) {
        console.error('Failed to toggle favorite:', err);
      }
    },
    [toggleFavorite, fetchRecommendations]
  );

  const handleTagChange = useCallback(
    (newTag: string | null) => {
      setTag(newTag);
      setListKey((k) => k + 1);
      fetchLetters(undefined, INITIAL_LIMIT, newTag);
    },
    [setTag, fetchLetters]
  );

  useEffect(() => {
    fetchFavorites();
    fetchLetters();
    fetchRecommendations();
  }, [fetchLetters, fetchRecommendations, fetchFavorites]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingRef.current) {
          fetchLetters(nextCursor ?? undefined, LOAD_MORE_LIMIT, tag);
        }
      },
      { rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, nextCursor, tag, fetchLetters]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <TagBar selectedTag={tag} onSelectTag={handleTagChange} />

      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-kaiti)',
                fontSize: '1.8rem',
                color: '#2C1810',
                marginBottom: 4,
              }}
            >
              诗笺寄语
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#8B7355' }}>
              在此留下你的诗句与故事
            </p>
          </div>
          <Link href="/create">
            <button
              style={{
                padding: '10px 24px',
                background: '#A67C52',
                color: '#FFFFFF',
                borderRadius: 24,
                fontSize: '0.95rem',
                transition: 'all 0.2s ease-out',
                boxShadow: '0 2px 8px rgba(166,124,82,0.3)',
              }}
              className="create-btn"
            >
              + 发布信笺
            </button>
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {letters.length === 0 && !loading ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 20px',
                  color: '#8B7355',
                }}
              >
                <p style={{ fontFamily: 'var(--font-kaiti)', fontSize: '1.2rem', marginBottom: 8 }}>
                  暂无信笺
                </p>
                <p style={{ fontSize: '0.9rem' }}>成为第一个留下诗句的人吧</p>
              </div>
            ) : (
              <div
                key={listKey}
                style={{
                  columnCount: 4,
                  columnGap: 16,
                  animation: 'slideInRight 0.3s ease-out',
                }}
                className="waterfall"
              >
                {letters.map((letter, idx) => (
                  <LetterCard
                    key={letter.id}
                    letter={letter}
                    favorited={favorites.has(letter.id)}
                    index={idx}
                    onFavorite={handleFavorite}
                  />
                ))}
              </div>
            )}

            <div ref={sentinelRef} style={{ height: 1 }} />

            {loading && letters.length > 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 24,
                  color: '#8B7355',
                  fontSize: '0.9rem',
                }}
              >
                加载中...
              </div>
            )}

            {!hasMore && letters.length > 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 32,
                  color: '#C0B0A0',
                  fontSize: '0.85rem',
                }}
              >
                — 已到底部 —
              </div>
            )}
          </div>

          <RecommendationBar letters={recommendations} loading={recLoading} />
        </div>
      </div>

      <style jsx>{`
        .waterfall {
          column-count: 4;
        }
        @media (max-width: 1024px) {
          .waterfall {
            column-count: 3;
          }
        }
        @media (max-width: 768px) {
          .waterfall {
            column-count: 2;
          }
        }
        @media (max-width: 480px) {
          .waterfall {
            column-count: 1;
          }
        }
        .create-btn:hover {
          transform: scale(1.05);
          background: #8B6642;
        }
      `}</style>
    </div>
  );
}
