import React, { useEffect, useState } from 'react';
import { GameState, MoveRecord, PieceColor, PRESET_MESSAGES } from '../../shared/types';
import { GameManager } from './GameManager';

interface GamePanelProps {
  gameManager: GameManager;
}

const GamePanel: React.FC<GamePanelProps> = ({ gameManager }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: string; color: PieceColor; message: string }[]>([]);
  const [myColor, setMyColor] = useState<PieceColor | null>(null);
  const moveListRef = React.useRef<HTMLDivElement>(null);

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
        setChatMessages(prev => [...prev, data]);
      }
    };

    gameManager.onEvent(handleEvent);

    const gs = gameManager.getGameState();
    if (gs) {
      setGameState({ ...gs, board: gs.board, moveHistory: [...gs.moveHistory] });
      setMyColor(gameManager.getMyColor());
    }
    setChatMessages(gameManager.getChatMessages());

    return () => gameManager.removeEvent(handleEvent);
  }, [gameManager]);

  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [gameState?.moveHistory.length]);

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

        {(gameState.status === 'check') && (
          <div className="game-status-bar check">将军！</div>
        )}

        {isGameOver && (
          <div className="game-status-bar">
            {gameState.status === 'checkmate' && '将杀'}
            {gameState.status === 'stalemate' && '困毙'}
            {gameState.status === 'timeout' && '超时'}
            {gameState.status === 'resigned' && '认输'}
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
        {chatMessages.length > 0 && (
          <div className="chat-messages" style={{ marginTop: 10 }}>
            {chatMessages.map((msg, i) => (
              <div key={i} className="chat-msg">
                <span className={`sender ${msg.color}`}>
                  {msg.color === 'red' ? '红方' : '黑方'}
                </span>
                {msg.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePanel;
