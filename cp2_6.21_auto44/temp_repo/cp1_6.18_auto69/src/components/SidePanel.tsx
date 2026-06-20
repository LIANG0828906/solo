import { useGameStore } from '../state/gameStore';
import { getCurrentPoem } from '../data/poems';

export const SidePanel = () => {
  const completedLines = useGameStore((state) => state.completedLines);
  const currentLineIndex = useGameStore((state) => state.currentLineIndex);
  const hintsRemaining = useGameStore((state) => state.hintsRemaining);
  const isComplete = useGameStore((state) => state.isComplete);
  const useHint = useGameStore((state) => state.useHint);
  const shuffleFragments = useGameStore((state) => state.shuffleFragments);
  const resetGame = useGameStore((state) => state.resetGame);

  const poem = getCurrentPoem();

  return (
    <div
      style={{
        width: '200px',
        backgroundColor: 'var(--panel-bg)',
        borderRadius: '12px',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: "'Ma Shan Zheng', cursive",
            fontSize: '20px',
            color: 'var(--panel-title)',
            marginBottom: '4px',
            letterSpacing: '2px',
          }}
        >
          {poem.title}
        </h1>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--panel-text-muted)',
          }}
        >
          {poem.author}
        </p>
      </div>

      <div
        style={{
          height: '1px',
          backgroundColor: 'rgba(232, 212, 176, 0.2)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {poem.lines.map((line, index) => {
          const isCompleted = completedLines.includes(line.text);
          const isCurrent = index === currentLineIndex && !isCompleted;

          return (
            <div
              key={line.id}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: isCurrent
                  ? 'rgba(212, 168, 67, 0.15)'
                  : 'transparent',
                border: isCurrent ? '1px solid var(--gold-primary)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <p
                style={{
                  fontSize: '15px',
                  color: isCompleted
                    ? 'var(--panel-title)'
                    : isCurrent
                    ? 'var(--gold-secondary)'
                    : 'var(--panel-text-muted)',
                  opacity: isCompleted ? 1 : isCurrent ? 0.9 : 0.4,
                  fontFamily: "'ZCOOL XiaoWei', serif",
                  letterSpacing: '1px',
                }}
              >
                {isCompleted ? line.text : '○ ○ ○ ○ ○'}
              </p>
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(212, 168, 67, 0.2)',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: 'var(--gold-primary)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            恭喜完成！
          </p>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <button
          onClick={useHint}
          disabled={hintsRemaining <= 0}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor:
              hintsRemaining > 0 ? 'var(--hint-btn)' : 'rgba(107, 91, 69, 0.5)',
            color: '#E8D4B0',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: hintsRemaining > 0 ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s ease',
            fontFamily: "'ZCOOL XiaoWei', serif",
          }}
          onMouseEnter={(e) => {
            if (hintsRemaining > 0) {
              e.currentTarget.style.backgroundColor = 'var(--hint-btn-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (hintsRemaining > 0) {
              e.currentTarget.style.backgroundColor = 'var(--hint-btn)';
            }
          }}
        >
          提示 ({hintsRemaining})
        </button>

        <button
          onClick={shuffleFragments}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: 'var(--shuffle-btn)',
            color: '#E8D4B0',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            fontFamily: "'ZCOOL XiaoWei', serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--shuffle-btn-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--shuffle-btn)';
          }}
        >
          重新洗牌
        </button>

        <button
          onClick={resetGame}
          style={{
            width: '100%',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: 'var(--panel-text-muted)',
            border: '1px solid rgba(232, 212, 176, 0.3)',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: "'ZCOOL XiaoWei', serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--panel-title)';
            e.currentTarget.style.borderColor = 'rgba(232, 212, 176, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--panel-text-muted)';
            e.currentTarget.style.borderColor = 'rgba(232, 212, 176, 0.3)';
          }}
        >
          重新开始
        </button>
      </div>
    </div>
  );
};
