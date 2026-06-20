import { useGameStore, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../store/gameStore';

const GearIcon = ({ active, size = 24 }: { active: boolean; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      opacity: active ? 1 : 0.35,
      filter: active ? 'drop-shadow(0 0 3px rgba(184, 134, 11, 0.6))' : 'none',
    }}
  >
    <path
      d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
      fill={active ? '#B8860B' : '#555'}
      stroke={active ? '#DAA520' : '#333'}
      strokeWidth="0.5"
    />
  </svg>
);

const BatteryIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))' }}
  >
    <rect x="2" y="7" width="16" height="10" rx="2" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" />
    <rect x="18" y="10" width="3" height="4" rx="1" fill="#B8860B" />
    <rect x="4" y="9" width="5" height="6" rx="1" fill="#FFF8DC" opacity="0.7" />
  </svg>
);

const hudPanelStyle: React.CSSProperties = {
  background: 'rgba(30, 20, 10, 0.7)',
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid rgba(184, 134, 11, 0.4)',
  boxShadow: '0 0 10px rgba(184, 134, 11, 0.2)',
};

export default function GameHud() {
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const batteryCount = useGameStore((s) => s.batteryCount);
  const maxBatteries = useGameStore((s) => s.maxBatteries);
  const exploredTiles = useGameStore((s) => s.exploredTiles);
  const playerX = useGameStore((s) => s.playerX);
  const playerY = useGameStore((s) => s.playerY);
  const gameState = useGameStore((s) => s.gameState);

  if (gameState !== 'playing') return null;

  const MINIMAP_SIZE = 80;
  const tileW = MINIMAP_SIZE / MAP_WIDTH;
  const tileH = MINIMAP_SIZE / MAP_HEIGHT;

  const playerTileX = Math.floor(playerX / TILE_SIZE);
  const playerTileY = Math.floor(playerY / TILE_SIZE);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#DAA520',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          ...hudPanelStyle,
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        {Array.from({ length: maxHealth }).map((_, i) => (
          <GearIcon key={i} active={i < health} size={24} />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          ...hudPanelStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
          minWidth: 120,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }}>
          第 {currentLevel} 层
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <BatteryIcon size={18} />
          <span>
            电池 {batteryCount}/{maxBatteries}
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          width: MINIMAP_SIZE,
          height: MINIMAP_SIZE,
          borderRadius: '50%',
          border: '2px solid #B8860B',
          background: '#1a0f0a',
          overflow: 'hidden',
          boxShadow: '0 0 12px rgba(184, 134, 11, 0.4)',
        }}
      >
        <svg width={MINIMAP_SIZE} height={MINIMAP_SIZE}>
          <defs>
            <radialGradient id="minimapBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2a1f18" />
              <stop offset="100%" stopColor="#0a0604" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width={MINIMAP_SIZE} height={MINIMAP_SIZE} fill="url(#minimapBg)" />
          {exploredTiles.map((row, y) =>
            row.map((explored, x) => (
              <rect
                key={`${x}-${y}`}
                x={x * tileW}
                y={y * tileH}
                width={tileW + 0.5}
                height={tileH + 0.5}
                fill={explored ? 'rgba(184, 134, 11, 0.4)' : 'rgba(20, 15, 10, 0.9)'}
              />
            ))
          )}
          <circle
            cx={playerTileX * tileW + tileW / 2}
            cy={playerTileY * tileH + tileH / 2}
            r={3}
            fill="#ffffff"
            filter="url(#glow)"
          />
        </svg>
      </div>
    </div>
  );
}
