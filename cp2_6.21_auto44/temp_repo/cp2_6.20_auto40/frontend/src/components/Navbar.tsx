import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Story } from '../types';
import { api } from '../api/client';

interface NavbarProps {
  allStories?: Story[];
  onSearchFilter?: (keyword: string) => void;
}

export default function Navbar({ allStories, onSearchFilter }: NavbarProps) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Story[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) {
      setSuggestions([]);
      if (onSearchFilter) onSearchFilter('');
      return;
    }

    if (allStories) {
      const filtered = allStories.filter(
        (s) =>
          s.title.toLowerCase().includes(kw) ||
          s.author.toLowerCase().includes(kw) ||
          (s.nodes[0]?.description?.toLowerCase().includes(kw) ?? false)
      );
      setSuggestions(filtered.slice(0, 8));
    } else {
      const timer = setTimeout(async () => {
        try {
          const res = await api.getStories({ search: kw, published_only: true });
          setSuggestions(res.slice(0, 8));
        } catch {
          setSuggestions([]);
        }
      }, 300);
      return () => clearTimeout(timer);
    }

    if (onSearchFilter) onSearchFilter(kw);
  }, [keyword, allStories, onSearchFilter]);

  const showSuggestions = isFocused && (keyword.length > 0 || suggestions.length > 0);

  const handleCreateStory = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const story = await api.createStory();
      navigate(`/editor/${story.id}`);
    } catch (err) {
      console.error('创建失败:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGoStory = (id: string) => {
    setIsFocused(false);
    setKeyword('');
    navigate(`/play/${id}`);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        background: 'rgba(22, 33, 62, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 2px 15px rgba(0,0,0,0.3)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
      }}
    >
      <div
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 26 }}>🎮</span>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#e94560',
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          StoryForge
        </span>
      </div>

      <div
        ref={searchRef}
        style={{
          position: 'relative',
          width: '40%',
          minWidth: 300,
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#a0a0b0',
            fontSize: 16,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          🔍
        </span>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="搜索故事、作者..."
          style={{
            width: '100%',
            padding: '10px 16px 10px 40px',
            background: '#1a1a2e',
            border: '1px solid #0f3460',
            borderRadius: 8,
            color: '#eaeaea',
            outline: 'none',
            fontSize: 14,
            transition: 'all 0.3s',
            boxSizing: 'border-box',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = '#e94560';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(233,69,96,0.2)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#0f3460';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />

        {showSuggestions && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: '#16213e',
              borderRadius: 8,
              boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              maxHeight: 300,
              overflowY: 'auto',
              border: '1px solid #0f3460',
              zIndex: 10,
            }}
          >
            {suggestions.length === 0 ? (
              <div
                style={{
                  padding: '14px 16px',
                  color: '#a0a0b0',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                没有找到匹配的故事
              </div>
            ) : (
              suggestions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleGoStory(s.id)}
                  className="search-suggestion-item"
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderBottom: '1px solid rgba(15,52,96,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <span style={{ color: '#eaeaea', fontSize: 14, fontWeight: 500 }}>
                    {s.title}
                  </span>
                  <span style={{ color: '#a0a0b0', fontSize: 11 }}>
                    作者：{s.author}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={handleCreateStory}
          disabled={isCreating}
          style={{
            padding: '8px 18px',
            background: 'linear-gradient(135deg, #e94560, #0f3460)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: isCreating ? 'wait' : 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 2px 10px rgba(233,69,96,0.3)',
            opacity: isCreating ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isCreating) e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {isCreating ? '创建中...' : '✏️  创建故事'}
        </button>

        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0f3460, #16213e)',
            border: '2px solid #0f3460',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          title="用户头像"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#e94560';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#0f3460';
          }}
        >
          🧑
        </div>
      </div>

      <style>{`
        .search-suggestion-item:hover {
          background: rgba(160, 160, 176, 0.15);
          color: #e94560 !important;
          padding-left: 20px !important;
        }
        .search-suggestion-item:hover > span:first-child {
          color: #e94560 !important;
        }
      `}</style>
    </nav>
  );
}
