import './styles/UserAvatar.css';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserAvatar({ name, size = 'md' }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={`user-avatar user-avatar-${size}`}>
      {initial}
    </div>
  );
}
