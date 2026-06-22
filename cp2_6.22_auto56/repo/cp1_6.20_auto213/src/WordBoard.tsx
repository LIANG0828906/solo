import { memo, useEffect, useRef } from 'react';
import type { WordEntry } from './types';

interface Props {
  words: WordEntry[];
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  userId: string;
}

const COLS = 5;
const ROWS = 4;
const MAX_WORDS = COLS * ROWS;

const WordCard = memo(function WordCard({
  word,
  onLike,
  onDislike,
  userId,
  isNew,
}: {
  word: WordEntry;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  userId: string;
  isNew: boolean;
}) {
  const isGold = word.likes >= 5;
  const isFaded = word.dislikes >= 3 || word.removed;

  return (
    <div
      className="word-card"
      style={{
        background: isFaded
          ? 'rgba(100,100,100,0.3)'
          : `hsla(${word.hue}, 40%, 70%, 0.35)`,
        borderRadius: 10,
        padding: '8px 6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        backdropFilter: 'blur(4px)',
        border: isGold ? '2px solid rgba(255,215,0,0.7)' : '1px solid rgba(255,255,255,0.15)',
        boxShadow: isGold
          ? '0 0 15px rgba(255,215,0,0.4), 0 0 30px rgba(255,215,0,0.2)'
          : '0 2px 8px rgba(0,0,0,0.2)',
        opacity: isFaded ? 0.3 : 1,
        transform: isNew ? 'scale(1)' : 'scale(1)',
        transition: 'transform 0.3s ease, opacity 0.3s ease, background 0.3s, border-color 0.3s, box-shadow 0.3s',
        animation: isNew
          ? 'cardAppear 0.5s ease-out'
          : isGold
            ? 'goldBreathe 1.2s ease-in-out infinite'
            : 'cardShake 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      } as React.CSSProperties}
    >
      <span
        style={{
          color: isFaded ? '#888' : '#fff',
          fontSize: 15,
          fontWeight: 500,
          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          textAlign: 'center',
          wordBreak: 'break-all',
          lineHeight: 1.3,
        }}
      >
        {word.text}
      </span>
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button
          className="vote-btn"
          onClick={() => onLike(word.id)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 6,
            color: isGold ? '#ffd700' : '#ccc',
            fontSize: 12,
            cursor: 'pointer',
            padding: '2px 6px',
            transition: 'background 0.15s',
          }}
        >
          ♥ {word.likes}
        </button>
        <button
          className="vote-btn"
          onClick={() => onDislike(word.id)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 6,
            color: isFaded ? '#666' : '#ccc',
            fontSize: 12,
            cursor: 'pointer',
            padding: '2px 6px',
            transition: 'background 0.15s',
          }}
        >
          ✗ {word.dislikes}
        </button>
      </div>
    </div>
  );
});

export default function WordBoard({ words, onLike, onDislike, userId }: Props) {
  const prevCountRef = useRef(words.length);
  const newestId = words.length > prevCountRef.current
    ? words[words.length - 1]?.id
    : null;

  useEffect(() => {
    prevCountRef.current = words.length;
  }, [words.length]);

  const displayWords = words.slice(-MAX_WORDS);

  const grid: (WordEntry | null)[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: (WordEntry | null)[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push(displayWords[r * COLS + c] || null);
    }
    grid.push(row);
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.2)',
        padding: 20,
        width: '100%',
        maxWidth: 480,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <style>{`
        @keyframes cardAppear {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes cardShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        @keyframes goldBreathe {
          0%, 100% { box-shadow: 0 0 10px rgba(255,215,0,0.3), 0 0 20px rgba(255,215,0,0.1); }
          50% { box-shadow: 0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3); }
        }
        .vote-btn:hover {
          background: rgba(255,255,255,0.25) !important;
        }
        .word-card:hover {
          transform: scale(1.04);
        }
      `}</style>
      {grid.map((row, ri) => (
        <div
          key={ri}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gap: 8,
            marginBottom: ri < grid.length - 1 ? 8 : 0,
          }}
        >
          {row.map((word, ci) =>
            word ? (
              <WordCard
                key={word.id}
                word={word}
                onLike={onLike}
                onDislike={onDislike}
                userId={userId}
                isNew={word.id === newestId}
              />
            ) : (
              <div
                key={`empty-${ri}-${ci}`}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 10,
                  padding: '8px 6px',
                  minHeight: 54,
                  border: '1px dashed rgba(255,255,255,0.1)',
                }}
              />
            )
          )}
        </div>
      ))}
    </div>
  );
}
