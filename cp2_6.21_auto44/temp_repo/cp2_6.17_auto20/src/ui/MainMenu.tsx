import { useGameStore } from '../store/gameStore';

const rotatingGearStyle = (duration: number, reverse = false): React.CSSProperties => ({
  animation: `spin ${duration}s linear infinite ${reverse ? 'reverse' : ''}`,
  position: 'absolute',
});

const gearSVG = (size: number, color: string, opacity: number) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <g opacity={opacity}>
      <path
        d="M50 65A15 15 0 0 1 35 50 15 15 0 0 1 50 35a15 15 0 0 1 15 15 15 15 0 0 1-15 15m32-11c.2-1.4.3-2.8.3-4.3 0-1.4-.1-2.8-.3-4.2l9-7c.8-.6 1-1.8.5-2.7l-8.5-14.8c-.5-.9-1.7-1.3-2.6-.9l-10.6 4.3c-2.2-1.7-4.6-3.1-7.2-4.2l-1.6-11.4c-.1-1-1-1.8-2.1-1.8h-17.4c-1 0-1.9.8-2.1 1.8l-1.6 11.4c-2.6 1.1-5 2.5-7.2 4.2L15.3 19.9c-.9-.4-2.1 0-2.6.9L4.2 35.6c-.5.9-.3 2.1.5 2.7l9 7c-.2 1.4-.3 2.8-.3 4.2 0 1.5.1 2.9.3 4.3l-9 7c-.8.6-1 1.8-.5 2.7l8.5 14.8c.5.9 1.7 1.3 2.6.9l10.6-4.3c2.2 1.7 4.6 3.1 7.2 4.2l1.6 11.4c.1 1 1 1.8 2.1 1.8h17.4c1 0 1.9-.8 2.1-1.8l1.6-11.4c2.6-1.1 5-2.5 7.2-4.2l10.6 4.3c.9.4 2.1 0 2.6-.9l8.5-14.8c.5-.9.3-2.1-.5-2.7l-9-7Z"
        fill={color}
      />
    </g>
  </svg>
);

