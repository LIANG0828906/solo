import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Table, Seat, Person, useStore, isTableOverCapacity } from '../store';
import PersonCard from './PersonCard';

interface TableCardProps {
  table: Table;
  people: Person[];
  isDragging?: boolean;
  onTableDragStart?: (e: React.MouseEvent, tableId: string) => void;
  onTableDragEnd?: () => void;
  onSeatDrop?: (tableId: string, seatId: string) => void;
  onPersonRemove?: (tableId: string, seatId: string) => void;
}

const TABLE_SIZE = 140;
const SEAT_RADIUS = 95;
const SEAT_SIZE = 36;

export const TableCard: React.FC<TableCardProps> = ({
  table,
  people,
  isDragging = false,
  onTableDragStart,
  onTableDragEnd,
  onSeatDrop,
  onPersonRemove,
}) => {
  const updateTableName = useStore((state) => state.updateTableName);
  const hoveredSeatId = useStore((state) => state.hoveredSeatId);
  const setHoveredSeatId = useStore((state) => state.setHoveredSeatId);
  const draggingPersonId = useStore((state) => state.draggingPersonId);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(table.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const overCapacity = isTableOverCapacity(table);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const getPersonById = useCallback(
    (id: string | null): Person | undefined => {
      if (!id) return undefined;
      return people.find((p) => p.id === id);
    },
    [people]
  );

  const handleNameDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingName(true);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (editName.trim() && editName !== table.name) {
      updateTableName(table.id, editName.trim());
    } else {
      setEditName(table.name);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setEditName(table.name);
      setIsEditingName(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.seat-element') || target.closest('input')) return;
    e.preventDefault();
    onTableDragStart?.(e, table.id);
  };

  const handleMouseUp = () => {
    onTableDragEnd?.();
  };

  const handleSeatMouseEnter = (seatId: string) => {
    if (draggingPersonId) {
      setHoveredSeatId(seatId);
    }
  };

  const handleSeatMouseLeave = (seatId: string) => {
    if (hoveredSeatId === seatId) {
      setHoveredSeatId(null);
    }
  };

  const handleSeatMouseUp = (e: React.MouseEvent, seatId: string) => {
    e.stopPropagation();
    if (draggingPersonId) {
      onSeatDrop?.(table.id, seatId);
      setHoveredSeatId(null);
    }
  };

  const handlePersonDoubleClick = (e: React.MouseEvent, seatId: string) => {
    e.stopPropagation();
    onPersonRemove?.(table.id, seatId);
  };

  const renderSeat = (seat: Seat, index: number) => {
    const angle = seat.angle;
    const seatX = Math.cos(angle) * SEAT_RADIUS;
    const seatY = Math.sin(angle) * SEAT_RADIUS;
    const person = getPersonById(seat.personId);
    const isHovered = hoveredSeatId === seat.id;
    const hasPerson = !!person;

    return (
      <div
        key={seat.id}
        className="seat-element"
        onMouseEnter={() => handleSeatMouseEnter(seat.id)}
        onMouseLeave={() => handleSeatMouseLeave(seat.id)}
        onMouseUp={(e) => handleSeatMouseUp(e, seat.id)}
        onDoubleClick={(e) => hasPerson && handlePersonDoubleClick(e, seat.id)}
        style={{
          position: 'absolute',
          left: `calc(50% + ${seatX}px - ${SEAT_SIZE / 2}px)`,
          top: `calc(50% + ${seatY}px - ${SEAT_SIZE / 2}px)`,
          width: SEAT_SIZE,
          height: SEAT_SIZE,
          borderRadius: '50%',
          backgroundColor: hasPerson ? 'transparent' : 'rgba(255,255,255,0.5)',
          border: isHovered
            ? '2px solid #8ecae6'
            : hasPerson
            ? '2px solid transparent'
            : '2px dashed rgba(0,0,0,0.15)',
          boxShadow: isHovered ? '0 0 12px rgba(142,202,230,0.8)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: hasPerson ? 'pointer' : draggingPersonId ? 'copy' : 'default',
          transition: 'all 0.2s ease',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {person && (
          <div
            style={{
              width: SEAT_SIZE - 4,
              height: SEAT_SIZE - 4,
              borderRadius: '50%',
              backgroundColor: person.avatar,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 500,
              color: '#555',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              animation: hasPerson ? 'flyIn 0.3s ease-out' : 'none',
            }}
            title={person.name}
          >
            {person.name.charAt(0)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: table.x,
        top: table.y,
        width: TABLE_SIZE + SEAT_SIZE * 2 + 20,
        height: TABLE_SIZE + SEAT_SIZE * 2 + 20,
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.7 : 1,
        transition: isDragging ? 'none' : 'opacity 0.2s',
        zIndex: isDragging ? 100 : 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: TABLE_SIZE,
          height: TABLE_SIZE,
          borderRadius: table.shape === 'round' ? '50%' : '16px',
          backgroundColor: '#8ecae6',
          boxShadow: overCapacity
            ? '0 0 0 3px #ef4444, 0 4px 20px rgba(0,0,0,0.15)'
            : '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: overCapacity ? 'pulse-red 1.2s ease-in-out infinite' : 'none',
          transition: 'box-shadow 0.3s',
        }}
      >
        {isEditingName ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#2d5a7b',
              textAlign: 'center',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: 6,
              padding: '4px 8px',
              outline: 'none',
              width: 100,
            }}
          />
        ) : (
          <div
            onDoubleClick={handleNameDoubleClick}
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#2d5a7b',
              textAlign: 'center',
              cursor: 'text',
              padding: '4px 8px',
              userSelect: 'none',
            }}
          >
            {table.name}
          </div>
        )}
        <div style={{ fontSize: 12, color: '#5a8aab', marginTop: 4 }}>
          {table.seats.filter((s) => s.personId).length} / {table.capacity}
        </div>
      </div>

      {table.seats.map(renderSeat)}

      {isDragging && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: TABLE_SIZE,
            height: TABLE_SIZE,
            borderRadius: table.shape === 'round' ? '50%' : '16px',
            backgroundColor: 'rgba(142,202,230,0.3)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            filter: 'blur(2px)',
          }}
        />
      )}
    </div>
  );
};

export default TableCard;
