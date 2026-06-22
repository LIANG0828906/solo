import React, { useState } from 'react';
import { SimulationStep, ActionType, Unit } from '../game/types';
import './DetailedSimView.css';

interface DetailedSimViewProps {
  steps: SimulationStep[];
  onStepClick: (step: SimulationStep) => void;
}

const actionIcons: Record<ActionType, string> = {
  play: '🃏',
  attack: '⚔️',
  spell: '✨',
  hero_power: '⚡',
  end_turn: '⏭️'
};

const actionColors: Record<ActionType, string> = {
  play: '#4caf50',
  attack: '#ff5722',
  spell: '#9c27b0',
  hero_power: '#ffd700',
  end_turn: '#607d8b'
};

const StepDot: React.FC<{
  step: SimulationStep;
  isActive: boolean;
  onClick: () => void;
}> = ({ step, isActive, onClick }) => {
  const color = actionColors[step.action];

  return (
    <div
      className={`step-dot ${isActive ? 'active' : ''}`}
      style={{ background: color, boxShadow: isActive ? `0 0 10px ${color}` : 'none' }}
      onClick={onClick}
      title={step.description}
    >
      <span className="step-icon">{actionIcons[step.action]}</span>
    </div>
  );
};

const MiniBoard: React.FC<{ board: (Unit | null)[][] }> = ({ board }) => {
  return (
    <div className="mini-board">
      {board.slice(0, 8).map((row, y) =>
        row.slice(0, 8).map((unit, x) => (
          <div
            key={`mini-${x}-${y}`}
            className={`mini-cell ${y < 4 ? 'enemy-zone' : 'player-zone'} ${unit ? 'has-unit' : ''}`}
          >
            {unit && (
              <div
                className={`mini-unit ${unit.owner}`}
                style={{
                  background: unit.owner === 'player' ? '#00e676' : '#ff5722',
                  opacity: 0.8
                }}
                title={unit.name}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
};

const DetailedSimView: React.FC<DetailedSimViewProps> = ({ steps, onStepClick }) => {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const handleStepClick = (step: SimulationStep) => {
    setActiveStepId(activeStepId === step.id ? null : step.id);
    onStepClick(step);
  };

  if (steps.length === 0) {
    return (
      <div className="detailed-sim-empty">
        <p>暂无模拟步骤</p>
      </div>
    );
  }

  return (
    <div className="detailed-sim-view">
      <div className="sim-timeline">
        {steps.map((step, index) => (
          <div key={step.id} className="timeline-item">
            <div className="timeline-connector">
              <StepDot
                step={step}
                isActive={activeStepId === step.id}
                onClick={() => handleStepClick(step)}
              />
              {index < steps.length - 1 && <div className="timeline-line" />}
            </div>

            <div className="timeline-content">
              <div
                className={`step-card ${activeStepId === step.id ? 'active' : ''}`}
                style={{
                  borderColor: activeStepId === step.id ? '#ffd700' : 'transparent'
                }}
                onClick={() => handleStepClick(step)}
              >
                <div className="step-header">
                  <span className="step-index">步骤 {index + 1}</span>
                  <span className="step-action" style={{ color: actionColors[step.action] }}>
                    {actionIcons[step.action]} {step.action}
                  </span>
                </div>
                <p className="step-description">{step.description}</p>
                <div className="step-stats">
                  <span>❤️ {step.playerHealth}</span>
                  <span>💎 {step.playerMana}</span>
                  <span>👹 {step.enemyHealth}</span>
                </div>

                {activeStepId === step.id && (
                  <div className="step-board-preview">
                    <div className="preview-label">战场快照</div>
                    <MiniBoard board={step.boardSnapshot} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailedSimView;
