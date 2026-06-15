import { useState, useCallback } from 'react';
import IdeaCard from './IdeaCard';
import type { Idea, GroupType } from '../types';

interface BrainstormBoardProps {
  ideas: Idea[];
  onLike: (ideaId: string) => void;
  onAddComment: (ideaId: string, text: string) => void;
  onUpdateGroup: (ideaId: string, group: GroupType) => void;
  userId: string;
}

const groups: { key: GroupType; title: string }[] = [
  { key: 'pending', title: '待讨论' },
  { key: 'in-progress', title: '进行中' },
  { key: 'completed', title: '已完成' }
];

function BrainstormBoard({ ideas, onLike, onAddComment, onUpdateGroup, userId }: BrainstormBoardProps) {
  const [draggedIdeaId, setDraggedIdeaId] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<GroupType | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, ideaId: string) => {
    setDraggedIdeaId(ideaId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIdeaId(null);
    setDragOverGroup(null);
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
    if (draggedIdeaId) {
      onUpdateGroup(draggedIdeaId, group);
    }
    setDraggedIdeaId(null);
    setDragOverGroup(null);
  }, [draggedIdeaId, onUpdateGroup]);

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
                isDragging={draggedIdeaId === idea.id}
                userId={userId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default BrainstormBoard;
