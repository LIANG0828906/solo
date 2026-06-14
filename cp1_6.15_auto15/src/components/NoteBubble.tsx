import React from 'react';
import './NoteBubble.css';

interface NoteBubbleProps {
  note: string;
  delay?: number;
}

const NoteBubble: React.FC<NoteBubbleProps> = ({ note, delay = 0 }) => {
  return (
    <div 
      className="note-bubble animate-slide-in-left animate-shake"
      style={{ animationDelay: `${delay}ms, ${delay + 400}ms` }}
    >
      <div className="note-arrow" />
      <p className="note-text handwriting">{note}</p>
    </div>
  );
};

export default React.memo(NoteBubble);
