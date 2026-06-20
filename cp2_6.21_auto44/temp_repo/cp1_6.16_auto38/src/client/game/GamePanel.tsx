import React, { useEffect, useRef, useState } from 'react';
import { GameState, MoveRecord, PieceColor, PRESET_MESSAGES } from '../../shared/types';
import { GameManager } from './GameManager';

interface GamePanelProps {
  gameManager: GameManager;
}

const GamePanel: React.FC<GamePanelProps> = ({ gameManager }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<{ playerId?: string; color: PieceColor | null; message: string }[]>([]);
  const [myColor, setMyColor] = useState<PieceColor | null>(null);
  const moveListRef = useRef<HTMLDivElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEvent = (event: string, data?: any) => {
      if (event === 'stateUpdate' || event === 'gameStart') {
        const gs = gameManager.getGameState();
        if (gs) setGameState({ ...gs, board: gs.board, moveHistory: [...gs.moveHistory] });
        setMyColor(gameManager.getMyColor());
      }
      if (event === 'timerUpdate') {
        setGameState(prev => prev ? { ...prev, redTime: data.redTime, blackTime: data.blackTime } : null);
      }
      if (event === 'chatMessage') {
        setChatMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.message === data.message && lastMsg.color === data.color && lastMsg.playerId === data.playerId) {
            return prev;
          }
          return [...prev, data];
        });
      }
    };

    gameManager.onEvent(handleEvent);

    const gs = gameManager.getGameState();
    if (gs) {
      setGameState({ ...gs, board: gs.board, moveHistory: [...gs.moveHistory] });
      setMyColor(gameManager.getMyColor());
    }
    setChatMessages(gameManager.getChatMessages().map(m => ({
      playerId: m.playerId,
      color: m.color,
      message: m.message,
    })));

    return () => gameManager.removeEvent(handleEvent);
  }, [gameManager]);

  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [gameState?.moveHistory.length]);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  if (!gameState) {
    return (
      <div className="info-panel">
        <div className="panel-section">
          <p style={{ color: '#AAA', textAlign: 'center' }}>等待对局开始</p>
        </div>
      </div>
    );
  }

  const redTime = gameManager.formatTime(gameState.redTime);
  const blackTime = gameManager.formatTime(gameState.blackTime);
  const isRedWarning = gameState.redTime < 120;
  const isBlackWarning = gameState.blackTime < 120;
  const currentTurn = gameState.currentTurn;
  const isGameOver = gameState.status === 'checkmate' || gameState.status === 'stalemate' || gameState.status === 'timeout' || gameState.status === 'resigned';

  const statusText: Record<string, string> = {
    checkmate: '将杀',
    stalemate: '困毙',
    timeout: '超时',
    resigned: '认输',
  };

  return (
    <div className="info-panel">
      <div className="panel-section">
        <h3>对局信息</h3>
        <div className={`player-info ${currentTurn === 'black' && !isGameOver ? 'active' : ''}`}>
          <div className="player-color-dot black" />
          <div className="player-name">
            黑方{myColor === 'black' ? '（你）' : ''}
          </div>
          <div className={`timer ${isBlackWarning ? 'warning' : ''}`}>{blackTime}</div>
        </div>
        <div className={`player-info ${currentTurn === 'red' && !isGameOver ? 'active' : ''}`}>
          <div className="player-color-dot red" />
          <div className="player-name">
            红方{myColor === 'red' ? '（你）' : ''}
          </div>
          <div className={`timer ${isRedWarning ? 'warning' : ''}`}>{redTime}</div>
        </div>

        {gameState.status === 'check' && (
          <div className="game-status-bar check">将军！</div>
        )}

        {isGameOver && (
          <div className="game-status-bar">
            {statusText[gameState.status] || gameState.status}
            {' - '}
            {gameState.winner === 'red' ? '红方胜' : '黑方胜'}
          </div>
        )}

        {!isGameOver && (
          <div className="game-status-bar">
            {currentTurn === 'red' ? '红方' : '黑方'}走棋
            {currentTurn === myColor ? '（你的回合）' : ''}
          </div>
        )}
      </div>

      <div className="panel-section">
        <h3>棋谱记录</h3>
        <div className="move-list" ref={moveListRef}>
          {gameState.moveHistory.length === 0 && (
            <div style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: 8 }}>暂无走法</div>
          )}
          {gameState.moveHistory.map((record, i) => (
            <div key={i} className="move-item">
              <span className="move-number">{Math.floor(i / 2) + 1}{i % 2 === 0 ? '.' : '...'}</span>
              <span className={`move-notation ${record.piece.color}`}>{record.notation}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3>快捷消息</h3>
        <div className="chat-presets">
          {PRESET_MESSAGES.map((msg) => (
            <button
              key={msg}
              className={`chat-preset-btn ${msg === '认输' ? 'resign' : ''}`}
              onClick={() => {
                if (msg === '认输') {
                  if (confirm('确定要认输吗？')) {
                    gameManager.resign();
                  }
                } else {
                  gameManager.sendChat(msg);
                }
              }}
            >
              {msg}
            </button>
          ))}
        </div>
        <div className="chat-messages" ref={chatListRef} style={{ marginTop: 10 }}>
          {chatMessages.length === 0 && (
            <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 8 }}>暂无消息</div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className="chat-msg">
              <span className={`sender ${msg.color || 'red'}`}>
                {msg.color === 'red' ? '红方' : '黑方'}
              </span>
              {msg.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamePanel;
