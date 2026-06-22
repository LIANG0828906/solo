import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Room, User } from '../utils/types';
import { USER_COLORS } from '../utils/mockBook';

interface RoomManagerProps {
  rooms: Room[];
  usersMap: Record<string, User[]>;
  onCreateRoom: (name: string, bookName: string) => void;
  onJoinRoom: (roomId: string) => void;
  onSetUserName: (name: string) => void;
  userName: string;
}

const GRADIENTS = [
  'linear-gradient(135deg, #ff9a56 0%, #8b4513 100%)',
  'linear-gradient(135deg, #ffb347 0%, #a0522d 100%)',
  'linear-gradient(135deg, #f4a460 0%, #654321 100%)',
  'linear-gradient(135deg, #deb887 0%, #8b4513 100%)',
  'linear-gradient(135deg, #d2691e 0%, #5d3a1a 100%)',
];

export const RoomManager: React.FC<RoomManagerProps> = ({
  rooms,
  usersMap,
  onCreateRoom,
  onJoinRoom,
  onSetUserName,
  userName,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [bookName, setBookName] = useState('');
  const [nameInput, setNameInput] = useState(userName);
  const [nameSaved, setNameSaved] = useState(!!userName);

  const handleCreateRoom = () => {
    if (roomName.trim() && bookName.trim()) {
      onCreateRoom(roomName.trim(), bookName.trim());
      setRoomName('');
      setBookName('');
      setShowCreate(false);
    }
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onSetUserName(nameInput.trim());
      setNameSaved(true);
    }
  };

  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(timestamp, { addSuffix: true, locale: zhCN });
    } catch {
      return '刚刚';
    }
  };

  const getInitials = (name: string) => name.slice(0, 1).toUpperCase();

  if (!nameSaved) {
    return (
      <div className="room-manager">
        <div className="name-setup">
          <h1 className="app-title">📚 图书共读平台</h1>
          <p className="subtitle">和朋友一起阅读，分享思考</p>
          <div className="name-input-wrapper">
            <label>请输入您的昵称</label>
            <input
              type="text"
              className="input"
              placeholder="您的昵称"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSaveName} disabled={!nameInput.trim()}>
              进入平台
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-manager">
      <div className="room-header">
        <div>
          <h1 className="app-title">📚 图书共读平台</h1>
          <p className="subtitle">欢迎，{userName}！选择一个房间开始阅读</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + 创建房间
        </button>
      </div>

      {showCreate && (
        <div className="create-modal" onClick={() => setShowCreate(false)}>
          <div className="create-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>创建阅读房间</h3>
            <div className="form-group">
              <label>房间名称</label>
              <input
                type="text"
                className="input"
                placeholder="如：双城记共读会"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>书籍名称</label>
              <input
                type="text"
                className="input"
                placeholder="如：双城记"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateRoom}
                disabled={!roomName.trim() || !bookName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📖</div>
          <h3>还没有阅读房间</h3>
          <p>创建第一个房间，开始您的共读之旅！</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + 创建房间
          </button>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map((room, idx) => {
            const roomUsers = usersMap[room.id] || [];
            return (
              <div
                key={room.id}
                className="room-card"
                onClick={() => onJoinRoom(room.id)}
              >
                <div
                  className="room-cover"
                  style={{ background: GRADIENTS[idx % GRADIENTS.length] }}
                >
                  <span className="room-cover-text">{room.bookName.slice(0, 2)}</span>
                </div>
                <div className="room-info">
                  <h3 className="room-name">{room.name}</h3>
                  <p className="room-book">《{room.bookName}》</p>
                  <div className="room-footer">
                    <div className="room-users">
                      {roomUsers.slice(0, 5).map((user, i) => (
                        <div
                          key={user.id}
                          className="user-avatar-stack"
                          style={{
                            backgroundColor: user.color || USER_COLORS[i % USER_COLORS.length],
                            zIndex: 5 - i,
                          }}
                          title={user.name}
                        >
                          {getInitials(user.name)}
                        </div>
                      ))}
                      {roomUsers.length > 5 && (
                        <div className="user-avatar-stack user-avatar-more">
                          +{roomUsers.length - 5}
                        </div>
                      )}
                    </div>
                    <span className="room-time">{formatTime(room.lastActive)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
