import { useState, useCallback, useRef } from 'react';
import IdeaCard from './IdeaCard';
import type { Idea, GroupType } from '../types';

interface BrainstormBoardProps {
  ideas: Idea[];
  onLike: (ideaId: string) => void;
  onAddComment: (ideaId: string, text: string) => void;
  onUpdateGroup: (ideaId: string, group: GroupType) => void;
  userId: string;
  setIdeas: React.Dispatch<React.SetStateAction<Idea[]>>;
  newestIdeaId?: string | null;
  newIdeaStartPosition?: { x: number; y: number } | null;
}

const groups: { key: GroupType; title: string }[] = [
  { key: 'pending', title: '待讨论' },
  { key: 'in-progress', title: '进行中' },
  { key: 'completed', title: '已完成' }
];

function BrainstormBoard({ ideas, onLike, onAddComment, onUpdateGroup, userId, setIdeas, newestIdeaId, newIdeaStartPosition }: BrainstormBoardProps) {
  const [draggedIdeaId, setDraggedIdeaId] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<GroupType | null>(null);
  const [longPressIdeaId, setLongPressIdeaId] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, ideaId: string) => {
    e.preventDefault();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ideaId);
    setDraggedIdeaId(ideaId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIdeaId(null);
    setDragOverGroup(null);
    setLongPressIdeaId(null);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, group: GroupType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverGroup(group);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverGroup(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, group: GroupType) => {
    e.preventDefault();
    const ideaId = e.dataTransfer.getData('text/plain') || draggedIdeaId;
    
    if (ideaId) {
      setIdeas(prev => prev.map(idea => {
        if (idea.id === ideaId) {
          return { ...idea, group };
        }
        return idea;
      }));
      
      onUpdateGroup(ideaId, group);
    }
    
    setDraggedIdeaId(null);
    setDragOverGroup(null);
    setLongPressIdeaId(null);
  }, [draggedIdeaId, onUpdateGroup, setIdeas]);

  const handleLongPressStart = useCallback((ideaId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setLongPressIdeaId(ideaId);
    }, 300);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setLongPressIdeaId(null);
  }, []);

  const getIdeasByGroup = (group: GroupType) => {
    return ideas.filter(idea => idea.group === group);
  };

  return (
    <div className="board-columns">
      {groups.map(group => (
        <div
          key={group.key}
          className={`board-column ${dragOverGroup === group.key ? 'drag-over' : ''}`}
          onDragOver={(e) => handleDragOver(e, group.key)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, group.key)}
        >
          <div className="column-header">
            <div className="column-title">
              {group.title}
              <span className="column-count">
                {getIdeasByGroup(group.key).length}
              </span>
            </div>
            <div className={`column-gradient ${group.key}`}></div>
          </div>
          
          <div className="column-cards">
            {getIdeasByGroup(group.key).map(idea => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onLike={onLike}
                onAddComment={onAddComment}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onLongPressStart={handleLongPressStart}
                onLongPressEnd={handleLongPressEnd}
                isDragging={draggedIdeaId === idea.id}
                isLongPressing={longPressIdeaId === idea.id}
                userId={userId}
                isNew={newestIdeaId === idea.id}
                startPosition={newestIdeaId === idea.id ? newIdeaStartPosition || undefined : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default BrainstormBoard;
