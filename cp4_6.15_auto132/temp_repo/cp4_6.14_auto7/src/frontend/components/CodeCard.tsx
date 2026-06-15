import { useState, useEffect, useRef, useCallback } from 'react';
import type { CodeSnippet } from '../types';
import { snippetsApi } from '../api';
import { useFavorites } from '../hooks/useFavorites';
import { useToast } from '../hooks/useToast';

interface CodeCardProps {
  snippet: CodeSnippet;
  onClick?: () => void;
  onFavoritesChange?: (id: string, favorites: number) => void;
}

const FAVORITE_DEBOUNCE_MS = 300;

export default function CodeCard({ snippet, onClick, onFavoritesChange }: CodeCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast, ToastContainer } = useToast();
  const [displayFavorites, setDisplayFavorites] = useState(snippet.favorites);
  const [isRequesting, setIsRequesting] = useState(false);
  const requestNonceRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingToggleRef = useRef(false);

  const favorited = isFavorite(snippet.id);

  useEffect(() => {
    setDisplayFavorites(snippet.favorites);
  }, [snippet.favorites]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  const getCodePreview = () => {
    const lines = snippet.code.split('\n').slice(0, 5);
    return lines.join('\n');
  };

  const fireFavoriteRequest = useCallback(
    async (nonce: string, optimisticDelta: number) => {
      setIsRequesting(true);
      try {
        const result = await snippetsApi.toggleFavorite(snippet.id);
        setDisplayFavorites(result.snippet.favorites);
        if (onFavoritesChange) {
          onFavoritesChange(snippet.id, result.snippet.favorites);
        }
        showToast(result.favorited ? '已收藏' : '已取消收藏', 'success');
      } catch {
        setDisplayFavorites((prev) => Math.max(0, prev - optimisticDelta));
        if (onFavoritesChange) {
          onFavoritesChange(snippet.id, Math.max(0, displayFavorites - optimisticDelta));
        }
        toggleFavorite(snippet.id);
        showToast('操作失败，请重试', 'error');
      } finally {
        setIsRequesting(false);
        requestNonceRef.current = null;
      }
    },
    [snippet.id, displayFavorites, onFavoritesChange, showToast, toggleFavorite]
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isRequesting) {
      pendingToggleRef.current = !pendingToggleRef.current;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const willBeFavorited = !favorited;
    const optimisticDelta = willBeFavorited ? 1 : -1;

    toggleFavorite(snippet.id);
    setDisplayFavorites((prev) => Math.max(0, prev + optimisticDelta));
    if (onFavoritesChange) {
      onFavoritesChange(snippet.id, Math.max(0, displayFavorites + optimisticDelta));
    }

    const nonce = `${snippet.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    requestNonceRef.current = nonce;

    debounceTimerRef.current = setTimeout(() => {
      pendingToggleRef.current = false;
      fireFavoriteRequest(nonce, optimisticDelta);
    }, FAVORITE_DEBOUNCE_MS);
  };

  return (
    <>
      <div className="code-card" onClick={onClick} role="article">
        <div className="code-card-header">
          <h3 className="code-card-title" title={snippet.title}>
            {snippet.title}
          </h3>
          <button
            className={`favorite-btn ${favorited ? 'favorited' : ''} ${isRequesting ? 'requesting' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={favorited ? '取消收藏' : '收藏'}
            aria-pressed={favorited}
            disabled={false}
          >
            <svg
              className={`favorite-icon ${isRequesting ? 'spinner' : ''}`}
              viewBox="0 0 24 24"
              fill={favorited ? '#ff6b6b' : 'none'}
              stroke={favorited ? '#ff6b6b' : 'currentColor'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="favorite-count">{displayFavorites}</span>
          </button>
        </div>

        {snippet.description && (
          <p className="code-card-description" title={snippet.description}>
            {snippet.description}
          </p>
        )}

        <pre className="code-card-code" aria-hidden="true">
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
            {snippet.tags.length > 2 && (
              <span className="tag tag-more">+{snippet.tags.length - 2}</span>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
