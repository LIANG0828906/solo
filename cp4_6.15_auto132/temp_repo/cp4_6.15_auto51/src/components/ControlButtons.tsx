import React from 'react';

interface ControlButtonsProps {
  onDraw: () => void;
  onHint: () => void;
  onUndo: () => void;
  onRestart: () => void;
  canUndo: boolean;
  disabled?: boolean;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  onDraw,
  onHint,
  onUndo,
  onRestart,
  canUndo,
  disabled = false,
}) => {
  return (
    <div className="control-bar">
      <button
        className="control-btn"
        onClick={onDraw}
        disabled={disabled}
      >
        发牌
      </button>
      <button
        className="control-btn"
        onClick={onHint}
        disabled={disabled}
      >
        提示
      </button>
      <button
        className="control-btn"
        onClick={onUndo}
        disabled={!canUndo || disabled}
      >
        撤回
      </button>
      <button
        className="control-btn"
        onClick={onRestart}
      >
        重新开局
      </button>
    </div>
  );
};
