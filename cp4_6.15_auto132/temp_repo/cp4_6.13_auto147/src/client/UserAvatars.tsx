import { UserInfo } from '../shared/types';

interface UserAvatarsProps {
  users: UserInfo[];
  currentUserId: string;
}

function UserAvatars({ users, currentUserId }: UserAvatarsProps) {
  const getInitial = (nickname: string) => {
    return nickname.charAt(0).toUpperCase();
  };

  return (
    <div className="user-avatars">
      {users.map((user) => (
        <div
          key={user.id}
          className="user-avatar"
          style={{ backgroundColor: user.color }}
          title={`${user.nickname}${user.id === currentUserId ? ' (你)' : ''}`}
        >
          {getInitial(user.nickname)}
        </div>
      ))}
    </div>
  );
}

export default UserAvatars;
