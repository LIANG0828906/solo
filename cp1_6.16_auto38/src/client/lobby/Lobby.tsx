import React, { useState } from 'react';
import { GameManager } from '../game/GameManager';

interface LobbyProps {
  gameManager: GameManager;
  onGameStart: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ gameManager, onGameStart }) => {
  const [mode, setMode] = useState<'menu' | 'created' | 'joining' | 'matching'>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    const handleEvent = (event: string, data?: any) => {
      if (event === 'roomCreated') {
        setCreatedCode(data.roomId);
        setMode('created');
      }
      if (event === 'joinSuccess' || event === 'matchFound' || event === 'gameStart') {
        onGameStart();
      }
      if (event === 'joinFailed') {
        setError(data.reason || '加入失败');
        setMode('menu');
      }
    };

    gameManager.onEvent(handleEvent);
    return () => gameManager.removeEvent(handleEvent);
  }, [gameManager, onGameStart]);

  const handleCreateRoom = () => {
    setError('');
    gameManager.createRoom();
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      setError('请输入房间码');
      return;
    }
    setError('');
    gameManager.joinRoom(roomCode.trim().toUpperCase());
  };

  const handleRandomMatch = () => {
    setError('');
    setMode('matching');
    gameManager.randomMatch();
  };

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <h2>♚ 中国象棋</h2>
        <p>在线双人对弈平台</p>

        {mode === 'menu' && (
          <div className="lobby-buttons">
            {error && (
              <div style={{ color: '#cc0000', fontSize: 14, marginBottom: 8 }}>{error}</div>
            )}
            <button className="btn btn-primary" onClick={handleCreateRoom}>
              创建房间
            </button>
            <button className="btn btn-secondary" onClick={() => { setMode('joining'); setError(''); }}>
              加入房间
            </button>
            <button className="btn btn-outline" onClick={handleRandomMatch}>
              随机匹配
            </button>
          </div>
        )}

        {mode === 'created' && (
          <div>
            <p style={{ marginBottom: 12 }}>房间已创建，将房间码分享给好友：</p>
            <div className="room-code-display">{createdCode}</div>
            <p style={{ color: '#888', fontSize: 13, marginTop: 12 }}>
              等待对手加入...
            </p>
            <div style={{ marginTop: 16 }}>
              <div className="waiting-overlay">
                <div className="spinner" />
                <p>等待中</p>
              </div>
            </div>
          </div>
        )}

        {mode === 'joining' && (
          <div>
            <p style={{ marginBottom: 12 }}>输入6位房间码：</p>
            <div className="join-form">
              <input
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="房间码"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button className="btn btn-primary btn-sm" onClick={handleJoinRoom}>
                加入
              </button>
            </div>
            {error && (
              <div style={{ color: '#cc0000', fontSize: 13, marginTop: 8 }}>{error}</div>
            )}
            <button
              className="btn btn-outline btn-sm"
              style={{ marginTop: 12, width: '100%' }}
              onClick={() => { setMode('menu'); setError(''); }}
            >
              返回
            </button>
          </div>
        )}

        {mode === 'matching' && (
          <div className="waiting-overlay">
            <div className="spinner" />
            <p>正在匹配对手...</p>
            <button
              className="btn btn-outline btn-sm"
              style={{ marginTop: 16 }}
              onClick={() => { setMode('menu'); }}
            >
              取消匹配
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
