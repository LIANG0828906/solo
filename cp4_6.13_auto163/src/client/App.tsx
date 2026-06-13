import { useState, useEffect } from 'react';
import GameCanvas from './GameCanvas';
import TowerPanel from './TowerPanel';
import { useGameWebSocket } from './hooks/useGameWebSocket';
import type { GameState, TowerType, ScoreEntry } from '../shared/types';
import { TOWER_CONFIGS } from '../shared/types';

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflow: 'auto',
    padding: '20px 0',
    boxSizing: 'border-box',
  },
  statusBar: {
    width: '100%',
    maxWidth: '680px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#16213e',
    borderRadius: '12px',
    marginBottom: '16px',
    boxSizing: 'border-box',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  heartIcon: {
    color: '#ff4757',
    fontSize: '22px',
  },
  coinIcon: {
    color: '#ffc107',
    fontSize: '22px',
  },
  waveText: {
    color: '#4fc3f7',
    fontSize: '18px',
  },
  gameOverOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  gameOverCard: {
    backgroundColor: '#16213e',
    padding: '40px',
    borderRadius: '20px',
    textAlign: 'center',
    maxWidth: '500px',
    width: '90%',
  },
  gameOverTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#ff4757',
    marginBottom: '20px',
  },
  finalScore: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#ffc107',
    marginBottom: '16px',
  },
  scoreDetails: {
    fontSize: '16px',
    color: '#aaa',
    marginBottom: '24px',
  },
  restartBtn: {
    padding: '12px 32px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  leaderboard: {
    marginTop: '20px',
    textAlign: 'left',
  },
  leaderboardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#4fc3f7',
    marginBottom: '12px',
    textAlign: 'center',
  },
  leaderboardItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 16px',
    marginBottom: '4px',
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    fontSize: '14px',
  },
  leaderboardRank1: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    border: '1px solid #ffc107',
  },
  preparationInfo: {
    textAlign: 'center',
    padding: '8px 16px',
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  countdownText: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#4fc3f7',
  },
  startWaveBtn: {
    padding: '8px 20px',
    marginLeft: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#4fc3f7',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  startScreen: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
  },
  gameTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ff6b35, #ffc107, #4fc3f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '20px',
  },
  gameSubtitle: {
    fontSize: '18px',
    color: '#888',
    marginBottom: '40px',
  },
  startBtn: {
    padding: '16px 48px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  disconnected: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 71, 87, 0.9)',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '12px',
    zIndex: 50,
  },
  latency: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    padding: '6px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#4fc3f7',
    borderRadius: '6px',
    fontSize: '12px',
    zIndex: 50,
  },
};

