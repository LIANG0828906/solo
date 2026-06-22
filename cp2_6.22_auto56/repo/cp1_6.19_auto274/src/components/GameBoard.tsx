import { useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store';
import { TileType } from '../dungeonGenerator';

const TILE_SIZE = 60;
const MAP_SIZE = 8;

const tileColors: Record<TileType | 'specialChest', string> = {
  wall: '#3A3A3A',
  floor: '#B0B0B0',
  chest: '#FFD700',
  entrance: '#2ECC71',
  exit: '#E74C3C',
  specialChest: '#FFD700',
};

interface TileProps {
  tile: TileType;
  x: number;
  y: number;
  onClick: () => void;
  hasChestAnimation?: boolean;
}

const Tile = memo(function Tile({ tile, x, y, onClick, hasChestAnimation }: TileProps) {
  const isChest = tile === 'chest' || tile === 'specialChest';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2, delay: (x + y) * 0.02 }}
      onClick={onClick}
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        backgroundColor: tileColors[tile] || tileColors.floor,
        border: '1px solid rgba(0,0,0,0.3)',
        boxSizing: 'border-box',
        cursor: tile !== 'wall' ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderRadius: '2px',
      }}
      whileHover={tile !== 'wall' ? { filter: 'brightness(1.2)' } : {}}
      whileTap={tile !== 'wall' ? { scale: 0.95 } : {}}
    >
      {isChest && (
        <motion.div
          animate={hasChestAnimation ? { rotate: 360, scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.5 }}
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#8B4513',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {tile === 'specialChest' ? '★' : '♦'}
        </motion.div>
      )}
      {tile === 'entrance' && (
        <span style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>入</span>
      )}
      {tile === 'exit' && (
        <span style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>出</span>
      )}
    </motion.div>
  );
});

function GameBoard() {
  const { map, player, monsters, movePlayer, movePlayerTo, currentLevel, initGame, levelComplete, nextLevel, gameOver } =
    useGameStore();

  useEffect(() => {
    if (map.length === 0) {
      initGame();
    }
  }, [map.length, initGame]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          movePlayer(0, -1);
          break;
        case 's':
        case 'arrowdown':
          movePlayer(0, 1);
          break;
        case 'a':
        case 'arrowleft':
          movePlayer(-1, 0);
          break;
        case 'd':
        case 'arrowright':
          movePlayer(1, 0);
          break;
      }
    },
    [movePlayer]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTileClick = (x: number, y: number) => {
    movePlayerTo(x, y);
  };

  if (map.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <span style={{ color: '#E0E0E0' }}>加载中...</span>
      </div>
    );
  }

  return (
    <motion.div
      key={currentLevel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <h2 style={{ color: '#C9A96E', marginBottom: '16px', fontSize: '20px' }}>
        第 {currentLevel} 层地下城
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${MAP_SIZE}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${MAP_SIZE}, ${TILE_SIZE}px)`,
          gap: '0px',
          position: 'relative',
          boxShadow: '0 0 30px rgba(201, 169, 110, 0.3)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {map.map((row, y) =>
          row.map((tile, x) => (
            <Tile
              key={`${x}-${y}-${currentLevel}`}
              tile={tile}
              x={x}
              y={y}
              onClick={() => handleTileClick(x, y)}
            />
          ))
        )}

        {monsters.map((monster) => (
          <motion.div
            key={monster.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'absolute',
              left: monster.x * TILE_SIZE + 10,
              top: monster.y * TILE_SIZE + 10,
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#E74C3C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(231, 76, 60, 0.5)',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            {monster.name.charAt(0)}
          </motion.div>
        ))}

        <motion.div
          animate={{
            left: player.x * TILE_SIZE + 10,
            top: player.y * TILE_SIZE + 10,
          }}
          transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#3498DB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(52, 152, 219, 0.6)',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          勇
        </motion.div>
      </div>

      <p style={{ color: '#888', marginTop: '16px', fontSize: '13px' }}>
        使用 WASD 或方向键移动，点击相邻格子也可移动
      </p>

      <AnimatePresence>
        {levelComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              borderRadius: '8px',
            }}
          >
            <motion.h2
              initial={{ scale: 0.5, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{ color: '#2ECC71', fontSize: '32px', marginBottom: '20px' }}
            >
              🎉 恭喜通关！
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ color: '#E0E0E0', marginBottom: '24px', fontSize: '16px' }}
            >
              你成功通过了第 {currentLevel} 层地下城
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={nextLevel}
              style={{
                padding: '12px 32px',
                backgroundColor: '#C9A96E',
                color: '#1A0A2E',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(201, 169, 110, 0.4)',
              }}
            >
              进入下一关
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              borderRadius: '8px',
            }}
          >
            <motion.h2
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{ color: '#E74C3C', fontSize: '36px', marginBottom: '16px' }}
            >
              💀 Game Over
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ color: '#E0E0E0', marginBottom: '8px', fontSize: '16px' }}
            >
              到达层数: {currentLevel}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ color: '#E0E0E0', marginBottom: '24px', fontSize: '16px' }}
            >
              击杀怪物: {useGameStore.getState().totalMonstersKilled}
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => useGameStore.getState().restartGame()}
              style={{
                padding: '12px 32px',
                backgroundColor: '#E74C3C',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
              }}
            >
              重新开始
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default GameBoard;
