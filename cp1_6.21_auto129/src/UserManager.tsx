import React from 'react';
import { User } from './types';

interface Props {
  users: User[];
}

const UserManager: React.FC<Props> = ({ users }) => {
  const onlineUsers = users.filter(u => u.online);

  return (
    <div className="user-bar">
      {onlineUsers.length === 0 ? (
        <div className="no-users-hint">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="8" cy="6" r="4" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
            <path
              d="M2 14c0-3 2.5-5 6-5s6 2 6 5"
              stroke="#94A3B8"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          点击「添加用户」开始协作
        </div>
      ) : (
        onlineUsers.map(user => (
          <div className="user-avatar-wrapper" key={user.id}>
            <div
              className="user-avatar"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0)}
            </div>
            <div className={`user-status-dot ${user.online ? 'online' : 'offline'}`} />
            <div className="user-name-tooltip">{user.name}</div>
          </div>
        ))
      )}
    </div>
  );
};

export default UserManager;
