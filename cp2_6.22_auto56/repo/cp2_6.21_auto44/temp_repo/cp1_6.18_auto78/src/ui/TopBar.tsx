import React, { useState } from 'react';
import { Share2, Hash, Check, Edit3 } from 'lucide-react';
import { useElementStore } from '@data/elementStore';

export const TopBar: React.FC = () => {
  const {
    roomId,
    setRoom,
    currentUserName,
    currentUserColor,
    collaborators,
    currentUserId,
  } = useElementStore();

  const [showRoomInput, setShowRoomInput] = useState(false);
  const [newRoomId, setNewRoomId] = useState(roomId);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRoomChange = () => {
    if (newRoomId.trim()) {
      setRoom(newRoomId.trim());
      setShowRoomInput(false);
    }
  };

  const getInitial = (name: string): string => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  const me = collaborators.find((c) => c.id === currentUserId);
  const others = collaborators.filter((c) => c.id !== currentUserId);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand-section">
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 14l2 2 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="brand-name">画布共鸣</span>
        </div>

        <div className="room-section">
          {showRoomInput ? (
            <div className="room-input-wrapper">
              <Hash size={16} />
              <input
                className="room-input"
                value={newRoomId}
                onChange={(e) => setNewRoomId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRoomChange()}
                autoFocus
                placeholder="输入房间ID"
              />
              <button
                className="room-input-confirm"
                onClick={handleRoomChange}
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              className="room-badge"
              onClick={() => {
                setNewRoomId(roomId);
                setShowRoomInput(true);
              }}
              title="点击切换房间"
            >
              <Hash size={16} />
              <span className="room-id-text">{roomId}</span>
              <Edit3 size={12} className="room-edit-icon" />
            </button>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <div className="user-avatars-stack">
          {me && (
            <div
              className="user-avatar me"
              style={{ backgroundColor: me.color }}
              title={`${me.name} (我)`}
            >
              {getInitial(me.name)}
            </div>
          )}
          {others.slice(0, 4).map((c, i) => (
            <div
              key={c.id}
              className="user-avatar"
              style={{
                backgroundColor: c.color,
                zIndex: 10 - i,
              }}
              title={c.name}
            >
              {getInitial(c.name)}
            </div>
          ))}
          {others.length > 4 && (
            <div className="user-avatar more" title={`还有${others.length - 4}人`}>
              +{others.length - 4}
            </div>
          )}
        </div>

        <button
          className={`share-btn ${copied ? 'copied' : ''}`}
          onClick={handleShare}
        >
          {copied ? <Check size={18} /> : <Share2 size={18} />}
          <span>{copied ? '已复制' : '分享房间'}</span>
        </button>
      </div>
    </header>
  );
};
