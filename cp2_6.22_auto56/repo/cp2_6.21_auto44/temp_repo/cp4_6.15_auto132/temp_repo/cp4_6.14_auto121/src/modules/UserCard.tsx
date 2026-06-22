import type { UserCardProps } from '../types';

export default function UserCard({ avatarUrl, name, role, tagColor }: UserCardProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        boxSizing: 'border-box',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          objectFit: 'cover',
          marginRight: 12,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flex: 1,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#1e293b',
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
        <span
          style={{
            display: 'inline-block',
            alignSelf: 'flex-start',
            backgroundColor: tagColor,
            color: '#ffffff',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {role}
        </span>
      </div>
    </div>
  );
}
