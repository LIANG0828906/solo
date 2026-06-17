import React from 'react';
import { Users } from 'lucide-react';
import { useElementStore } from '@data/elementStore';
import { Collaborator } from '@types/index';

const getInitial = (name: string): string => {
  if (!name) return '?';
  const trimmed = name.trim();
  return trimmed.charAt(0).toUpperCase();
};

const CollaboratorAvatar: React.FC<{ collaborator: Collaborator }> = ({ collaborator }) => {
  return (
    <div
      className="collaborator-item"
      title={`${collaborator.name}${collaborator.isLocal ? ' (我)' : ''}`}
    >
      <div
        className="collaborator-avatar"
        style={{ backgroundColor: collaborator.color }}
      >
        {getInitial(collaborator.name)}
      </div>
      <div className="collaborator-info">
        <span className="collaborator-name">
          {collaborator.name}
          {collaborator.isLocal && <span className="self-tag">我</span>}
        </span>
        <span className="collaborator-active">
          {collaborator.isLocal ? '在线' : '活跃中'}
        </span>
      </div>
      <div className="collaborator-status" />
    </div>
  );
};

export const CollaboratorPanel: React.FC = () => {
  const { collaborators, roomId } = useElementStore();

  return (
    <aside className="collaborator-panel">
      <div className="collaborator-header">
        <div className="collaborator-header-icon">
          <Users size={18} />
        </div>
        <div className="collaborator-header-text">
          <h3 className="collaborator-title">协作成员</h3>
          <span className="collaborator-room">房间 {roomId}</span>
        </div>
        <div className="collaborator-count">{collaborators.length}</div>
      </div>

      <div className="collaborator-list">
        {collaborators
          .slice()
          .sort((a, b) => (a.isLocal ? -1 : b.isLocal ? 1 : 0))
          .map((c) => (
            <CollaboratorAvatar key={c.id} collaborator={c} />
          ))}
      </div>

      <div className="room-info-section">
        <h4 className="section-title">房间信息</h4>
        <div className="room-info-row">
          <span className="room-info-label">房间ID</span>
          <span className="room-info-value">{roomId}</span>
        </div>
        <div className="room-info-row">
          <span className="room-info-label">成员数</span>
          <span className="room-info-value">{collaborators.length}人</span>
        </div>
      </div>

      <div className="color-legend-section">
        <h4 className="section-title">颜色说明</h4>
        <div className="color-legend">
          {collaborators.map((c) => (
            <div key={c.id} className="color-legend-item">
              <div
                className="color-dot"
                style={{ backgroundColor: c.color }}
              />
              <span className="color-name">
                {c.name}
                {c.isLocal && ' (我)'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export const CursorLayer: React.FC<{ canvasWidth: number; canvasHeight: number }> = () => {
  const { collaborators, currentUserId, tool } = useElementStore();
  const shouldShowCursor = tool === 'brush' || tool === 'text';

  return (
    <div className="cursor-layer">
      {collaborators.map((c) => {
        if (c.id === currentUserId) return null;
        if (c.cursorX <= 0 && c.cursorY <= 0) return null;
        return (
          <div
            key={c.id}
            className="remote-cursor"
            style={{
              left: c.cursorX,
              top: c.cursorY,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="remote-cursor-dot"
              style={{ backgroundColor: c.color }}
            />
            {shouldShowCursor && (
              <div
                className="remote-cursor-label"
                style={{ borderColor: c.color }}
              >
                {c.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
