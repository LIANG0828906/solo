import { memo } from 'react';
import type { AnnotationItem } from '@/types';
import styles from './AnnotationOverlay.module.css';

interface AnnotationOverlayProps {
  content: string;
  annotations: AnnotationItem[];
}

function AnnotationOverlay({ content, annotations }: AnnotationOverlayProps) {
  const sortedAnnotations = [...annotations].sort((a, b) => a.startOffset - b.startOffset);

  const renderContent = () => {
    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    sortedAnnotations.forEach((annotation, index) => {
      if (annotation.startOffset > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {content.slice(lastIndex, annotation.startOffset)}
          </span>,
        );
      }

      const typeCapitalized = annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1);
      const highlightClass = `${styles.highlight} ${styles['highlight' + typeCapitalized]}`;
      const iconClass = `${styles.annotationIcon} ${styles['icon' + typeCapitalized]}`;

      parts.push(
        <span key={`ann-${annotation.id}`} className={highlightClass}>
          {content.slice(annotation.startOffset, annotation.endOffset)}
          <span className={iconClass}>
            {annotation.type === 'suggestion' && '✓'}
            {annotation.type === 'question' && '?'}
            {annotation.type === 'error' && '!'}
          </span>
          {annotation.replies.length > 0 && (
            <span className={styles.replyBadge}>{annotation.replies.length}</span>
          )}
        </span>,
      );

      lastIndex = annotation.endOffset;
    });

    if (lastIndex < content.length) {
      parts.push(
        <span key="text-end">{content.slice(lastIndex)}</span>,
      );
    }

    return parts;
  };

  return <div className={styles.overlay}>{renderContent()}</div>;
}

export default memo(AnnotationOverlay);
