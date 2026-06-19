import React, { useState, useEffect, useRef } from 'react';
import type { RoomMember } from './index';

interface RoomUIProps {
  roomId: string | null;
  members: RoomMember[];
  localUserId: string | null;
  onVolumeChange: (userId: string, volume: number) => void;
  onMuteToggle: (userId: string, muted: boolean) => void;
  onNameChange: (userId: string, name: string) => void;
  onCopyRoomId: () => void;
  copied: boolean;
  onLeave: () => void;
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

const MemberCard: React.FC<{
  member: RoomMember;
  isLocal: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: (muted: boolean) => void;
  onNameChange: (name: string) => void;
}> = ({ member, isLocal, onVolumeChange, onMuteToggle, onNameChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(member.userName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameClick = () => {
    if (isLocal) {
      setIsEditing(true);
      setEditName(member.userName);
    }
  };

  const handleNameSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed.length <= 12) {
      onNameChange(trimmed);
    } else {
      setEditName(member.userName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(member.userName);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`member-card ${member.isSpeaking ? 'speaking' : ''} ${
        member.isLeaving ? 'leaving' : ''
      } ${isLocal ? 'local' : ''}`}
      style={{ '--avatar-color': member.avatarColor } as React.CSSProperties}
    >
      {member.muted && (
        <div className="mute-indicator" title="已静音">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        </div>
      )}

      <div className="member-avatar">
        {getInitials(member.userName)}
      </div>

      <div className="member-info">
        {isEditing ? (
          <div className="name-edit-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value.slice(0, 12))}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyDown}
              className="name-input"
              maxLength={12}
            />
            <span className="char-count">{editName.length}/12</span>
          </div>
        ) : (
          <div
            className={`member-name ${isLocal ? 'editable' : ''}`}
            onClick={handleNameClick}
            title={isLocal ? '点击修改用户名' : ''}
          >
            {member.userName}
            {isLocal && <span className="local-badge">我</span>}
          </div>
        )}

        <div className="member-controls">
          <button
            className={`mute-btn ${member.muted ? 'muted' : ''} ${!isLocal ? 'disabled' : ''}`}
            onClick={() => isLocal && onMuteToggle(!member.muted)}
            title={member.muted ? '取消静音' : '静音'}
            disabled={!isLocal}
          >
            {member.muted ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            )}
          </button>

          <div className="volume-slider-wrapper">
            <svg viewBox="0 0 24 24" fill="currentColor" className="volume-icon">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={member.volume}
              onChange={(e) => isLocal && onVolumeChange(Number(e.target.value))}
              className={`volume-slider ${!isLocal ? 'disabled' : ''}`}
              disabled={!isLocal}
            />
          </div>
        </div>
      </div>

      <style>{`
        .member-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 200ms ease-out;
          opacity: 1;
          transform: scale(1);
        }

        .member-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          border-color: rgba(74, 74, 255, 0.3);
        }

        .member-card.speaking {
          animation: breathe 1.5s ease-in-out infinite;
        }

        @keyframes breathe {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(100, 180, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 20px 4px rgba(100, 180, 255, 0.6);
          }
        }

        .member-card.leaving {
          opacity: 0;
          transform: scale(0.9);
          transition: all 200ms ease-out;
        }

        .member-card.local {
          border-color: rgba(74, 74, 255, 0.4);
        }

        .mute-indicator {
          position: absolute;
          top: 8px;
          left: 8px;
          width: 20px;
          height: 20px;
          background: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 2;
        }

        .mute-indicator svg {
          width: 12px;
          height: 12px;
        }

        .member-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--avatar-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
          flex-shrink: 0;
        }

        .member-info {
          flex: 1;
          min-width: 0;
        }

        .member-name {
          color: #e0e0e0;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .member-name.editable {
          cursor: pointer;
        }

        .member-name.editable:hover {
          color: #4a4aff;
        }

        .local-badge {
          background: #4a4aff;
          color: white;
          font-size: 10px;
          padding: 1px 5px;
          border-radius: 4px;
          font-weight: normal;
        }

        .name-edit-wrapper {
          position: relative;
          margin-bottom: 8px;
        }

        .name-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #4a4aff;
          border-radius: 6px;
          padding: 4px 8px;
          color: #e0e0e0;
          font-size: 14px;
          outline: none;
        }

        .char-count {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          color: #888;
        }

        .member-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mute-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 200ms ease-out;
          flex-shrink: 0;
        }

        .mute-btn:hover {
          background: rgba(74, 74, 255, 0.3);
        }

        .mute-btn.muted {
          background: #ef4444;
          color: white;
        }

        .mute-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mute-btn.disabled:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .mute-btn svg {
          width: 14px;
          height: 14px;
        }

        .volume-slider-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .volume-icon {
          width: 16px;
          height: 16px;
          color: #888;
          flex-shrink: 0;
        }

        .volume-slider {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.2);
          outline: none;
          cursor: pointer;
          min-width: 0;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #4a4aff;
          cursor: pointer;
        }

        .volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #4a4aff;
          cursor: pointer;
          border: none;
        }

        .volume-slider.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .volume-slider.disabled::-webkit-slider-thumb {
          cursor: not-allowed;
        }

        .volume-slider.disabled::-moz-range-thumb {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export const RoomUI: React.FC<RoomUIProps> = ({
  roomId,
  members,
  localUserId,
  onVolumeChange,
  onMuteToggle,
  onNameChange,
  onCopyRoomId,
  copied,
  onLeave,
}) => {
  return (
    <div className="room-ui">
      <div className="room-header">
        <div className="room-title">
          <h3>排练室</h3>
          <div className="room-id-wrapper" onClick={onCopyRoomId} title="点击复制房间ID">
            <span className="room-id-label">房间ID:</span>
            <span className="room-id-value">{roomId || '---'}</span>
            <span className="copy-icon">
              {copied ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
              )}
            </span>
          </div>
        </div>
        <button className="leave-btn" onClick={onLeave}>
          离开房间
        </button>
      </div>

      <div className="members-count">
        <span>在线成员: {members.length}</span>
      </div>

      <div className="members-list">
        {members.map((member) => (
          <MemberCard
            key={member.userId}
            member={member}
            isLocal={member.userId === localUserId}
            onVolumeChange={(vol) => onVolumeChange(member.userId, vol)}
            onMuteToggle={(muted) => onMuteToggle(member.userId, muted)}
            onNameChange={(name) => onNameChange(member.userId, name)}
          />
        ))}
      </div>

      <style>{`
        .room-ui {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 16px;
          gap: 16px;
        }

        .room-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .room-title h3 {
          margin: 0 0 8px 0;
          color: #fff;
          font-size: 18px;
        }

        .room-id-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          padding: 6px 10px;
          background: rgba(74, 74, 255, 0.15);
          border-radius: 8px;
          transition: background 200ms ease-out;
          font-family: monospace;
        }

        .room-id-wrapper:hover {
          background: rgba(74, 74, 255, 0.3);
        }

        .room-id-label {
          color: #888;
          font-size: 12px;
        }

        .room-id-value {
          color: #4a4aff;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .copy-icon {
          color: #888;
          display: flex;
          align-items: center;
        }

        .copy-icon svg {
          width: 14px;
          height: 14px;
        }

        .leave-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          cursor: pointer;
          font-size: 13px;
          transition: all 200ms ease-out;
          white-space: nowrap;
        }

        .leave-btn:hover {
          background: rgba(239, 68, 68, 0.4);
        }

        .members-count {
          color: #888;
          font-size: 13px;
        }

        .members-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 4px;
        }

        .members-list::-webkit-scrollbar {
          width: 6px;
        }

        .members-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .members-list::-webkit-scrollbar-thumb {
          background: rgba(74, 74, 255, 0.3);
          border-radius: 3px;
        }

        .members-list::-webkit-scrollbar-thumb:hover {
          background: rgba(74, 74, 255, 0.5);
        }

        @media (max-width: 768px) {
          .room-ui {
            padding: 12px;
          }

          .members-list {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            gap: 12px;
          }

          .member-card {
            min-width: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default RoomUI;
