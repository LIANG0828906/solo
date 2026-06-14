import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ThumbsUp, Pencil, Trash2, X, Check } from 'lucide-react';
import { useDrag } from '../hooks/useDrag';
import { UserAvatar } from './UserAvatar';
import type { Note } from '../utils/types';
import { NOTE_COLORS, NOTE_BORDER_COLORS } from '../utils/types';

interface NoteCardProps {
  note: Note;
  scale: number;
  currentUserId: string;
  isFiltered: boolean;
  onDragStart: (noteId: string) => void;
  onDrag: (noteId: string, x: number, y: number) => void;
  onDragEnd: (noteId: string, x: number, y: number, group?: string) => void;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
  onDelete: (noteId: string) => void;
  onVote: (noteId: string) => void;
  getGroupAtPosition?: (x: number, y: number) => string | undefined;
  isMindmapMode?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  scale,
  currentUserId,
  isFiltered,
  onDragStart,
  onDrag,
  onDragEnd,
  onUpdate,
  onDelete,
  onVote,
  getGroupAtPosition,
  isMindmapMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [voteAnimating, setVoteAnimating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasVoted = note.votes.includes(currentUserId);

  const { isDragging, position, handleMouseDown } = useDrag({
    noteId: note.id,
    initialX: note.x,
    initialY: note.y,
    scale,
    onDragStart,
    onDrag,
    onDragEnd,
    getGroupAtPosition,
  });

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditContent(note.content);
  }, [note.content]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      setIsEditing(true);
    }
  }, [isDragging]);

  const handleSave = useCallback(() => {
    if (editContent.trim() !== note.content) {
      onUpdate(note.id, { content: editContent.trim() });
    }
    setIsEditing(false);
  }, [note.id, note.content, editContent, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditContent(note.content);
    setIsEditing(false);
  }, [note.content]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handleVoteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onVote(note.id);
    setVoteAnimating(true);
    setTimeout(() => setVoteAnimating(false), 300);
  }, [note.id, onVote]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这张便签吗？')) {
      onDelete(note.id);
    }
  }, [note.id, onDelete]);

  const bgColor = NOTE_COLORS[note.color];
  const borderColor = NOTE_BORDER_COLORS[note.color];

  const transformStyle = isMindmapMode
    ? `translate(${note.x}px, ${note.y}px) scale(${1 / scale})`
    : `translate(${position.x}px, ${position.y}px) scale(${1 / scale})`;

  return (
    <div
      className={`note-card absolute w-52 rounded-xl shadow-lg cursor-grab select-none ${
        isDragging ? 'dragging' : ''
      } ${isFiltered ? 'note-filter-out pointer-events-none' : 'note-filter-in'}`}
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        transform: transformStyle,
        transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        zIndex: isDragging ? 1000 : note.votes.length,
        transformOrigin: 'top left',
      }}
      onMouseDown={!isEditing ? handleMouseDown : undefined}
      onDoubleClick={!isEditing ? handleDoubleClick : undefined}
    >
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 pr-2">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-24 p-2 rounded-lg border-2 border-gray-300 bg-white/80 text-sm text-gray-800 resize-none focus:outline-none focus:border-blue-400"
                style={{ fontFamily: 'inherit' }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm text-gray-800 leading-relaxed min-h-[60px] whitespace-pre-wrap">
                {note.content}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <UserAvatar
              user={{
                id: note.authorId,
                name: note.authorName,
                avatar: note.authorAvatar,
                color: '#FFFFFF',
              }}
              size="sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
          <div className="flex items-center gap-1">
            <button
              onClick={handleVoteClick}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 ${
                hasVoted ? 'bg-blue-500 text-white' : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
            >
              <ThumbsUp size={14} className={hasVoted ? 'fill-current' : ''} />
              <span
                className={`text-sm font-semibold min-w-[16px] text-center ${
                  voteAnimating ? 'vote-bounce' : ''
                }`}
              >
                {note.votes.length}
              </span>
            </button>
          </div>

          {isEditing ? (
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600"
              >
                <Check size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                className="p-1.5 rounded-lg bg-gray-400 text-white hover:bg-gray-500"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="p-1.5 rounded-lg bg-white/50 text-gray-600 hover:bg-white/80"
              >
                <Pencil size={14} />
              </button>
              {note.authorId === currentUserId && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg bg-white/50 text-gray-600 hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: borderColor }}
      />
    </div>
  );
};
