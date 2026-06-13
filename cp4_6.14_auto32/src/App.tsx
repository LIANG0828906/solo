import { useEffect, useRef, useState, useCallback } from 'react';
import { Renderer } from './game/Renderer';
import { NetworkManager } from './game/NetworkManager';
import { Direction, Snake, Food, DeathParticle } from './game/types';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const networkRef = useRef<NetworkManager | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const leaderboardUpdateTimerRef = useRef<number>(0);
  const playerIdRef = useRef<string>('');
  const snakesRef = useRef<Map<string, Snake>>(new Map());
  const isSpectatingRef = useRef<boolean>(false);

  const [playerId, setPlayerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<{ name: string; score: number; survivalTime: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ id: string; name: string; score: number; alive: boolean }[]>([]);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const handleDirectionChange = useCallback((direction: Direction) => {
    networkRef.current?.sendDirection(direction);
  }, []);

  const handleResize = useCallback(() => {
    setIsSmallScreen(window.innerWidth < 768);
  }, []);

  const updatePlayerState = useCallback((newSnakes: Map<string, Snake>) => {
    const pid = playerIdRef.current;
    const playerSnake = newSnakes.get(pid);
    if (playerSnake) {
      setPlayerInfo({
        name: playerSnake.name,
        score: playerSnake.score,
        survivalTime: playerSnake.alive ? (Date.now() - playerSnake.bornAt) / 1000 : 0,
      });
      if (!playerSnake.alive && !isSpectatingRef.current) {
        isSpectatingRef.current = true;
        setIsSpectating(true);
      }
    }
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;

    rendererRef.current?.render();

    const now = Date.now();
    if (now - leaderboardUpdateTimerRef.current > 2000) {
      leaderboardUpdateTimerRef.current = now;
      if (rendererRef.current) {
        const lb = Array.from(snakesRef.current.values())
          .map(s => ({ id: s.id, name: s.name, score: s.score, alive: s.alive }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        setLeaderboard(lb);
        rendererRef.current.updateLeaderboard(lb);
      }
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    if (!canvasRef.current) return;

    const renderer = new Renderer({
      canvas: canvasRef.current,
      onDirectionChange: handleDirectionChange,
    });
    rendererRef.current = renderer;

    const network = new NetworkManager('ws://localhost:3001');
    networkRef.current = network;

    network.setOnWelcome((id) => {
      playerIdRef.current = id;
      setPlayerId(id);
      renderer.setPlayerSnakeId(id);
    });

    network.setOnConnected(() => {
      setIsConnected(true);
    });

    network.setOnDisconnected(() => {
      setIsConnected(false);
    });

    network.setOnStateChange((newSnakes: Map<string, Snake>, foods: Map<string, Food>, deathParticles: DeathParticle[]) => {
      snakesRef.current = newSnakes;
      renderer.setGameState(newSnakes, foods, deathParticles);
      updatePlayerState(newSnakes);
    });

    network.setOnPlayerJoined((newPlayerId) => {
      const existingIds = Array.from(snakesRef.current.keys())
        .filter(id => id !== newPlayerId && id !== playerIdRef.current);
      if (existingIds.length > 0) {
        renderer.triggerSnakeFlash(existingIds);
      }
    });

    network.connect();

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      network.disconnect();
      renderer.destroy();
    };
  }, [handleDirectionChange, handleResize, gameLoop, updatePlayerState]);

  const handleRestart = () => {
    if (networkRef.current) {
      networkRef.current.disconnect();
    }
    isSpectatingRef.current = false;
    setIsSpectating(false);
    setPlayerInfo(null);
    setLeaderboard([]);
    setTimeout(() => {
      networkRef.current?.connect();
    }, 100);
  };

  const getRankChangeAnimation = (id: string) => {
    if (!rendererRef.current) return {};
    const anim = rendererRef.current.getLeaderboardAnimation(id);
    return {
      transform: `translateY(${anim.translateY}px)`,
      opacity: anim.opacity,
      transition: 'none',
    };
  };

  return (
    <div style={styles.app}>
      {!isSmallScreen && (
        <div style={styles.leftPanel}>
          <div style={styles.panelCard}>
            <h3 style={styles.panelTitle}>我的信息</h3>
            {playerInfo ? (
              <>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>蛇名:</span>
                  <span style={styles.infoValue}>{playerInfo.name}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>分数:</span>
                  <span style={{ ...styles.infoValue, ...styles.scoreValue }}>{playerInfo.score}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>存活:</span>
                  <span style={styles.infoValue}>{playerInfo.survivalTime.toFixed(1)}s</span>
                </div>
                <div style={styles.statusRow}>
                  <span style={{ ...styles.statusDot, ...(isSpectating ? styles.statusDead : styles.statusAlive) }}></span>
                  <span style={styles.infoValue}>{isSpectating ? '观战中' : '战斗中'}</span>
                </div>
              </>
            ) : (
              <div style={styles.loadingText}>等待连接...</div>
            )}
          </div>

          <div style={styles.panelCard}>
            <h3 style={styles.panelTitle}>操作说明</h3>
            <div style={styles.controlsList}>
              <div style={styles.controlItem}><kbd style={styles.key}>W</kbd> 向上</div>
              <div style={styles.controlItem}><kbd style={styles.key}>A</kbd> 向左</div>
              <div style={styles.controlItem}><kbd style={styles.key}>S</kbd> 向下</div>
              <div style={styles.controlItem}><kbd style={styles.key}>D</kbd> 向右</div>
              <div style={styles.controlItem}><kbd style={styles.key}>↑</kbd><kbd style={styles.key}>↓</kbd><kbd style={styles.key}>←</kbd><kbd style={styles.key}>→</kbd> 方向键</div>
            </div>
            <p style={styles.hintText}>不能180度掉头，碰撞即死！</p>
          </div>
        </div>
      )}

      <div style={styles.gameContainer}>
        <div style={styles.gameWrapper}>
          <canvas
            ref={canvasRef}
            style={styles.canvas}
          />
          {isSpectating && (
            <div style={styles.spectatorOverlay}>
              <div style={styles.spectatorContent}>
                <h2 style={styles.spectatorTitle}>游戏结束</h2>
                <p style={styles.spectatorText}>你已阵亡，正在观战</p>
                <p style={styles.finalScore}>最终得分: {playerInfo?.score || 0}</p>
                <button style={styles.restartButton} onClick={handleRestart}>
                  重新开始
                </button>
              </div>
            </div>
          )}
          {!isConnected && (
            <div style={styles.connectingOverlay}>
              <div style={styles.connectingContent}>
                <div style={styles.spinner}></div>
                <p style={styles.connectingText}>正在连接服务器...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.panelCard}>
          <h3 style={styles.panelTitle}>🏆 排行榜</h3>
          <div style={styles.leaderboardList}>
            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                style={{
                  ...styles.leaderboardItem,
                  ...(player.id === playerId ? styles.leaderboardItemSelf : {}),
                  ...getRankChangeAnimation(player.id),
                }}
              >
                <span style={{
                  ...styles.rankBadge,
                  ...(index === 0 ? styles.rankGold : {}),
                  ...(index === 1 ? styles.rankSilver : {}),
                  ...(index === 2 ? styles.rankBronze : {}),
                }}>
                  {index + 1}
                </span>
                <span style={{
                  ...styles.playerName,
                  ...(player.id === playerId ? styles.playerNameSelf : {}),
                }}>
                  {player.name}
                  {!player.alive && <span style={styles.deadIndicator}> 💀</span>}
                </span>
                <span style={styles.playerScore}>{player.score}</span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div style={styles.emptyLeaderboard}>暂无数据</div>
            )}
          </div>
        </div>

        <div style={styles.panelCard}>
          <h3 style={styles.panelTitle}>在线状态</h3>
          <div style={styles.statusRow}>
            <span style={{ ...styles.statusDot, ...(isConnected ? styles.statusOnline : styles.statusOffline) }}></span>
            <span style={styles.infoValue}>{isConnected ? '已连接' : '连接中'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>玩家数:</span>
            <span style={styles.infoValue}>{snakesRef.current.size}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
    padding: '20px',
    gap: '20px',
    overflow: 'hidden',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '220px',
    flexShrink: 0,
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '260px',
    flexShrink: 0,
  },
  gameContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  gameWrapper: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 0 40px rgba(0, 255, 136, 0.2), 0 0 80px rgba(0, 170, 255, 0.1)',
  },
  canvas: {
    display: 'block',
    borderRadius: '12px',
  },
  panelCard: {
    background: 'rgba(22, 33, 62, 0.6)',
    backdropFilter: 'blur(8px)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  panelTitle: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 12px 0',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '13px',
  },
  infoValue: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
  },
  scoreValue: {
    color: '#00ff88',
    fontWeight: 700,
    fontSize: '18px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  statusAlive: {
    background: '#00ff88',
    boxShadow: '0 0 10px #00ff88',
  },
  statusDead: {
    background: '#ff4757',
    boxShadow: '0 0 10px #ff4757',
  },
  statusOnline: {
    background: '#00ff88',
    boxShadow: '0 0 10px #00ff88',
  },
  statusOffline: {
    background: '#ff4757',
    boxShadow: '0 0 10px #ff4757',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '13px',
    textAlign: 'center',
    padding: '20px 0',
  },
  controlsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  controlItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '13px',
  },
  key: {
    display: 'inline-block',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#ffffff',
    minWidth: '18px',
    textAlign: 'center',
  },
  hintText: {
    color: '#ffd93d',
    fontSize: '12px',
    marginTop: '12px',
    marginBottom: 0,
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '6px',
    transition: 'background 150ms ease',
  },
  leaderboardItemSelf: {
    background: 'rgba(0, 255, 136, 0.1)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
  },
  rankBadge: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    fontSize: '12px',
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  rankGold: {
    background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
    color: '#1a1a2e',
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
  },
  rankSilver: {
    background: 'linear-gradient(135deg, #c0c0c0, #a0a0a0)',
    color: '#1a1a2e',
  },
  rankBronze: {
    background: 'linear-gradient(135deg, #cd7f32, #a0522d)',
    color: '#ffffff',
  },
  playerName: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '13px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  playerNameSelf: {
    color: '#00ff88',
    fontWeight: 600,
  },
  playerScore: {
    color: '#ffd93d',
    fontWeight: 700,
    fontSize: '14px',
    minWidth: '40px',
    textAlign: 'right',
  },
  deadIndicator: {
    marginLeft: '4px',
  },
  emptyLeaderboard: {
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    padding: '20px 0',
    fontSize: '13px',
  },
  spectatorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fadeIn 300ms ease',
  },
  spectatorContent: {
    textAlign: 'center',
    color: '#ffffff',
  },
  spectatorTitle: {
    fontSize: '32px',
    fontWeight: 700,
    margin: '0 0 10px 0',
    color: '#ff4757',
    textShadow: '0 0 20px rgba(255, 71, 87, 0.5)',
  },
  spectatorText: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0 0 10px 0',
  },
  finalScore: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#ffd93d',
    margin: '0 0 20px 0',
  },
  restartButton: {
    background: 'linear-gradient(135deg, #00ff88, #00aaff)',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a2e',
    cursor: 'pointer',
    transition: 'transform 150ms ease, box-shadow 150ms ease',
    boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4)',
  },
  connectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingContent: {
    textAlign: 'center',
    color: '#ffffff',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTopColor: '#00ff88',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 15px auto',
  },
  connectingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    margin: 0,
  },
};

export default App;
