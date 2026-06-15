import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SweeperGame, Cell } from './gameLogic';
import { Character, characters, SkillResult } from './character';
import Grid from './Grid';

type GameStatus = 'selecting' | 'playing' | 'won' | 'lost';

const GRID_SIZE = 16;
const MINE_COUNT = 40;

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('selecting');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [game, setGame] = useState<SweeperGame | null>(null);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [health, setHealth] = useState<number>(1);
  const [maxHealth, setMaxHealth] = useState<number>(1);
  const [turn, setTurn] = useState<number>(1);
  const [skillCooldown, setSkillCooldown] = useState<number>(0);
  const [lastActionWasSkill, setLastActionWasSkill] = useState<boolean>(false);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [totalSafeCells, setTotalSafeCells] = useState<number>(0);
  const [skillMode, setSkillMode] = useState<boolean>(false);
  const [healthAnimating, setHealthAnimating] = useState<boolean>(false);
  const [explosionPos, setExplosionPos] = useState<{ row: number; col: number } | null>(null);
  const [showFireworks, setShowFireworks] = useState<boolean>(false);

  const gameRef = useRef<SweeperGame | null>(null);

  const triggerHealthAnimation = useCallback(() => {
    setHealthAnimating(true);
    setTimeout(() => setHealthAnimating(false), 300);
  }, []);

  const updateGridState = useCallback(() => {
    if (gameRef.current) {
      setGrid(gameRef.current.getGrid().map(row => [...row]));
      setRevealedCount(gameRef.current.getRevealedCount());
    }
  }, []);

  const handleCharacterSelect = useCallback((character: Character) => {
    setSelectedCharacter(character);
    setHealth(character.maxHealth);
    setMaxHealth(character.maxHealth);
    setTurn(1);
    setSkillCooldown(0);
    setLastActionWasSkill(false);
    setRevealedCount(0);
    setSkillMode(false);
    setExplosionPos(null);
    setShowFireworks(false);

    const newGame = new SweeperGame(GRID_SIZE, GRID_SIZE, MINE_COUNT);
    gameRef.current = newGame;
    setGame(newGame);
    setGrid(newGame.getGrid().map(row => [...row]));
    setTotalSafeCells(newGame.getTotalSafeCells());
    setGameStatus('playing');
  }, []);

  const handleReset = useCallback(() => {
    setGameStatus('selecting');
    setSelectedCharacter(null);
    setGame(null);
    gameRef.current = null;
    setGrid([]);
    setHealth(1);
    setMaxHealth(1);
    setTurn(1);
    setSkillCooldown(0);
    setLastActionWasSkill(false);
    setRevealedCount(0);
    setTotalSafeCells(0);
    setSkillMode(false);
    setExplosionPos(null);
    setShowFireworks(false);
  }, []);

  const advanceTurn = useCallback((wasSkill: boolean) => {
    setTurn(prev => prev + 1);
    setLastActionWasSkill(wasSkill);

    if (skillCooldown > 0) {
      setSkillCooldown(prev => Math.max(0, prev - 1));
    }
  }, [skillCooldown]);

  const triggerWinAnimation = useCallback(() => {
    if (!gameRef.current) return;

    const rows = gameRef.current.getRows();
    const cols = gameRef.current.getCols();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const delay = (row * cols + col) * 15;
        setTimeout(() => {
          if (gameRef.current) {
            gameRef.current.setCellRippling(row, col, true);
            updateGridState();
          }
        }, delay);
      }
    }

    setShowFireworks(true);
  }, [updateGridState]);

  const triggerLoseAnimation = useCallback((hitRow: number, hitCol: number) => {
    if (!gameRef.current) return;

    setExplosionPos({ row: hitRow, col: hitCol });

    const rows = gameRef.current.getRows();
    const cols = gameRef.current.getCols();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = gameRef.current.getCell(row, col);
        if (cell && cell.isMine) {
          const distance = Math.sqrt(
            Math.pow(row - hitRow, 2) + Math.pow(col - hitCol, 2)
          );
          const delay = distance * 60;

          setTimeout(() => {
            if (gameRef.current) {
              gameRef.current.setCellBurning(row, col, true);
              updateGridState();
            }
          }, delay);
        }
      }
    }
  }, [updateGridState]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameRef.current || gameStatus !== 'playing') return;

    if (skillMode && selectedCharacter && !selectedCharacter.isPassive) {
      if (lastActionWasSkill) {
        alert('不能连续使用两次技能！');
        return;
      }
      if (skillCooldown > 0) {
        alert(`技能冷却中，还需 ${skillCooldown} 回合`);
        return;
      }

      const result: SkillResult = selectedCharacter.executeSkill(
        gameRef.current,
        row,
        col
      );

      if (result.success) {
        if (result.healthChange) {
          setHealth(prev => {
            const newHealth = Math.max(0, prev + result.healthChange!);
            if (newHealth <= 0) {
              setTimeout(() => {
                setGameStatus('lost');
                triggerLoseAnimation(row, col);
              }, 100);
            }
            return newHealth;
          });
          triggerHealthAnimation();
        }

        setSkillMode(false);
        setSkillCooldown(selectedCharacter.cooldown);
        updateGridState();

        if (gameRef.current.checkWin()) {
          setGameStatus('won');
          triggerWinAnimation();
          return;
        }

        advanceTurn(true);
      }
      return;
    }

    const result = gameRef.current.revealCell(row, col);
    updateGridState();

    if (result.hitMine) {
      setHealth(prev => {
        const newHealth = prev - 1;
        if (newHealth <= 0) {
          setTimeout(() => {
            setGameStatus('lost');
            triggerLoseAnimation(row, col);
          }, 100);
        }
        return Math.max(0, newHealth);
      });
      triggerHealthAnimation();

      if (health - 1 > 0) {
        setTimeout(() => {
          if (gameRef.current) {
            gameRef.current = new SweeperGame(GRID_SIZE, GRID_SIZE, MINE_COUNT);
            updateGridState();
          }
        }, 500);
      }
    } else {
      if (gameRef.current.checkWin()) {
        setGameStatus('won');
        triggerWinAnimation();
        return;
      }
    }

    advanceTurn(false);
  }, [gameStatus, skillMode, selectedCharacter, lastActionWasSkill, skillCooldown, health, advanceTurn, updateGridState, triggerHealthAnimation, triggerWinAnimation, triggerLoseAnimation]);

  const handleCellRightClick = useCallback((row: number, col: number) => {
    if (!gameRef.current || gameStatus !== 'playing') return;
    if (skillMode) return;

    gameRef.current.markCell(row, col);
    updateGridState();
  }, [gameStatus, skillMode, updateGridState]);

  const handleSkillButtonClick = useCallback(() => {
    if (!selectedCharacter || selectedCharacter.isPassive) return;
    if (lastActionWasSkill) {
      alert('不能连续使用两次技能！');
      return;
    }
    if (skillCooldown > 0) {
      alert(`技能冷却中，还需 ${skillCooldown} 回合`);
      return;
    }
    setSkillMode(prev => !prev);
  }, [selectedCharacter, lastActionWasSkill, skillCooldown]);

  const progress = totalSafeCells > 0 ? (revealedCount / totalSafeCells) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="app min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="game-title mb-6">战术扫雷</h1>

      {gameStatus === 'selecting' && (
        <div className="character-select-container">
          <h2 className="select-title mb-8">选择你的角色</h2>
          <div className="character-cards">
            {characters.map((char, index) => (
              <div
                key={char.id}
                className={`character-card card-${index}`}
                onClick={() => handleCharacterSelect(char)}
              >
                <div className="card-avatar">{char.avatar}</div>
                <div className="card-info">
                  <h3 className="card-name">{char.name}</h3>
                  <p className="card-skill-name">{char.skillName}</p>
                  <p className="card-description">{char.description}</p>
                  <p className="card-cooldown">
                    {char.isPassive ? '被动技能' : `冷却: ${char.cooldown} 回合`}
                  </p>
                  <p className="card-health">❤️ 生命: {char.maxHealth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {gameStatus !== 'selecting' && (
        <>
          <div className="stats-panel">
            <div className="stat-item health-stat">
              <span className="stat-icon">❤️</span>
              <span className={`stat-value health-value ${healthAnimating ? 'health-bounce' : ''}`}>
                {health}/{maxHealth}
              </span>
            </div>

            <div className="stat-item progress-stat">
              <svg className="progress-ring" width="80" height="80" viewBox="0 0 100 100">
                <circle
                  className="progress-bg"
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#333"
                  strokeWidth="6"
                />
                <circle
                  className="progress-fill"
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 50 50)"
                />
                <circle
                  className="progress-dot"
                  cx="50"
                  cy="5"
                  r="4"
                  fill="#4ade80"
                  style={{
                    transform: `rotate(${progress * 3.6}deg)`,
                    transformOrigin: '50% 50%',
                  }}
                />
              </svg>
              <span className="progress-text">{Math.round(progress)}%</span>
            </div>

            <div className="stat-item turn-stat">
              <span className="stat-icon">⏳</span>
              <span className="stat-value turn-value">{turn}</span>
            </div>
          </div>

          <div className="game-controls mt-4 mb-4">
            {selectedCharacter && !selectedCharacter.isPassive && (
              <button
                className={`skill-button ${skillMode ? 'active' : ''} ${skillCooldown > 0 || lastActionWasSkill ? 'disabled' : ''}`}
                onClick={handleSkillButtonClick}
                disabled={skillCooldown > 0 || lastActionWasSkill}
              >
                {selectedCharacter.skillName}
                {skillCooldown > 0 && <span className="cooldown-badge">{skillCooldown}</span>}
              </button>
            )}
            {skillMode && (
              <span className="skill-hint">点击格子使用技能</span>
            )}
          </div>

          <div className="game-wrapper">
            {explosionPos && (
              <div
                className="shockwave"
                style={{
                  left: `${(explosionPos.col + 0.5) * (100 / GRID_SIZE)}%`,
                  top: `${(explosionPos.row + 0.5) * (100 / GRID_SIZE)}%`,
                }}
              />
            )}
            <Grid
              grid={grid}
              onCellClick={handleCellClick}
              onCellRightClick={handleCellRightClick}
              disabled={gameStatus !== 'playing' || skillMode}
              gameStatus={gameStatus}
              skillMode={skillMode}
            />
          </div>

          <button
            className="reset-button mt-6"
            onClick={handleReset}
          >
            🔄 重新开始
          </button>
        </>
      )}

      {gameStatus === 'won' && (
        <div className="overlay">
          <div className="result-modal win-modal">
            <h2 className="result-text win-text">排雷成功</h2>
            {showFireworks && (
              <div className="fireworks-container">
                <span className="firework">🎆</span>
                <span className="firework">🎇</span>
                <span className="firework">🎆</span>
                <span className="firework">🎇</span>
                <span className="firework">🎆</span>
                <span className="firework">🎇</span>
              </div>
            )}
            <p className="result-stats">
              用时: {turn} 回合 | 进度: {Math.round(progress)}%
            </p>
          </div>
        </div>
      )}

      {gameStatus === 'lost' && (
        <div className="overlay">
          <div className="result-modal lose-modal">
            <h2 className="result-text lose-text">💥 触雷 💥</h2>
            <p className="result-stats">
              坚持了 {turn} 回合 | 揭开 {revealedCount} 格
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
