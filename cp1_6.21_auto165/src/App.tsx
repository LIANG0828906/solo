import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import axios from 'axios';
import type { Meme, MemeContextType } from './types';
import MemeWall from './MemeWall';
import SubmitPanel from './SubmitPanel';

const MemeContext = createContext<MemeContextType | null>(null);

export const useMemeContext = () => {
  const ctx = useContext(MemeContext);
  if (!ctx) throw new Error('useMemeContext must be used within MemeProvider');
  return ctx;
};

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  '今日梗': { bg: '#FEF3C7', text: '#D97706' },
  '暖心': { bg: '#DBEAFE', text: '#2563EB' },
  '冷笑话': { bg: '#D1FAE5', text: '#059669' },
  '金句': { bg: '#FCE7F3', text: '#DB2777' },
  '吐槽': { bg: '#E0E7FF', text: '#4F46E5' },
};

export default function App() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchMemes = useCallback(async () => {
    try {
      const res = await axios.get('/api/memes');
      setMemes(res.data);
    } catch (err) {
      console.error('Failed to fetch memes:', err);
    }
  }, []);

  useEffect(() => {
    fetchMemes();
  }, [fetchMemes]);

  const addMeme = useCallback(async (content: string, tags: string[], author: string) => {
    try {
      const res = await axios.post('/api/memes', { content, tags, author });
      setMemes(prev => [res.data, ...prev]);
    } catch (err) {
      console.error('Failed to add meme:', err);
      throw err;
    }
  }, []);

  const likeMeme = useCallback(async (id: string) => {
    setMemes(prev => prev.map(m => m.id === id ? { ...m, likes: m.likes + 1 } : m));
    try {
      await axios.post(`/api/memes/${id}/like`);
    } catch (err) {
      console.error('Failed to like meme:', err);
      setMemes(prev => prev.map(m => m.id === id ? { ...m, likes: Math.max(0, m.likes - 1) } : m));
    }
  }, []);

  const contextValue = useMemo<MemeContextType>(() => ({
    memes,
    selectedTag,
    setSelectedTag,
    addMeme,
    likeMeme,
    fetchMemes,
  }), [memes, selectedTag, addMeme, likeMeme, fetchMemes]);

  const filteredMemes = useMemo(() => {
    if (!selectedTag) return memes;
    return memes.filter(m => m.tags.includes(selectedTag));
  }, [memes, selectedTag]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    memes.forEach(m => m.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [memes]);

  const todayContributors = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    const authorLikes: Record<string, number> = {};
    memes.forEach(m => {
      if (m.timestamp >= todayTs) {
        authorLikes[m.author] = (authorLikes[m.author] || 0) + m.likes;
      }
    });

    return Object.entries(authorLikes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([author, likes]) => ({ author, likes }));
  }, [memes]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <MemeContext.Provider value={contextValue}>
      <div style={styles.app}>
        <div className="mobile-header" style={styles.mobileHeader}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.hamburgerBtn}
            aria-label="菜单"
          >
            <span style={styles.hamburgerLine} />
            <span style={styles.hamburgerLine} />
            <span style={styles.hamburgerLine} />
          </button>
          <h1 style={styles.mobileTitle}>团队妙语墙</h1>
          <div style={{ width: 40 }} />
        </div>

        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={styles.sidebar}>
          <h1 style={styles.sidebarTitle}>团队妙语墙</h1>

          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>今日贡献榜</h3>
            {todayContributors.length === 0 ? (
              <p style={styles.emptyText}>暂无数据</p>
            ) : (
              <ul style={styles.rankingList}>
                {todayContributors.map((item, idx) => (
                  <li key={item.author} style={styles.rankingItem}>
                    <div style={{
                      ...styles.avatarDot,
                      backgroundColor: ['#6366F1', '#8B5CF6', '#EC4899'][idx] || '#94A3B8',
                    }}>
                      {item.author.charAt(0)}
                    </div>
                    <span style={styles.rankingName}>{item.author}</span>
                    <span style={styles.rankingLikes}>{item.likes} 赞</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {allTags.length > 0 && (
            <div style={styles.tagSection}>
              <h3 style={styles.tagSectionTitle}>标签筛选</h3>
              <div style={styles.tagList}>
                {allTags.map(tag => {
                  const colors = TAG_COLORS[tag] || { bg: '#E2E8F0', text: '#475569' };
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      className="tag-pill-btn"
                      onClick={() => handleTagClick(tag)}
                      style={{
                        backgroundColor: isSelected ? colors.text : colors.bg,
                        color: isSelected ? '#FFFFFF' : colors.text,
                      }}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {isMobile && sidebarOpen && (
          <div
            style={styles.overlay}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="main-content" style={styles.main}>
          <MemeWall memes={filteredMemes} />
        </main>

        <SubmitPanel />
      </div>
    </MemeContext.Provider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
  },
  mobileHeader: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 100,
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  hamburgerLine: {
    width: 24,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  mobileTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 700,
  },
  sidebar: {
    width: 260,
    minWidth: 260,
    backgroundColor: '#1E293B',
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 200,
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    overflowY: 'auto',
  },
  sidebarTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
  },
  statTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    opacity: 0.9,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  rankingList: {
    listStyle: 'none',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  rankingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatarDot: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  rankingName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 500,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rankingLikes: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: 500,
  },
  tagSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  tagSectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    opacity: 0.9,
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 150,
  },
  main: {
    flex: 1,
    marginLeft: 260,
    padding: '32px',
    minHeight: '100vh',
  },
};
