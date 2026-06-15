import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { fetchAllCards, fetchLeaderboard, createCard as apiCreateCard } from './utils/api';
import InspirationCard from './components/InspirationCard';
import CreateCardModal from './components/CreateCardModal';
import Leaderboard from './components/Leaderboard';
import CommentPanel from './components/CommentPanel';
import type {
  PublicCardData,
  FilterType,
  RatingUpdatedPayload,
  CommentAddedPayload,
  InitSyncPayload,
  Comment,
} from './types';
import './styles/App.css';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function App() {
  const [cards, setCards] = useState<PublicCardData[]>([]);
  const [leaderboard, setLeaderboard] = useState<PublicCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const initializedRef = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const updateLeaderboard = useCallback((allCards: PublicCardData[]) => {
    const sorted = [...allCards].sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return b.createdAt - a.createdAt;
    });
    setLeaderboard(sorted.slice(0, 10));
  }, []);

  const wsHandlers = useMemo(
    () => ({
      onInitSync: (payload: InitSyncPayload) => {
        if (!initializedRef.current) {
          initializedRef.current = true;
          setCards(payload.cards);
          updateLeaderboard(payload.cards);
          setLoading(false);
        }
      },
      onCardCreated: (card: PublicCardData) => {
        setCards((prev) => {
          if (prev.some((c) => c.id === card.id)) return prev;
          return [card, ...prev];
        });
      },
      onRatingUpdated: (payload: RatingUpdatedPayload) => {
        setCards((prev) => {
          const updated = prev.map((c) =>
            c.id === payload.cardId
              ? {
                  ...c,
                  averageRating: payload.averageRating,
                  ratingCount: payload.ratingCount,
                  hasRated: true,
                }
              : c
          );
          updateLeaderboard(updated);
          return updated;
        });
      },
      onCommentAdded: (payload: CommentAddedPayload) => {
        setCards((prev) =>
          prev.map((c) => {
            if (c.id !== payload.cardId) return c;
            const exists = c.comments.some((cm) => cm.id === payload.comment.id);
            const newComments: Comment[] = exists
              ? c.comments
              : [payload.comment, ...c.comments].slice(0, 50);
            return {
              ...c,
              commentCount: payload.commentCount,
              comments: newComments,
            };
          })
        );
      },
    }),
    [updateLeaderboard]
  );

  const wsEnabled = typeof window !== 'undefined';
  useWebSocket(wsHandlers, wsEnabled);

  useEffect(() => {
    if (initializedRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const [allCards, lb] = await Promise.all([
          fetchAllCards(),
          fetchLeaderboard(),
        ]);
        if (cancelled) return;
        setCards(allCards);
        setLeaderboard(lb);
        initializedRef.current = true;
      } catch (err) {
        showToast(err instanceof Error ? err.message : '加载失败', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const handleCreateCard = useCallback(
    async (data: { title: string; description?: string; imageUrl?: string }) => {
      try {
        const newCard = await apiCreateCard(data);
        setShowCreateModal(false);
        showToast('灵感卡片创建成功！');
        return newCard;
      } catch (err) {
        showToast(err instanceof Error ? err.message : '创建失败', 'error');
        throw err;
      }
    },
    [showToast]
  );

  const filteredCards = useMemo(() => {
    const now = Date.now();
    const query = searchQuery.trim().toLowerCase();

    return cards.filter((card) => {
      if (filterType === 'highRating' && card.averageRating < 4) {
        return false;
      }
      if (filterType === 'recent' && now - card.createdAt > ONE_DAY_MS) {
        return false;
      }
      if (query) {
        const inTitle = card.title.toLowerCase().includes(query);
        const inDesc = card.description.toLowerCase().includes(query);
        if (!inTitle && !inDesc) return false;
      }
      return true;
    });
  }, [cards, searchQuery, filterType]);

  const selectedCard = useMemo(
    () => cards.find((c) => c.id === selectedCardId) ?? null,
    [cards, selectedCardId]
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">💡</span>
            <span className="logo-text">灵感众筹</span>
          </div>

          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="搜索灵感..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>

        <div className="filter-tabs">
          {(['all', 'highRating', 'recent'] as FilterType[]).map((type) => (
            <button
              key={type}
              className={`filter-tab ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'all' && '全部'}
              {type === 'highRating' && '高评分 ⭐≥4'}
              {type === 'recent' && '新发布 24h'}
            </button>
          ))}
        </div>
      </header>

      <main className="app-main">
        <section className="cards-section">
          {loading ? (
            <div className="loading-container">
              <div className="pulse-loader">
                <span />
                <span />
                <span />
              </div>
              <p className="loading-text">正在加载灵感...</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>暂无匹配的灵感卡片</h3>
              <p>试试调整搜索条件，或发布第一个灵感吧！</p>
            </div>
          ) : (
            <div className="masonry-grid" key={`${filterType}-${searchQuery}`}>
              {filteredCards.map((card, index) => (
                <div
                  key={card.id}
                  className="masonry-item"
                  style={{
                    animationDelay: `${Math.min(index * 50, 500)}ms`,
                  }}
                >
                  <InspirationCard
                    card={card}
                    onOpenComments={() => setSelectedCardId(card.id)}
                    onToast={showToast}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="leaderboard-section">
          <Leaderboard cards={leaderboard} onCardClick={setSelectedCardId} />
        </aside>
      </main>

      <button
        className="floating-add-btn"
        onClick={() => setShowCreateModal(true)}
        aria-label="创建灵感卡片"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showCreateModal && (
        <CreateCardModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCard}
        />
      )}

      {selectedCard && (
        <CommentPanel
          card={selectedCard}
          onClose={() => setSelectedCardId(null)}
          onToast={showToast}
        />
      )}

      {toast && (
        <div className={`toast toast-${toast.type} animate-scale-in`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
