import React from 'react';
import IdeaCard from './IdeaCard';
import { Idea } from '../utils/api';

interface IdeaBoardProps {
  ideas: Idea[];
  nickname: string;
  onVote: (id: string) => void;
  onComment: (id: string, content: string) => void;
  votedIdeas: Set<string>;
}

export default function IdeaBoard({ ideas, nickname, onVote, onComment, votedIdeas }: IdeaBoardProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 260px)',
      gap: 16,
      justifyContent: 'center',
    }}>
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          nickname={nickname}
          onVote={onVote}
          onComment={onComment}
          votedIdeas={votedIdeas}
        />
      ))}
    </div>
  );
}
