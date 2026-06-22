import { useState, useEffect } from 'react';
import { Song } from '../types';
import { useDebounce } from '../hooks/useDebounce';

interface SearchBarProps {
  onAddSong: (song: Song) => void;
}

export default function SearchBar({ onAddSong }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: debouncedQuery }),
    })
      .then((res) => res.json())
      .then((data: Song[]) => {
        if (!cancelled) {
          setResults(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleSelect = (song: Song) => {
    onAddSong(song);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="搜索歌曲、艺术家或流派..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {isLoading && <div className="spinner" />}
      </div>
      {showDropdown && (query || isLoading) && (
        <div className="search-dropdown">
          {isLoading && results.length === 0 ? (
            <div className="search-empty">搜索中...</div>
          ) : results.length === 0 ? (
            <div className="search-empty">未找到匹配的歌曲</div>
          ) : (
            results.map((song) => (
              <div
                key={song.id}
                className="search-item"
                onMouseDown={() => handleSelect(song)}
              >
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="search-item-cover"
                />
                <div className="search-item-info">
                  <div className="search-item-title">{song.title}</div>
                  <div className="search-item-meta">
                    {song.artist} · {song.genre}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
