import { User } from '../types';
import './components.css';

interface OnlineUsersProps {
  users: User[];
}

const getInitial = (name: string): string => name.charAt(0).toUpperCase();

const getAvatarColor = (name: string): string => {
  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function OnlineUsers({ users }: OnlineUsersProps) {
  const onlineUsers = users.filter((u) => u.online);

  return (
    <div className="online-users-card">
      <div className="online-users-header">
        <h3 className="online-users-title">在线成员</h3>
        <span className="online-users-count">{onlineUsers.length}</span>
      </div>

      <div className="online-users-list">
        {users.map((user) => (
          <div key={user.id} className="online-user-item">
            <div className="avatar-wrapper">
              <div className="user-avatar" style={{ backgroundColor: getAvatarColor(user.name) }}>
                {getInitial(user.name)}
              </div>
              <span className={`status-dot ${user.online ? 'online' : 'offline'}`} />
            </div>
            <span className="user-name">{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
