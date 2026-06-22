import React from 'react';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  title?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, color, size = 36, title }) => {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      title={title || name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 600,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initial}
    </div>
  );
};
