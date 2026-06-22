import React, { useState, useMemo, useCallback } from 'react';
import { useGameStore } from './GameStore';

const DICE_SIZE = 80;
const HALF_SIZE = DICE_SIZE / 2;

const facePositions: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
};

const Pips: React.FC<{ value: number }> = ({ value }) => {
  const pipPositions = useMemo(() => {
    const positions: Array<{ top: string; left: string }> = [];
    const full = '15%';
    const center = '50%';
    const far = '70%';

    switch (value) {
      case 1:
        positions.push({ top: center, left: center });
        break;
      case 2:
        positions.push({ top: full, left: full });
        positions.push({ top: far, left: far });
        break;
      case 3:
        positions.push({ top: full, left: full });
        positions.push({ top: center, left: center });
        positions.push({ top: far, left: far });
        break;
      case 4:
        positions.push({ top: full, left: full });
        positions.push({ top: full, left: far });
        positions.push({ top: far, left: full });
        positions.push({ top: far, left: far });
        break;
      case 5:
        positions.push({ top: full, left: full });
        positions.push({ top: full, left: far });
        positions.push({ top: center, left: center });
        positions.push({ top: far, left: full });
        positions.push({ top: far, left: far });
        break;
      case 6:
        positions.push({ top: full, left: full });
        positions.push({ top: full, left: far });
        positions.push({ top: center, left: full });
        positions.push({ top: center, left: far });
        positions.push({ top: far, left: full });
        positions.push({ top: far, left: far });
        break;
    }
    return positions;
  }, [value]);

  return (
    <>
      {pipPositions.map((pos, idx) => (
        <div
          key={idx}
          className="absolute w-3 h-3 bg-gray-900 rounded-full"
          style={{
            top: pos.top,
            left: pos.left,
            transform: 'translate(-50%, -50%)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
          }}
        />
      ))}
    </>
  );
};

const DiceFace: React.FC<{ value: number; transform: string }> = ({ value, transform }) => (
  <div
    className="absolute bg-white rounded-lg"
    style={{
      width: DICE_SIZE,
      height: DICE_SIZE,
      transform,
      backfaceVisibility: 'hidden',
      border: '3px solid #d4af37',
      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
    }}
  >
    <Pips value={value} />
  </div>
);

export default function DiceRoll() {
  const { isRolling, diceValue, phase, currentPlayerIndex, players, rollDice, localPlayerId } = useGameStore();
  const [isClicked, setIsClicked] = useState(false);
  const [spinRotation, setSpinRotation] = useState({ x: 0, y: 0 });

  const currentPlayer = players[currentPlayerIndex];
  const isLocalPlayerTurn = currentPlayer?.id === localPlayerId;
  const canRoll = phase === 'waiting' && isLocalPlayerTurn && !isRolling;

  const handleClick = useCallback(() => {
    if (!canRoll) return;

    setIsClicked(true);
    const randomX = (Math.floor(Math.random() * 3) + 2) * 360 + (Math.random() > 0.5 ? 0 : 180);
    const randomY = (Math.floor(Math.random() * 3) + 2) * 360 + (Math.random() > 0.5 ? 0 : 180);
    setSpinRotation({ x: randomX, y: randomY });

    setTimeout(() => {
      setIsClicked(false);
    }, 200);

    rollDice();
  }, [canRoll, rollDice]);

  const getTransform = () => {
    if (isRolling) {
      return `rotateX(${spinRotation.x}deg) rotateY(${spinRotation.y}deg)`;
    }
    if (diceValue !== null) {
      const pos = facePositions[diceValue];
      return `rotateX(${pos.x}deg) rotateY(${pos.y}deg)`;
    }
    return 'rotateX(-20deg) rotateY(20deg)';
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative ${canRoll ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
        style={{
          perspective: '600px',
          width: DICE_SIZE + 20,
          height: DICE_SIZE + 20,
        }}
        onClick={handleClick}
      >
        <div
          className={`absolute top-1/2 left-1/2 transition-transform`}
          style={{
            width: DICE_SIZE,
            height: DICE_SIZE,
            transform: `translate(-50%, -50%) ${getTransform()}`,
            transformStyle: 'preserve-3d',
            transition: isRolling ? 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'transform 0.3s ease-out',
            animation: isClicked ? 'squeeze 0.2s ease-out' : 'none',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
          }}
        >
          <DiceFace value={1} transform={`translateZ(${HALF_SIZE}px)`} />
          <DiceFace value={6} transform={`rotateY(180deg) translateZ(${HALF_SIZE}px)`} />
          <DiceFace value={2} transform={`rotateY(90deg) translateZ(${HALF_SIZE}px)`} />
          <DiceFace value={5} transform={`rotateY(-90deg) translateZ(${HALF_SIZE}px)`} />
          <DiceFace value={3} transform={`rotateX(90deg) translateZ(${HALF_SIZE}px)`} />
          <DiceFace value={4} transform={`rotateX(-90deg) translateZ(${HALF_SIZE}px)`} />
        </div>
      </div>

      {!canRoll && !isRolling && (
        <div className="text-white/70 text-xs bg-black/40 px-3 py-1 rounded-full">
          {!isLocalPlayerTurn ? '等待其他玩家...' : phase !== 'waiting' ? '请先移动棋子' : ''}
        </div>
      )}

      {isRolling && (
        <div className="text-yellow-300 text-sm font-medium animate-pulse">
          投掷中...
        </div>
      )}

      <style>{`
        @keyframes squeeze {
          0% { transform: translate(-50%, -50%) scaleX(1) scaleY(1); }
          30% { transform: translate(-50%, -50%) scaleX(1.15) scaleY(0.85); }
          50% { transform: translate(-50%, -50%) scaleX(0.95) scaleY(1.05); }
          70% { transform: translate(-50%, -50%) scaleX(1.02) scaleY(0.98); }
          100% { transform: translate(-50%, -50%) scaleX(1) scaleY(1); }
        }
      `}</style>
    </div>
  );
}
