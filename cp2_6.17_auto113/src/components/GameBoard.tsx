import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import type { Position, PlayerId } from '../types';
import { GRID_SIZE, getReachableCells, canAttack } from '../engine/gameEngine';

const CELL_SIZE = 80;
const BORDER_SIZE = 2;

interface HeroSpriteProps {
  heroId: PlayerId;
  displayPos: Position;
  actualPos: Position;
  onAnimationEnd: (heroId: PlayerId) => void;
}

const HeroSprite: React.FC<HeroSpriteProps> = ({ heroId, displayPos, actualPos, onAnimationEnd }) => {
  const [currentPos, setCurrentPos] = useState<Position>(displayPos);
  const animRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);

  const handleAnimEnd = useCallback(() => {
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      onAnimationEnd(heroId);
    }
  }, [heroId, onAnimationEnd]);

  useEffect(() => {
    hasAnimatedRef.current = false;

    if (displayPos.x === actualPos.x && displayPos.y === actualPos.y) {
      setCurrentPos(actualPos);
      return;
    }

    const start = { ...displayPos };
    const target = { ...actualPos };
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const duration = 300;
      const t = Math.min(elapsed / duration, 1);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      setCurrentPos({
        x: start.x + (target.x - start.x) * easeT,
        y: start.y + (target.y - start.y) * easeT,
      });

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentPos(target);
        handleAnimEnd();
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [actualPos.x, actualPos.y, displayPos.x, displayPos.y, handleAnimEnd]);

  const hero = useGameStore((s) => s.heroes[heroId]);

  const bgColor = heroId === 'player' ? '#4A90D9' : '#E74C3C';
  const hpPercent = (hero.currentHp / hero.maxHp) * 100;

  return (
    <div
      style={{
        position: 'absolute',
        left: currentPos.x * (CELL_SIZE + BORDER_SIZE) + (CELL_SIZE - 50) / 2,
        top: currentPos.y * (CELL_SIZE + BORDER_SIZE) + (CELL_SIZE - 50) / 2 - 12,
        width: 50,
        height: 62,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div style={{ position: 'relative', width: 60, height: 6, marginLeft: -5, marginBottom: 2 }}>
        <div
          style={{
            position: 'absolute',
            width: 60,
            height: 6,
            background: '#333',
            borderRadius: 3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: hpPercent > 0 ? `${hpPercent}%` : 0,
            height: 6,
            background: hpPercent > 50 ? '#4CAF50' : hpPercent > 25 ? '#FFC107' : '#F44336',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: bgColor,
          border: '2px solid #FFD700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
          boxShadow: hero.stunned > 0 ? '0 0 12px rgba(255, 215, 0, 0.8)' : 'none',
        }}
      >
        {heroId === 'player' ? '勇' : '刺'}
      </div>
      <div
        style={{
          color: 'white',
          fontSize: 12,
          textAlign: 'center',
          marginTop: 2,
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        {hero.currentHp}/{hero.maxHp}
      </div>
    </div>
  );
};

export const GameBoard: React.FC = () => {
  const { heroes, phase, selectedSkill, selectSkill, moveHero, attack, useSkill, isAnimating, setIsAnimating, updateDisplayPosition } = useGameStore(
    useShallow((s) => ({
      heroes: s.heroes,
      phase: s.phase,
      selectedSkill: s.selectedSkill,
      selectSkill: s.selectSkill,
      moveHero: s.moveHero,
      attack: s.attack,
      useSkill: s.useSkill,
      isAnimating: s.isAnimating,
      setIsAnimating: s.setIsAnimating,
      updateDisplayPosition: s.updateDisplayPosition,
    }))
  );

  const playerHero = heroes.player;
  const aiHero = heroes.ai;

  const reachableCells = phase === 'player_turn' && !isAnimating
    ? getReachableCells(playerHero.position, [aiHero.position], playerHero.moveRange)
    : [];

  const handleCellClick = (x: number, y: number) => {
    if (phase !== 'player_turn' || isAnimating) return;
    if (playerHero.stunned > 0) return;

    if (selectedSkill) {
      if (x === aiHero.position.x && y === aiHero.position.y) {
        useSkill('player', selectedSkill);
      }
      selectSkill(null);
      return;
    }

    if (x === aiHero.position.x && y === aiHero.position.y) {
      if (canAttack(playerHero, aiHero)) {
        attack('player');
      }
      return;
    }

    if (x === playerHero.position.x && y === playerHero.position.y) {
      return;
    }

    const isReachable = reachableCells.some((c) => c.x === x && c.y === y);
    if (isReachable && !playerHero.hasMoved) {
      moveHero('player', { x, y });
    }
  };

  const handleAnimEnd = useCallback((playerId: PlayerId) => {
    updateDisplayPosition(playerId, heroes[playerId].position);
    setIsAnimating(false);
  }, [heroes, updateDisplayPosition, setIsAnimating]);

  const boardWidth = GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * BORDER_SIZE;
  const boardHeight = GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * BORDER_SIZE;

  return (
    <div
      style={{
        position: 'relative',
        width: boardWidth,
        height: boardHeight + 30,
        background: '#1A1A2E',
        padding: 0,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gap: `${BORDER_SIZE}px`,
          background: '#1A1A2E',
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
          const x = idx % GRID_SIZE;
          const y = Math.floor(idx / GRID_SIZE);
          const isReachable = reachableCells.some((c) => c.x === x && c.y === y);
          const isAiPos = aiHero.position.x === x && aiHero.position.y === y;
          const isAttackable = canAttack(playerHero, aiHero) && isAiPos && !playerHero.hasActed;

          let bg = '#2D2D44';
          if (isReachable && !playerHero.hasMoved) bg = 'rgba(74, 144, 217, 0.3)';
          if (selectedSkill && isAiPos) bg = 'rgba(231, 76, 60, 0.3)';
          if (isAttackable && !selectedSkill) bg = 'rgba(231, 76, 60, 0.4)';

          return (
            <div
              key={`${x}-${y}`}
              onClick={() => handleCellClick(x, y)}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                background: bg,
                cursor: phase === 'player_turn' && !isAnimating && !playerHero.stunned ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease',
              }}
            />
          );
        })}
      </div>

      <HeroSprite
        heroId="player"
        displayPos={playerHero.displayPosition}
        actualPos={playerHero.position}
        onAnimationEnd={handleAnimEnd}
      />
      <HeroSprite
        heroId="ai"
        displayPos={aiHero.displayPosition}
        actualPos={aiHero.position}
        onAnimationEnd={handleAnimEnd}
      />
    </div>
  );
};
