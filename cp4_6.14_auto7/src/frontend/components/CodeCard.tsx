import { useState } from 'react';
import type { CodeSnippet } from '../types';
import { snippetsApi } from '../api';
import { useFavorites } from '../hooks/useFavorites';
import { useToast } from '../hooks/useToast';

interface CodeCardProps {
  snippet: CodeSnippet;
  onClick?: () => void;
}

export default function CodeCard({ snippet, onClick }: CodeCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast, ToastContainer } = useToast();
  const [favorites, setFavorites] = useState(snippet.favorites);
  const favorited = isFavorite(snippet.id);

  const getCodePreview = () => {
    const lines = snippet.code.split('\n').slice(0, 5);
    return lines.join('\n');
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await snippetsApi.toggleFavorite(snippet.id);
      setFavorites(result.snippet.favorites);
      toggleFavorite(snippet.id);
      showToast(result.favorited ? '已收藏' : '已取消收藏', 'success');
    } catch {
      showToast('操作失败，请重试', 'error');
    }
  };

  return (
    <>
      <div className="code-card" onClick={onClick}>
        <div className="code-card-header">
          <h3 className="code-card-title" title={snippet.title}>
            {snippet.title}
          </h3>
          <button
            className={`favorite-btn ${favorited ? 'favorited' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={favorited ? '取消收藏' : '收藏'}
          >
            <svg
              className="favorite-icon"
              viewBox="0 0 24 24"
              fill={favorited ? '#ff6b6b' : 'none'}
              stroke={favorited ? '#ff6b6b' : 'currentColor'}
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="favorite-count">{favorites}</span>
          </button>
        </div>

        {snippet.description && (
          <p className="code-card-description" title={snippet.description}>
            {snippet.description}
          </p>
        )}

        <pre className="code-card-code">
          <code>{getCodePreview()}</code>
        </pre>

        <div className="code-card-footer">
          <div className="code-card-tags">
            <span className="tag tag-language">{snippet.language}</span>
            {snippet.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
