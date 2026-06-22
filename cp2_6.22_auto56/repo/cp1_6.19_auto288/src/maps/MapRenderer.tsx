import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tile, DecorationType } from '../types';

const CELL_SIZE = 48;

const TILE_COLORS: Record<string, string> = {
  wall: '#1a1a2e',
  corridor: '#2d2d44',
  room: '#3b3b5c',
};

const DECORATION_ICONS: Record<DecorationType & {}, string> = {
  torch: '🔥',
  chest: '📦',
  rubble: '🪨',
  bones: '💀',
};

const MONSTER_ICONS: Record<string, string> = {
  slime: '🟢',
  goblin: '👺',
  skeleton: '💀',
  orc: '👹',
  boss: '🐉',
};

function TileCell({ tile, isPlayer }: { tile: Tile; isPlayer: boolean }) {
  const opacity = tile.visible ? 1 : tile.explored ? 0.35 : 0.08;
  const baseColor = TILE_COLORS[tile.type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity,
        scale: 1,
        backgroundColor: baseColor,
      }}
      transition={{ duration: 0.2 }}
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        position: 'relative',
        border: '1px solid rgba(255,255,255,0.04)',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
      }}
    >
      {tile.decoration && (tile.visible || tile.explored) && (
        <span
          style={{
            position: 'absolute',
            fontSize: 18,
            opacity: tile.visible ? 1 : 0.5,
            filter: tile.type === 'wall' ? 'none' : 'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
          }}
        >
          {DECORATION_ICONS[tile.decoration]}
        </span>
      )}

      {isPlayer && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #4dd0e1, #00b4d8 60%, #0097a7)',
            boxShadow: '0 0 14px rgba(0,180,216,0.7), inset 0 -2px 4px rgba(0,0,0,0.3)',
            position: 'absolute',
            zIndex: 10,
            border: '2px solid rgba(255,255,255,0.4)',
          }}
        />
      )}
    </motion.div>
  );
}

function MonsterOnMap({ monster, visible }: { monster: any; visible: boolean }) {
  if (!visible) return null;

  const size = monster.isBoss ? 36 : 26;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 250, damping: 15 }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: monster.isBoss
          ? 'radial-gradient(circle at 30% 30%, #ff6b6b, #e63946 60%, #9d0208)'
          : 'radial-gradient(circle at 30% 30%, #ff8080, #e63946 60%, #b71c1c)',
        boxShadow: monster.isBoss
          ? '0 0 20px rgba(230,57,70,0.8), inset 0 -2px 4px rgba(0,0,0,0.3)'
          : '0 0 10px rgba(230,57,70,0.6), inset 0 -2px 4px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        zIndex: 5,
        border: monster.isBoss ? '3px solid #ffd700' : '2px solid rgba(255,255,255,0.3)',
        fontSize: monster.isBoss ? 20 : 14,
        animation: monster.isBoss ? 'boss-pulse 1.5s infinite' : undefined,
      }}
    >
      {MONSTER_ICONS[monster.type]}
    </motion.div>
  );
}

function ItemOnMap({ item, visible }: { item: any; visible: boolean }) {
  if (!visible) return null;

  const rarityColors: Record<string, string> = {
    common: '#b0b0b0',
    uncommon: '#4ecdc4',
    rare: '#5dade2',
    epic: '#bb8fce',
    legendary: '#f8c630',
  };

  const borderColor = rarityColors[item.item.rarity] || '#b0b0b0';

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        background: 'linear-gradient(135deg, #3a3a5c, #2a2a4c)',
        border: `2px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        zIndex: 4,
        fontSize: 12,
        boxShadow: `0 0 8px ${borderColor}60`,
      }}
    >
      {item.item.type === 'weapon' ? '⚔️' : item.item.type === 'armor' ? '🛡️' : '🧪'}
    </motion.div>
  );
}

export default function MapRenderer() {
  const { mapData, player } = useGameStore();

  if (!mapData) return null;

  const playerX = player.position.x;
  const playerY = player.position.y;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 20,
        background: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)',
        borderRadius: 16,
        border: '2px solid #3b3b5c',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div
        style={{
          marginBottom: 12,
          fontSize: 14,
          color: '#9999bb',
          letterSpacing: 2,
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        🏰 地牢第 {mapData.floor} 层 &nbsp; | &nbsp; 房间数: {mapData.rooms.length}
      </div>

      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `repeat(${mapData.width}, ${CELL_SIZE}px)`,
          gap: 0,
          padding: 4,
          background: '#0a0a14',
          borderRadius: 8,
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
        }}
      >
        {mapData.tiles.map((row, y) =>
          row.map((tile, x) => {
            const isPlayer = x === playerX && y === playerY;
            const distance = Math.abs(x - playerX) + Math.abs(y - playerY);
            const inFogRange = distance > 1;

            return (
              <div
                key={`${x}-${y}`}
                style={{ position: 'relative' }}
              >
                <TileCell tile={tile} isPlayer={isPlayer} />
                {inFogRange && tile.visible && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'rgba(0,0,0,0.25)',
                      pointerEvents: 'none',
                      borderRadius: 2,
                    }}
                  />
                )}
              </div>
            );
          })
        )}

        <AnimatePresence>
          {mapData.monsters.map((monster) => {
            const tile = mapData.tiles[monster.position.y][monster.position.x];
            return (
              <div
                key={monster.id}
                style={{
                  position: 'absolute',
                  left: monster.position.x * CELL_SIZE + CELL_SIZE / 2 + 4,
                  top: monster.position.y * CELL_SIZE + CELL_SIZE / 2 + 4,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              >
                <MonsterOnMap monster={monster} visible={tile.visible} />
              </div>
            );
          })}

          {mapData.items.map((item) => {
            const tile = mapData.tiles[item.position.y][item.position.x];
            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: item.position.x * CELL_SIZE + CELL_SIZE / 2 + 4,
                  top: item.position.y * CELL_SIZE + CELL_SIZE / 2 + 4,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              >
                <ItemOnMap item={item} visible={tile.visible} />
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'flex',
          gap: 20,
          fontSize: 12,
          color: '#8888aa',
        }}
      >
        <span>🔵 玩家</span>
        <span>🔴 怪物</span>
        <span>🐉 Boss</span>
        <span>📦 宝箱</span>
      </div>
    </div>
  );
}
