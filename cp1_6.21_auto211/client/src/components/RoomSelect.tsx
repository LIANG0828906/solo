import { useState } from 'react';
import type { Player, Room } from '../types';

interface RoomSelectProps {
  rooms: Room[];
  currentPlayer: Player | null;
  onCreateRoom: (roomName: string, nickname: string) => void;
  onJoinRoom: (roomId: string, nickname: string) => void;
  onAddNotification: (type: 'info' | 'success' | 'error' | 'warning', message: string) => void;
}

const MAGIC_COLORS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16',
  '#F97316', '#14B8A6', '#A855F7', '#E11D48'
];

function getRandomColor(): string {
  return MAGIC_COLORS[Math.floor(Math.random() * MAGIC_COLORS.length)];
}

function getInitial(name: string): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

export default function RoomSelect({
  rooms,
  currentPlayer,
  onCreateRoom,
  onJoinRoom,
  onAddNotification
}: RoomSelectProps) {
  const [roomName, setRoomName] = useState('');
  const [nickname, setNickname] = useState('');

  const handleRoomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 20);
    setRoomName(value);
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 12);
    setNickname(value);
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      onAddNotification('error', '请输入房间名');
      return;
    }
    if (!nickname.trim()) {
      onAddNotification('error', '请输入昵称');
      return;
    }
    onCreateRoom(roomName.trim(), nickname.trim());
  };

  const handleJoinRoom = (roomId: string) => {
    if (!nickname.trim()) {
      onAddNotification('error', '请输入昵称');
      return;
    }
    onJoinRoom(roomId, nickname.trim());
  };

  const canCreate = roomName.trim().length > 0 && nickname.trim().length > 0;

  return (
    <div className="room-select-page">
      <h1 className="page-title">🎨 魔法绘画室</h1>
      <p className="page-subtitle">创建房间，和朋友们一起实时绘画吧！</p>

      <div className="create-join-section">
        <h2 className="section-title">创建或加入房间</h2>
        <div className="input-group">
          <div className="input-wrapper">
            <label className="input-label">房间名称 (最多20字符)</label>
            <input
              type="text"
              className="text-input"
              placeholder="输入房间名称..."
              value={roomName}
              onChange={handleRoomNameChange}
              maxLength={20}
            />
          </div>
          <div className="input-wrapper">
            <label className="input-label">你的昵称 (最多12字符)</label>
            <input
              type="text"
              className="text-input"
              placeholder="输入你的昵称..."
              value={nickname}
              onChange={handleNicknameChange}
              maxLength={12}
            />
          </div>
        </div>
        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={handleCreateRoom}
            disabled={!canCreate}
          >
            ✨ 创建房间
          </button>
        </div>
        {currentPlayer && (
          <p style={{ marginTop: '16px', color: '#94A3B8', fontSize: '14px' }}>
            当前身份：{currentPlayer.nickname}
          </p>
        )}
      </div>

      <div className="rooms-list-section">
        <div className="rooms-list-header">
          <h2 className="section-title" style={{ marginBottom: 0 }}>在线房间</h2>
          <span className="rooms-count">共 {rooms.length} 个房间</span>
        </div>

        {rooms.length === 0 ? (
          <div className="empty-rooms">
            暂无房间，快来创建第一个吧！🎨
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="room-card"
                onClick={() => handleJoinRoom(room.id)}
              >
                <div className="room-card-header">
                  <span className="room-card-name">{room.name}</span>
                  <span className="room-card-status">
                    <span className="status-dot"></span>
                    进行中
                  </span>
                </div>
                <div className="room-card-players">
                  <div className="players-avatars">
                    {room.players.slice(0, 4).map((player, index) => (
                      <div
                        key={player.id}
                        className="player-avatar"
                        style={{
                          backgroundColor: player.avatarColor || MAGIC_COLORS[index % MAGIC_COLORS.length],
                          zIndex: 10 - index
                        }}
                        title={player.nickname}
                      >
                        {getInitial(player.nickname)}
                      </div>
                    ))}
                    {room.players.length > 4 && (
                      <div
                        className="player-avatar"
                        style={{ backgroundColor: '#475569', zIndex: 5 }}
                      >
                        +{room.players.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="players-count">
                    {room.players.length}/{room.maxPlayers}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { getRandomColor, getInitial, MAGIC_COLORS };
