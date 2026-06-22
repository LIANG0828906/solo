import { getAvatarColor } from '../utils/colors';
import './Avatar.css';

interface AvatarProps {
  name: string;
  size?: number;
}

export default function Avatar({ name, size = 60 }: AvatarProps) {
  const color = getAvatarColor(name);
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        backgroundColor: color
      }}
    >
      {initial}
    </div>
  );
}
