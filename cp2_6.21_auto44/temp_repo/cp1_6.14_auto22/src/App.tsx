import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Card, Deck, BattleRecord, UserStats } from './types';
import { cardApi, deckApi, battleApi, statsApi } from './api';
import CardGallery from './components/CardGallery';
import DeckBuilder from './components/DeckBuilder';
import BattleReport from './components/BattleReport';
import Dashboard from './components/Dashboard';

interface AppContextType {
  cards: Card[];
  decks: Deck[];
  battles: BattleRecord[];
  currentDeck: Deck | null;
  userStats: UserStats;
  isLoading: boolean;
  setCurrentDeck: (deck: Deck | null) => void;
  refreshDecks: () => Promise<void>;
  refreshBattles: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

type PageKey = 'dashboard' | 'gallery' | 'deck' | 'battle';

const pageIcons: Record<PageKey, string> = {
  dashboard: '📊',
  gallery: '🃏',
  deck: '📚',
  battle: '⚔️',
};

const pageNames: Record<PageKey, string> = {
  dashboard: '个人面板',
  gallery: '卡牌图鉴',
  deck: '卡组构建',
  battle: '对局分析',
};

const App: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [battles, setBattles] = useState<BattleRecord[]>([]);
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ deckCount: 0, battleCount: 0, topCards: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const currentPage = useMemo<PageKey>(() => {
    const path = location.pathname;
    if (path.includes('/gallery')) return 'gallery';
    if (path.includes('/deck')) return 'deck';
    if (path.includes('/battle')) return 'battle';
    return 'dashboard';
  }, [location.pathname]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [c, d, b, s] = await Promise.all([
        cardApi.getAll(),
        deckApi.getAll(),
        battleApi.getAll(),
        statsApi.get(),
      ]);
      setCards(c);
      setDecks(d);
      setBattles(b);
      setUserStats(s);
    } catch (err) {
      console.error('加载初始数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDecks = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([deckApi.getAll(), statsApi.get()]);
      setDecks(d);
      setUserStats(s);
    } catch (err) {
      console.error('刷新卡组失败:', err);
    }
  }, []);

  const refreshBattles = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([battleApi.getAll(), statsApi.get()]);
      setBattles(b);
      setUserStats(s);
    } catch (err) {
      console.error('刷新对局失败:', err);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const s = await statsApi.get();
      setUserStats(s);
    } catch (err) {
      console.error('刷新统计失败:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const goToPage = (page: PageKey) => {
    const paths: Record<PageKey, string> = {
      dashboard: '/',
      gallery: '/gallery',
      deck: '/deck',
      battle: '/battle',
    };
    navigate(paths[page]);
    setSidebarOpen(false);
  };

  const contextValue = useMemo<AppContextType>(
    () => ({
      cards,
      decks,
      battles,
      currentDeck,
      userStats,
      isLoading,
      setCurrentDeck,
      refreshDecks,
      refreshBattles,
      refreshStats,
    }),
    [cards, decks, battles, currentDeck, userStats, isLoading, refreshDecks, refreshBattles, refreshStats]
  );

  if (isLoading) {
    return (
      <div style={{ width: '100%', height: '100vh', padding: '40px' }}>
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 32 }}></div>
        <div className="card-grid">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="skeleton card-item"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-container">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="菜单"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>

        <div
          className={`mobile-overlay ${sidebarOpen ? 'show' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside className={`sidebar ${sidebarOpen ? 'show' : ''}`}>
          <div className="sidebar-logo">⚔️ 卡牌对战</div>
          <nav className="sidebar-nav">
            {(Object.keys(pageNames) as PageKey[]).map((key) => (
              <div
                key={key}
                className={`sidebar-item ${currentPage === key ? 'active' : ''}`}
                onClick={() => goToPage(key)}
              >
                <span className="sidebar-item-icon">{pageIcons[key]}</span>
                <span>{pageNames[key]}</span>
              </div>
            ))}
          </nav>
          <div style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            v1.0.0
          </div>
        </aside>

        <div className="main-content">
          <div className="content-area" key={currentPage}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/gallery" element={<CardGallery />} />
              <Route path="/deck" element={<DeckBuilder />} />
              <Route path="/battle" element={<BattleReport />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </div>

          <aside className="info-panel">
            <div className="section-title">快捷信息</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>卡组总数</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--accent)' }}>{userStats.deckCount}<span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 4 }}>/5</span></div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>对局记录</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--success)' }}>{userStats.battleCount}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>常用卡牌</div>
                {userStats.topCards.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {userStats.topCards.map((tc, idx) => {
                      const card = cards.find((c) => c.id === tc.cardId);
                      return (
                        <div key={tc.cardId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: idx === 0 ? 'rgba(251,191,36,0.2)' : idx === 1 ? 'rgba(192,192,192,0.2)' : 'rgba(205,127,50,0.2)',
                            color: idx === 0 ? 'var(--legendary)' : idx === 1 ? 'var(--common)' : '#cd7f32',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 'bold', flexShrink: 0,
                          }}>{idx + 1}</span>
                          <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {card?.name || '未知卡牌'}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>×{tc.count}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: '12px 0' }}>暂无数据</div>
                )}
              </div>
              <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>稀有度分布</div>
                <RarityDistribution cards={cards} decks={decks} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppContext.Provider>
  );
};

const RarityDistribution: React.FC<{ cards: Card[]; decks: Deck[] }> = ({ cards, decks }) => {
  const allCardsInDecks = decks.flatMap((d) => d.cards);
  const rarityMap = { common: 0, rare: 0, epic: 0, legendary: 0 };
  allCardsInDecks.forEach((dc) => {
    const c = cards.find((x) => x.id === dc.cardId);
    if (c) rarityMap[c.rarity] += dc.count;
  });
  const total = Object.values(rarityMap).reduce((a, b) => a + b, 0) || 1;
  const colors = { common: '#c0c0c0', rare: '#4a90d9', epic: '#a855f7', legendary: '#fbbf24' };
  const names = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(Object.keys(rarityMap) as (keyof typeof rarityMap)[]).map((r) => (
        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 36, fontSize: 12, color: 'var(--text-secondary)' }}>{names[r]}</span>
          <div style={{ flex: 1, height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(rarityMap[r] / total) * 100}%`,
              background: colors[r],
              borderRadius: 4,
              transition: 'width 0.6s ease',
            }} />
          </div>
          <span style={{ fontSize: 11, color: colors[r], minWidth: 28, textAlign: 'right' }}>{rarityMap[r]}</span>
        </div>
      ))}
    </div>
  );
};

export default App;
