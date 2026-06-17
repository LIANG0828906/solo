import { useGameStore } from '../state/gameStore';
import { getCurrentPoem } from '../data/poems';

export const ProgressBar = () => {
  const completedLines = useGameStore((state) => state.completedLines);
  const currentLineIndex = useGameStore((state) => state.currentLineIndex);
  const poem = getCurrentPoem();

  const progress = (completedLines.length / poem.lines.length) * 100;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const elapsedTime = useGameStore((state) => state.elapsedTime);
  const score = useGameStore((state) => state.score);
  const combo = useGameStore((state) => state.combo);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '600px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#E8D4B0',
          fontSize: '14px',
        }}
      >
        <span>第 {currentLineIndex + 1} / {poem.lines.length} 句</span>
        <span>计时: {formatTime(elapsedTime)}</span>
        <span>分数: {score}</span>
        {combo > 0 && (
          <span style={{ color: '#D4A843', fontWeight: 'bold' }}>
            连击 x{combo}
          </span>
        )}
      </div>
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--progress-unfilled)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--gold-primary), var(--gold-secondary))',
            borderRadius: '4px',
            transition: 'width 0.5s ease-out',
          }}
        />
      </div>
    </div>
  );
};
