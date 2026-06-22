import React, { useState } from 'react';
import type { Table, Guest, Conflict } from '../types';
import { GROUP_LABELS } from '../types';

interface TableCanvasProps {
  tables: Table[];
  guests: Guest[];
  conflicts: Conflict[];
  onSeatGuest: (tableId: string, seatIndex: number, guestId: string) => void;
  onUnseatGuest: (tableId: string, seatIndex: number) => void;
  onMoveGuest: (fromTableId: string, fromSeat: number, toTableId: string, toSeat: number) => void;
}

const TableCanvas: React.FC<TableCanvasProps> = ({
  tables,
  guests,
  conflicts,
  onSeatGuest,
  onUnseatGuest,
  onMoveGuest
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<{ tableId: string; seat: number } | null>(null);
  const [draggingFrom, setDraggingFrom] = useState<{ tableId: string; seat: number } | null>(null);
  const [bouncingSeat, setBouncingSeat] = useState<{ tableId: string; seat: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const guestMap = new Map(guests.map(g => [g.id, g]));
  const tablesWithEnemyConflict = new Set(
    conflicts.filter(c => c.type === 'enemy_same_table').flatMap(c => c.tableIds)
  );
  const coupleConflicts = conflicts.filter(c => c.type === 'couple_separated');

  const getGuestSeatPosition = (tableId: string, guestId: string): { table: Table; seat: number } | null => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return null;
    const seat = table.seats.findIndex(s => s === guestId);
    if (seat === -1) return null;
    return { table, seat };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnSeat = (e: React.DragEvent, tableId: string, seatIndex: number) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData('guestId');
    const sourceData = e.dataTransfer.getData('fromSeat');

    if (sourceData) {
      const { tableId: fromTableId, seat: fromSeat } = JSON.parse(sourceData);
      onMoveGuest(fromTableId, fromSeat, tableId, seatIndex);
    } else if (guestId) {
      onSeatGuest(tableId, seatIndex, guestId);
      setBouncingSeat({ tableId, seat: seatIndex });
      setTimeout(() => setBouncingSeat(null), 200);
    }
    setDraggingFrom(null);
    setHoveredSeat(null);
  };

  const handleSeatDragStart = (e: React.DragEvent, tableId: string, seatIndex: number) => {
    e.dataTransfer.setData('fromSeat', JSON.stringify({ tableId, seat: seatIndex }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingFrom({ tableId, seat: seatIndex });
  };

  const handleLineClick = (e: React.MouseEvent, text: string) => {
    setTooltip({ x: e.clientX, y: e.clientY, text });
    setTimeout(() => setTooltip(null), 2500);
  };

  const renderTable = (table: Table) => {
    const hasEnemyConflict = tablesWithEnemyConflict.has(table.id);
    const size = 280;
    const cx = size / 2;
    const cy = size / 2;
    const tableRadius = 85;
    const seatRadius = 32;
    const seatDistance = 115;

    return (
      <div
        key={table.id}
        style={{
          position: 'relative',
          width: size,
          height: size,
          padding: 20
        }}
        data-table-id={table.id}
      >
        <div
          className={hasEnemyConflict ? 'pulse-red-anim' : ''}
          style={{
            position: 'absolute',
            left: cx - tableRadius,
            top: cy - tableRadius,
            width: tableRadius * 2,
            height: tableRadius * 2,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FDF2F8, #F5F3FF)',
            border: hasEnemyConflict ? '3px solid #EF4444' : '2px solid #C4B5FD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: hasEnemyConflict
              ? '0 0 20px rgba(239, 68, 68, 0.3)'
              : '0 4px 20px rgba(139, 92, 246, 0.15)'
          }}
        >
          <span style={{
            fontSize: 28,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #DB2777, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {table.number}
          </span>
        </div>

        {table.seats.map((guestId, seatIdx) => {
          const angle = (seatIdx / table.seats.length) * Math.PI * 2 - Math.PI / 2;
          const sx = cx + Math.cos(angle) * seatDistance;
          const sy = cy + Math.sin(angle) * seatDistance;
          const guest = guestId ? guestMap.get(guestId) : null;
          const isBouncing = bouncingSeat?.tableId === table.id && bouncingSeat?.seat === seatIdx;
          const isHovered = hoveredSeat?.tableId === table.id && hoveredSeat?.seat === seatIdx;
          const isDraggingSource = draggingFrom?.tableId === table.id && draggingFrom?.seat === seatIdx;

          return (
            <div
              key={seatIdx}
              onDragOver={handleDragOver}
              onDragEnter={() => setHoveredSeat({ tableId: table.id, seat: seatIdx })}
              onDragLeave={() => setHoveredSeat(null)}
              onDrop={e => handleDropOnSeat(e, table.id, seatIdx)}
              style={{
                position: 'absolute',
                left: sx - seatRadius,
                top: sy - seatRadius,
                width: seatRadius * 2,
                height: seatRadius * 2,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: guestId ? 'grab' : 'pointer',
                opacity: isDraggingSource ? 0.4 : 1,
                transform: isHovered && !guestId ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.15s'
              }}
              className={isBouncing ? 'bounce-scale-anim' : ''}
            >
              {guest ? (
                <div
                  draggable
                  onDragStart={e => handleSeatDragStart(e, table.id, seatIdx)}
                  onDoubleClick={() => onUnseatGuest(table.id, seatIdx)}
                  title="双击移回宾客池"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #DB2777, #8B5CF6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 600,
                    textAlign: 'center',
                    padding: 4,
                    boxShadow: '0 2px 8px rgba(219, 39, 119, 0.4)',
                    userSelect: 'none',
                    lineHeight: 1.2
                  }}
                >
                  {guest.name}
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: `2px dashed ${isHovered ? '#8B5CF6' : '#D1D5DB'}`,
                    background: isHovered ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                    transition: 'all 0.15s'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      id="table-canvas"
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'auto',
        padding: 40,
        background: '#F9FAFB'
      }}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5
        }}
      >
        {coupleConflicts.map(conflict => {
          const guest1Id = conflict.guestIds[0];
          const guest2Id = conflict.guestIds[1];
          let p1: { x: number; y: number } | null = null;
          let p2: { x: number; y: number } | null = null;

          const table1Pos = getGuestSeatPosition(conflict.tableIds[0], guest1Id) ||
                            getGuestSeatPosition(conflict.tableIds[0], guest2Id);
          const table2Pos = getGuestSeatPosition(conflict.tableIds[1], guest1Id) ||
                            getGuestSeatPosition(conflict.tableIds[1], guest2Id);

          if (table1Pos && table2Pos) {
            const t1 = tables.findIndex(t => t.id === table1Pos.table.id);
            const t2 = tables.findIndex(t => t.id === table2Pos.table.id);
            const cols = 2;
            const tableW = 320;
            const tableH = 320;
            const paddingX = 60;
            const paddingY = 40;

            const cx1 = paddingX + (t1 % cols) * tableW + 140;
            const cy1 = paddingY + Math.floor(t1 / cols) * tableH + 140;
            const cx2 = paddingX + (t2 % cols) * tableW + 140;
            const cy2 = paddingY + Math.floor(t2 / cols) * tableH + 140;

            const a1 = (table1Pos.seat / 8) * Math.PI * 2 - Math.PI / 2;
            const a2 = (table2Pos.seat / 8) * Math.PI * 2 - Math.PI / 2;

            p1 = { x: cx1 + Math.cos(a1) * 115, y: cy1 + Math.sin(a1) * 115 };
            p2 = { x: cx2 + Math.cos(a2) * 115, y: cy2 + Math.sin(a2) * 115 };
          }

          if (!p1 || !p2) return null;

          return (
            <g key={conflict.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }}
               onClick={(e: unknown) => handleLineClick(e as React.MouseEvent, conflict.message)}>
              <line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="#EC4899"
                strokeWidth={2}
                strokeDasharray="6,4"
              />
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y - 40,
          background: '#1F2937',
          color: 'white',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 12,
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          {tooltip.text}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
        maxWidth: 800,
        margin: '0 auto'
      }}>
        {tables.map(table => renderTable(table))}
      </div>

      <div style={{
        marginTop: 30,
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 12
      }}>
        <p>提示：从左侧拖拽宾客卡片到圆桌席位；双击席位上的宾客可移回宾客池</p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #table-canvas {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TableCanvas;
