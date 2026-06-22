import { useGameStore } from './gameStore';

export default function CluePanel() {
  const clues = useGameStore((state) => state.clues);
  const highlightItem = useGameStore((state) => state.highlightItem);
  const setHighlightItem = useGameStore((state) => state.setHighlightItem);

  const collectedClues = clues.filter((clue) => clue.collected);

  const handleClueClick = (relatedItemId: string) => {
    if (highlightItem === relatedItemId) {
      setHighlightItem(null);
    } else {
      setHighlightItem(relatedItemId);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[200px] p-4 overflow-y-auto z-40">
      <div className="glass-panel h-full p-4 flex flex-col">
        <h2 className="text-xl font-bold text-center mb-4 text-[var(--color-accent-gold)]" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
          Collected Clues
        </h2>

        {collectedClues.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-text-secondary)] text-sm text-center px-2">
            Find scrolls in the scene...
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {collectedClues.map((clue) => {
              const isHighlighted = highlightItem === clue.relatedItemId;
              return (
                <div
                  key={clue.id}
                  onClick={() => handleClueClick(clue.relatedItemId)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                    isHighlighted
                      ? 'bg-[rgba(255,215,0,0.2)] border-2 border-[var(--color-accent-gold)] shadow-[var(--shadow-glow-gold)]'
                      : 'border border-transparent hover:bg-[rgba(255,255,255,0.1)] hover:translate-x-[-5px]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">📜</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1 truncate">
                        {clue.title}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                        {clue.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .fixed {
            position: fixed;
            right: 0;
            left: 0;
            bottom: 0;
            top: auto;
            width: 100%;
            height: 120px;
            overflow-x: auto;
            overflow-y: hidden;
          }

          .glass-panel {
            height: 100%;
            flex-direction: row;
            align-items: center;
            gap: 12px;
          }

          .glass-panel h2 {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            margin: 0;
            flex-shrink: 0;
            font-size: 14px;
          }

          .flex-1.flex.items-center.justify-center {
            writing-mode: vertical-rl;
            text-orientation: mixed;
          }

          .flex.flex-col.gap-2 {
            flex-direction: row;
            gap: 8px;
            overflow-x: auto;
            overflow-y: hidden;
            flex: 1;
            padding-bottom: 4px;
          }

          .flex.flex-col.gap-2::-webkit-scrollbar {
            height: 4px;
          }

          .p-3.rounded-lg {
            width: 140px;
            flex-shrink: 0;
          }

          .border.border-transparent:hover {
            transform: translateY(-3px) !important;
          }
        }
      `}</style>
    </div>
  );
}