export default function MainMenu() {
  const gameState = useGameStore((s) => s.gameState);
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);

  if (gameState === 'playing') return null;

  const isMenu = gameState === 'menu';
  const isGameOver = gameState === 'gameover';
  const isVictory = gameState === 'victory';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(ellipse at center, #3E2723 0%, #1a0f0a 70%, #0a0604 100%)`,
        fontFamily: 'Georgia, "Times New Roman", serif',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes celebrate {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.05) rotate(-2deg); }
          75% { transform: scale(1.05) rotate(2deg); }
        }
      `}</style>

      <div style={{ ...rotatingGearStyle(25), top: '-30px', left: '-40px' }}>
        {gearSVG(200, '#B8860B', 0.2)}
      </div>
      <div style={{ ...rotatingGearStyle(40, true), top: '10%', right: '-60px' }}>
        {gearSVG(260, '#8B6914', 0.15)}
      </div>
      <div style={{ ...rotatingGearStyle(18), bottom: '-50px', left: '15%' }}>
        {gearSVG(180, '#DAA520', 0.18)}
      </div>
      <div style={{ ...rotatingGearStyle(35, true), bottom: '-30px', right: '10%' }}>
        {gearSVG(220, '#B8860B', 0.12)}
      </div>

      {isMenu && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            animation: 'floatUp 0.8s ease-out',
          }}
        >
          <h1
            style={{
              fontSize: 72,
              margin: 0,
              fontWeight: 900,
              letterSpacing: 4,
              background: 'linear-gradient(180deg, #FFD700 0%, #B8860B 45%, #8B6914 55%, #DAA520 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(218, 165, 32, 0.4)',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
            }}
          >
            SteamGearPunks
          </h1>
          <p
            style={{
              fontSize: 22,
              margin: 0,
              color: '#CD853F',
              letterSpacing: 6,
              opacity: 0.9,
            }}
          >
            蒸汽朋克地精工厂冒险
          </p>
          <button
            onClick={startGame}
            style={{
              marginTop: 24,
              padding: '18px 56px',
              fontSize: 22,
              fontWeight: 'bold',
              letterSpacing: 4,
              color: '#FFF8DC',
              background: 'linear-gradient(180deg, #DAA520 0%, #B8860B 50%, #8B6914 100%)',
              border: '2px solid #FFD700',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(218, 165, 32, 0.4), inset 0 1px 0 rgba(255, 248, 220, 0.3)',
              animation: 'pulse 2.5s ease-in-out infinite',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                '0 6px 30px rgba(255, 215, 0, 0.7), inset 0 1px 0 rgba(255, 248, 220, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                '0 4px 20px rgba(218, 165, 32, 0.4), inset 0 1px 0 rgba(255, 248, 220, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ⚙ 启动引擎 ⚙
          </button>
        </div>
      )}

      {isGameOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 5, 3, 0.85)',
            gap: 32,
            animation: 'floatUp 0.6s ease-out',
          }}
        >
          <div style={{ ...rotatingGearStyle(8), position: 'relative' }}>
            {gearSVG(140, '#5a1a1a', 0.6)}
          </div>
          <h2
            style={{
              fontSize: 56,
              margin: 0,
              color: '#8B0000',
              fontWeight: 900,
              letterSpacing: 8,
              textShadow: '0 0 30px rgba(139, 0, 0, 0.6), 0 4px 8px rgba(0,0,0,0.8)',
            }}
          >
            锅炉熄火了
          </h2>
          <button
            onClick={resetGame}
            style={{
              padding: '14px 48px',
              fontSize: 20,
              fontWeight: 'bold',
              letterSpacing: 3,
              color: '#FFF8DC',
              background: 'linear-gradient(180deg, #A0522D 0%, #8B4513 50%, #5D2E0C 100%)',
              border: '2px solid #CD853F',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(139, 69, 19, 0.5), inset 0 1px 0 rgba(255, 248, 220, 0.2)',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow =
                '0 6px 24px rgba(139, 69, 19, 0.7), inset 0 1px 0 rgba(255, 248, 220, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 4px 16px rgba(139, 69, 19, 0.5), inset 0 1px 0 rgba(255, 248, 220, 0.2)';
            }}
          >
            🔧 重新开始
          </button>
        </div>
      )}

      {isVictory && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
            animation: 'floatUp 0.6s ease-out',
          }}
        >
          <h2
            style={{
              fontSize: 64,
              margin: 0,
              background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
              letterSpacing: 8,
              textShadow: '0 0 40px rgba(255, 215, 0, 0.7)',
              animation: 'celebrate 2s ease-in-out infinite',
            }}
          >
            你征服了工厂！
          </h2>
          <p style={{ fontSize: 20, color: '#CD853F', letterSpacing: 4, margin: 0 }}>
            🏆 恭喜完成所有关卡 🏆
          </p>
          <button
            onClick={resetGame}
            style={{
              padding: '16px 52px',
              fontSize: 22,
              fontWeight: 'bold',
              letterSpacing: 4,
              color: '#FFF8DC',
              background: 'linear-gradient(180deg, #FFD700 0%, #DAA520 50%, #B8860B 100%)',
              border: '2px solid #FFD700',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 24px rgba(255, 215, 0, 0.5), inset 0 1px 0 rgba(255, 248, 220, 0.3)',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              animation: 'pulse 2s ease-in-out infinite',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow =
                '0 6px 32px rgba(255, 215, 0, 0.8), inset 0 1px 0 rgba(255, 248, 220, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow =
                '0 4px 24px rgba(255, 215, 0, 0.5), inset 0 1px 0 rgba(255, 248, 220, 0.3)';
            }}
          >
            ⚙ 再玩一次 ⚙
          </button>
        </div>
      )}
    </div>
  );
}
