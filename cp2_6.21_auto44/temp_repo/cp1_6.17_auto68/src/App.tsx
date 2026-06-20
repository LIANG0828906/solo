import React, { useEffect, useState, useCallback } from 'react';
import { IdeaList } from './modules/ideas/IdeaList';
import { RankingSidebar } from './modules/ranking/RankingSidebar';
import { useIdeaStore } from './modules/ideas/IdeaStore';
import { useRankingStore } from './modules/ranking/RankingStore';

const App: React.FC = () => {
  const { ideas, searchQuery, setSearchQuery, fetchIdeas, createIdea } = useIdeaStore();
  const { fetchRankings } = useRankingStore();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    void fetchIdeas();
    void fetchRankings();
  }, [fetchIdeas, fetchRankings]);

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (query: string) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearchQuery(query);
        }, 80);
      };
    })(),
    [setSearchQuery]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleCreateIdea = async () => {
    if (!newTitle.trim() || !newDescription.trim()) return;
    
    setIsSubmitting(true);
    const result = await createIdea({
      title: newTitle.trim(),
      description: newDescription.trim()
    });
    
    if (result) {
      setNewTitle('');
      setNewDescription('');
      setShowModal(false);
      void fetchRankings();
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      <nav
        style={{
          height: '60px',
          background: '#2C3E50',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.5px' }}>
            灵感风暴
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 40px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="输入灵感关键词..."
              style={{
                width: '100%',
                height: '38px',
                padding: '0 16px 0 42px',
                border: 'none',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                transition: 'background 0.2s ease'
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.25)';
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.15)';
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.6)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            height: '38px',
            padding: '0 20px',
            borderRadius: '8px',
            background: '#27AE60',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#219A52';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#27AE60';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          创建新灵感
        </button>
      </nav>

      <div style={{ paddingTop: '60px' }}>
        <div
          style={{
            display: 'flex',
            gap: '24px',
            padding: '24px',
            maxWidth: '1600px',
            margin: '0 auto'
          }}
        >
          <RankingSidebar />
          <main style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#2C3E50', margin: 0 }}>
                全部灵感
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#5A6B7C', marginLeft: '10px' }}>
                  共 {ideas.length} 条
                </span>
              </h1>
            </div>
            <IdeaList ideas={ideas} />
          </main>
        </div>
      </div>

      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 2000,
              animation: 'fadeIn 0.2s ease'
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              width: '90%',
              maxWidth: '500px',
              zIndex: 2001,
              boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
              animation: 'modalIn 0.25s ease'
            }}
          >
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#2C3E50', margin: '0 0 24px 0' }}>
              分享你的灵感
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#2C3E50', marginBottom: '8px' }}>
                灵感标题
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="用一句话描述你的创意..."
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 14px',
                  border: '2px solid #E9ECEF',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#2C3E50';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#E9ECEF';
                }}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#2C3E50', marginBottom: '8px' }}>
                详细描述
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="详细介绍你的想法、背景和期望的效果..."
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #E9ECEF',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  (e.target as HTMLTextAreaElement).style.borderColor = '#2C3E50';
                }}
                onBlur={(e) => {
                  (e.target as HTMLTextAreaElement).style.borderColor = '#E9ECEF';
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  height: '42px',
                  padding: '0 24px',
                  borderRadius: '10px',
                  background: '#F8F9FA',
                  color: '#2C3E50',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#E9ECEF';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#F8F9FA';
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateIdea}
                disabled={isSubmitting || !newTitle.trim() || !newDescription.trim()}
                style={{
                  height: '42px',
                  padding: '0 28px',
                  borderRadius: '10px',
                  background: (!newTitle.trim() || !newDescription.trim()) ? '#A9D5BB' : '#27AE60',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: (!newTitle.trim() || !newDescription.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (newTitle.trim() && newDescription.trim()) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#219A52';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = (!newTitle.trim() || !newDescription.trim()) ? '#A9D5BB' : '#27AE60';
                }}
              >
                {isSubmitting ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    提交中...
                  </>
                ) : (
                  '发布灵感'
                )}
              </button>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes modalIn {
              from { opacity: 0; transform: translate(-50%, -48%); }
              to { opacity: 1; transform: translate(-50%, -50%); }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            input::placeholder, textarea::placeholder {
              color: #A0AEC0;
            }
          `}</style>
        </>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Roboto, Oxygen, Ubuntu, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: #F8F9FA;
        }
        html {
          scroll-behavior: smooth;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #F1F3F5;
        }
        ::-webkit-scrollbar-thumb {
          background: #CED4DA;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #ADB5BD;
        }
      `}</style>
    </div>
  );
};

export default App;
