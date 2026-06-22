import React, { useState, memo } from 'react';
import { Note, TextNoteContent } from '../types';
import NoteBase from './NoteBase';

interface TextNoteProps {
  note: Note;
  isDragging: boolean;
  isConnecting: boolean;
  isConnectionSource: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onContentChange: (content: TextNoteContent) => void;
  onConnectionStart: (e: React.MouseEvent) => void;
}

const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, index) => {
    const processed = line.replace(
      /\*\*(.+?)\*\*/g,
      '<strong style="font-weight: bold;">$1</strong>'
    );
    return (
      <React.Fragment key={index}>
        <span dangerouslySetInnerHTML={{ __html: processed }} />
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const TextNote: React.FC<TextNoteProps> = memo(
  ({
    note,
    isDragging,
    isConnecting,
    isConnectionSource,
    onMouseDown,
    onDelete,
    onContentChange,
    onConnectionStart,
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const content = note.content as TextNoteContent;

    const handleDoubleClick = () => {
      setIsEditing(true);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsEditing(false);
      if (e.target.value !== content.text) {
        onContentChange({ text: e.target.value });
      }
    };

    return (
      <NoteBase
        note={note}
        isDragging={isDragging}
        isConnecting={isConnecting}
        isConnectionSource={isConnectionSource}
        onMouseDown={onMouseDown}
        onDelete={onDelete}
        onDoubleClick={handleDoubleClick}
        onConnectionStart={onConnectionStart}
      >
        {isEditing ? (
          <textarea
            autoFocus
            defaultValue={content.text}
            onBlur={handleBlur}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              minHeight: '100px',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              resize: 'vertical',
              fontSize: '14px',
              color: '#1E293B',
              fontFamily: 'inherit',
              lineHeight: '1.5',
              cursor: 'text',
            }}
          />
        ) : (
          <div
            style={{
              fontSize: '14px',
              color: '#1E293B',
              lineHeight: '1.5',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              minHeight: '60px',
            }}
          >
            {renderMarkdown(content.text)}
          </div>
        )}
      </NoteBase>
    );
  }
);

TextNote.displayName = 'TextNote';

export default TextNote;
