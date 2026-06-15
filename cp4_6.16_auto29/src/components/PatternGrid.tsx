import { useMemo, useRef, useEffect } from 'react';
import { parsePattern } from '@/utils/pattern';
import './PatternGrid.css';

interface PatternGridProps {
  patternText: string;
  currentRow: number;
  totalRows: number;
}

export function PatternGrid({ patternText, currentRow, totalRows }: PatternGridProps) {
  const rows = useMemo(() => parsePattern(patternText), [patternText]);
  const gridRef = useRef<HTMLDivElement>(null);
  const currentRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentRowRef.current && gridRef.current) {
      const grid = gridRef.current;
      const rowElement = currentRowRef.current;
      const gridRect = grid.getBoundingClientRect();
      const rowRect = rowElement.getBoundingClientRect();

      const scrollTop =
        grid.scrollTop + (rowRect.top - gridRect.top) - gridRect.height / 2 + rowRect.height / 2;

      grid.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      });
    }
  }, [currentRow]);

  const getRowState = (rowIndex: number): 'completed' | 'current' | 'upcoming' | 'hidden' => {
    if (rowIndex < currentRow) return 'completed';
    if (rowIndex === currentRow) return 'current';
    if (rowIndex <= currentRow + 2 && rowIndex >= currentRow - 2) return 'upcoming';
    return 'hidden';
  };

  return (
    <div className="pattern-grid-container">
      <div className="pattern-grid" ref={gridRef}>
        {rows.map((row, rowIndex) => {
          const state = getRowState(rowIndex);
          const isCurrent = state === 'current';

          return (
            <div
              key={rowIndex}
              ref={isCurrent ? currentRowRef : null}
              className={`pattern-row pattern-row--${state}`}
              data-row-index={rowIndex}
            >
              <div className="pattern-row-number">{rowIndex + 1}</div>
              <div className="pattern-row-cells">
                {row.symbols.map((symbol, colIndex) => (
                  <div key={colIndex} className="pattern-cell">
                    {symbol}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
