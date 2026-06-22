import React from 'react';
import { Cursor } from '../types';

interface CollaborativeCursorProps {
  cursor: Cursor;
  containerRef: React.RefObject<HTMLDivElement>;
  rowHeight: number;
}

export const CollaborativeCursor: React.FC<CollaborativeCursorProps> = ({
  cursor,
  containerRef,
  rowHeight
}) => {
  if (!containerRef.current) return null;

  const top = cursor.measure * rowHeight + 10;
  const left = cursor.type === 'chord' ? cursor.position * 130 + 60 : 20;

  return (
    <div
      className="collaborative-cursor"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        height: `${rowHeight - 20}px`
      }}
    >
      <div
        className="collaborative-cursor-line"
        style={{ background: cursor.color }}
      />
      <div
        className="collaborative-cursor-label"
        style={{ background: cursor.color }}
      >
        {cursor.userName}
      </div>
    </div>
  );
};

export default CollaborativeCursor;
