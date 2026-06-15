import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import type { PublicCardData } from '../types';
import '../styles/Leaderboard.css';

interface LeaderboardProps {
  cards: PublicCardData[];
  onCardClick: (cardId: string) => void;
}

interface RankedItem {
  card: PublicCardData;
  previousRank: number;
  rank: number;
}

const RANK_UPDATE_THROTTLE_MS = 40;
const MAX_DISPLAY = 10;
const FLIP_TRANSITION_MS = 500;

export default function Leaderboard({ cards, onCardClick }: LeaderboardProps) {
  const [rankedItems, setRankedItems] = useState<RankedItem[]>([]);
  const previousRankMapRef = useRef<Map<string, number>>(new Map());
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCardsRef = useRef<PublicCardData[] | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemPositionsRef = useRef<Map<string, DOMRect>>(new Map());
  const animatingRef = useRef<Set<string>>(new Set());

  useLayoutEffect(() => {
    if (!listRef.current) return;

    const items = listRef.current.querySelectorAll<HTMLElement>('[data-card-id]');
    const newPositions = new Map<string, DOMRect>();

    items.forEach((el) => {
      const id = el.dataset.cardId;
      if (id) newPositions.set(id, el.getBoundingClientRect());
    });

    const prevPositions = itemPositionsRef.current;

    if (prevPositions.size > 0) {
      newPositions.forEach((newRect, id) => {
        const oldRect = prevPositions.get(id);
        if (!oldRect) return;

        const deltaY = oldRect.top - newRect.top;
        if (Math.abs(deltaY) > 1 && !animatingRef.current.has(id)) {
          animatingRef.current.add(id);

          const el = listRef.current?.querySelector<HTMLElement>(
            `[data-card-id="${id}"]`
          );
          if (el) {
            el.style.transition = 'none';
            el.style.transform = `translateY(${deltaY}px)`;

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                el.style.transition = `transform ${FLIP_TRANSITION_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
                el.style.transform = '';

                setTimeout(() => {
                  animatingRef.current.delete(id);
                  el.style.transition = '';
                  el.style.transform = '';
                }, FLIP_TRANSITION_MS + 20);
              });
            });
          }
        }
      });
    }

    itemPositionsRef.current = newPositions;
  }, [rankedItems]);

  useEffect(() => {
    pendingCardsRef.current = cards;

    if (updateTimerRef.current) return;

    updateTimerRef.current = setTimeout(() => {
      updateTimerRef.current = null;
      const currentCards = pendingCardsRef.current ?? cards;
      processUpdate(currentCards);
    }, RANK_UPDATE_THROTTLE_MS);

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
    };
  }, [cards]);

  const processUpdate = (newCards: PublicCardData[]) => {
    const sorted = [...newCards]
      .sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return b.createdAt - a.createdAt;
      })
      .slice(0, MAX_DISPLAY);

    const prevMap = previousRankMapRef.current;

    const newItems: RankedItem[] = sorted.map((card, index) => {
      const rank = index + 1;
      const previousRank = prevMap.get(card.id) ?? rank;
      return { card, previousRank, rank };
    });

    const newRankMap = new Map<string, number>();
    newItems.forEach((item) => {
      newRankMap.set(item.card.id, item.rank);
    });
    previousRankMapRef.current = newRankMap;

    setRankedItems(newItems);
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'rank-gold';
      case 2:
        return 'rank-silver';
      case 3:
        return 'rank-bronze';
      default:
        return 'rank-normal';
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${rank}`;
    }
  };

  const getTrendIcon = (item: RankedItem) => {
    if (item.previousRank === item.rank) return null;
    const improved = item.previousRank > item.rank;
    const isNewEntry = item.previousRank === item.rank && !previousRankMapRef.current.has(item.card.id);
    if (isNewEntry) return null;
    return (
      <span className={`trend-icon ${improved ? 'trend-up' : 'trend-down'}`}>
        {improved ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <aside className="leaderboard-panel">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">
          <span className="title-icon">🏆</span>
          实时排行榜
        </h2>
        <span className="leaderboard-badge animate-pulse">LIVE</span>
      </div>

      <div className="leaderboard-list" ref={listRef}>
        {rankedItems.length === 0 ? (
          <div className="leaderboard-empty">
            <p className="empty-text">暂无数据</p>
            <p className="empty-hint">发布灵感后自动排名</p>
          </div>
        ) : (
          rankedItems.map((item) => (
            <button
              type="button"
              key={item.card.id}
              data-card-id={item.card.id}
              className={`leaderboard-item ${getRankStyle(item.rank)}`}
              style={{
                '--rank-delay': `${(item.rank - 1) * 40}ms`,
              } as React.CSSProperties}
              onClick={() => onCardClick(item.card.id)}
            >
              <div className="item-rank">
                <span className="rank-display">{getRankEmoji(item.rank)}</span>
                {getTrendIcon(item)}
              </div>

              <div className="item-content">
                <p className="item-title">{item.card.title}</p>
                <div className="item-meta">
                  <span className="item-rating">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="meta-star">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <strong>{item.card.averageRating > 0 ? item.card.averageRating.toFixed(1) : '—'}</strong>
                    <span className="meta-sub">({item.card.ratingCount})</span>
                  </span>
                  <span className="item-comments">
                    💬 {item.card.commentCount}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="leaderboard-footer">
        <span className="footer-icon">⚡</span>
        <span className="footer-text">实时更新中</span>
      </div>
    </aside>
  );
}
