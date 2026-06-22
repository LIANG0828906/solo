import React from 'react';
import { Guest, RelationshipType, RELATIONSHIP_COLORS, RELATIONSHIP_LABELS } from '../rules/seatRules';

interface GuestPoolProps {
  guests: Guest[];
  assignedGuestIds: Set<string>;
  onDragStart: (e: React.DragEvent, guestId: string) => void;
}

const GuestPool: React.FC<GuestPoolProps> = ({ guests, assignedGuestIds, onDragStart }) => {
  const unassignedGuests = guests.filter(g => !assignedGuestIds.has(g.id));

  const getPrimaryRelationship = (guest: Guest): RelationshipType => {
    const typeOrder: RelationshipType[] = ['couple', 'family', 'friend', 'colleague', 'enemy'];
    for (const type of typeOrder) {
      if (guest.relationships.some(r => r.type === type)) {
        return type;
      }
    }
    return 'friend';
  };

  return (
    <div style={styles.container}>
      <style>{`
        .guest-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .guest-card:active {
          cursor: grabbing;
          transform: scale(0.98);
        }
      `}</style>
      <div style={styles.header}>
        <h2 style={styles.title}>宾客池</h2>
        <span style={styles.count}>{unassignedGuests.length} 位未安排</span>
      </div>
      <div style={styles.guestList}>
        {unassignedGuests.map(guest => {
          const primaryRel = getPrimaryRelationship(guest);
          const color = RELATIONSHIP_COLORS[primaryRel];
          
          return (
            <div
              key={guest.id}
              draggable
              className="guest-card"
              onDragStart={(e) => onDragStart(e, guest.id)}
              style={{
                ...styles.guestCard,
                borderLeftColor: color,
              }}
            >
              <div style={styles.cardContent}>
                <span style={styles.guestName}>{guest.name}</span>
                <span style={{
                  ...styles.relationshipTag,
                  backgroundColor: color + '20',
                  color: color,
                }}>
                  {RELATIONSHIP_LABELS[primaryRel]}
                </span>
              </div>
            </div>
          );
        })}
        {unassignedGuests.length === 0 && (
          <div style={styles.emptyState}>
            <p>所有宾客已安排座位</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '320px',
    minWidth: '320px',
    backgroundColor: '#FDF2F8',
    borderRight: '1px solid #F7DC6F30',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #E8A87C30',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  count: {
    fontSize: '13px',
    color: '#E8A87C',
    fontWeight: 500,
  },
  guestList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  guestCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '12px 14px',
    borderLeft: '4px solid',
    cursor: 'grab',
    transition: 'all 0.2s ease-out',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    userSelect: 'none',
  },
  cardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guestName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  relationshipTag: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontWeight: 500,
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#999',
    fontSize: '14px',
  },
};

export default GuestPool;
