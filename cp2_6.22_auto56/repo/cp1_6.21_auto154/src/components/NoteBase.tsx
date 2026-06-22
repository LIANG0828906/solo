import React, { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { Note } from '../types';

interface NoteBaseProps {
  note: Note;
  isDragging: boolean;
  isConnecting: boolean;
  isConnectionSource: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onDoubleClick: () => void;
  onConnectionStart: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

const NoteBase: React.FC<NoteBaseProps> = memo(
  ({
    note,
    isDragging,
    isConnecting,
    isConnectionSource,
    onMouseDown,
    onDelete,
    onDoubleClick,
    onConnectionStart,
    children,
  }) => {
    const borderColor = note.syncError ? '#EF4444' : '#EAB308';

    return (
      <div
        data-note-id={note.id}
        style={{
          position: 'absolute',
          left: note.x,
          top: note.y,
          minWidth: '200px',
          maxWidth: '400px',
          width: note.width,
          backgroundColor: '#FEF3C7',
          borderRadius: '12px',
          border: `2px dashed ${borderColor}`,
          padding: '16px',
          cursor: isConnecting ? 'crosshair' : 'grab',
          opacity: isDragging ? 0.7 : 1,
          transition: isDragging
            ? 'none'
            : 'opacity 0.2s ease, box-shadow 0.2s ease',
          boxShadow: isDragging
            ? '0 8px 24px rgba(0, 0, 0, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: isDragging ? 100 : 10,
          animation: 'noteAppear 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          userSelect: 'none',
        }}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
      >
        {isConnecting && (
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onConnectionStart(e);
            }}
            style={{
              position: 'absolute',
              right: '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: isConnectionSource ? '#3B82F6' : '#FFFFFF',
              border: '2px solid #3B82F6',
              cursor: 'crosshair',
              zIndex: 10,
            }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            display: 'flex',
            gap: '4px',
          }}
          className="note-actions"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div
          onMouseEnter={(e) => {
            const actions = e.currentTarget.parentElement?.querySelector('.note-actions') as HTMLElement;
            if (actions) actions.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            const actions = e.currentTarget.parentElement?.querySelector('.note-actions') as HTMLElement;
            if (actions) actions.style.opacity = '0';
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

NoteBase.displayName = 'NoteBase';

export default NoteBase;
