import { useState, useRef, useEffect, useCallback } from 'react';
import { FiShuffle, FiRotateCcw } from 'react-icons/fi';
import Cube from './Cube';
import { useTimer } from './Timer';
import { generateScramble, type Move } from './Scrambler';

type Rating = 'S' | 'A' | 'B' | 'C' | null;

function App() {
  const { moves, time, formatTime, incrementMove, reset } = useTimer();
  const [isScrambling, setIsScrambling] = useState(false);
  const [rating, setRating] = useState<Rating>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const executeMoveRef = useRef<((move: Move, callback?: () => void) => void) | null>(null);
  const movesRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    movesRef.current = moves;
    timeRef.current = time;
  }, [moves, time]);

  const calculateRating = useCallback((totalMoves: number, totalTime: number): Rating => {
    if (totalMoves < 30 && totalTime < 15000) return 'S';
    if (totalMoves < 50 && totalTime < 30000) return 'A';
    if (totalMoves < 80 && totalTime < 60000) return 'B';
    if (totalMoves > 0) return 'C';
    return null;
  }, []);

  const handleScramble = async () => {
    if (isScrambling) return;
    setIsScrambling(true);
    reset();
    setRating(null);
    setResetTrigger(t => t + 1);

    await new Promise(resolve => setTimeout(resolve, 300));

    const scrambleMoves = generateScramble(20);
    const moveDelay = 100;

    for (let i = 0; i < scrambleMoves.length; i++) {
      await new Promise<void>(resolve => {
        if (executeMoveRef.current) {
          executeMoveRef.current(scrambleMoves[i], () => resolve());
        } else {
          resolve();
        }
      });
      if (i < scrambleMoves.length - 1) {
        await new Promise(resolve => setTimeout(resolve, moveDelay));
      }
    }

    setIsScrambling(false);
  };

  const handleReset = () => {
    reset();
    setRating(null);
    setResetTrigger(t => t + 1);
  };

  const handleMoveComplete = () => {
    incrementMove();
    const currentMoves = movesRef.current + 1;
    const currentTime = timeRef.current;
    const newRating = calculateRating(currentMoves, currentTime);
    if (newRating) {
      setRating(newRating);
    }
  };

  const ratingClass = rating ? `rating-${rating}` : '';
  const ratingDisplay = rating ? rating : '--';

  return (
    <div className="app">
      <div className="top-bar">
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">步数</span>
            <span className="stat-value-moves">{moves}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">用时</span>
            <span className="stat-value-time">{formatTime(time)}</span>
          </div>
        </div>
        <div className="controls">
          <button
            className="btn btn-scramble"
            onClick={handleScramble}
            disabled={isScrambling}
          >
            <FiShuffle size={18} />
            {isScrambling ? '打乱中...' : '打乱'}
          </button>
          <button
            className="btn btn-reset"
            onClick={handleReset}
            disabled={isScrambling}
          >
            <FiRotateCcw size={18} />
            重置
          </button>
        </div>
      </div>

      <Cube
        onMoveComplete={handleMoveComplete}
        isAnimating={isScrambling}
        executeMoveRef={executeMoveRef}
        resetTrigger={resetTrigger}
      />

      <div className="bottom-bar">
        <div className={`rating-box ${ratingClass}`}>
          <div className="rating-label">评级</div>
          <div className="rating-value">{ratingDisplay}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
