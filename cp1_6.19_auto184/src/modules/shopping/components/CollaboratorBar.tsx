import { motion } from 'framer-motion';
import type { Collaborator } from '@/types';

interface CollaboratorBarProps {
  collaborators: Collaborator[];
  currentUserId: string;
}

export function CollaboratorBar({ collaborators, currentUserId }: CollaboratorBarProps) {
  const onlineCollaborators = collaborators.filter((c) => c.online);
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(212, 197, 176, 0.3)',
    }}>
      <span style={{
        fontSize: 13,
        color: '#7F8C8D',
        fontWeight: 500,
      }}>
        在线协作者
      </span>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
      }}>
        {onlineCollaborators.map((collaborator, index) => (
          <motion.div
            key={collaborator.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            style={{
              position: 'relative',
              marginLeft: index > 0 ? -8 : 0,
            }}
          >
            <div
              title={`${collaborator.name}${collaborator.id === currentUserId ? ' (我)' : ''}`}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: collaborator.color,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFFFFF',
                boxSizing: 'border-box',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.zIndex = '10';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.zIndex = '1';
              }}
            >
              {collaborator.name.charAt(0)}
            </div>
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#2ECC71',
              border: '2px solid #FFFFFF',
              boxSizing: 'border-box',
            }} />
          </motion.div>
        ))}
      </div>
      
      <span style={{
        fontSize: 12,
        color: '#95A5A6',
        marginLeft: 'auto',
      }}>
        {onlineCollaborators.length} 人在线
      </span>
    </div>
  );
}
