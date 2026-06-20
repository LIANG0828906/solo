import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore, createPart } from '../../store/gameStore';
import type { MatchCard, PartType } from '../../store/types';

const SearchModal: React.FC = () => {
  const isSearching = useGameStore((s) => s.isSearching);
  const matchCards = useGameStore((s) => s.matchCards);
  const flippedCards = useGameStore((s) => s.flippedCards);
  const matchedPairs = useGameStore((s) => s.matchedPairs);
  const totalPairs = useGameStore((s) => s.totalPairs);
  const flipCard = useGameStore((s) => s.flipCard);
  const resetFlippedCards = useGameStore((s) => s.resetFlippedCards);
  const setMatchCards = useGameStore((s) => s.setMatchCards);
  const incrementMatchedPairs = useGameStore((s) => s.incrementMatchedPairs);
  const endSearch = useGameStore((s) => s.endSearch);
  const addCollectedPart = useGameStore((s) => s.addCollectedPart);
  const setGamePhase = useGameStore((s) => s.setGamePhase);

  const [searchPhase, setSearchPhase] = useState<'magnify' | 'matching'>('magnify');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (isSearching) {
      setSearchPhase('magnify');
      const timer = setTimeout(() => {
        setSearchPhase('matching');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSearching]);

  useEffect(() => {
    if (!checking && flippedCards.length === 2) {
      setChecking(true);
      const [firstId, secondId] = flippedCards;
      const first = matchCards.find((c) => c.id === firstId);
      const second = matchCards.find((c) => c.id === secondId);

      if (first && second && first.partType === second.partType) {
        setTimeout(() => {
          const updated = matchCards.map((c) =>
            c.id === firstId || c.id === secondId ? { ...c, matched: true } : c
          );
          setMatchCards(updated);
          incrementMatchedPairs();
          addCollectedPart(createPart(first.partType as PartType));
          resetFlippedCards();
          setChecking(false);
        }, 600);
      } else {
        setTimeout(() => {
          resetFlippedCards();
          setChecking(false);
        }, 900);
      }
    }
  }, [flippedCards, matchCards, checking, setMatchCards, incrementMatchedPairs, resetFlippedCards, addCollectedPart]);

  const handleClose = useCallback(() => {
    endSearch();
    setGamePhase('exploring');
  }, [endSearch, setGamePhase]);

  if (!isSearching) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 12, 27, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="glass-panel glow-panel"
        style={{
          padding: 32,
          minWidth: 400,
          maxWidth: '90vw',
          position: 'relative',
        }}
      >
        <h2
          style={{
            color: '#64ffda',
            fontSize: 20,
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          🔍 搜索沉船残骸
        </h2>

        {searchPhase === 'magnify' ? (
          <div
            style={{
              height: 260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                fontSize: 72,
                animation: 'magnify-spin 1s ease-out forwards',
              }}
            >
              🔍
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: 'rgba(16, 42, 67, 0.6)',
              }}
            >
              <span style={{ color: '#8892b0', fontSize: 13 }}>匹配进度</span>
              <span style={{ color: '#64ffda', fontFamily: 'monospace', fontWeight: 600 }}>
                {matchedPairs} / {totalPairs}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
                marginBottom: 20,
              }}
            >
              {matchCards.map((card: MatchCard) => {
                const isFlipped = flippedCards.includes(card.id) || card.matched;
                return (
                  <MatchCardItem
                    key={card.id}
                    card={card}
                    isFlipped={isFlipped}
                    onClick={() => !checking && !card.matched && flipCard(card.id)}
                  />
                );
              })}
            </div>

            {matchedPairs === totalPairs && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 16,
                  backgroundColor: 'rgba(100, 255, 218, 0.1)',
                  borderRadius: 8,
                  border: '1px solid rgba(100, 255, 218, 0.3)',
                  marginBottom: 16,
                  animation: 'fadeIn 0.4s ease-out',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                <div style={{ color: '#64ffda', fontWeight: 600 }}>搜索完成！</div>
                <div style={{ color: '#8892b0', fontSize: 12, marginTop: 4 }}>
                  所有部件已收入背包
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn"
                onClick={handleClose}
                disabled={matchedPairs < totalPairs}
              >
                {matchedPairs < totalPairs ? '继续匹配...' : '完成搜索'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MatchCardItem: React.FC<{
  card: MatchCard;
  isFlipped: boolean;
  onClick: () => void;
}> = ({ card, isFlipped, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: '1 / 1',
        perspective: '600px',
        cursor: card.matched ? 'default' : 'pointer',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.4s ease',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #112240 0%, #1a365d 100%)',
            border: '2px solid rgba(100, 255, 218, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64ffda',
            fontSize: 24,
            boxShadow: card.matched
              ? '0 0 15px rgba(100, 255, 218, 0.5)'
              : '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ opacity: 0.5 }}>?</span>
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: 10,
            background: card.matched
              ? 'linear-gradient(135deg, rgba(100, 255, 218, 0.2) 0%, rgba(100, 255, 218, 0.1) 100%)'
              : 'linear-gradient(135deg, #1e3a5f 0%, #234e70 100%)',
            border: `2px solid ${card.matched ? '#64ffda' : 'rgba(100, 255, 218, 0.4)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: 4,
          }}
        >
          <span style={{ fontSize: 28 }}>{card.icon}</span>
          <span
            style={{
              fontSize: 10,
              color: card.matched ? '#64ffda' : '#8892b0',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            {card.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
