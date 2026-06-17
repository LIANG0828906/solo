import { useCallback } from 'react';
import { useGameStore } from '../state/gameStore';

export const PoemGrid = () => {
  const placedFragments = useGameStore((state) => state.placedFragments);
  const availableFragments = useGameStore((state) => state.availableFragments);
  const matchedGridIndices = useGameStore((state) => state.matchedGridIndices);
  const removeFragment = useGameStore((state) => state.removeFragment);
  const placeFragment = useGameStore((state) => state.placeFragment);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      const fragmentId = e.dataTransfer.getData('fragmentId');
      if (fragmentId) {
        placeFragment(index, fragmentId);
      }
    },
    [placeFragment]
  );

  const handleClick = useCallback(
    (index: number) => {
      if (placedFragments[index]) {
        removeFragment(index);
      }
    },
    [placedFragments, removeFragment]
  );

  const getFragmentText = (fragmentId: string | null): string => {
    if (!fragmentId) return '';
    const fragment = availableFragments.find((f) => f.id === fragmentId);
    return fragment ? fragment.text : '';
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 'var(--grid-gap)',
      }}
    >
      {placedFragments.map((fragmentId, index) => {
        const isMatched = matchedGridIndices.includes(index);
        const text = getFragmentText(fragmentId);

        return (
          <div
            key={index}
            className="grid-cell"
            data-index={index}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => handleClick(index)}
            style={{
              width: 'var(--grid-width)',
              height: 'var(--grid-height)',
              backgroundColor: isMatched ? 'rgba(212, 168, 67, 0.15)' : 'var(--grid-bg)',
              border: isMatched
                ? '2px solid var(--gold-primary)'
                : '1px dashed var(--grid-border)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: text.length === 1 ? '20px' : '16px',
              fontWeight: fragmentId ? 600 : 400,
              color: fragmentId ? '#333' : 'transparent',
              cursor: fragmentId ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              animation: isMatched ? 'pulse-gold 1s ease-in-out infinite' : undefined,
              boxShadow: isMatched ? '0 0 15px rgba(212, 168, 67, 0.4)' : 'none',
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};
