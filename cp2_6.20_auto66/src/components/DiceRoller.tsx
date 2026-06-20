import { useState, useEffect, useCallback, useMemo } from 'react';
import { rollD20 } from '../utils/dice';
import { useGameStore } from '../store/gameStore';
import './DiceRoller.css';

interface DiceRollerProps {
  onRollComplete?: (result: number) => void;
  autoRoll?: boolean;
  dc?: number;
  modifier?: number;
  showResult?: boolean;
  size?: 'small' | 'medium' | 'large';
  finalValue?: number;
  customTrigger?: boolean;
}

function DiceRoller({
  onRollComplete,
  autoRoll = false,
  dc = 10,
  modifier = 0,
  showResult = true,
  size = 'medium',
  finalValue,
  customTrigger,
}: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [finalDisplay, setFinalDisplay] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState<'success' | 'failure' | null>(null);
  const [rotationStyle, setRotationStyle] = useState<React.CSSProperties>({});
  const { setDiceAnimation } = useGameStore();

  const diceFaces = useMemo(() => {
    const faces: number[] = [];
    for (let i = 1; i <= 20; i++) {
      faces.push(i);
    }
    return faces;
  }, []);

  const visibleFaces = useMemo(() => {
    const shuffled = [...diceFaces].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }, [diceFaces, isRolling, finalDisplay]);

  const roll = useCallback(
    (forcedValue?: number) => {
      if (isRolling) return;

      setIsRolling(true);
      setShowSuccess(null);
      setFinalDisplay(null);
      setDiceAnimation({ rolling: true, value: null, finalValue: null });

      const result = forcedValue ?? finalValue ?? rollD20();

      const randomX = Math.floor(Math.random() * 4) + 3;
      const randomY = Math.floor(Math.random() * 4) + 3;
      const randomZ = Math.floor(Math.random() * 2) + 1;

      const rotationsForNumber: Record<number, { x: number; y: number; z: number }> = {
        1: { x: 0, y: 0, z: 0 },
        2: { x: 0, y: 90, z: 0 },
        3: { x: 0, y: 180, z: 0 },
        4: { x: 0, y: 270, z: 0 },
        5: { x: 90, y: 0, z: 0 },
        6: { x: 270, y: 0, z: 0 },
        7: { x: 0, y: 0, z: 45 },
        8: { x: 0, y: 45, z: 45 },
        9: { x: 45, y: 0, z: 45 },
        10: { x: 45, y: 45, z: 0 },
        11: { x: 315, y: 0, z: 0 },
        12: { x: 0, y: 315, z: 0 },
        13: { x: 0, y: 0, z: 315 },
        14: { x: 135, y: 0, z: 0 },
        15: { x: 0, y: 135, z: 0 },
        16: { x: 225, y: 0, z: 0 },
        17: { x: 0, y: 225, z: 0 },
        18: { x: 45, y: 45, z: 45 },
        19: { x: 315, y: 315, z: 315 },
        20: { x: 0, y: 0, z: 180 },
      };

      const targetRot = rotationsForNumber[result] || rotationsForNumber[1];
      const finalX = targetRot.x + randomX * 360;
      const finalY = targetRot.y + randomY * 360;
      const finalZ = targetRot.z + randomZ * 360;

      setRotationStyle({
        transform: `rotateX(${finalX}deg) rotateY(${finalY}deg) rotateZ(${finalZ}deg)`,
        transition: 'transform 2.5s cubic-bezier(0.17, 0.67, 0.23, 0.99)',
      });

      let frameCount = 0;
      const totalFrames = 40;
      const frameInterval = 50;
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 20) + 1);
        frameCount++;
        if (frameCount >= totalFrames) {
          clearInterval(interval);
        }
      }, frameInterval);

      setTimeout(() => {
        clearInterval(interval);
        setDisplayValue(result);
        setFinalDisplay(result);
        setIsRolling(false);
        setDiceAnimation({ rolling: false, value: result, finalValue: result });

        const total = result + modifier;
        const success = total >= dc;
        setShowSuccess(success ? 'success' : 'failure');

        if (onRollComplete) {
          onRollComplete(result);
        }

        setTimeout(() => setShowSuccess(null), 2000);
      }, 2600);
    },
    [isRolling, dc, modifier, finalValue, onRollComplete, setDiceAnimation]
  );

  useEffect(() => {
    if (autoRoll) {
      const timer = setTimeout(() => roll(), 300);
      return () => clearTimeout(timer);
    }
  }, [autoRoll, roll]);

  useEffect(() => {
    if (customTrigger) {
      roll();
    }
  }, [customTrigger, roll]);

  const sizeClass = size === 'small' ? 'dice-small' : size === 'large' ? 'dice-large' : '';

  return (
    <div className={`dice-roller ${sizeClass}`}>
      <div className={`dice-container ${sizeClass}`}>
        <div
          className={`dice d20 ${isRolling ? 'rolling' : ''} ${showSuccess || ''} ${finalDisplay !== null ? 'settled' : ''}`}
          style={rotationStyle}
        >
          <div className="dice-face d20-face face-1">
            <span className="face-number">{finalDisplay ?? visibleFaces[0]}</span>
          </div>
          <div className="dice-face d20-face face-2">
            <span className="face-number">{(finalDisplay ?? visibleFaces[1])}</span>
          </div>
          <div className="dice-face d20-face face-3">
            <span className="face-number">{(finalDisplay ?? visibleFaces[2])}</span>
          </div>
          <div className="dice-face d20-face face-4">
            <span className="face-number">{(finalDisplay ?? visibleFaces[3])}</span>
          </div>
          <div className="dice-face d20-face face-5">
            <span className="face-number">{(finalDisplay ?? visibleFaces[4])}</span>
          </div>
          <div className="dice-face d20-face face-6">
            <span className="face-number">{(finalDisplay ?? visibleFaces[5])}</span>
          </div>
          <div className="d20-glow" />
        </div>
      </div>

      {showResult && finalDisplay !== null && !isRolling && (
        <div className={`dice-result ${showSuccess || ''}`}>
          <span className={`dice-result-value ${finalDisplay === 20 ? 'critical-hit' : finalDisplay === 1 ? 'critical-fumble' : 'gold-text'}`}>
            {finalDisplay}
          </span>
          {finalDisplay === 20 && <span className="critical-label">✦ 暴击！</span>}
          {finalDisplay === 1 && <span className="critical-label fumble">✧ 大失败！</span>}
          {modifier !== 0 && (
            <span className="dice-modifier">
              {modifier >= 0 ? '+' : ''}
              {modifier} = {finalDisplay + modifier}
            </span>
          )}
          {dc > 0 && (
            <span className="dice-dc">
              DC: {dc} {showSuccess === 'success' ? '✓ 成功' : '✗ 失败'}
            </span>
          )}
        </div>
      )}

      {showResult && displayValue !== null && isRolling && (
        <div className="dice-result rolling-display">
          <span className="dice-result-value gold-text rolling-number">{displayValue}</span>
        </div>
      )}

      {!autoRoll && (
        <button className="btn-primary roll-btn" onClick={() => roll()} disabled={isRolling}>
          {isRolling ? '投掷中...' : '🎲 投骰'}
        </button>
      )}
    </div>
  );
}

export default DiceRoller;
