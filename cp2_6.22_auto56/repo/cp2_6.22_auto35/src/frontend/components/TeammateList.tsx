import React from 'react';
import { useRouteStore } from '../store/useRouteStore';
import { User } from 'lucide-react';

const TeammateList: React.FC = () => {
  const teammates = useRouteStore((state) => state.teammates);

  return (
    <div style={{ width: '100%' }}>
      {teammates.map((teammate) => (
        <div
          key={teammate.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {teammate.avatar ? (
                <img
                  src={teammate.avatar}
                  alt={teammate.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={18} color="#999" />
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: teammate.isOnline ? '#4CAF50' : '#9E9E9E',
                border: '2px solid #fff',
              }}
            />
          </div>
          <span style={{ fontSize: 14, color: '#333' }}>{teammate.name}</span>
        </div>
      ))}
    </div>
  );
};

export default TeammateList;
