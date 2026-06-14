import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { InteractableObject, PuzzleState } from '../types';

interface InteractionPanelProps {
  object: InteractableObject;
  puzzleState: PuzzleState;
  socket: Socket;
  playerId: string;
  onClose: () => void;
  onSolved: (puzzleId: string) => void;
}

const InteractionPanel: React.FC<InteractionPanelProps> = ({
  object,
  puzzleState,
  socket,
  playerId,
  onClose,
  onSolved,
}) => {
  const { code } = useParams<{ code: string }>();
  const [codeInput, setCodeInput] = useState('');
  const [paintingTiles, setPaintingTiles] = useState<number[]>(() => {
    const tiles = Array.from({ length: 9 }, (_, i) => i);
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    return tiles;
  });
  const [message, setMessage] = useState('');
  const isSolved = puzzleState[object.puzzleId];

  const handleCodeSubmit = () => {
    if (codeInput === '7249') {
      onSolved(object.puzzleId);
      socket.emit('puzzle-solved', { roomCode: code, puzzleId: object.puzzleId, playerId });
      setMessage('密码正确！箱子打开了！');
    } else {
      setMessage('密码错误，再试试！');
      setCodeInput('');
    }
  };

  const handlePaintingClick = (index: number) => {
    const emptyIndex = paintingTiles.indexOf(0);
    const row = Math.floor(index / 3);
    const col = index % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;
    if (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    ) {
      const newTiles = [...paintingTiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setPaintingTiles(newTiles);
      const isComplete = newTiles.every((tile, i) => tile === i);
      if (isComplete) {
        onSolved(object.puzzleId);
        socket.emit('puzzle-solved', { roomCode: code, puzzleId: object.puzzleId, playerId });
        setMessage('画作还原！提示：7-2-4-9');
      }
    }
  };

  const handleBookRead = () => {
    onSolved(object.puzzleId);
    socket.emit('puzzle-solved', { roomCode: code, puzzleId: object.puzzleId, playerId });
  };

  const handleButtonPress = () => {
    socket.emit('cooperative-action', {
      roomCode: code,
      actionId: 'coop_buttons',
      playerId,
      requiredPlayers: 2,
    });
    setMessage('已按下按钮，等待队友配合...');
  };

  if (isSolved) {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 50, 0, 0.9)',
          border: '2px solid #4caf50',
          borderRadius: 12,
          padding: '20px 32px',
          color: '#a5d6a7',
          fontFamily: '"Segoe UI", sans-serif',
          minWidth: 300,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '1.1rem', marginBottom: 12 }}>✅ 已完成</div>
        <button
          onClick={onClose}
          style={{
            background: '#4caf50',
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          关闭
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(20, 20, 50, 0.95)',
        border: '2px solid rgba(142, 45, 226, 0.6)',
        borderRadius: 12,
        padding: '24px 32px',
        color: '#e0e0ff',
        fontFamily: '"Segoe UI", sans-serif',
        minWidth: 320,
        maxWidth: 420,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0, color: '#c0b0ee', fontSize: '1.2rem' }}>{object.name}</h3>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid rgba(142, 45, 226, 0.4)',
            borderRadius: 6,
            color: '#888',
            cursor: 'pointer',
            padding: '4px 10px',
            fontSize: '0.85rem',
          }}
        >
          ✕
        </button>
      </div>

      {object.type === 'codebox' && (
        <div>
          <p style={{ margin: '0 0 12px', color: '#a0a0cc', fontSize: '0.9rem' }}>
            输入四位密码打开箱子
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.slice(0, 4))}
              placeholder="输入密码"
              maxLength={4}
              style={{
                flex: 1,
                background: 'rgba(10, 10, 30, 0.8)',
                border: '1px solid rgba(142, 45, 226, 0.5)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#fff',
                fontSize: '1.1rem',
                letterSpacing: 4,
                textAlign: 'center',
                outline: 'none',
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={handleCodeSubmit}
              style={{
                background: 'linear-gradient(135deg, #6a0dad, #9b30ff)',
                border: 'none',
                borderRadius: 8,
                padding: '10px 18px',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              确认
            </button>
          </div>
        </div>
      )}

      {object.type === 'painting' && (
        <div>
          <p style={{ margin: '0 0 12px', color: '#a0a0cc', fontSize: '0.9rem' }}>
            拼图还原画作，点击方块移动
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 4,
              width: 180,
              margin: '0 auto 12px',
            }}
          >
            {paintingTiles.map((tile, index) => (
              <div
                key={index}
                onClick={() => handlePaintingClick(index)}
                style={{
                  width: 56,
                  height: 56,
                  background: tile === 0
                    ? 'rgba(20,20,50,0.5)'
                    : `hsl(${tile * 40}, 70%, ${50 + tile * 3}%)`,
                  borderRadius: 6,
                  cursor: tile === 0 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: tile === 0 ? 'transparent' : '#fff',
                  border: tile === 0 ? '1px dashed rgba(142,45,226,0.3)' : '1px solid rgba(255,255,255,0.2)',
                  transition: 'background 0.2s',
                }}
              >
                {tile || ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {object.type === 'book' && (
        <div>
          <div
            style={{
              background: 'rgba(60, 20, 20, 0.6)',
              borderRadius: 8,
              padding: '16px 20px',
              border: '1px solid rgba(180, 80, 80, 0.3)',
              color: '#d4a574',
              fontSize: '1rem',
              lineHeight: 1.8,
              fontFamily: 'serif',
              marginBottom: 12,
            }}
          >
            古老书籍记载：<br />
            密码提示：7-2-4-9
          </div>
          <button
            onClick={handleBookRead}
            style={{
              background: 'linear-gradient(135deg, #6a0dad, #9b30ff)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'block',
              margin: '0 auto',
            }}
          >
            记录线索
          </button>
        </div>
      )}

      {object.type === 'button' && (
        <div>
          <p style={{ margin: '0 0 12px', color: '#a0a0cc', fontSize: '0.9rem' }}>
            需要两名玩家同时按下不同按钮才能激活机关
          </p>
          <button
            onClick={handleButtonPress}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ff4444, #aa0000)',
              border: '4px solid #660000',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'block',
              margin: '0 auto',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'scale(0.9)';
            }}
            onMouseUp={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            按下
          </button>
        </div>
      )}

      {message && (
        <p
          style={{
            margin: '8px 0 0',
            color: message.includes('正确') || message.includes('还原') ? '#4caf50' : '#ff9800',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default InteractionPanel;
