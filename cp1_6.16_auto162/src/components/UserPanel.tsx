import { useEditorStore } from '../stores/editorStore';

export function UserPanel() {
  const { onlineUsers, userName, room } = useEditorStore();

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 10,
        background: 'rgba(44, 44, 44, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #333333',
        borderRadius: 10,
        padding: '8px 14px',
      }}
    >
      {room && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              color: '#888888',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            房间
          </span>
          <span
            style={{
              fontSize: 13,
              color: '#00BFA5',
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            #{room}
          </span>
        </div>
      )}

      <div style={{ width: 1, height: 20, background: '#333333' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex' }}>
          {onlineUsers.slice(0, 6).map((user, i) => (
            <div
              key={user.id}
              title={`${user.name}${user.name === userName ? ' (你)' : ''}`}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: user.color,
                border: '2px solid #2C2C2C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#FFFFFF',
                fontWeight: 700,
                marginLeft: i === 0 ? 0 : -8,
                zIndex: onlineUsers.length - i,
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
        <span
          style={{
            fontSize: 12,
            color: '#E0E0E0',
            fontWeight: 600,
          }}
        >
          {onlineUsers.length}
        </span>
      </div>
    </div>
  );
}
