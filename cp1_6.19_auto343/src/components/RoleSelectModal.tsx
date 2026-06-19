import React from 'react';

type Role = 'annotator' | 'reviewer' | 'admin';

interface RoleSelectModalProps {
  onSelect: (role: Role) => void;
}

const RoleSelectModal: React.FC<RoleSelectModalProps> = ({ onSelect }) => {
  const roles: { key: Role; label: string; icon: string }[] = [
    { key: 'annotator', label: '标注员', icon: '✏️' },
    { key: 'reviewer', label: '审核员', icon: '🔍' },
    { key: 'admin', label: '管理员', icon: '📊' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        style={{
          backgroundColor: '#37474F',
          borderRadius: 12,
          padding: 40,
          width: 520,
        }}
      >
        <h2
          style={{
            fontSize: 24,
            textAlign: 'center',
            marginBottom: 32,
            color: '#fff',
            fontWeight: 600,
          }}
        >
          选择您的角色
        </h2>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          {roles.map((r) => (
            <button
              key={r.key}
              onClick={() => onSelect(r.key)}
              style={{
                width: 140,
                height: 140,
                borderRadius: 8,
                backgroundColor: '#455A64',
                cursor: 'pointer',
                border: 'none',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#546E7A';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#455A64';
              }}
            >
              <span style={{ fontSize: 48 }}>{r.icon}</span>
              <span style={{ fontSize: 16, fontWeight: 500 }}>{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelectModal;
