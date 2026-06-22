import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Ship } from '../types';

interface FleetPanelProps {
  side: 'player' | 'ai';
  title: string;
}

interface ShipCardProps {
  ship: Ship;
  side: 'player' | 'ai';
}

const ShipCard = memo(function ShipCard({ ship, side }: ShipCardProps) {
  const hitCount = ship.hits.filter(Boolean).length;
  const totalHits = ship.hits.length;
  const healthPercent = ship.isPlaced ? ((totalHits - hitCount) / totalHits) * 100 : 100;

  const getHealthColor = () => {
    if (healthPercent > 60) return '#2ECC71';
    if (healthPercent > 30) return '#F1C40F';
    return '#E74C3C';
  };

  const handleRemove = () => {
    if (side === 'player' && ship.isPlaced) {
      useGameStore.getState().removeShip(ship.id);
    }
  };

  return (
    <motion.div
      style={{
        backgroundColor: ship.isSunk ? '#5D6D7E' : 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        opacity: ship.isSunk ? 0.6 : 1,
        position: 'relative',
        cursor: side === 'player' && ship.isPlaced ? 'pointer' : 'default',
      }}
      whileHover={
        side === 'player' && ship.isPlaced
          ? { scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }
          : {}
      }
      transition={{ duration: 0.15 }}
      onClick={side === 'player' ? handleRemove : undefined}
    >
      <div style={{ fontSize: 24, filter: ship.isSunk ? 'grayscale(1)' : 'none' }}>
        {ship.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 'bold',
            color: ship.isSunk ? '#BDC3C7' : '#ECF0F1',
            marginBottom: 4,
            position: 'relative',
          }}
        >
          {ship.name}
          {ship.isSunk && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: '#E74C3C',
                transform: 'rotate(-15deg)',
              }}
            />
          )}
        </div>
        <div
          style={{
            height: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {ship.isPlaced && (
            <motion.div
              style={{
                height: '100%',
                backgroundColor: getHealthColor(),
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
              }}
              initial={{ width: '100%' }}
              animate={{ width: `${healthPercent}%` }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
          {!ship.isPlaced && (
            <div
              style={{
                height: '100%',
                backgroundColor: '#7F8C8D',
                borderRadius: 4,
                fontStyle: 'italic',
              }}
            />
          )}
        </div>
        <div style={{ fontSize: 11, color: '#95A5A6', marginTop: 2 }}>
          {ship.isPlaced ? `${totalHits - hitCount}/${totalHits}` : '未放置'}
        </div>
      </div>
      {ship.isSunk && (
        <div
          style={{
            fontSize: 20,
            color: '#E74C3C',
            position: 'absolute',
            top: 2,
            right: 6,
          }}
        >
          ✕
        </div>
      )}
    </motion.div>
  );
});

const FleetPanel = memo(function FleetPanel({ side, title }: FleetPanelProps) {
  const ships = useGameStore((state) => (side === 'player' ? state.playerShips : state.aiShips));
  const phase = useGameStore((state) => state.phase);
  const hits = useGameStore((state) => (side === 'player' ? state.aiHits : state.playerHits));
  const misses = useGameStore((state) => (side === 'player' ? state.aiMisses : state.playerMisses));

  const remainingShips = ships.filter((s) => s.isPlaced && !s.isSunk).length;
  const totalShips = ships.filter((s) => s.isPlaced).length;
  const sunkShips = totalShips - remainingShips;

  const totalShots = hits + misses;
  const hitRate = totalShots > 0 ? ((hits / totalShots) * 100).toFixed(1) : '0.0';

  return (
    <motion.div
      style={{
        backgroundColor: 'rgba(44, 62, 80, 0.9)',
        borderRadius: 12,
        padding: 16,
        width: 200,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
      }}
      initial={{ opacity: 0, x: side === 'player' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#ECF0F1',
            marginBottom: 4,
            textAlign: 'center',
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#BDC3C7',
          }}
        >
          <span>剩余: {remainingShips}/{totalShips}</span>
          <span>击沉: {sunkShips}</span>
        </div>
        {phase === 'battle' && (
          <div style={{ fontSize: 11, color: '#95A5A6', textAlign: 'center', marginTop: 4 }}>
            命中率: {hitRate}%
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ships.map((ship) => (
          <ShipCard key={ship.id} ship={ship} side={side} />
        ))}
      </div>

      {side === 'player' && phase === 'placement' && (
        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: '#95A5A6',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          点击已放置船只可移除
        </div>
      )}
    </motion.div>
  );
});

export default FleetPanel;
