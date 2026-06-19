import React, { useEffect, useRef } from 'react';

interface ChordSelectorProps {
  position: { x: number; y: number };
  onSelect: (chord: string) => void;
  onClose: () => void;
  recommendedChord?: string;
}

const COMMON_CHORDS = [
  'C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim',
  'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7',
  'Cm', 'Ddim', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb',
  'A', 'B', 'D', 'E'
];

export const ChordSelector: React.FC<ChordSelectorProps> = ({
  position,
  onSelect,
  onClose,
  recommendedChord
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="chord-selector"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      {recommendedChord && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            推荐和弦
          </div>
          <div
            className="chord-selector-item"
            style={{
              background: 'var(--accent-light)',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              fontWeight: '600'
            }}
            onClick={() => onSelect(recommendedChord)}
          >
            ✨ {recommendedChord}
          </div>
        </div>
      )}
      
      <div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          常用和弦
        </div>
        <div className="chord-selector-grid">
          {COMMON_CHORDS.map(chord => (
            <div
              key={chord}
              className="chord-selector-item"
              onClick={() => onSelect(chord)}
            >
              {chord}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChordSelector;
