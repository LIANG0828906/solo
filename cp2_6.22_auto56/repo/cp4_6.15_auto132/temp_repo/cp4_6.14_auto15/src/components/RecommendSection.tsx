import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecommendations } from '../utils/api';
import { CardSkeleton } from './Skeleton';
import { useLazyImage } from '../hooks/useLazyImage';
import { cuisineLabel, difficultyLabel, difficultyColor } from '../utils/helpers';
import type { Recipe } from '../types';

interface RecommendSectionProps {
  recipeId: string;
}

function RecommendCard({ recipe }: { recipe: Recipe }) {
  const navigate = useNavigate();
  const { ref, loaded } = useLazyImage();

  return (
    <div
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      style={{
        minWidth: 240,
        maxWidth: 240,
        background: 'var(--card-bg)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        cursor: 'pointer',
        transition: 'transform 0.25s, box-shadow 0.25s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '4 / 3' }}>
        {!loaded && <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />}
        <img
          ref={ref}
          src={recipe.thumbnail}
          alt={recipe.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          display: 'flex',
          gap: 6,
        }}>
          <span style={{
            padding: '2px 8px',
            borderRadius: 12,
            background: 'rgba(255,111,0,0.9)',
            color: 'white',
            fontSize: 11,
          }}>
            {cuisineLabel(recipe.cuisine)}
          </span>
          <span style={{
            padding: '2px 8px',
            borderRadius: 12,
            background: difficultyColor(recipe.difficulty) + 'E6',
            color: 'white',
            fontSize: 11,
          }}>
            {difficultyLabel(recipe.difficulty)}
          </span>
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <h4 style={{
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {recipe.name}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-light)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFB300" stroke="#FFB300" strokeWidth="1">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>{recipe.rating.toFixed(1)}</span>
          <span style={{ color: '#ddd' }}>·</span>
          <span>{recipe.cookTime}分钟</span>
        </div>
      </div>
    </div>
  );
}

export default function RecommendSection({ recipeId }: RecommendSectionProps) {
  const [recommendations, setRecommendations] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const data = await getRecommendations(recipeId);
        setRecommendations(data);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [recipeId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || loading || recommendations.length === 0) return;

    const startScroll = () => {
      intervalRef.current = setInterval(() => {
        if (container) {
          container.scrollLeft += 1;
          if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
            container.scrollLeft = 0;
          }
        }
      }, 30);
    };

    const stopScroll = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startScroll();

    container.addEventListener('mouseenter', stopScroll);
    container.addEventListener('mouseleave', startScroll);

    return () => {
      stopScroll();
      container.removeEventListener('mouseenter', stopScroll);
      container.removeEventListener('mouseleave', startScroll);
    };
  }, [loading, recommendations.length]);

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: 20,
      padding: 28,
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
        }}>
          🌟 猜你喜欢
        </h2>
        <p style={{
          fontSize: 14,
          color: 'var(--text-light)',
        }}>
          基于菜系和食材为您推荐
        </p>
      </div>

      {loading ? (
        <div style={{
          display: 'flex',
          gap: 16,
          padding: '8px 0',
        }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ minWidth: 240, maxWidth: 240 }}>
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-light)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🤔</div>
          <p>暂无推荐食谱</p>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            padding: '8px 0',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none',
          }}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        >
          {recommendations.map((recipe) => (
            <RecommendCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
