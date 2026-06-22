import React, { useMemo, useState } from 'react';
import { useGameStore } from './store';
import { pixelsToLightYears, lightYearsToDays, getShieldColor } from './GameMap';

export const InfoPanel: React.FC = () => {
  const totalDistance = useGameStore(s => s.totalDistance);
  const remainingShield = useGameStore(s => s.remainingShield);
  const resetGame = useGameStore(s => s.resetGame);
  const undoLastStep = useGameStore(s => s.undoLastStep);
  const gameStatus = useGameStore(s => s.gameStatus);
  const selectedPath = useGameStore(s => s.selectedPath);
  const shortestPathDistance = useGameStore(s => s.shortestPathDistance);

  const [resetPressed, setResetPressed] = useState(false);
  const [undoPressed, setUndoPressed] = useState(false);

  const lightYears = useMemo(() => {
    return pixelsToLightYears(totalDistance).toFixed(2);
  }, [totalDistance]);

  const travelDays = useMemo(() => {
    return lightYearsToDays(pixelsToLightYears(totalDistance));
  }, [totalDistance]);

  const shieldColor = useMemo(() => getShieldColor(remainingShield), [remainingShield]);

  const ringSize = 80;
  const ringStroke = 8;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (remainingShield / 100) * ringCircumference;

  const canUndo = gameStatus === 'planning' && selectedPath.length > 1;

  return (
    <div className="info-panel">
      <div className="info-panel-inner">
        <div className="info-title">
          <span className="title-accent">✦</span>
          星际航线规划师
          <span className="title-accent">✦</span>
        </div>

        <div className="info-items">
          <div className="info-item">
            <div className="info-label">总路径长度</div>
            <div className="info-value">
              <span className="value-number">{lightYears}</span>
              <span className="value-unit">光年</span>
            </div>
            {shortestPathDistance > 0 && (
              <div className="info-sub">
                最优: {pixelsToLightYears(shortestPathDistance).toFixed(2)} 光年
              </div>
            )}
          </div>

          <div className="info-item">
            <div className="info-label">预计航行时间</div>
            <div className="info-value">
              <span className="value-number">{travelDays}</span>
              <span className="value-unit">天</span>
            </div>
            <div className="info-sub">
              星段: {Math.max(0, selectedPath.length - 1)}
            </div>
          </div>

          <div className="info-item shield-ring-item">
            <div className="info-label">剩余护盾</div>
            <div className="shield-ring-container">
              <svg width={ringSize} height={ringSize} className="shield-svg">
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(102, 252, 241, 0.12)"
                  strokeWidth={ringStroke}
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke={shieldColor}
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                  style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }}
                />
                <text
                  x={ringSize / 2}
                  y={ringSize / 2 + 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={shieldColor}
                  fontSize="18"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {Math.round(remainingShield)}%
                </text>
              </svg>
            </div>
          </div>

          <div className="info-buttons">
            {canUndo && (
              <button
                className="btn btn-undo"
                onClick={undoLastStep}
                onMouseDown={() => setUndoPressed(true)}
                onMouseUp={() => setUndoPressed(false)}
                onMouseLeave={() => setUndoPressed(false)}
                style={{
                  transform: undoPressed ? 'scale(0.95)' : 'scale(1)',
                  transition: 'transform 0.1s ease',
                }}
              >
                ↶ 撤销
              </button>
            )}
            <button
              className="btn btn-reset"
              onClick={resetGame}
              onMouseDown={() => setResetPressed(true)}
              onMouseUp={() => setResetPressed(false)}
              onMouseLeave={() => setResetPressed(false)}
              style={{
                transform: resetPressed ? 'scale(0.95)' : 'scale(1)',
                transition: 'transform 0.1s ease',
              }}
            >
              ⟳ 重置星图
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
