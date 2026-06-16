import { useMemo } from 'react';
import type { Capsule } from '@/types';
import { CapsuleCard } from './CapsuleCard';

interface CapsuleTimelineProps {
  capsules: Capsule[];
  onCardClick: (capsule: Capsule) => void;
  onOpenCapsule: (capsule: Capsule) => void;
  emptyTitle: string;
  emptyDesc: string;
  emptyIcon?: string;
  showPrivateMask?: boolean;
  onEmptyAction?: () => void;
  emptyActionText?: string;
}

export function CapsuleTimeline({
  capsules,
  onCardClick,
  onOpenCapsule,
  emptyTitle,
  emptyDesc,
  emptyIcon = '📭',
  showPrivateMask = false,
  onEmptyAction,
  emptyActionText,
}: CapsuleTimelineProps) {
  const sorted = useMemo(() => {
    return [...capsules].sort(
      (a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime()
    );
  }, [capsules]);

  if (sorted.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">{emptyIcon}</div>
        <div className="empty-state-title">{emptyTitle}</div>
        <div className="empty-state-desc">{emptyDesc}</div>
        {onEmptyAction && (
          <button className="btn btn-primary" onClick={onEmptyAction}>
            {emptyActionText || '创建第一个胶囊'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="timeline-grid">
      {sorted.map((capsule, index) => (
        <CapsuleCard
          key={capsule.id}
          capsule={capsule}
          index={index}
          onClick={() => onCardClick(capsule)}
          onOpen={() => onOpenCapsule(capsule)}
          hideContentPreview={showPrivateMask}
        />
      ))}
    </div>
  );
}
