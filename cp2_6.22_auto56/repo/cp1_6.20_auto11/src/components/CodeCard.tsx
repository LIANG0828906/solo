import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Snippet } from '../types';

interface CodeCardProps {
  snippet: Snippet;
  onLike: (id: string) => Promise<Snippet | null>;
  onFavorite: (id: string) => Promise<Snippet | null>;
  index?: number;
}

const LANG_ICONS: Record<string, string> = {
  JavaScript: 'JS',
  TypeScript: 'TS',
  Python: 'PY',
  HTML: 'HTML',
  CSS: 'CSS',
  Java: 'J',
  Go: 'GO',
  Rust: 'RS',
  React: '⚛',
  Vue: 'V',
  Shell: '$',
  SQL: 'SQL',
};

const PARTICLE_COLORS = ['#7C3AED', '#A78BFA', '#F472B6', '#FBBF24', '#34D399'];

export default function CodeCard({ snippet, onLike, onFavorite, index = 0 }: CodeCardProps) {
  const navigate = useNavigate();
  const [pressingLike, setPressingLike] = useState(false);
  const [pressingFav, setPressingFav] = useState(false);
  const [particles, setParticles] = useState<{ id: number; tx: number; ty: number; color: string }[]>([]);

  const handleCardClick = useCallback(() => {
    navigate(`/snippet/${snippet.id}`);
  }, [navigate, snippet.id]);

  const handleLikeClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPressingLike(true);
    setTimeout(() => setPressingLike(false), 300);

    if (!snippet.isLiked) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        tx: (Math.random() - 0.5) * 80,
        ty: (Math.random() - 0.5) * 80 - 30,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      }));
      setParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 600);
    }

    await onLike(snippet.id);
  }, [snippet.id, snippet.isLiked, onLike]);

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPressingFav(true);
    setTimeout(() => setPressingFav(false), 300);
    await onFavorite(snippet.id);
  }, [snippet.id, onFavorite]);

  const previewCode = snippet.code.length > 200 ? snippet.code.slice(0, 200) + '...' : snippet.code;
  const langIcon = LANG_ICONS[snippet.language] || snippet.language.slice(0, 2).toUpperCase();

  return (
    <div
      className="code-card"
      onClick={handleCardClick}
      style={{ animationDelay: `${(index % 20) * 50}ms` }}
    >
      <div className="card-header">
        <h3 className="card-title" title={snippet.title}>{snippet.title}</h3>
        <span className="lang-badge">
          <span className="lang-icon">{langIcon}</span>
          {snippet.language}
        </span>
      </div>

      <div className="code-preview">
        <pre>{previewCode}</pre>
      </div>

      {snippet.tags.length > 0 && (
        <div className="card-tags">
          {snippet.tags.map((tag, i) => (
            <span key={i} className="tag">#{tag}</span>
          ))}
        </div>
      )}

      <div className="card-actions">
        <button
          className={`action-btn ${snippet.isLiked ? 'active' : ''} ${pressingLike ? 'pressing' : ''}`}
          onClick={handleLikeClick}
        >
          <svg viewBox="0 0 24 24" fill={snippet.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          {snippet.likes}
          {particles.length > 0 && (
            <div className="particle-container">
              {particles.map(p => (
                <span
                  key={p.id}
                  className="particle"
                  style={{
                    background: p.color,
                    borderRadius: p.id % 2 === 0 ? '50%' : '0',
                    transform: `rotate(${p.id % 360}deg)`,
                    // @ts-ignore
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                  }}
                />
              ))}
            </div>
          )}
        </button>

        <button
          className={`action-btn ${snippet.isFavorited ? 'active' : ''} ${pressingFav ? 'pressing' : ''}`}
          onClick={handleFavoriteClick}
        >
          <svg viewBox="0 0 24 24" fill={snippet.isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          {snippet.favorites}
        </button>
      </div>
    </div>
  );
}