function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const { gameState, connected, latency, sendMessage } = useGameWebSocket(gameId);

  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (gameStarted && !gameId) {
      startNewGame();
    }
  }, [gameStarted, gameId]);

  useEffect(() => {
    fetch('/api/scores')
      .then(res => res.json())
      .then(data => setScores(data.scores || []))
      .catch(() => {});
  }, []);

  const startNewGame = async () => {
    try {
      const res = await fetch('/api/game/start', { method: 'POST' });
      const data = await res.json();
      setGameId(data.gameId);
    } catch (err) {
      console.error('启动游戏失败:', err);
    }
  };

  const handleBuildTower = (x: number, y: number) => {
    if (!selectedTower || !gameState) return;

    const cfg = TOWER_CONFIGS[selectedTower][1];
    if (gameState.gold < cfg.buildCost) return;

    sendMessage({
      type: 'build',
      payload: { x, y, type: selectedTower },
    });
    setSelectedTower(null);
    setSelectedCell(null);
  };

  const handleUpgradeTower = (x: number, y: number) => {
    if (!gameState) return;

    const tower = gameState.towers.find(t => t.position.x === x && t.position.y === y);
    if (!tower || tower.level >= 3) return;

    const cfg = TOWER_CONFIGS[tower.type][tower.level];
    if (gameState.gold < (cfg.upgradeCost ?? Infinity)) return;

    sendMessage({
      type: 'upgrade',
      payload: { x, y },
    });
  };

  const handleCellClick = (x: number, y: number) => {
    if (!gameState || gameState.phase === 'gameover') return;

    const existingTower = gameState.towers.find(t => t.position.x === x && t.position.y === y);

    if (existingTower) {
      setSelectedCell({ x, y });
      setSelectedTower(null);
      handleUpgradeTower(x, y);
    } else if (selectedTower) {
      handleBuildTower(x, y);
    } else {
      setSelectedCell({ x, y });
    }
  };

  const handleStartWave = () => {
    if (!gameState || gameState.phase !== 'preparation') return;
    sendMessage({ type: 'startWave' });
  };

  const handleRestart = () => {
    setGameId(null);
    setGameStarted(false);
    setSelectedTower(null);
    setSelectedCell(null);
    fetch('/api/scores')
      .then(res => res.json())
      .then(data => setScores(data.scores || []))
      .catch(() => {});
  };

  if (!gameStarted) {
    return (
      <div style={styles.startScreen}>
        <h1 style={styles.gameTitle}>⚔️ 魔法塔防 ⚔️</h1>
        <p style={styles.gameSubtitle}>建造防御塔，抵御怪物入侵！</p>
        <button style={styles.startBtn} onClick={() => setGameStarted(true)}>
          开始游戏
        </button>

        <div style={{ ...styles.leaderboard, maxWidth: '400px', width: '90%', marginTop: '60px' }}>
          <h3 style={styles.leaderboardTitle}>🏆 历史最高分</h3>
          {scores.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888' }}>暂无记录</p>
          ) : (
            scores.map((score, idx) => (
              <div
                key={score.id}
                style={{
                  ...styles.leaderboardItem,
                  ...(idx === 0 ? styles.leaderboardRank1 : {}),
                }}
              >
                <span>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`} 第{score.wave}波 · {score.kills}击杀
                </span>
                <span style={{ fontWeight: 'bold', color: '#ffc107' }}>{score.score}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  const getPreparationCountdown = (state: GameState) => {
    if (state.phase !== 'preparation' || !state.preparationEndTime) return 0;
    return Math.max(0, Math.ceil((state.preparationEndTime - Date.now()) / 1000));
  };

  return (
    <div style={styles.container}>
      {!connected && <div style={styles.disconnected}>连接断开</div>}
      {connected && <div style={styles.latency}>延迟: {latency}ms</div>}

      {gameState && (
        <>
          <div style={{ ...styles.statusBar, '@media (max-width: 900px)': { fontSize: '14px' } }}>
            <div style={styles.statusItem}>
              <span style={styles.heartIcon}>❤️</span>
              <span>{gameState.lives}</span>
            </div>
            <div style={styles.statusItem}>
              <span style={styles.coinIcon}>🪙</span>
              <span>{gameState.gold}</span>
            </div>
            <div style={{ ...styles.statusItem, ...styles.waveText }}>
              第 {gameState.wave} 波
            </div>
          </div>

          {gameState.phase === 'preparation' && (
            <div style={styles.preparationInfo}>
              <span style={styles.countdownText}>
                准备时间: {getPreparationCountdown(gameState)}秒
              </span>
              <button style={styles.startWaveBtn} onClick={handleStartWave}>
                开始下一波
              </button>
            </div>
          )}

          <GameCanvas
            gameState={gameState}
            selectedTower={selectedTower}
            selectedCell={selectedCell}
            onCellClick={handleCellClick}
          />

          <TowerPanel
            gold={gameState.gold}
            selectedTower={selectedTower}
            onSelectTower={setSelectedTower}
            selectedCellTower={
              selectedCell
                ? gameState.towers.find(
                    t => t.position.x === selectedCell.x && t.position.y === selectedCell.y
                  )
                : null
            }
          />

          {gameState.phase === 'gameover' && (
            <div style={styles.gameOverOverlay}>
              <div style={styles.gameOverCard}>
                <h2 style={styles.gameOverTitle}>游戏结束</h2>
                <div style={styles.finalScore}>{gameState.score}</div>
                <div style={styles.scoreDetails}>
                  击杀: {gameState.kills} × 10 = {gameState.kills * 10}
                  <br />
                  剩余生命: {Math.max(0, gameState.lives)} × 50 = {Math.max(0, gameState.lives) * 50}
                  <br />
                  坚持波数: {gameState.wave}
                </div>
                <button style={styles.restartBtn} onClick={handleRestart}>
                  重新开始
                </button>

                <div style={styles.leaderboard}>
                  <h3 style={styles.leaderboardTitle}>🏆 排行榜</h3>
                  {scores.slice(0, 10).map((score, idx) => (
                    <div
                      key={score.id}
                      style={{
                        ...styles.leaderboardItem,
                        ...(idx === 0 ? styles.leaderboardRank1 : {}),
                      }}
                    >
                      <span>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' :