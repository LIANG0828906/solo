import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
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

export const NoteCard: React.FC<NoteCardProps> = memo(({
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
  const [voteButtonAnimating, setVoteButtonAnimating] = useState(false);
  const [voteKey, setVoteKey] = useState(0);
  const [animationState, setAnimationState] = useState<'visible' | 'fading-out' | 'hidden' | 'fading-in'>(
    isFiltered ? 'hidden' : 'visible'
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevVoteCount = useRef<number>(note.votes.length);
  const hasVoted = note.votes.includes(currentUserId);
  const [isAppear, setIsAppear] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAppear(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isFiltered) {
      if (animationState === 'visible') {
        setAnimationState('fading-out');
      } else if (animationState === 'fading-in') {
        setAnimationState('fading-out');
      }
    } else {
      if (animationState === 'hidden') {
        setAnimationState('fading-in');
      } else if (animationState === 'fading-out') {
        setAnimationState('fading-in');
      }
    }
  }, [isFiltered, animationState]);

  useEffect(() => {
    if (note.votes.length !== prevVoteCount.current) {
      setVoteKey(prev => prev + 1);
      prevVoteCount.current = note.votes.length;
    }
  }, [note.votes.length]);

  const handleAnimationEnd = useCallback((e: React.AnimationEvent) => {
    if (e.animationName === 'fadeOut') {
      if (animationState === 'fading-out') {
        setAnimationState('hidden');
      }
    } else if (e.animationName === 'fadeIn') {
      if (animationState === 'fading-in') {
        setAnimationState('visible');
      }
    }
  }, [animationState]);

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
    setVoteButtonAnimating(true);
    setTimeout(() => setVoteAnimating(false), 450);
    setTimeout(() => setVoteButtonAnimating(false), 650);
  }, [note.id, onVote]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这张便签吗？')) {
      onDelete(note.id);
    }
  }, [note.id, onDelete]);

  const bgColor = NOTE_COLORS[note.color];
  const borderColor = NOTE_BORDER_COLORS[note.color];

  const targetX = isMindmapMode ? note.x : position.x;
  const targetY = isMindmapMode ? note.y : position.y;

  const transformStyle = `translate(${targetX}px, ${targetY}px) scale(${1 / scale})`;

  const filterClasses = (() => {
    switch (animationState) {
      case 'fading-out':
      case 'hidden':
        return 'note-filter-out';
      case 'fading-in':
      case 'visible':
        return 'note-filter-in';
      default:
        return 'note-filter-in';
    }
  })();

  return (
    <div
      className={`note-card absolute w-52 rounded-xl shadow-lg cursor-grab select-none group ${
        isDragging ? 'dragging' : ''
      } ${filterClasses} ${isAppear ? 'note-appear' : ''}`}
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        transform: transformStyle,
        transition: isDragging
          ? 'none'
          : 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
        zIndex: isDragging ? 1000 : note.votes.length + 10,
        transformOrigin: 'center center',
      }}
      onMouseDown={!isEditing ? handleMouseDown : undefined}
      onDoubleClick={!isEditing ? handleDoubleClick : undefined}
      onTouchStart={!isEditing ? handleMouseDown : undefined}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="note-inner p-3 relative">
        <div
          className="note-color-bar absolute top-0 left-4 right-4 h-1 rounded-b-lg -mt-px"
          style={{ backgroundColor: borderColor }}
        />

        <div className="flex justify-between items-start mb-2 pt-1">
          <div className="flex-1 pr-2 min-w-0">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-24 p-2 rounded-lg border-2 border-gray-300 bg-white/90 text-sm text-gray-800 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                style={{ fontFamily: 'inherit' }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm text-gray-800 leading-relaxed min-h-[60px] whitespace-pre-wrap break-words">
                {note.content || <span className="text-gray-400 italic">双击编辑...</span>}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 relative">
            <UserAvatar
              user={{
                id: note.authorId,
                name: note.authorName,
                avatar: note.authorAvatar,
                color: borderColor,
              }}
              size="sm"
              showTooltip={true}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
          <div className="flex items-center gap-1">
            <button
              onClick={handleVoteClick}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
                hasVoted
                  ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
                  : 'bg-white/60 text-gray-600 hover:bg-white hover:shadow-sm'
              } ${voteButtonAnimating ? 'vote-pulse' : ''}`}
            >
              <ThumbsUp
                size={14}
                className={`${hasVoted ? 'fill-current' : ''} transition-transform duration-200 ${
                  voteAnimating ? 'scale-125' : ''
                }`}
              />
              <span
                key={voteKey}
                className={`text-sm font-bold min-w-[20px] text-center inline-block ${
                  voteAnimating ? 'vote-bounce' : ''
                }`}
              >
                {note.votes.length}
              </span>
            </button>
          </div>

          {isEditing ? (
            <div className="flex gap-1 edit-buttons">
              <button
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 shadow-sm transition-all"
              >
                <Check size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                className="p-1.5 rounded-lg bg-gray-400 text-white hover:bg-gray-500 shadow-sm transition-all"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="p-1.5 rounded-lg bg-white/60 text-gray-600 hover:bg-white hover:shadow-sm transition-all"
                title="编辑"
              >
                <Pencil size={14} />
              </button>
              {note.authorId === currentUserId && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg bg-white/60 text-gray-600 hover:bg-red-500 hover:text-white hover:shadow-sm transition-all"
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

NoteCard.displayName = 'NoteCard';
