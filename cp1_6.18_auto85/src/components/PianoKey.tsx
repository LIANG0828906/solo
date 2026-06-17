import { useGameStore, type FlashColor } from '../store/gameStore';

interface PianoKeyProps {
  note: string;
  isBlack: boolean;
  left?: number;
}

const durationMap: Record<number, string> = {
  1: '1n',
  2: '2n',
  4: '4n',
  8: '8n',
  16: '16n',
};

export function PianoKey({ note, isBlack, left }: PianoKeyProps) {
  const pressedKeys = useGameStore((s) => s.pressedKeys);
  const flashKeys = useGameStore((s) => s.flashKeys);
  const pressKey = useGameStore((s) => s.pressKey);
  const releaseKey = useGameStore((s) => s.releaseKey);
  const recordNote = useGameStore((s) => s.recordNote);
  const currentScore = useGameStore((s) => s.currentScore);

  const isPressed = pressedKeys.includes(note);
  const flashColor: FlashColor | undefined = flashKeys[note];

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    pressKey(note);
    if (currentScore.length > 0) {
      recordNote(note);
    }
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    releaseKey(note);
  };

  const handleMouseLeave = () => {
    if (isPressed) releaseKey(note);
  };

  let bgClass = isBlack
    ? isPressed
      ? 'bg-blackKeyPressed'
      : 'bg-blackKey'
    : isPressed
    ? 'bg-whiteKeyPressed'
    : 'bg-whiteKey';

  let flashStyle: React.CSSProperties = {};
  if (flashColor === 'green') {
    flashStyle = {
      backgroundColor: 'rgba(107, 203, 119, 0.7) !important',
      boxShadow: '0 0 20px rgba(107, 203, 119, 0.9), inset 0 0 10px rgba(107,203,119,0.3)',
      animation: 'flash-green 0.3s ease',
    };
  } else if (flashColor === 'red') {
    flashStyle = {
      backgroundColor: 'rgba(255, 107, 107, 0.7) !important',
      boxShadow: '0 0 20px rgba(255, 107, 107, 0.9), inset 0 0 10px rgba(255,107,107,0.3)',
      animation: 'flash-red 0.3s ease',
    };
  }

  if (isBlack) {
    return (
      <div
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className={`absolute cursor-pointer select-none rounded-b-md transition-all duration-100 ease-out
          ${bgClass}
          hover:shadow-key-glow-hover shadow-key-glow
          border border-gray-700/40 z-10`}
        style={{
          width: '36px',
          height: '120px',
          left: `${left}px`,
          top: 0,
          ...flashStyle,
        }}
        role="button"
        aria-label={`key ${note}`}
      >
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-300 font-medium pointer-events-none">
          {note.replace(/\d/, '')}
        </span>
      </div>
    );
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      className={`relative cursor-pointer select-none rounded-b-md transition-all duration-100 ease-out
        ${bgClass}
        hover:shadow-key-glow-hover shadow-key-glow
        border border-gray-300/50 flex-shrink-0`}
      style={{
        width: '60px',
        height: '200px',
        ...flashStyle,
      }}
      role="button"
      aria-label={`key ${note}`}
    >
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-600 font-medium pointer-events-none">
        {note}
      </span>
    </div>
  );
}
