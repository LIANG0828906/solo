import React, { useState, useEffect, useRef, useCallback } from 'react';
import Board from './Board';
import GameInfo from './GameInfo';
import type {
  BoardState,
  BattleLogEntry,
  PlayerColor,
  Piece,
  Move,
  Position,
  WSServerMessage,
} from './types';
import { getLegalMovesForPiece } from '../backend/gameEngine';

const DEFAULT_ROOM = 'room-001';

export default function App() {
  const [roomId] = useState<string>(DEFAULT_ROOM);
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [board, setBoard] = useState<BoardState | null>(null);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<Position[]>([]);
  const [shockwavePos, setShockwavePos] = useState<Position | null>(null);
  const [capturedAnim, setCapturedAnim] = useState<{ pos: Position; piece: Piece } | null>(null);
  const [revealAnim, setRevealAnim] = useState<Position | null>(null);
  const [toast, setToast] = useState<string>('');
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const boardRef = useRef<BoardState | null>(null);
  const playerColorRef = useRef<PlayerColor | null>(null);
  const pendingMoveRef = useRef<{ move: Move; capturedPieceId?: string } | null>(null);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { playerColorRef.current = playerColor; }, [playerColor]);

  // 建立WebSocket连接
  useEffect(() => {
    const wsUrl = `ws://${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', roomId }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg: WSServerMessage = JSON.parse(ev.data);
        handleServerMessage(msg);
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    ws.onerror = () => {
      showToast('连接失败，请刷新重试');
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  const showToast = useCallback((text: string) => {
    setToast(text);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const handleServerMessage = useCallback((msg: WSServerMessage) => {
    switch (msg.type) {
      case 'room_joined':
        setPlayerColor(msg.playerColor);
        setBoard(msg.board);
        setBattleLog(msg.battleLog);
        if (msg.playerColor === 'white') {
          showToast('您是白方，等待对手加入...');
        } else {
          setOpponentJoined(true);
          showToast('您是黑方，游戏开始！白方先走');
        }
        break;
      case 'waiting_for_opponent':
        setOpponentJoined(false);
        break;
      case 'player_joined':
        setOpponentJoined(true);
        showToast(msg.playerColor === 'black' ? '黑方加入，游戏开始！' : '白方加入');
        break;
      case 'state_update': {
        const prevBoard = boardRef.current;
        setBoard(msg.board);
        setBattleLog(msg.battleLog);

        if (msg.battleLog.length > 0) {
          const lastEntry = msg.battleLog[msg.battleLog.length - 1];
          const prevTotal = prevBoard?.totalMoves ?? 0;
          if (msg.board.totalMoves > prevTotal || !prevBoard) {
            setShockwavePos(lastEntry.move.to);
            setRevealAnim(lastEntry.move.to);
            setTimeout(() => {
              setShockwavePos(null);
              setRevealAnim(null);
            }, 500);

            if (lastEntry.capturedPiece) {
              setCapturedAnim({ pos: lastEntry.move.to, piece: lastEntry.capturedPiece });
              setTimeout(() => setCapturedAnim(null), 500);
            }
          }
        }

        setSelectedPieceId(null);
        setLegalTargets([]);
        break;
      }
      case 'game_over':
        setBoard(msg.board);
        setBattleLog(msg.battleLog);
        setSelectedPieceId(null);
        setLegalTargets([]);
        {
          const pc = playerColorRef.current;
          const won = msg.winner === pc;
          showToast(won ? '🎉 恭喜你赢了！' : '😢 你输了，再来一局吧');
        }
        break;
      case 'move_invalid':
        showToast('⚠️ ' + (msg.reason || '非法走法'));
        break;
    }
  }, [showToast]);

  const onSquareClick = useCallback((row: number, col: number) => {
    if (!board || !playerColor) return;
    if (!opponentJoined) {
      showToast('等待对手加入...');
      return;
    }
    if (board.isGameOver) return;
    if (board.currentTurn !== playerColor) {
      showToast('等待对方走棋...');
      return;
    }

    const pos = { row, col };
    const pieceAtPos = board.pieces.find((p) => p.position.row === row && p.position.col === col);

    // 如果已经选中棋子，尝试走子
    if (selectedPieceId) {
      const selected = board.pieces.find((p) => p.id === selectedPieceId);
      if (!selected) {
        setSelectedPieceId(null);
        setLegalTargets([]);
        return;
      }

      // 点击同一棋子 → 取消选中
      if (pieceAtPos && pieceAtPos.id === selectedPieceId) {
        setSelectedPieceId(null);
        setLegalTargets([]);
        return;
      }

      // 点击己方其他棋子 → 切换选中
      if (pieceAtPos && pieceAtPos.color === playerColor) {
        setSelectedPieceId(pieceAtPos.id);
        const moves = getLegalMovesForPiece(pieceAtPos, board.pieces);
        setLegalTargets(moves);
        return;
      }

      // 判断是否为合法目标
      const isTarget = legalTargets.some((t) => t.row === row && t.col === col);
      if (isTarget) {
        const move: Move = {
          pieceId: selected.id,
          from: { ...selected.position },
          to: pos,
        };
        pendingMoveRef.current = { move };
        // 冲击波立即显示
        setShockwavePos(pos);
        setTimeout(() => setShockwavePos(null), 500);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'move',
            roomId,
            move,
            playerColor,
          }));
        }
        setSelectedPieceId(null);
        setLegalTargets([]);
        return;
      }

      // 非法位置 → 取消
      setSelectedPieceId(null);
      setLegalTargets([]);
      return;
    }

    // 未选中棋子，选中己方棋子
    if (pieceAtPos && pieceAtPos.color === playerColor) {
      setSelectedPieceId(pieceAtPos.id);
      const moves = getLegalMovesForPiece(pieceAtPos, board.pieces);
      setLegalTargets(moves);
      if (moves.length === 0) {
        showToast('该棋子无合法走法');
      }
    }
  }, [board, playerColor, selectedPieceId, legalTargets, opponentJoined, roomId, showToast]);

  const requestRestart = useCallback(() => {
    if (!playerColor || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      type: 'restart',
      roomId,
      playerColor,
    }));
    showToast('已请求重开，等待对方同意...');
  }, [playerColor, roomId, showToast]);

  const leaveRoom = useCallback(() => {
    window.location.reload();
  }, []);

  // 按玩家视角整理已揭示棋子
  const myRevealed: Piece[] = [];
  const oppRevealed: Piece[] = [];
  let myAliveCount = 0;
  let oppAliveCount = 0;
  if (board && playerColor) {
    for (const p of board.pieces) {
      if (p.color === playerColor) {
        myAliveCount++;
        if (p.revealed) myRevealed.push(p);
      } else {
        oppAliveCount++;
        if (p.revealed) oppRevealed.push(p);
      }
    }
  }
  const oppColor: PlayerColor | null = playerColor === 'white' ? 'black' : playerColor === 'black' ? 'white' : null;

  return (
    <div style={styles.app}>
      {/* 顶部状态栏 */}
      <div className="top-bar" style={styles.topBar}>
        <div style={styles.hourglassWrap}>
          <HourglassIcon active={board?.currentTurn === playerColor} />
          <div className="turn-text" style={styles.turnText}>
            {!board ? (
              <span style={{ color: '#bdbdbd' }}>连接中...</span>
            ) : !opponentJoined ? (
              <span style={{ color: '#FFC107' }}>等待对手加入... 房间号 {roomId}</span>
            ) : board.isGameOver ? (
              <span style={{ color: '#FFD700', fontWeight: 700 }}>
                游戏结束 · {board.winner === 'white' ? '白方' : '黑方'}胜利
              </span>
            ) : (
              <span>
                轮到
                <span style={{
                  color: board.currentTurn === 'white' ? '#FFFFFF' : '#BDBDBD',
                  fontWeight: 700,
                  margin: '0 4px',
                  textShadow: board.currentTurn === 'white' ? '0 0 6px #fff' : 'none',
                }}>
                  {board.currentTurn === 'white' ? '白方' : '黑方'}
                </span>
                走棋
                {board.currentTurn === playerColor && (
                  <span style={{ color: '#4CAF50', marginLeft: 8 }}>● 你的回合</span>
                )}
              </span>
            )}
          </div>
        </div>
        <div style={styles.totalMoves}>第 {board?.totalMoves ?? 0} 步</div>
      </div>

      {/* 移动端信息面板开关 */}
      <button className="mobile-info-btn" style={styles.mobilePanelToggle} onClick={() => setInfoPanelOpen((v) => !v)}>
        {infoPanelOpen ? '✕' : '📋'} 棋子信息
      </button>
      {/* 移动端滑动面板 */}
      {infoPanelOpen && (
        <div className="mobile-info-panel" style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          zIndex: 15,
          background: 'rgba(44, 24, 16, 0.98)',
          borderBottom: '2px solid #5D4037',
          padding: 12,
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          maxHeight: '55vh',
        }}>
          <div style={{ minWidth: 200, flex: 1 }}>
            <GameInfo
              title={playerColor === 'white' ? '白方（你）' : playerColor === 'black' ? '黑方（你）' : '己方'}
              color="self"
              playerColor={playerColor || 'white'}
              revealedPieces={myRevealed}
              totalPieces={myAliveCount || 16}
            />
          </div>
          <div style={{ minWidth: 200, flex: 1 }}>
            <GameInfo
              title={oppColor === 'white' ? '白方（对手）' : oppColor === 'black' ? '黑方（对手）' : '对方'}
              color="opponent"
              playerColor={oppColor || 'black'}
              revealedPieces={oppRevealed}
              totalPieces={oppAliveCount || 16}
            />
          </div>
        </div>
      )}

      {/* 主体布局 */}
      <div style={styles.mainLayout}>
        {/* 左侧 己方信息 */}
        <div className="side-panel" style={styles.sidePanel}>
          <GameInfo
            title={playerColor === 'white' ? '白方（你）' : playerColor === 'black' ? '黑方（你）' : '己方'}
            color="self"
            playerColor={playerColor || 'white'}
            revealedPieces={myRevealed}
            totalPieces={myAliveCount || 16}
          />
        </div>

        {/* 中间 棋盘 */}
        <div className="board-wrap" style={styles.boardWrap}>
          {board && (
            <Board
              board={board}
              playerColor={playerColor || 'white'}
              selectedPieceId={selectedPieceId}
              legalTargets={legalTargets}
              shockwavePos={shockwavePos}
              capturedAnim={capturedAnim}
              revealAnim={revealAnim}
              onSquareClick={onSquareClick}
            />
          )}
        </div>

        {/* 右侧 对方信息 */}
        <div className="side-panel" style={styles.sidePanel}>
          <GameInfo
            title={oppColor === 'white' ? '白方（对手）' : oppColor === 'black' ? '黑方（对手）' : '对方'}
            color="opponent"
            playerColor={oppColor || 'black'}
            revealedPieces={oppRevealed}
            totalPieces={oppAliveCount || 16}
          />
        </div>
      </div>

      {/* 战报面板 */}
      <div className="battle-log-box" style={styles.battleLog}>
        <div style={styles.battleLogHeader}>战报</div>
        <div style={styles.battleLogBody}>
          {battleLog.length === 0 && (
            <div style={{ color: '#757575', fontSize: 12, textAlign: 'center', padding: 12 }}>暂无对局记录</div>
          )}
          {battleLog.slice().reverse().map((entry, i) => (
            <div key={i} style={styles.logItem}>
              <div style={styles.logTime}>{formatTime(entry.timestamp)}</div>
              <div style={styles.logMsg}>{entry.message}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast提示 */}
      {toast && (
        <div style={styles.toast}>{toast}</div>
      )}

      {/* 胜利弹窗 */}
      {board?.isGameOver && board.winner && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>
              {board.winner === 'white' ? '白方' : '黑方'} 胜利！
            </div>
            <div style={styles.modalSubtitle}>
              {board.winner === playerColor ? '🎉 恭喜你赢得了这局暗影棋局！' : '再接再厉，下次一定！'}
            </div>
            <div style={styles.modalButtons}>
              <button style={styles.btnPrimary} onClick={requestRestart}>
                再来一局
              </button>
              <button style={styles.btnDanger} onClick={leaveRoom}>
                退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function HourglassIcon({ active }: { active: boolean | undefined }) {
  return (
    <svg width="34" height="34" viewBox="0 0 32 32" style={{ marginRight: 10 }}>
      <defs>
        <linearGradient id="hg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={active ? '#F44336' : '#616161'} />
          <stop offset="50%" stopColor={active ? '#FFC107' : '#9E9E9E'} />
          <stop offset="100%" stopColor={active ? '#FFD700' : '#BDBDBD'} />
        </linearGradient>
      </defs>
      <path
        d="M6 2 L26 2 L26 6 L18 14 L26 22 L26 30 L6 30 L6 22 L14 14 L6 6 Z"
        fill="url(#hg-grad)"
        stroke="#5D4037"
        strokeWidth="1.5"
      />
      <path
        d="M12 7 L20 7 L16 13 Z"
        fill={active ? '#FFD700' : '#757575'}
        opacity={active ? 0.8 : 0.5}
      />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    background: 'linear-gradient(135deg, #2c1810 0%, #3e2723 50%, #1a0f0a 100%)',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 28px',
    background: 'linear-gradient(180deg, rgba(93, 64, 55, 0.85) 0%, rgba(62, 39, 35, 0.7) 100%)',
    borderBottom: '2px solid #5D4037',
    boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  hourglassWrap: {
    display: 'flex',
    alignItems: 'center',
  },
  turnText: {
    fontSize: 16,
    color: '#E0E0E0',
    letterSpacing: 0.5,
  },
  totalMoves: {
    fontSize: 12,
    color: '#9E9E9E',
    padding: '4px 10px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  mobilePanelToggle: {
    display: 'none',
    position: 'absolute',
    top: 60,
    left: 12,
    zIndex: 20,
    padding: '6px 12px',
    fontSize: 12,
    background: 'rgba(93, 64, 55, 0.9)',
    color: '#fff',
    border: '1px solid #8D6E63',
    borderRadius: 6,
    cursor: 'pointer',
  },
  mainLayout: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 2%',
    minHeight: 0,
  },
  sidePanel: {
    width: '15%',
    minWidth: 160,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '0 8px',
    zIndex: 5,
  },
  sidePanelMobileOpen: {},
  boardWrap: {
    width: '65%',
    maxWidth: 640,
    minWidth: 320,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  battleLog: {
    position: 'fixed',
    right: 16,
    bottom: 16,
    width: 220,
    height: 180,
    background: 'rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 8,
  },
  battleLogHeader: {
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    color: '#FFD700',
    background: 'rgba(0,0,0,0.3)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    letterSpacing: 1,
  },
  battleLogBody: {
    flex: 1,
    overflowY: 'auto',
    padding: 8,
  },
  logItem: {
    padding: '6px 8px',
    borderBottom: '1px dashed rgba(255,255,255,0.06)',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 10,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  logMsg: {
    fontSize: 12,
    color: '#E0E0E0',
    lineHeight: 1.4,
  },
  toast: {
    position: 'fixed',
    top: 70,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    background: 'rgba(0,0,0,0.85)',
    color: '#fff',
    borderRadius: 8,
    fontSize: 14,
    border: '1px solid #8D6E63',
    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
    zIndex: 100,
    maxWidth: '80%',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(6px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    width: 320,
    padding: '28px 24px',
    background: 'linear-gradient(145deg, #1A237E 0%, #283593 60%, #3949AB 100%)',
    borderRadius: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(63, 81, 181, 0.4)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    animation: 'modalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    transform: 'translate(-50%, -50%)',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 12,
    textShadow: '0 2px 12px rgba(255, 215, 0, 0.5)',
    letterSpacing: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#E8EAF6',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 1.6,
  },
  modalButtons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  btnPrimary: {
    flex: 1,
    padding: '11px 18px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: '#4CAF50',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    boxShadow: '0 3px 0 #2E7D32, 0 4px 10px rgba(76, 175, 80, 0.4)',
    transition: 'transform 0.08s',
    letterSpacing: 1,
  },
  btnDanger: {
    flex: 1,
    padding: '11px 18px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: 'transparent',
    border: '2px solid #F44336',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s',
    letterSpacing: 1,
  },
};

// 响应式样式注入
(function injectResponsiveStyles() {
  if (typeof document === 'undefined') return;
  const id = 'shadow-chess-responsive';
  if (document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id;
  el.textContent = `
    @media (max-width: 900px) {
      .side-panel {
        display: none !important;
      }
      .board-wrap {
        width: 75% !important;
        max-width: 480px !important;
      }
      .mobile-info-btn {
        display: block !important;
      }
      .battle-log-box {
        width: 180px !important;
        height: 140px !important;
        right: 8px !important;
        bottom: 8px !important;
      }
      .turn-text {
        font-size: 14px !important;
      }
      .top-bar {
        padding: 10px 14px !important;
      }
    }
    @media (max-width: 560px) {
      .board-wrap {
        width: 92% !important;
        min-width: 0 !important;
      }
      .battle-log-box {
        width: calc(100vw - 16px) !important;
        height: 100px !important;
      }
    }
    .mobile-info-btn { display: none !important; }
  `;
  document.head.appendChild(el);
})();
