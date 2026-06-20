import React from 'react';
import { motion } from 'framer-motion';
import { Member } from '../types';

interface SidebarProps {
  members: Member[];
  collapsed: boolean;
  onToggle: () => void;
  onAddMember: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const Sidebar: React.FC<SidebarProps> = ({
  members,
  collapsed,
  onToggle,
  onAddMember,
}) => {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 0 : 240 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{
        background: '#2C3E50',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div style={{ minWidth: 240, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div
          style={{
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 600,
              color: '#fff',
            }}
          >
            团队成员
          </h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggle}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <motion.svg
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </motion.svg>
          </motion.button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 8px',
          }}
        >
          {members.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
              }}
              style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                borderRadius: '10px',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: member.avatarColor || '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {getInitials(member.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#fff',
                    marginBottom: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {member.name}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  本周 {member.weeklyHours}h
                </div>
              </div>
            </motion.div>
          ))}

          {members.length === 0 && (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '13px',
              }}
            >
              暂无成员
            </div>
          )}
        </div>

        <div
          style={{
            padding: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02, background: '#9B5DE5' }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddMember}
            style={{
              width: '100%',
              padding: '12px',
              background: '#7C3AED',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            添加成员
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
