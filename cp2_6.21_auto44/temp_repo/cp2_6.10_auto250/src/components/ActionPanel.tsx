import React, { useState, useCallback } from 'react';
import type { Action, ActionOption } from '../types';

interface ActionPanelProps {
  actions: Action;
  onSubmit: (musicId: string, chessId: string, paintingId: string) => void;
  disabled?: boolean;
  result?: { success: boolean; message: string } | null;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ actions, onSubmit, disabled, result }) => {
  const [selected, setSelected] = useState<{
    music: string | null;
    chess: string | null;
    painting: string | null;
  }>({
    music: null,
    chess: null,
    painting: null,
  });

  const handleSelect = useCallback((category: keyof typeof selected, id: string) => {
    if (disabled) return;
    setSelected(prev => ({ ...prev, [category]: id }));
  }, [disabled]);

  const handleSubmit = useCallback(() => {
    if (!selected.music || !selected.chess || !selected.painting) {
      return;
    }
    onSubmit(selected.music, selected.chess, selected.painting);
  }, [selected, onSubmit]);

  const canSubmit = selected.music && selected.chess && selected.painting && !disabled;

  const renderOptions = (options: ActionOption[], category: keyof typeof selected, icon: string, title: string) => (
    <div className="category-section">
      <h3 className="category-title">
        <span>{icon}</span>
        <span>{title}</span>
      </h3>
      <div className="option-grid">
        {options.map((option, index) => (
          <div
            key={option.id}
            className={`option-card ${selected[category] === option.id ? 'selected' : ''} ${
              result
                ? option.isCorrect
                  ? 'correct'
                  : selected[category] === option.id
                  ? 'wrong'
                  : ''
                : ''
            }`}
            onClick={() => handleSelect(category, option.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{option.name}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--mo-qing)' }}>
              {option.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="ink-card action-panel">
      <h2 style={{ marginBottom: '20px' }}>安排雅集活动</h2>

      {renderOptions(actions.music, 'music', '🎵', '琴曲')}
      {renderOptions(actions.chess, 'chess', '⚫', '棋局')}
      {renderOptions(actions.painting, 'painting', '🖌️', '书画')}

      {result && (
        <div
          className={result.success ? 'success-message' : 'error-message'}
          style={{ margin: '20px 0', padding: '12px', borderRadius: '4px', background: result.success ? 'rgba(74, 124, 89, 0.1)' : 'rgba(192, 57, 43, 0.1)' }}
        >
          {result.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{ minWidth: '150px' }}
        >
          确认安排
        </button>
      </div>
    </div>
  );
};

export default ActionPanel;
