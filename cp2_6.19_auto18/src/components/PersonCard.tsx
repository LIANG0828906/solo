import React, { useRef, useState, useEffect } from 'react';
import { Person, useStore } from '../store';

interface PersonCardProps {
  person: Person;
  size?: 'small' | 'medium' | 'large';
  draggable?: boolean;
  onDragStart?: (e: React.MouseEvent, personId: string) => void;
  onDragEnd?: () => void;
}

const sizeMap = {
  small: { avatar: 28, fontSize: 11 },
  medium: { avatar: 40, fontSize: 13 },
  large: { avatar: 56, fontSize: 14 },
};

export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  size = 'medium',
  draggable = true,
  onDragStart,
  onDragEnd,
}) => {
  const updatePersonName = useStore((state) => state.updatePersonName);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(person.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const dimensions = sizeMap[size];

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editName.trim() && editName !== person.name) {
      updatePersonName(person.id, editName.trim());
    } else {
      setEditName(person.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditName(person.name);
      setIsEditing(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    if (!draggable) return;
    e.preventDefault();
    onDragStart?.(e, person.id);
  };

  return (
    <div
      className="person-card"
      style={{
        width: dimensions.avatar + 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: draggable ? 'grab' : 'default',
        userSelect: 'none',
        flexShrink: 0,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div
        style={{
          width: dimensions.avatar,
          height: dimensions.avatar,
          borderRadius: '50%',
          backgroundColor: person.avatar,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: dimensions.avatar * 0.45,
          fontWeight: 500,
          color: '#555',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          overflow: 'hidden',
        }}
        className="person-avatar"
      >
        {(person.name.trim() || '未命名').charAt(0)}
      </div>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="未命名"
          style={{
            width: dimensions.avatar + 10,
            fontSize: dimensions.fontSize,
            textAlign: 'center',
            border: '1px solid #8ecae6',
            borderRadius: 4,
            padding: '2px 4px',
            outline: 'none',
            backgroundColor: 'white',
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          style={{
            fontSize: dimensions.fontSize,
            color: person.name.trim() ? '#4a4a4a' : '#aaa',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: dimensions.avatar + 12,
            fontStyle: person.name.trim() ? 'normal' : 'italic',
          }}
          title={person.name.trim() || '未命名 - 双击编辑'}
        >
          {person.name.trim() || '未命名'}
        </span>
      )}
    </div>
  );
};

export default PersonCard;
