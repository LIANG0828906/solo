import React, { useState, useCallback, useEffect } from 'react';
import { GameBoard } from './GameBoard';
import {
  ScoreDisplay,
  EnergyBar,
  LevelDisplay,
  ComboIndicator,
  Sidebar,
  ControlButton,
} from './UIComponents';
import {
  generateBoard,
  Cell,
  MAX_ENERGY,
  MAX_COMBO,
  getMoonCount,
} from './GameEngine';
import './App.css';

const App: React.FC = () => {
  const [board, setBoard] = useState<Cell[][]>(() => generateBoard(1));
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isScoreAnimating, setIsScoreAnimating] = useState(false);
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  const moonCount = getMoonCount(board);

  const handleScoreAdd = useCallback((points: number) => {
    setScore(prev => prev + points);
    setIsScoreAnimating(true);
    setTimeout(() => setIsScoreAnimating(false), 100);

    setCombo(prev => Math.min(prev + 1, MAX_COMBO));
  }, []);

  const handleEnergyAdd = useCallback((energyGain: number) => {
    setEnergy(prev => {
      const newEnergy = prev + energyGain;
      if (newEnergy >= MAX_ENERGY) {
        return MAX_ENERGY;
      }
      return newEnergy;
    });
  }, []);

  const handleBoardUpdate = useCallback((newBoard: Cell[][]) => {
    setBoard(newBoard);
  }, []);

  const handleLevelUp = useCallback(() => {
    setIsLevelingUp(true);

    let flashCount = 0;
    const flashInterval = setInterval(() => {
      flashCount++;
      if (flashCount >= 6) {
        clearInterval(flashInterval);
        setIsLevelingUp(false);
        setLevel(prev => prev + 1);
        setEnergy(0);
        setCombo(0);
        setBoard(generateBoard(level + 1));
      }
    }, 500);
  }, [level]);

  const handleRestart = useCallback(() => {
    setBoard(generateBoard(1));
    setScore(0);
    setEnergy(0);
    setLevel(1);
    setCombo(0);
    setIsPaused(false);
    setIsLevelingUp(false);
  }, []);

  const handlePauseToggle = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handlePauseToggle();
      }
      if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePauseToggle, handleRestart]);

  return (
    <div className="app-container">
      <div className="game-layout">
        <Sidebar side="left" />

        <div className="game-main">
          <div className="game-header">
            <div className="header-left">
              <ComboIndicator combo={combo} />
            </div>
            <div className="header-center">
              <LevelDisplay level={level} />
            </div>
            <div className="header-right">
              <ScoreDisplay score={score} isAnimating={isScoreAnimating} />
            </div>
          </div>

          <div className="board-wrapper">
            {isPaused && (
              <div className="pause-overlay">
                <div className="pause-content">
                  <h2>暂停中</h2>
                  <p>按空格键继续</p>
                </div>
              </div>
            )}
            <GameBoard
              board={board}
              onScoreAdd={handleScoreAdd}
              onEnergyAdd={handleEnergyAdd}
              onBoardUpdate={handleBoardUpdate}
              onLevelUp={handleLevelUp}
              isPaused={isPaused}
              level={level}
              energy={energy}
              isLevelingUp={isLevelingUp}
            />
          </div>

          <div className="game-footer">
            <EnergyBar energy={energy} maxEnergy={MAX_ENERGY} />
            <div className="control-buttons">
              <ControlButton label={isPaused ? '继续' : '暂停'} onClick={handlePauseToggle} />
              <ControlButton label="重新开始" onClick={handleRestart} />
            </div>
          </div>
        </div>

        <Sidebar side="right" level={level} moonCount={moonCount} />
      </div>
    </div>
  );
};

export default App;
