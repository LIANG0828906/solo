import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBattleStore } from '../store/battleStore';
import { executeTurn } from '../engine/battleEngine';
import { Card, RARITY_COLORS, TYPE_COLORS } from '../engine/types';

function CardComponent({
  card,
  isSelected,
  onClick,
  disabled,
}: {
  card: Card;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    if (!isSelected) {
      setFlipped(true);
      setTimeout(() => setFlipped(false), 300);
    }
    onClick();
  };

  const rarityColor = RARITY_COLORS[card.rarity];
  const typeColor = TYPE_COLORS[card.type];

  return (
    <motion.div
      onClick={handleClick}
      animate={{
        y: isSelected ? -20 : 0,
        scale: isSelected ? 1.05 : 1,
        rotateY: flipped ? 180 : 0,
      }}
      transition={{
        y: { type: 'spring', stiffness: 300, damping: 20, duration: 0.2 },
        scale: { duration: 0.2 },
        rotateY: { duration: 0.3 },
      }}
      style={{
        width: '80px',
        height: '120px',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        perspective: '600px',
        flexShrink: 0,
        border: isSelected ? `2px solid ${typeColor}` : '2px solid transparent',
        boxShadow: isSelected
          ? `0 4px 20px ${typeColor}55`
          : '0 2px 8px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%)`,
        display: 'flex',
        flexDirection: 'column',
        padding: '6px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: rarityColor,
        }} />
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          color: rarityColor,
          marginBottom: '2px',
          marginTop: '2px',
          textAlign: 'center',
        }}>
          {card.name}
        </div>
        <div style={{
          fontSize: '8px',
          color: typeColor,
          textAlign: 'center',
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {card.type}
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: `${typeColor}22`,
            border: `1px solid ${typeColor}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}>
            {card.type === 'attack' ? '⚔️' : card.type === 'heal' ? '💚' : card.type === 'defense' ? '🛡️' : card.type === 'buff' ? '⚡' : '🔮'}
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '9px',
        }}>
          <span style={{ color: '#42A5F5' }}>🔮{card.mpCost}</span>
          <span style={{
            fontSize: '7px',
            padding: '1px 4px',
            borderRadius: '3px',
            background: `${rarityColor}33`,
            color: rarityColor,
          }}>
            {card.rarity === 'common' ? '普通' : card.rarity === 'rare' ? '稀有' : '史诗'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function CardHand() {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const playerHand = useBattleStore((s) => s.playerHand);
  const player = useBattleStore((s) => s.player);
  const isOver = useBattleStore((s) => s.isOver);
  const isAnimating = useBattleStore((s) => s.isAnimating);
  const setAnimating = useBattleStore((s) => s.setAnimating);

  const selectedCard = playerHand.find((c) => c.id === selectedCardId);
  const canPlay = selectedCard && selectedCard.mpCost <= player.mp && !isOver && !isAnimating;

  const handlePlay = async () => {
    if (!selectedCard || !canPlay) return;
    setAnimating(true);
    setSelectedCardId(null);
    try {
      await executeTurn(selectedCard);
    } finally {
      setAnimating(false);
    }
  };

  return (
    <div style={{
      padding: '12px 24px 20px',
      background: 'linear-gradient(180deg, transparent 0%, #0d1525 100%)',
      borderTop: '1px solid #2a2a4a',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '12px',
      }}>
        {playerHand.map((card) => (
          <CardComponent
            key={card.id}
            card={card}
            isSelected={card.id === selectedCardId}
            onClick={() => setSelectedCardId(card.id === selectedCardId ? null : card.id)}
            disabled={isOver || isAnimating}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <motion.button
          onClick={handlePlay}
          disabled={!canPlay}
          whileHover={canPlay ? { scale: 1.1 } : {}}
          whileTap={canPlay ? { scale: 0.95 } : {}}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: 'none',
            background: canPlay
              ? 'linear-gradient(135deg, #E53935, #FF7043)'
              : '#333',
            color: canPlay ? '#fff' : '#666',
            fontSize: '20px',
            cursor: canPlay ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: canPlay
              ? '0 4px 20px rgba(229,57,53,0.5)'
              : 'none',
            transition: 'background 0.3s',
          }}
        >
          ▶
        </motion.button>
      </div>
    </div>
  );
}
