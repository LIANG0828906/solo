import { useEffect, useRef } from 'react';
import { CARD_COLORS } from '../utils/colors';
import './WordHistoryList.css';

interface WordCard {
  word: string;
  playerIndex: number;
  id: string;
  colorIndex: number;
}

interface WordHistoryListProps {
  cards: WordCard[];
  playerNames: [string, string];
}

export default function WordHistoryList({ cards, playerNames }: WordHistoryListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(cards.length);

  useEffect(() => {
    if (listRef.current && cards.length > prevCountRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    prevCountRef.current = cards.length;
  }, [cards.length]);

  return (
    <div className="history-panel">
      <div className="history-title">词语记录</div>
      <div className="history-list" ref={listRef}>
        {cards.map((card, idx) => (
          <div
            key={card.id}
            className={`word-card ${idx === cards.length - 1 && idx > 0 ? 'word-card-new' : ''}`}
            style={{ background: CARD_COLORS[card.colorIndex] }}
          >
            <span className="word-index">{idx + 1}</span>
            <span className="word-text">{card.word}</span>
            {card.playerIndex >= 0 && (
              <span className={`word-player p${card.playerIndex + 1}`}>
                {playerNames[card.playerIndex]?.charAt(0) || '?'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
