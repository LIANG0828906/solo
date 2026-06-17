import { memo, useCallback } from 'react';
import { useDrag } from '../hooks/useDrag';
import { useGameStore } from '../state/gameStore';

interface WordFragmentProps {
  fragmentId: string;
}

export const WordFragment = memo(function WordFragment({ fragmentId }: WordFragmentProps) {
  const fragment = useGameStore((state) =>
    state.availableFragments.find((f) => f.id === fragmentId)
  );
  const highlightedFragmentId = useGameStore((state) => state.highlightedFragmentId);
  const placeFragment = useGameStore((state) => state.placeFragment);
  const placedFragments = useGameStore((state) => state.placedFragments);
  const availableFragments = useGameStore((state) => state.availableFragments);

  const isHighlighted = fragment?.id === highlightedFragmentId;
  const isUsed = fragment?.isUsed;

  const handleDragEnd = useCallback(
    (droppedOnGrid: boolean) => {
      if (!droppedOnGrid || !fragment) return;

      setTimeout(() => {
        const elements = document.querySelectorAll('.grid-cell:hover');
        if (elements.length > 0) {
          const gridCell = elements[0] as HTMLElement;
          const index = parseInt(gridCell.getAttribute('data-index') || '-1', 10);
          if (index >= 0) {
            placeFragment(index, fragment.id);
          }
        }
      }, 10);
    },
    [fragment, placeFragment]
  );

  const { elementRef, handleMouseDown } = useDrag({
    fragmentId,
    onDragEnd: handleDragEnd,
  });

  if (!fragment || isUsed) {
    const placedIndex = placedFragments.findIndex((f) => f === fragmentId);
    if (placedIndex === -1) return null;

    const placedFragment = availableFragments.find((f) => f.id === fragmentId);
    if (!placedFragment) return null;

    return null;
  }

  const fragmentWidth =
    fragment.text.length === 1
      ? 'var(--fragment-height)'
      : `calc(var(--fragment-width) + ${(fragment.text.length - 2) * 15}px)`;

  return (
    <div
      ref={elementRef}
      className="word-fragment"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      style={{
        position: 'absolute',
        width: fragmentWidth,
        height: 'var(--fragment-height)',
        backgroundColor: 'var(--fragment-bg)',
        border: '1px solid var(--fragment-border)',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fragment.text.length === 1 ? '18px' : '16px',
        fontWeight: 600,
        color: '#333',
        cursor: 'grab',
        transform: `translate(${fragment.x}px, ${fragment.y}px)`,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        willChange: 'transform',
        animation: isHighlighted ? 'highlight-pulse 1s ease-in-out infinite' : undefined,
        zIndex: isHighlighted ? 500 : 'auto',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `translate(${fragment.x}px, ${fragment.y}px) scale(1.1)`;
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `translate(${fragment.x}px, ${fragment.y}px)`;
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
    >
      {fragment.text}
    </div>
  );
});
