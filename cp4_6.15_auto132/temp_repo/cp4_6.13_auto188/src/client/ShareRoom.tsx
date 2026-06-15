import { useState } from 'react';
import type { User } from './types';

interface ShareRoomProps {
  currentRoomCode: string | null;
  onlineUsers: User[];
  currentUserId: string | null;
  currentUserName: string;
  onCreateRoom: () => void;
  onJoinRoom: (code: string, userName: string) => void;
  onLeaveRoom: () => void;
  onUpdateName: (name: string) => void;
}

export function ShareRoom({
  currentRoomCode,
  onlineUsers,
  currentUserId,
  currentUserName,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onUpdateName,
}: ShareRoomProps) {
  const [joinCode, setJoinCode] = useState('');
  const [tempName, setTempName] = useState(currentUserName);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (currentRoomCode) {
      await navigator.clipboard.writeText(currentRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = () => {
    if (joinCode.trim().length === 6 && tempName.trim()) {
      onJoinRoom(joinCode.trim().toUpperCase(), tempName.trim());
      setJoinCode('');
    }
  };

  const handleNameChange = () => {
    if (tempName.trim() && tempName.trim() !== currentUserName) {
      onUpdateName(tempName.trim());
    }
  };

  return (
    <div className="share-room">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ marginBottom: 0 }}>协作房间</h3>
        <input
          className="input"
          type="text"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleNameChange}
          placeholder="你的昵称"
          style={{ width: '100px', padding: '4px 8px', fontSize: '12px' }}
        />
      </div>

      {currentRoomCode ? (
        <>
          <div className="room-code-display">
            <div className="room-code">{currentRoomCode}</div>
            <button className="btn btn-secondary" onClick={handleCopyCode} style={{ padding: '6px 12px' }}>
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <button className="btn btn-secondary" onClick={onLeaveRoom} style={{ width: '100%', marginBottom: '12px' }}>
            离开房间
          </button>
          {onlineUsers.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                在线成员 ({onlineUsers.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {onlineUsers.map((user) => (
                  <div key={user.id} className="user-avatar" style={{ padding: '2px 8px 2px 2px' }}>
                    <div className="avatar-circle" style={{ width: '24px', height: '24px', fontSize: '11px' }}>
                      {user.name.charAt(0).toUpperCase()}
                      <span className="online-dot" style={{ width: '8px', height: '8px' }} />
                    </div>
                    <span className="user-name" style={{ fontSize: '11px' }}>
                      {user.id === currentUserId ? `${user.name}(我)` : user.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <button className="btn btn-primary" onClick={onCreateRoom} style={{ width: '100%', marginBottom: '8px' }}>
            创建新房间
          </button>
          <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', margin: '8px 0' }}>或加入已有房间</div>
          <div className="join-room">
            <input
              className="input"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="输入6位邀请码"
              maxLength={6}
              style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
            />
            <button className="btn btn-secondary" onClick={handleJoin} disabled={joinCode.length !== 6}>
              加入
            </button>
          </div>
        </>
      )}
    </div>
  );
}
