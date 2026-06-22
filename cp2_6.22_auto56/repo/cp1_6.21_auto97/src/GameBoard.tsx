import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Board,
  PlayerColor,
  createInitialBoard,
  makeMove,
  getValidMoves,
  isGameOver,
  getWinner,
  countPieces,
  hasValidMoves,
  getOpponent,
  BOARD_SIZE,
} from './BoardLogic';
import { getBestMove } from './AIPlayer';
import {
  getStats,
  addGameResult,
  clearStats,
  getWinRate,
  StatsData,
  GameRecord,
} from './StatsStore';

const CANVAS_SIZE = 480;
const CELL_SIZE = CANVAS_SIZE / BOARD_SIZE;
const PIECE_RADIUS = CELL_SIZE * 0.42;

interface PieceAnimation {
  row: number;
  col: number;
  type: 'place' | 'flip' | 'error';
  startTime: number;
  fromColor?: PlayerColor;
  toColor?: PlayerColor;
}

export default function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<Board>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('black');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('black');
  const [showFactionSelect, setShowFactionSelect] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<PlayerColor | 'draw' | null>(null);
  const [stats, setStats] = useState<StatsData>({ totalGames: 0, wins: 0, recentGames: [] });
  const [animations, setAnimations] = useState<PieceAnimation[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const animationRef = useRef<number>(0);
  const gameResultRecorded = useRef(false);

  useEffect(() => {
    setStats(getStats());
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1000);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const validMoves = getValidMoves(board, currentPlayer);
  const { black: blackCount, white: whiteCount } = countPieces(board);

  const checkGameEnd = useCallback((currentBoard: Board) => {
    if (isGameOver(currentBoard)) {
      const gameWinner = getWinner(currentBoard);
      setWinner(gameWinner);
      setGameOver(true);

      if (!gameResultRecorded.current) {
        gameResultRecorded.current = true;
        let result: 'win' | 'lose' | 'draw' = 'draw';
        if (gameWinner === playerColor) {
          result = 'win';
        } else if (gameWinner !== 'draw' && gameWinner !== null) {
          result = 'lose';
        }
        const newStats = addGameResult(result, playerColor);
        setStats(newStats);
      }
    }
  }, [playerColor]);

  const switchTurn = useCallback((boardAfter: Board, lastPlayer: PlayerColor) => {
    const nextPlayer = getOpponent(lastPlayer);
    if (hasValidMoves(boardAfter, nextPlayer)) {
      setCurrentPlayer(nextPlayer);
    } else if (hasValidMoves(boardAfter, lastPlayer)) {
      setCurrentPlayer(lastPlayer);
    } else {
      checkGameEnd(boardAfter);
    }
  }, [checkGameEnd]);

  const handlePlaceAnimation = useCallback((row: number, col: number) => {
    const anim: PieceAnimation = {
      row,
      col,
      type: 'place',
      startTime: performance.now(),
    };
    setAnimations(prev => [...prev, anim]);
  }, []);

  const handleFlipAnimation = useCallback((flipped: [number, number][], toColor: PlayerColor) => {
    const now = performance.now();
    const newAnims: PieceAnimation[] = flipped.map(([row, col]) => ({
      row,
      col,
      type: 'flip',
      startTime: now + 100,
      toColor,
    }));
    setAnimations(prev => [...prev, ...newAnims]);
  }, []);

  const handleErrorAnimation = useCallback((row: number, col: number) => {
    const anim: PieceAnimation = {
      row,
      col,
      type: 'error',
      startTime: performance.now(),
    };
    setAnimations(prev => [...prev, anim]);
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameOver || showFactionSelect) return;
    if (currentPlayer !== playerColor) return;

    const isValid = validMoves.some(([r, c]) => r === row && c === col);

    if (!isValid) {
      handleErrorAnimation(row, col);
      return;
    }

    const { newBoard, flipped } = makeMove(board, row, col, playerColor);

    handlePlaceAnimation(row, col);
    handleFlipAnimation(flipped, playerColor);

    setBoard(newBoard);

    setTimeout(() => {
      switchTurn(newBoard, playerColor);
      checkGameEnd(newBoard);
    }, 300);
  }, [board, currentPlayer, playerColor, validMoves, gameOver, showFactionSelect, handlePlaceAnimation, handleFlipAnimation, handleErrorAnimation, switchTurn, checkGameEnd]);

  useEffect(() => {
    if (gameOver || showFactionSelect) return;
    if (currentPlayer === playerColor) return;

    const aiTimeout = setTimeout(() => {
      const aiMove = getBestMove(board, currentPlayer);
      if (aiMove) {
        const [row, col] = aiMove;
        const { newBoard, flipped } = makeMove(board, row, col, currentPlayer);

        handlePlaceAnimation(row, col);
        handleFlipAnimation(flipped, currentPlayer);

        setBoard(newBoard);

        setTimeout(() => {
          switchTurn(newBoard, currentPlayer);
          checkGameEnd(newBoard);
        }, 300);
      } else {
        switchTurn(board, currentPlayer);
      }
    }, 400);

    return () => clearTimeout(aiTimeout);
  }, [currentPlayer, playerColor, board, gameOver, showFactionSelect, handlePlaceAnimation, handleFlipAnimation, switchTurn, checkGameEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = 0;

    const render = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_SIZE);
      gradient.addColorStop(0, '#2D5A27');
      gradient.addColorStop(1, '#1E3D1A');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      ctx.strokeStyle = '#2D5A27';
      ctx.lineWidth = 2;

      for (let i = 0; i <= BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
      }

      if (!gameOver && currentPlayer === playerColor && !showFactionSelect) {
        for (const [row, col] of validMoves) {
          const cx = col * CELL_SIZE + CELL_SIZE / 2;
          const cy = row * CELL_SIZE + CELL_SIZE / 2;

          ctx.fillStyle = '#00FF0088';
          ctx.beginPath();
          ctx.arc(cx, cy, PIECE_RADIUS * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const piece = board[row][col];
          if (!piece) continue;

          const anim = animations.find(a => a.row === row && a.col === col);
          const elapsed = anim ? time - anim.startTime : 1000;

          if (anim?.type === 'error') {
            if (elapsed < 1000) {
              const cx = col * CELL_SIZE + CELL_SIZE / 2;
              const cy = row * CELL_SIZE + CELL_SIZE / 2;
              const rotation = (elapsed / 1000) * Math.PI * 2;
              const shake = Math.sin(elapsed / 50) * 3;

              ctx.save();
              ctx.translate(cx + shake, cy);
              ctx.rotate(rotation);

              ctx.strokeStyle = '#FF3333';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(0, 0, PIECE_RADIUS * 0.5, 0, Math.PI * 2);
              ctx.stroke();

              ctx.restore();
            }
            continue;
          }

          let scale = 1;
          let flipProgress = 1;
          let displayColor: PlayerColor = piece;

          if (anim?.type === 'place') {
            const duration = 300;
            if (elapsed < duration) {
              const t = elapsed / duration;
              scale = 1 - Math.pow(1 - t, 3) * 0.4;
              scale = Math.max(0.1, scale);
            }
          }

          if (anim?.type === 'flip' && anim.toColor) {
            const duration = 400;
            if (elapsed < duration) {
              flipProgress = elapsed / duration;
              if (flipProgress < 0.5) {
                displayColor = getOpponent(anim.toColor);
              } else {
                displayColor = anim.toColor;
              }
            }
          }

          const cx = col * CELL_SIZE + CELL_SIZE / 2;
          const cy = row * CELL_SIZE + CELL_SIZE / 2;
          const radius = PIECE_RADIUS * scale;
          const scaleY = Math.abs(Math.cos(flipProgress * Math.PI));

          draw3DPiece(ctx, cx, cy, radius, displayColor, scaleY);
        }
      }

      const now = performance.now();
      setAnimations(prev => prev.filter(a => {
        const age = now - a.startTime;
        if (a.type === 'error') return age < 1000;
        if (a.type === 'place') return age < 300;
        if (a.type === 'flip') return age < 400;
        return false;
      }));

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [board, animations, validMoves, currentPlayer, playerColor, gameOver, showFactionSelect]);

  const draw3DPiece = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: PlayerColor,
    scaleY: number = 1
  ) => {
    if (scaleY < 0.05) return;

    const actualRadius = radius;
    const verticalRadius = radius * scaleY;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, scaleY);

    const baseColor = color === 'black' ? '#1A1A1A' : '#F5F5F5';
    const highlightColor = color === 'black' ? '#333333' : '#FFFFFF';
    const shadowColor = color === 'black' ? '#000000' : '#CCCCCC';

    const gradient = ctx.createRadialGradient(
      -radius * 0.3, -radius * 0.3, radius * 0.1,
      0, 0, radius
    );
    gradient.addColorStop(0, highlightColor);
    gradient.addColorStop(0.5, baseColor);
    gradient.addColorStop(1, shadowColor);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = highlightColor + '60';
    ctx.beginPath();
    ctx.ellipse(-radius * 0.25, -radius * 0.3, radius * 0.35, radius * 0.2, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      handleCellClick(row, col);
    }
  };

  const resetGame = () => {
    setShowFactionSelect(true);
  };

  const startGame = (color: PlayerColor) => {
    setPlayerColor(color);
    setBoard(createInitialBoard());
    setCurrentPlayer('black');
    setGameOver(false);
    setWinner(null);
    setAnimations([]);
    gameResultRecorded.current = false;
    setShowFactionSelect(false);
  };

  const handleClearStats = () => {
    const newStats = clearStats();
    setStats(newStats);
  };

  const getResultText = (record: GameRecord) => {
    if (record.result === 'win') return '胜';
    if (record.result === 'lose') return '负';
    return '平';
  };

  const getResultColor = (record: GameRecord) => {
    if (record.result === 'win') return '#4CAF50';
    if (record.result === 'lose') return '#F44336';
    return '#FFC107';
  };

  const turnText = gameOver
    ? winner === 'draw'
      ? '平局！'
      : `${winner === 'black' ? '黑棋' : '白棋'}获胜！`
    : `轮到${currentPlayer === 'black' ? '黑棋' : '白棋'}`;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>黑白棋对战</h1>
      </div>

      <div style={{ ...styles.mainLayout, flexDirection: sidebarCollapsed ? 'column' : 'row' }}>
        <div style={styles.gameArea}>
          <div style={styles.scoreBar}>
            <div style={{ ...styles.scorePanel, backgroundColor: '#1A1A1A' }}>
              <div style={styles.scoreLabel}>黑棋</div>
              <div style={{ ...styles.scoreValue, color: '#F5F5F5' }}>{blackCount}</div>
            </div>
            <div style={styles.turnIndicator}>
              <div style={styles.turnText}>{turnText}</div>
            </div>
            <div style={{ ...styles.scorePanel, backgroundColor: '#F5F5F5' }}>
              <div style={{ ...styles.scoreLabel, color: '#1A1A1A' }}>白棋</div>
              <div style={{ ...styles.scoreValue, color: '#1A1A1A' }}>{whiteCount}</div>
            </div>
          </div>

          <div style={styles.canvasWrapper}>
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={styles.canvas}
              onClick={handleCanvasClick}
            />
          </div>

          <div style={styles.controls}>
            <button style={styles.resetBtn} onClick={resetGame}>
              重置游戏
            </button>
          </div>
        </div>

        <div style={{ ...styles.sidebar, width: sidebarCollapsed ? '100%' : '240px' }}>
          <div style={styles.statsPanel}>
            <h3 style={styles.statsTitle}>战绩统计</h3>
            <div style={styles.statsRow}>
              <span style={styles.statsLabel}>总场次</span>
              <span style={styles.statsValue}>{stats.totalGames}</span>
            </div>
            <div style={styles.statsRow}>
              <span style={styles.statsLabel}>胜率</span>
              <span style={styles.statsValue}>{getWinRate(stats)}%</span>
            </div>

            <h4 style={styles.recentTitle}>最近10局</h4>
            <div style={styles.recentList}>
              {stats.recentGames.length === 0 ? (
                <div style={styles.emptyText}>暂无记录</div>
              ) : (
                stats.recentGames.map((game, index) => (
                  <div key={index} style={styles.recentItem}>
                    <span style={styles.recentIndex}>{index + 1}.</span>
                    <span style={{ ...styles.recentResult, color: getResultColor(game) }}>
                      {getResultText(game)}
                    </span>
                    <span style={styles.recentColor}>
                      ({game.playerColor === 'black' ? '黑' : '白'})
                    </span>
                  </div>
                ))
              )}
            </div>

            <button style={styles.clearBtn} onClick={handleClearStats}>
              清空记录
            </button>
          </div>
        </div>
      </div>

      {showFactionSelect && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>选择先手阵营</h2>
            <div style={styles.factionOptions}>
              <button
                style={{ ...styles.factionBtn, backgroundColor: '#1A1A1A', color: '#F5F5F5' }}
                onClick={() => startGame('black')}
              >
                执黑先行
              </button>
              <button
                style={{ ...styles.factionBtn, backgroundColor: '#F5F5F5', color: '#1A1A1A' }}
                onClick={() => startGame('white')}
              >
                执白后行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    minWidth: '800px',
    background: 'linear-gradient(135deg, #0A192F 0%, #1B2838 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: '"Courier New", "Consolas", monospace',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    color: '#F5F5F5',
    fontSize: '24px',
    margin: 0,
    letterSpacing: '4px',
  },
  mainLayout: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '900px',
  },
  gameArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  scoreBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: CANVAS_SIZE,
    gap: '16px',
  },
  scorePanel: {
    width: '100px',
    padding: '12px 16px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  scoreLabel: {
    fontSize: '12px',
    color: '#F5F5F5',
    marginBottom: '4px',
  },
  scoreValue: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  turnIndicator: {
    flex: 1,
    textAlign: 'center',
  },
  turnText: {
    fontSize: '14px',
    color: '#88C0D0',
  },
  canvasWrapper: {
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    border: '3px solid #2D5A27',
  },
  canvas: {
    display: 'block',
    cursor: 'pointer',
  },
  controls: {
    display: 'flex',
    gap: '12px',
  },
  resetBtn: {
    padding: '10px 24px',
    fontSize: '12px',
    fontFamily: '"Courier New", "Consolas", monospace',
    backgroundColor: '#4C566A',
    color: '#ECEFF4',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  sidebar: {
    flexShrink: 0,
  },
  statsPanel: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '16px',
    backdropFilter: 'blur(10px)',
  },
  statsTitle: {
    color: '#88C0D0',
    fontSize: '14px',
    margin: '0 0 12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '8px',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  statsLabel: {
    color: '#D8DEE9',
    fontSize: '12px',
  },
  statsValue: {
    color: '#ECEFF4',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  recentTitle: {
    color: '#88C0D0',
    fontSize: '12px',
    margin: '16px 0 8px 0',
  },
  recentList: {
    maxHeight: '200px',
    overflowY: 'auto',
  },
  recentItem: {
    display: 'flex',
    gap: '8px',
    padding: '4px 0',
    fontSize: '11px',
  },
  recentIndex: {
    color: '#666',
    width: '20px',
  },
  recentResult: {
    fontWeight: 'bold',
    width: '24px',
  },
  recentColor: {
    color: '#888',
  },
  emptyText: {
    color: '#666',
    fontSize: '11px',
    textAlign: 'center',
    padding: '10px 0',
  },
  clearBtn: {
    width: '100%',
    marginTop: '12px',
    padding: '8px',
    fontSize: '11px',
    fontFamily: '"Courier New", "Consolas", monospace',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#BF616A',
    border: '1px solid rgba(191,97,106,0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#1B2838',
    padding: '32px 48px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#ECEFF4',
    fontSize: '16px',
    margin: '0 0 24px 0',
    textAlign: 'center',
  },
  factionOptions: {
    display: 'flex',
    gap: '16px',
  },
  factionBtn: {
    padding: '16px 32px',
    fontSize: '13px',
    fontFamily: '"Courier New", "Consolas", monospace',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    minWidth: '100px',
  },
};
