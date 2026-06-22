import React, { useEffect, useRef, useState } from 'react';
import type { Idea } from '../../types';
import { IdeaCard } from './IdeaCard';

interface IdeaListProps {
  ideas: Idea[];
}

export const IdeaList: React.FC<IdeaListProps> = ({ ideas }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(4);

  useEffect(() => {
    const updateColumnCount = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const gap = 12;
        const cardWidth = 300;
        const columns = Math.max(1, Math.floor((width + gap) / (cardWidth + gap)));
        setColumnCount(columns);
      }
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  const scrollToIdea = (id: string) => {
    const element = document.getElementById(`idea-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (ideas.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px',
          color: '#5A6B7C'
        }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ marginBottom: '20px', opacity: 0.5 }}
        >
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p style={{ fontSize: '16px', margin: 0 }}>暂无灵感点子，快来创建第一个吧！</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        columnCount: columnCount,
        columnGap: '12px',
        width: '100%'
      }}
    >
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          onScrollToMe={() => scrollToIdea(idea.id)}
        />
      ))}
    </div>
  );
};
