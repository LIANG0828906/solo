import { memo, useRef, useCallback, useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, X, Plus } from 'lucide-react';
import type { Idea, User, VoteType } from '../../../shared/types';

const CARD_WIDTH = 280;
const CARD_HEIGHT = 200;
const GRID_SIZE = 290;

interface BoardProps {
  ideas: Idea[];
  currentUser: User | null;
  isLocked: boolean;
  onVote: (ideaId: string, voteType: VoteType) => void;
  onDelete: (ideaId: string) => void;
  onDragUpdate: (ideaId: string, position: { x: number; y: number }) => void;
  onAddClick: () => void;
  animatingVotes: Set<string>;
  formatTime: (seconds: number) => string;
}

interface IdeaCardProps {
  idea: Idea;
  currentUser: User | null;
  isLocked: boolean;
  onVote: (ideaId: string, voteType: VoteType) => void;
  onDelete: (ideaId: string) => void;
  onDragUpdate: (ideaId: string, position: { x: number; y: number }) => void;
  allIdeas: Idea[];
  animatingVotes: Set<string>;
  rankClass: string;
}

const IdeaCard = memo(function IdeaCard({
  idea,
  currentUser,
  isLocked,
  onVote,
  onDelete,
  onDragUpdate,
  allIdeas,
  animatingVotes,
  rankClass,
}: IdeaCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPos, setLocalPos] = useState(idea.position);
  const dragStart = useRef<{
    mouseX: number;
    mouseY: number;
    cardX: number;
    cardY: number;
  } | null>(null);
  const rafId = useRef<number | null>(null);
  const lastBroadcast = useRef<number>(0);

  useEffect(() => {
    if (!isDragging) {
      setLocalPos(idea.position);
    }
  }, [idea.position, isDragging]);

  const checkCollision = useCallback(
    (pos: { x: number; y: number }) => {
      let newPos = { ...pos };
      let hasCollision = true;
      let attempts = 0;

      while (hasCollision && attempts < 30) {
        hasCollision = false;
        for (const other of allIdeas) {
          if (other.id === idea.id) continue;
          const dx = Math.abs(newPos.x - other.position.x);
          const dy = Math.abs(newPos.y - other.position.y);
          if (dx < CARD_WIDTH + 10 && dy < CARD_HEIGHT + 10) {
            hasCollision = true;
            const overlapX = CARD_WIDTH + 10 - dx;
            const overlapY = CARD_HEIGHT + 10 - dy;
            if (overlapX < overlapY) {
              newPos.x += newPos.x >= other.position.x ? overlapX : -overlapX;
            } else {
              newPos.y += newPos.y >= other.position.y ? overlapY : -overlapY;
            }
            break;
          }
        }
        attempts++;
      }
      return newPos;
    },
    [allIdeas, idea.id]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isLocked) return;
      const target = e.target as HTMLElement;
      if (target.closest('.vote-btn') || target.closest('.idea-delete-btn')) return;

      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        cardX: localPos.x,
        cardY: localPos.y,
      };
    },
    [isLocked, localPos]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart.current) return;

      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        if (!dragStart.current) return;
        const dx = e.clientX - dragStart.current.mouseX;
        const dy = e.clientY - dragStart.current.mouseY;

        let newX = dragStart.current.cardX + dx;
        let newY = dragStart.current.cardY + dy;

        newX = Math.max(0, newX);
        newY = Math.max(0, newY);

        const safePos = checkCollision({ x: newX, y: newY });
        setLocalPos(safePos);

        const now = Date.now();
        if (now - lastBroadcast.current > 16) {
          lastBroadcast.current = now;
          onDragUpdate(idea.id, safePos);
        }
      });
    };

    const handleMouseUp = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      dragStart.current = null;
      setIsDragging(false);
      onDragUpdate(idea.id, localPos);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isDragging, checkCollision, idea.id, localPos, onDragUpdate]);

  const handleVote = (type: 'up' | 'down') => {
    if (isLocked || !currentUser) return;
    const currentVote = idea.votes[currentUser.id] || null;
    const newVote: VoteType = currentVote === type ? null : type;
    onVote(idea.id, newVote);
  };

  const myVote = currentUser ? idea.votes[currentUser.id] || null : null;

  return (
    <div
      ref={cardRef}
      className={`idea-card ${isDragging ? 'dragging' : ''} ${rankClass}`}
      style={{
        transform: `translate(${localPos.x}px, ${localPos.y}px)`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="idea-card-header">
        <span className="idea-author">{idea.author}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="idea-time">{idea.createdAt}</span>
          {currentUser?.id === idea.authorId && !isLocked && (
            <button
              className="idea-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(idea.id);
              }}
              title="删除"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="idea-content">{idea.content}</div>
      <div className="idea-footer">
        <button
          className={`vote-btn up ${myVote === 'up' ? 'active' : ''} ${
            animatingVotes.has(`${idea.id}-up`) ? 'animate' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleVote('up');
          }}
          disabled={isLocked || !currentUser}
        >
          <ThumbsUp size={14} />
          {idea.upvotes}
        </button>
        <button
          className={`vote-btn down ${myVote === 'down' ? 'active' : ''} ${
            animatingVotes.has(`${idea.id}-down`) ? 'animate' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleVote('down');
          }}
          disabled={isLocked || !currentUser}
        >
          <ThumbsDown size={14} />
          {idea.downvotes}
        </button>
      </div>
    </div>
  );
});

function Board({
  ideas,
  currentUser,
  isLocked,
  onVote,
  onDelete,
  onDragUpdate,
  onAddClick,
  animatingVotes,
}: BoardProps) {
  const sortedIdeas = [...ideas].sort(
    (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
  );
  const rankMap = new Map<string, number>();
  sortedIdeas.forEach((idea, idx) => rankMap.set(idea.id, idx));

  const getRankClass = (ideaId: string) => {
    const rank = rankMap.get(ideaId);
    if (rank === 0) return 'gold';
    if (rank === 1) return 'silver';
    if (rank === 2) return 'bronze';
    return '';
  };

  return (
    <div className="board-container">
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          currentUser={currentUser}
          isLocked={isLocked}
          onVote={onVote}
          onDelete={onDelete}
          onDragUpdate={onDragUpdate}
          allIdeas={ideas}
          animatingVotes={animatingVotes}
          rankClass={getRankClass(idea.id)}
        />
      ))}
      <button
        className="add-idea-btn"
        onClick={onAddClick}
        disabled={isLocked || !currentUser}
        title={isLocked ? '白板已锁定' : '添加想法'}
      >
        <Plus size={28} />
      </button>
    </div>
  );
}

export default memo(Board);
