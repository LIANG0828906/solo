import React from 'react';
import { TeamMember } from './types';

interface SidebarProps {
  members: TeamMember[];
  completedCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ members, completedCount }) => {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px'
    }}>
      <div style={{
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: '16px',
          paddingLeft: '8px'
        }}>
          团队成员
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {members.map(member => (
            <div
              key={member.id}
              style={{
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: member.avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                flexShrink: 0,
                border: '2px solid white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}>
                {member.name.charAt(0)}
              </div>
              <span style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}>
                {member.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 'auto',
        padding: '24px 16px',
        backgroundColor: '#fafafa',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginBottom: '8px'
        }}>
          本周完成卡片
        </p>
        <div style={{
          fontSize: '48px',
          fontWeight: 700,
          color: 'var(--accent-green)',
          lineHeight: 1.1,
          marginBottom: '4px'
        }}>
          {completedCount}
        </div>
        <p style={{
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          张卡片
        </p>
      </div>
    </div>
  );
};

export default React.memo(Sidebar);
