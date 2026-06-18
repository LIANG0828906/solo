import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import axios from 'axios';
import ReviewForm from '@/components/ReviewForm';
import { useReviewStore, type Movie, type SortType } from '@/stores/reviewStore';

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function RatingCircle({ rating, total }: { rating: number; total: number }) {
  const diameter = 44;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  const percent = total > 0 ? rating / 5 : 0;
  const offset = circumference - percent * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedOffset(offset);
    }, 100);
    return () => clearTimeout(timer);
  }, [offset]);

  const getGradientColor = () => {
    if (rating >= 4) return '#10B981';
    if (rating >= 3) return '#F59E0B';
    if (rating > 0) return '#EF4444';
    return '#475569';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: diameter, height: diameter }}>
        <svg width={diameter} height={diameter} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="ratingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth="4"
          />
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="url(#ratingGradient)"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: getGradientColor(),
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          {total > 0 ? rating.toFixed(1) : '-'}
        </span>
      </div>
      <div>
        <div style={{ color: '#F1F5F9', fontSize: '18px', fontWeight: 600 }}>
          平均评分
        </div>
        <div style={{ color: '#94A3B8', fontSize: '14px' }}>
          共 {total} 条影评
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= rating ? '#F59E0B' : 'none'}
          stroke={star <= rating ? '#F59E0B' : '#475569'}
        />
      ))}
    </div>
  );
}

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    sortType,
    setSortType,
    fetchReviews,
    fetchStats,
    addReview,
    stats,
    getSortedReviews,
  } = useReviewStore();

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await axios.get(`/api/movies/${id}`);
        setMovie(res.data);
        await fetchReviews(id);
        await fetchStats(id);
      } catch (err) {
        console.error('加载电影详情失败', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, fetchReviews, fetchStats]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#94A3B8',
        }}
      >
        加载中...
      </div>
    );
  }

  if (!movie) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#94A3B8',
          gap: '16px',
        }}
      >
        电影未找到
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 20px',
            backgroundColor: '#3B82F6',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

  const sortedReviews = getSortedReviews();

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
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#F1F5F9',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '8px',
            transition: 'background-color 0.25s ease-in-out',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1E293B';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          <ArrowLeft size={20} />
          返回首页
        </button>
        <div
          style={{
            marginLeft: '24px',
            fontSize: '18px',
            fontWeight: 600,
            color: '#F1F5F9',
          }}
        >
          {movie.title}
        </div>
      </div>

      <div style={{ paddingTop: '96px', paddingLeft: '32px', paddingRight: '32px', paddingBottom: '48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginBottom: '48px',
            flexWrap: 'wrap',
          }}
        >
          <img
            src={movie.poster}
            alt={movie.title}
            style={{
              width: '400px',
              borderRadius: '12px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              objectFit: 'cover',
            }}
          />
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1
              style={{
                color: '#F1F5F9',
                fontSize: '36px',
                fontWeight: 700,
                margin: '0 0 12px 0',
              }}
            >
              {movie.title}
            </h1>
            <div
              style={{
                display: 'flex',
                gap: '24px',
                color: '#94A3B8',
                fontSize: '15px',
                marginBottom: '24px',
              }}
            >
              <span>{movie.year} 年</span>
              <span>导演：{movie.director}</span>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <RatingCircle rating={stats.averageRating} total={stats.totalReviews} />
            </div>
            <div>
              <h3
                style={{
                  color: '#F1F5F9',
                  fontSize: '18px',
                  fontWeight: 600,
                  margin: '0 0 12px 0',
                }}
              >
                剧情简介
              </h3>
              <p
                style={{
                  color: '#CBD5E1',
                  fontSize: '15px',
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                {movie.overview}
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                color: '#F1F5F9',
                fontSize: '24px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              用户影评
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['date', 'rating'] as SortType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSortType(type)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
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

          {sortedReviews.length === 0 ? (
            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                color: '#94A3B8',
              }}
            >
              还没有影评，成为第一个发表影评的人吧！
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sortedReviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    padding: '20px 24px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <StarRating rating={review.rating} />
                    <span style={{ color: '#64748B', fontSize: '13px' }}>
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <p
                    style={{
                      color: '#E2E8F0',
                      fontSize: '15px',
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {id && <ReviewForm movieId={id} onSubmit={addReview} />}
      </div>
    </div>
  );
}
