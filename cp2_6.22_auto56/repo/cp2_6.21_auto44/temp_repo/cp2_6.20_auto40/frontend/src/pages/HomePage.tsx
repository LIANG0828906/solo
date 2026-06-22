import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StoryCard from '../components/StoryCard';
import type { Story } from '../types';
import { api } from '../api/client';

export default function HomePage() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredStories(stories);
      return;
    }
    const kw = searchKeyword.toLowerCase();
    const filtered = stories.filter(
      (s) =>
        s.title.toLowerCase().includes(kw) ||
        s.author.toLowerCase().includes(kw) ||
        (s.nodes[0]?.description?.toLowerCase().includes(kw) ?? false)
    );
    setFilteredStories(filtered);
  }, [stories, searchKeyword]);

  const loadStories = async () => {
    setLoading(true);
    try {
      const data = await api.getStories({ published_only: true });
      setStories(data);
      setFilteredStories(data);
    } catch (err) {
      console.error('加载故事列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFilter = useCallback((kw: string) => {
    setSearchKeyword(kw);
  }, []);

  const handleCreateStory = async () => {
    try {
      const story = await api.createStory();
      navigate(`/editor/${story.id}`);
    } catch (err) {
      console.error('创建失败:', err);
    }
  };

  const skeletonCount = 5;

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e' }}>
      <Navbar allStories={stories} onSearchFilter={handleSearchFilter} />

      <div style={{ paddingTop: 60 }}>
        <div
          style={{
            padding: '40px 20px 20px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 64,
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #e94560, #0f3460)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2,
            }}
          >
            探索无限故事宇宙
          </h1>
          <p
            style={{
              fontSize: 18,
              color: '#a0a0b0',
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            由创作者编织，由你抉择
          </p>
        </div>

        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '20px 24px 60px',
          }}
        >
          {loading ? (
            <div className="waterfall-container">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-card"
                  style={{
                    width: '100%',
                    minHeight: 320,
                    background: '#16213e',
                    borderRadius: 8,
                    overflow: 'hidden',
                    breakInside: 'avoid',
                    marginBottom: '1.5rem',
                    display: 'inline-block',
                  }}
                >
                  <div
                    className="skeleton-pulse"
                    style={{
                      width: '100%',
                      aspectRatio: '16 / 10',
                      background: '#0f3460',
                    }}
                  />
                  <div style={{ padding: 16 }}>
                    <div
                      className="skeleton-pulse"
                      style={{
                        height: 24,
                        width: '80%',
                        borderRadius: 4,
                        background: '#0f3460',
                        marginBottom: 10,
                      }}
                    />
                    <div
                      className="skeleton-pulse"
                      style={{
                        height: 14,
                        width: '50%',
                        borderRadius: 4,
                        background: '#0f3460',
                        marginBottom: 16,
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        className="skeleton-pulse"
                        style={{
                          height: 14,
                          width: 60,
                          borderRadius: 4,
                          background: '#0f3460',
                        }}
                      />
                      <div
                        className="skeleton-pulse"
                        style={{
                          height: 14,
                          width: 100,
                          borderRadius: 4,
                          background: '#0f3460',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStories.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div
                style={{
                  fontSize: 100,
                  opacity: 0.6,
                  filter: 'drop-shadow(0 4px 20px rgba(233,69,96,0.3))',
                }}
              >
                📚✨
              </div>
              <p
                style={{
                  color: '#a0a0b0',
                  fontSize: 18,
                  margin: 0,
                }}
              >
                {searchKeyword
                  ? '没有找到匹配的故事，换个关键词试试吧~'
                  : '还没有故事，快来创作第一个吧！'}
              </p>
              {!searchKeyword && (
                <button
                  onClick={handleCreateStory}
                  style={{
                    marginTop: 10,
                    padding: '12px 28px',
                    background: 'linear-gradient(135deg, #e94560, #0f3460)',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 15px rgba(233,69,96,0.4)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow =
                      '0 6px 20px rgba(233,69,96,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow =
                      '0 4px 15px rgba(233,69,96,0.4)';
                  }}
                >
                  ✏️  立即创作
                </button>
              )}
            </div>
          ) : (
            <div className="waterfall-container">
              {filteredStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .skeleton-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }

        .waterfall-container {
          column-count: 1;
          column-gap: 1rem;
        }

        @media (min-width: 640px) {
          .waterfall-container {
            column-count: 1;
            column-gap: 1rem;
          }
        }

        @media (min-width: 768px) {
          .waterfall-container {
            column-count: 2;
            column-gap: 1.25rem;
          }
        }

        @media (min-width: 1024px) {
          .waterfall-container {
            column-count: 3;
            column-gap: 1.5rem;
          }
        }

        @media (min-width: 1280px) {
          .waterfall-container {
            column-count: 4;
            column-gap: 1.5rem;
          }
        }

        .waterfall-container > * {
          break-inside: avoid;
          margin-bottom: 1.5rem;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1a1a2e;
        }
        ::-webkit-scrollbar-thumb {
          background: #0f3460;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #e94560;
        }
      `}</style>
    </div>
  );
}
