import React from 'react';
import { User } from '../types';

interface UserListProps {
  users: User[];
  currentUser: User | null;
}

const UserList: React.FC<UserListProps> = ({ users, currentUser }) => {
  return (
    <div className="panel-section">
      <h3 className="panel-title">在线成员 ({users.length})</h3>
      <ul className="user-list">
        {users.map((user) => (
          <li key={user.id} className="user-item">
            <div className="user-avatar">{user.avatar}</div>
            <div className="user-info">
              <div className="user-name">
                {user.name}
                {currentUser?.id === user.id && ' (我)'}
              </div>
              <div className="user-status">
                <span className="status-dot" style={{ display: 'inline-block', marginRight: '4px' }}></span>
                在线
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
