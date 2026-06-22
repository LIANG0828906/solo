import React, { useState, useMemo } from 'react';
import { Guest, Table, Conflict, RELATIONSHIP_COLORS, getRelationshipBetween } from '../rules/seatRules';

interface SeatPlanProps {
  tables: Table[];
  guests: Guest[];
  conflicts: Conflict[];
  tableStatus: Record<string, 'valid' | 'conflict' | 'empty'>;
  draggedGuestId: string | null;
  onDropGuest: (tableId: string, seatIndex: number, guestId: string) => void;
  onRemoveGuest: (guestId: string) => void;
  validationMode: boolean;
}

const SeatPlan: React.FC<SeatPlanProps> = ({
  tables,
  guests,
  conflicts,
  tableStatus,
  draggedGuestId,
  onDropGuest,
  onRemoveGuest,
  validationMode,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<{ tableId: string; index: number } | null>(null);
  const [recentlyDropped, setRecentlyDropped] = useState<string | null>(null);

  const getGuestById = (id: string | null): Guest | undefined => {
    if (!id) return undefined;
    return guests.find(g => g.id === id);
  };

  const getInitials = (name: string): string => {
    if (name.length <= 2) return name;
    return name.slice(0, 2);
  };

  const getGuestConflictStatus = (guestId: string, tableId: string): { hasEnemyConflict: boolean; hasCoupleConflict: boolean } => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return { hasEnemyConflict: false, hasCoupleConflict: false };

    const otherGuests = table.seats.filter((id): id is string => id !== null && id !== guestId);
    let hasEnemyConflict = false;
    let hasCoupleConflict = false;

    otherGuests.forEach(otherId => {
      const rel = getRelationshipBetween(guestId, otherId, guests);
      if (rel === 'enemy') hasEnemyConflict = true;
    });

    const guest = getGuestById(guestId);
    if (guest) {
      const coupleRelationships = guest.relationships.filter(r => r.type === 'couple');
      coupleRelationships.forEach(coupleRel => {
        const coupleTable = tables.find(t => t.seats.includes(coupleRel.guestId));
        if (coupleTable && coupleTable.id !== tableId) {
          hasCoupleConflict = true;
        }
      });
    }

    return { hasEnemyConflict, hasCoupleConflict };
  };

  const handleDragOver = (e: React.DragEvent, tableId: string, index: number) => {
    e.preventDefault();
    setHoveredSeat({ tableId, index });
  };

  const handleDragLeave = () => {
    setHoveredSeat(null);
  };

  const handleDrop = (e: React.DragEvent, tableId: string, index: number) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData('guestId');
    if (guestId) {
      onDropGuest(tableId, index, guestId);
      setRecentlyDropped(`${tableId}-${index}`);
      setTimeout(() => setRecentlyDropped(null), 200);
    }
    setHoveredSeat(null);
  };

  const handleSeatClick = (guestId: string) => {
    onRemoveGuest(guestId);
  };

  const calculateSeatPosition = (index: number, total: number, centerX: number, centerY: number, radius: number) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  };

  const renderTable = (table: Table) => {
    const centerX = 100;
    const centerY = 100;
    const seatRadius = 62;
    const seatSize = 28;
    const status = tableStatus[table.id];
    const hasConflict = status === 'conflict';
    const isValid = status === 'valid';

    let tableBgColor = '#F7DC6F';
    let tableStrokeColor = '#E8A87C';
    
    if (validationMode) {
      if (hasConflict) {
        tableBgColor = '#FEE2E2';
        tableStrokeColor = '#EF4444';
      } else if (isValid) {
        tableBgColor = '#ECFDF5';
        tableStrokeColor = '#10B981';
      }
    }

    const seatedGuests = table.seats.filter(s => s !== null);
    const hasAnyConflict = seatedGuests.some(guestId => {
      const { hasEnemyConflict, hasCoupleConflict } = getGuestConflictStatus(guestId, table.id);
      return hasEnemyConflict || hasCoupleConflict;
    });

    return (
      <div key={table.id} style={styles.tableWrapper}>
        {hasAnyConflict && !validationMode && (
          <div style={styles.conflictBadge}>
            <span style={styles.conflictIcon}>!</span>
          </div>
        )}
        
        <svg width="200" height="200" style={styles.tableSvg}>
          <circle
            cx={centerX}
            cy={centerY}
            r={80}
            fill={tableBgColor}
            stroke={tableStrokeColor}
            strokeWidth="2"
            style={{ transition: 'all 0.3s ease-out' }}
          />
          
          <circle
            cx={centerX}
            cy={centerY}
            r={55}
            fill="white"
            stroke={tableStrokeColor}
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.5"
          />
          
          <text
            x={centerX}
            y={centerY + 5}
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fill="#E8A87C"
          >
            {table.tableNumber}
          </text>
          
          {table.seats.map((guestId, index) => {
            const pos = calculateSeatPosition(index, 8, centerX, centerY, seatRadius);
            const isHovered = hoveredSeat?.tableId === table.id && hoveredSeat.index === index;
            const guest = getGuestById(guestId);
            const isRecentlyDropped = recentlyDropped === `${table.id}-${index}`;
            const { hasEnemyConflict, hasCoupleConflict } = guestId 
              ? getGuestConflictStatus(guestId, table.id)
              : { hasEnemyConflict: false, hasCoupleConflict: false };

            const guestPrimaryRel = guest
              ? guest.relationships[0]?.type || 'friend'
              : null;
            const seatColor = guestPrimaryRel ? RELATIONSHIP_COLORS[guestPrimaryRel] : '#9CA3AF';

            return (
              <g key={index}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={seatSize / 2 + 3}
                  fill="transparent"
                  stroke={isHovered ? '#E8A87C' : 'transparent'}
                  strokeWidth="2"
                  style={{
                    transition: 'all 0.2s ease-out',
                  }}
                />
                
                {guest ? (
                  <g
                    onClick={() => handleSeatClick(guest.id)}
                    style={{ cursor: 'pointer' }}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('guestId', guest.id);
                      e.dataTransfer.setData('fromTable', table.id);
                    }}
                    draggable
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={seatSize / 2}
                      fill="white"
                      stroke={hasEnemyConflict ? '#EF4444' : seatColor}
                      strokeWidth={hasEnemyConflict ? 3 : 2}
                      style={{
                        animation: hasEnemyConflict ? 'flash-red 0.5s ease-in-out 2' : 'none',
                        transform: isRecentlyDropped ? 'scale(1.2)' : 'scale(1)',
                        transformOrigin: `${pos.x}px ${pos.y}px`,
                        transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="500"
                      fill="#333"
                      style={{ pointerEvents: 'none' }}
                    >
                      {getInitials(guest.name)}
                    </text>
                    {hasCoupleConflict && (
                      <text
                        x={pos.x + 12}
                        y={pos.y - 8}
                        fontSize="12"
                        fill="#F472B6"
                        style={{ animation: 'bounce-in 0.3s ease-out' }}
                      >
                        💔
                      </text>
                    )}
                    {hasEnemyConflict && (
                      <text
                        x={pos.x}
                        y={pos.y + seatSize / 2 + 14}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#EF4444"
                        style={{ animation: 'fade-in 0.4s ease-out' }}
                      >
                        存在冲突
                      </text>
                    )}
                  </g>
                ) : (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={seatSize / 2}
                    fill="rgba(156, 163, 175, 0.1)"
                    stroke="#9CA3AF"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                    style={{
                      transform: isHovered && draggedGuestId ? 'scale(1.2)' : 'scale(1)',
                      transformOrigin: `${pos.x}px ${pos.y}px`,
                      transition: 'transform 0.2s ease-out',
                      cursor: draggedGuestId ? 'copy' : 'default',
                    }}
                    onDragOver={(e) => handleDragOver(e, table.id, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, table.id, index)}
                  />
                )}
              </g>
            );
          })}
        </svg>
        
        <div style={styles.tableLabel}>
          <span style={styles.tableNumber}>第 {table.tableNumber} 桌</span>
          <span style={styles.seatCount}>
            {table.seats.filter(s => s !== null).length}/8 人
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>座位布局</h2>
        <span style={styles.tableCount}>{tables.length} 桌</span>
      </div>
      <div style={styles.tablesContainer}>
        {tables.map(table => renderTable(table))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#FFF5EE',
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid #E8A87C30',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  tableCount: {
    fontSize: '13px',
    color: '#E8A87C',
    fontWeight: 500,
  },
  tablesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '24px',
    maxHeight: '700px',
    alignContent: 'start',
  },
  tableWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  },
  tableSvg: {
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))',
  },
  tableLabel: {
    marginTop: '8px',
    textAlign: 'center',
  },
  tableNumber: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    display: 'block',
  },
  seatCount: {
    fontSize: '12px',
    color: '#999',
    display: 'block',
    marginTop: '2px',
  },
  conflictBadge: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#EF4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    animation: 'bounce-in 0.3s ease-out',
  },
  conflictIcon: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
  },
};

export default SeatPlan;
