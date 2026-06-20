import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Movie } from '@/stores/reviewStore';

interface MovieCardProps {
  movie: Movie;
  averageRating?: number;
}

export default function MovieCard({ movie, averageRating = 0 }: MovieCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/movie/${movie.id}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: '280px',
        backgroundColor: '#1E293B',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      }}
    >
      <div style={{ width: '100%', height: '400px', overflow: 'hidden', position: 'relative' }}>
        <img
          src={movie.poster}
          alt={movie.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
      <div style={{ padding: '16px' }}>
        <h3
          style={{
            color: '#F1F5F9',
            fontSize: '18px',
            fontWeight: 600,
            margin: '0 0 8px 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {movie.title}
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#94A3B8',
            fontSize: '14px',
          }}
        >
          <span>{movie.year}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star
              size={14}
              fill={averageRating > 0 ? '#F59E0B' : 'none'}
              stroke={averageRating > 0 ? '#F59E0B' : '#94A3B8'}
            />
            <span>{averageRating > 0 ? averageRating.toFixed(1) : '暂无评分'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
