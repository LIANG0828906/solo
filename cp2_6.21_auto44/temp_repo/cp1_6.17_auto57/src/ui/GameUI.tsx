import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import InventoryPanel from './InventoryPanel';
import { COLORS, DIMENSIONS, ANIMATION } from '../utils/constants';
import { GameEngine } from '../game/GameEngine';

const GameUI: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const {
    player,
    currentFloor,
    totalFloors,
    inventory,
    isTimeWarning,
    warningAlpha,
    gameStatus,
    restart,
  } = useGameStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    const handleKeyDown = (e: KeyboardEvent) => {
      engine.handleKeyDown(e);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.handleKeyUp(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    engine.start();

    return () => {
      engine.stop();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const healthPercentage = Math.max(0, player.health / player.maxHealth);
  const expPercentage = Math.max(0, player.experience / player.experienceToNext);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '16px',
        backgroundColor: '#0F172A',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          width: DIMENSIONS.INFO_PANEL_WIDTH,
          backgroundColor: COLORS.PANEL_BG,
          borderRadius: '8px',
          padding: '16px',
          color: COLORS.TEXT,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ fontSize: '14px', textAlign: 'center' }}>
          第 {currentFloor + 1} 层 / {totalFloors} 层
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px' }}>
            生命值: {player.health}/{player.maxHealth}
          </div>
          <div
            style={{
              width: '100%',
              height: '16px',
              backgroundColor: '#1F2937',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${healthPercentage * 100}%`,
                background: `linear-gradient(to right, ${COLORS.HP_BAR_START}, ${COLORS.HP_BAR_END})`,
                transition: 'width 0.2s ease',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '20px',
                  background: 'linear-gradient(to right, #FFFFFF40, transparent)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <span style={{ color: COLORS.GOLD }}>🪙</span>
          <span style={{ color: COLORS.GOLD }}>{player.gold}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Lv.{player.level}</span>
            <span>{player.experience}/{player.experienceToNext}</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '10px',
              backgroundColor: '#1F2937',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${expPercentage * 100}%`,
                backgroundColor: COLORS.EXP_BAR,
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          flex: 1,
          maxWidth: DIMENSIONS.CANVAS_MIN_WIDTH,
          aspectRatio: `${DIMENSIONS.CANVAS_MIN_WIDTH} / ${DIMENSIONS.CANVAS_MIN_HEIGHT}`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={DIMENSIONS.CANVAS_MIN_WIDTH}
          height={DIMENSIONS.CANVAS_MIN_HEIGHT}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            imageRendering: 'pixelated',
          }}
        />

        {isTimeWarning && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                boxShadow: `inset 0 0 80px 20px ${COLORS.WARNING}${Math.floor(warningAlpha * 0.4 * 255).toString(16).padStart(2, '0')}`,
                transition: `box-shadow ${ANIMATION.WARNING_TRANSITION}ms ease`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: COLORS.WHITE,
                fontSize: '24px',
                fontWeight: 'bold',
                textShadow: '0 0 10px #000000',
                animation: 'heartbeat 0.5s ease-in-out infinite',
                fontFamily: 'inherit',
              }}
            >
              时间不足!
            </div>
          </>
        )}

        {gameStatus === 'gameover' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#000000CC',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div
              style={{
                color: COLORS.WHITE,
                fontSize: '48px',
                fontWeight: 'bold',
                fontFamily: 'inherit',
              }}
            >
              游戏结束
            </div>
            <button
              onClick={restart}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontFamily: 'inherit',
                backgroundColor: '#DC2626',
                color: COLORS.WHITE,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#B91C1C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#DC2626';
              }}
            >
              重新开始
            </button>
          </div>
        )}

        {gameStatus === 'victory' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#000000CC',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div
              style={{
                color: COLORS.GOLD_HELMET,
                fontSize: '48px',
                fontWeight: 'bold',
                textShadow: `0 0 20px ${COLORS.GOLD_HELMET}80`,
                fontFamily: 'inherit',
              }}
            >
              通关胜利!
            </div>
            <button
              onClick={restart}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontFamily: 'inherit',
                backgroundColor: COLORS.GOLD_HELMET,
                color: '#1F2937',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F59E0B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.GOLD_HELMET;
              }}
            >
              重新开始
            </button>
          </div>
        )}
      </div>

      <InventoryPanel items={inventory} />
    </div>
  );
};

export default GameUI;
