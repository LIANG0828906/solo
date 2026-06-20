import { useEffect, useState, type ChangeEvent } from 'react';
import { Search } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import { useReviewStore, type SortType } from '@/stores/reviewStore';
import axios from 'axios';

interface MovieRatingMap {
  [movieId: string]: number;
}

export default function Home() {
  const {
    movies,
    searchQuery,
    sortType,
    isLoading,
    searchMovies,
    setSearchQuery,
    setSortType,
  } = useReviewStore();

  useEffect(() => {
    searchMovies('');
  }, [searchMovies]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    searchMovies(val);
  };

  const [movieRatings, setMovieRatings] = useState<MovieRatingMap>({});

  useEffect(() => {
    const fetchAllStats = async () => {
      const ratings: MovieRatingMap = {};
      for (const movie of movies) {
        try {
          const res = await axios.get('/api/reviews/stats', { params: { movieId: movie.id } });
          ratings[movie.id] = res.data.averageRating;
        } catch {
          ratings[movie.id] = 0;
        }
      }
      setMovieRatings(ratings);
    };
    if (movies.length > 0) {
      fetchAllStats();
    }
  }, [movies]);

  return (
    <div>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: 'rgba(15,23,42,0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          borderBottom: '1px solid rgba(71,85,105,0.3)',
        }}
      >
        <div
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#F1F5F9',
            marginRight: '40px',
            background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          影评聚焦
        </div>

        <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="搜索电影名称、导演或年份..."
            style={{
              width: '100%',
              height: '44px',
              paddingLeft: '48px',
              paddingRight: '20px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '24px',
              color: '#F1F5F9',
              fontSize: '15px',
              outline: 'none',
              transition: 'all 0.3s ease-in-out',
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = '#3B82F6';
              (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = '#334155';
              (e.target as HTMLInputElement).style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div style={{ paddingTop: '100px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1
              style={{
                color: '#F1F5F9',
                fontSize: '28px',
                fontWeight: 700,
                margin: '0 0 4px 0',
              }}
            >
              {searchQuery ? `"${searchQuery}" 的搜索结果` : '热门电影'}
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>
              共找到 {movies.length} 部电影
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {(['date', 'rating'] as SortType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSortType(type)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease-in-out',
                  border: 'none',
                  backgroundColor: sortType === type ? '#3B82F6' : '#1E293B',
                  color: '#F1F5F9',
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                {type === 'date' ? '最新发布' : '评分最高'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94A3B8' }}>
            加载中...
          </div>
        ) : movies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94A3B8' }}>
            没有找到相关电影
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 280px)',
              gap: '28px',
              justifyContent: 'center',
            }}
            className="movie-grid"
          >
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                averageRating={movieRatings[movie.id] || 0}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .movie-grid {
            grid-template-columns: repeat(2, 280px) !important;
          }
        }
        @media (max-width: 768px) {
          .movie-grid {
            grid-template-columns: 280px !important;
          }
        }
      `}</style>
    </div>
  );
}
