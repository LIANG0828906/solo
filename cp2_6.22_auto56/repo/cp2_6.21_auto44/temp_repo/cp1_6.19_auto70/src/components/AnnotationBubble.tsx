import React from 'react';

interface AnnotationBubbleProps {
  annotation: string;
  onEdit?: () => void;
}

export function AnnotationBubble({ annotation, onEdit }: AnnotationBubbleProps) {
  if (!annotation) return null;

  return (
    <div className="annotation-bubble" onClick={onEdit}>
      <div className="annotation-bubble__icon">✎</div>
      <div className="annotation-bubble__text">{annotation}</div>
    </div>
  );
}
