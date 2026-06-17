import React, { useState } from 'react';
import { useGameStore } from './store';
import { MAP_WIDTH, MAP_HEIGHT } from './gameConfig';

interface StatsData {
  totalWaves: number;
  totalKills: number;
  totalGoldEarned: number;
  towersBuilt: number;
}

const GameOverPanel: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const resetGame = useGameStore((s) => s.resetGame);
  const score = useGameStore((s) => s.score);
  const wave = useGameStore((s) => s.wave);
  const towers = useGameStore((s) => s.towers);

  const [showStats, setShowStats] = useState(false);

  const stats: StatsData = {
    totalWaves: wave,
    totalKills: Math.floor(score / 10),
    totalGoldEarned: score + Math.floor(score * 0.3),
    towersBuilt: towers.length,
  };

  if (gameState !== 'lost' && gameState !== 'won') return null;

  const isWin = gameState === 'won';

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#16213E',
          borderRadius: 12,
          padding: 40,
          minWidth: 400,
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(233, 69, 96, 0.3)',
          border: '2px solid #4A4A6E',
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 'bold',
            color: isWin ? '#00E676' : '#FF5252',
            marginBottom: 20,
            textShadow: `0 0 20px ${isWin ? '#00E676' : '#FF5252'}`,
          }}
        >
          {isWin ? '🎉 胜利!' : '💀 Game Over'}
        </div>

        {!showStats ? (
          <>
            <div style={{ color: '#ccc', fontSize: 16, marginBottom: 30 }}>
              {isWin
                ? `恭喜你成功守护了天空堡垒！`
                : `你坚持到了第 ${wave} 波`}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                justifyContent: 'center',
              }}
            >
              <button
                onClick={() => {
                  resetGame();
                  setShowStats(false);
                }}
                style={{
                  padding: '12px 32px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #E94560, #C73E54)',
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                  transition: 'transform 0.15s ease-out',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                onMouseDown={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
              >
                重新开始
              </button>
              <button
                onClick={() => setShowStats(true)}
                style={{
                  padding: '12px 32px',
                  borderRadius: 8,
                  border: '2px solid #4A4A6E',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                  transition: 'transform 0.15s ease-out',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                  (e.target as HTMLButtonElement).style.borderColor = '#00BFFF';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.target as HTMLButtonElement).style.borderColor = '#4A4A6E';
                }}
                onMouseDown={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
              >
                查看统计
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                textAlign: 'left',
                background: '#0D1117',
                borderRadius: 8,
                padding: 20,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 16,
                  textAlign: 'center',
                }}
              >
                📊 游戏统计
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <StatRow label="通过波次" value={`${stats.totalWaves}`} color="#00BFFF" />
                <StatRow label="击杀敌人" value={`${stats.totalKills}`} color="#FF5252" />
                <StatRow label="获得金币" value={`${stats.totalGoldEarned}`} color="#FFD700" />
                <StatRow label="建造防御塔" value={`${stats.towersBuilt}`} color="#00E676" />
                <StatRow label="最终得分" value={`${score}`} color="#9B59B6" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={() => setShowStats(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: '2px solid #4A4A6E',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 'bold',
                  transition: 'transform 0.15s ease-out',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                onMouseDown={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
              >
                返回
              </button>
              <button
                onClick={() => {
                  resetGame();
                  setShowStats(false);
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #E94560, #C73E54)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 'bold',
                  transition: 'transform 0.15s ease-out',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                onMouseDown={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
              >
                重新开始
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <span style={{ color: '#aaa', fontSize: 14 }}>{label}</span>
    <span style={{ color, fontSize: 16, fontWeight: 'bold' }}>{value}</span>
  </div>
);

export const GameUI: React.FC = () => {
  const {
    gold,
    wave,
    lives,
    enemies,
    waveInProgress,
    totalEnemiesInWave,
    enemiesSpawned,
    startWave,
  } = useGameStore();

  const aliveEnemies = enemies.length;
  const enemiesRemaining = totalEnemiesInWave - enemiesSpawned + aliveEnemies;
  const progressPercent =
    totalEnemiesInWave > 0
      ? Math.max(0, Math.min(100, (enemiesRemaining / totalEnemiesInWave) * 100))
      : 0;

  const progressColor = progressPercent > 50 ? '#00E676' : progressPercent > 25 ? '#FFD700' : '#FF5252';

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: -60,
          left: 0,
          width: MAP_WIDTH,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'white',
          fontSize: 20,
          fontWeight: 'bold',
        }}
      >
        <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#FFD700' }}>💰</span>
            <span>{gold}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#E94560' }}>❤️</span>
            <span>{lives}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#00BFFF' }}>🌊</span>
            <span>第 {wave} 波</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#FF5252' }}>👾</span>
            <span>{aliveEnemies}</span>
          </div>
        </div>

        <button
          onClick={startWave}
          disabled={waveInProgress}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            cursor: waveInProgress ? 'not-allowed' : 'pointer',
            background: waveInProgress
              ? 'rgba(233, 69, 96, 0.4)'
              : 'linear-gradient(135deg, #E94560, #C73E54)',
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
            transition: 'transform 0.15s ease-out',
          }}
          onMouseEnter={(e) => {
            if (!waveInProgress)
              (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            if (!waveInProgress)
              (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            if (!waveInProgress)
              (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
          }}
        >
          {waveInProgress ? '战斗中...' : wave === 0 ? '开始游戏' : '开始下一波'}
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: -30,
          left: 0,
          width: MAP_WIDTH,
          height: 10,
          background: '#1B2A3A',
          borderRadius: 5,
          overflow: 'hidden',
          border: '1px solid #2C3E50',
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: `linear-gradient(90deg, #00E676, ${progressColor})`,
            transition: 'width 0.3s ease-out',
          }}
        />
      </div>

      {waveInProgress && (
        <div
          style={{
            position: 'absolute',
            bottom: -50,
            left: 0,
            width: MAP_WIDTH,
            textAlign: 'center',
            color: 'white',
            fontSize: 12,
          }}
        >
          剩余敌人: {enemiesRemaining} / {totalEnemiesInWave}
        </div>
      )}

      <GameOverPanel />

      {wave === 0 && !waveInProgress && (
        <div
          style={{
            position: 'absolute',
            left: MAP_WIDTH / 2 - 150,
            top: MAP_HEIGHT / 2 - 40,
            width: 300,
            padding: '20px 16px',
            background: 'rgba(22, 33, 62, 0.95)',
            borderRadius: 12,
            textAlign: 'center',
            border: '2px solid #4A4A6E',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 8,
            }}
          >
            🏰 SkyFortress
          </div>
          <div style={{ color: '#aaa', fontSize: 12, lineHeight: 1.6 }}>
            点击空白格子建造防御塔
            <br />
            抵御敌人进攻，守护天空堡垒！
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
        <span style={{ color: 'transparent' }}>{MAP_HEIGHT}</span>
      </div>
    </>
  );
};
