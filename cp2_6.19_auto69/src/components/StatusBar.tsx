import React from 'react';
import { Users } from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';

const StatusBar: React.FC = () => {
  const { users, currentUserId } = useCanvasStore();

  return (
    <>
      <style>{`
        .statusbar-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 48px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 100;
        }

        .statusbar-title {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .users-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .users-count {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .avatars-container {
          display: flex;
          align-items: center;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 600;
          border: 2px solid white;
          margin-left: -8px;
          transition: all 0.3s ease;
          position: relative;
        }

        .avatar:first-child {
          margin-left: 0;
        }

        .avatar:hover {
          transform: scale(1.1);
          z-index: 10;
        }

        .avatar.current-user {
          border-color: #3b82f6;
        }

        .avatar.leaving {
          animation: shrinkFade 0.5s ease forwards;
        }

        @keyframes shrinkFade {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.1);
          }
        }

        .avatar-tooltip {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          background: #1e293b;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }

        .avatar:hover .avatar-tooltip {
          opacity: 1;
        }

        @media (max-width: 1280px) {
          .statusbar-container {
            padding: 0 16px;
          }
        }
      `}</style>

      <div className="statusbar-container">
        <div className="statusbar-title">
          <span>🎨 在线协作白板</span>
        </div>

        <div className="users-section">
          <div className="users-count">
            <Users size={18} />
            <span>{users.length} 人在线</span>
          </div>

          <div className="avatars-container">
            {users.map((user) => (
              <div
                key={user.id}
                className={`avatar ${user.id === currentUserId ? 'current-user' : ''} ${user.isLeaving ? 'leaving' : ''}`}
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.avatar}
                <span className="avatar-tooltip">{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default StatusBar;
