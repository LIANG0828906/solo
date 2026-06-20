import { useState, useEffect, useCallback } from 'react';
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
}

function DiceRoller({
  onRollComplete,
  autoRoll = false,
  dc = 10,
  modifier = 0,
  showResult = true,
  size = 'medium',
}: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState<'success' | 'failure' | null>(null);
  const { setDiceAnimation } = useGameStore();

  const roll = useCallback(() => {
    if (isRolling) return;

    setIsRolling(true);
    setShowSuccess(null);
    setDiceAnimation({ rolling: true, value: null, finalValue: null });

    const result = rollD20();
    setCurrentValue(result);

    let frameCount = 0;
    const totalFrames = 30;
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 20) + 1);
      frameCount++;
      if (frameCount >= totalFrames) {
        clearInterval(interval);
        setDisplayValue(result);
        setIsRolling(false);
        setDiceAnimation({ rolling: false, value: result, finalValue: result });

        const total = result + modifier;
        const success = total >= dc;
        setShowSuccess(success ? 'success' : 'failure');

        if (onRollComplete) {
          onRollComplete(result);
        }

        setTimeout(() => setShowSuccess(null), 1500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isRolling, dc, modifier, onRollComplete, setDiceAnimation]);

  useEffect(() => {
    if (autoRoll) {
      roll();
    }
  }, [autoRoll, roll]);

  const sizeClass = size === 'small' ? 'dice-small' : size === 'large' ? 'dice-large' : '';

  return (
    <div className={`dice-roller ${sizeClass}`}>
      <div className={`dice-container ${sizeClass}`}>
        <div className={`dice ${isRolling ? 'rolling' : ''} ${showSuccess || ''}`}>
          <div className="dice-face front">{displayValue || '?'}</div>
          <div className="dice-face back">{(displayValue || 10) % 20 + 1}</div>
          <div className="dice-face right">{(displayValue || 5) % 20 + 1}</div>
          <div className="dice-face left">{(displayValue || 15) % 20 + 1}</div>
          <div className="dice-face top">{(displayValue || 3) % 20 + 1}</div>
          <div className="dice-face bottom">{(displayValue || 17) % 20 + 1}</div>
        </div>
      </div>

      {showResult && displayValue !== null && !isRolling && (
        <div className={`dice-result ${showSuccess || ''}`}>
          <span className="dice-result-value gold-text">{displayValue}</span>
          {modifier !== 0 && (
            <span className="dice-modifier">
              {modifier >= 0 ? '+' : ''}
              {modifier} = {displayValue + modifier}
            </span>
          )}
          {dc > 0 && (
            <span className="dice-dc">
              DC: {dc} {showSuccess === 'success' ? '✓ 成功' : '✗ 失败'}
            </span>
          )}
        </div>
      )}

      {!autoRoll && (
        <button className="btn-primary roll-btn" onClick={roll} disabled={isRolling}>
          {isRolling ? '投掷中...' : '🎲 投骰'}
        </button>
      )}
    </div>
  );
}

export default DiceRoller;
