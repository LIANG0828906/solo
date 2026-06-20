import React from 'react';
import { CelestialEvent, Constellation } from '../types';

interface TaskPanelProps {
  currentEvent: CelestialEvent | null;
  constellations: Constellation[];
  onOptionSelect: (constellationId: string, inscription: string) => void;
  selectedOption: { constellationId: string; inscription: string } | null;
  isCorrect: boolean | null;
}

const TaskPanel: React.FC<TaskPanelProps> = ({
  currentEvent,
  constellations,
  onOptionSelect,
  selectedOption,
  isCorrect,
}) => {
  const getConstellationName = (id: string) => {
    const c = constellations.find((c) => c.id === id);
    return c ? c.name : '未知星宿';
  };

  if (!currentEvent) {
    return (
      <div className="left-panel">
        <h2 className="panel-title">天命任务</h2>
        <div className="task-card">
          <p style={{ textAlign: 'center', color: '#a0b4cc', padding: '20px' }}>
            等待天象异变...
          </p>
        </div>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      meteor: '☄',
      comet: '★',
      eclipse: '🌑',
      starfall: '💫',
      battle: '⚔',
      destruction: '⚠',
    };
    return icons[type] || '✦';
  };

  return (
    <div className="left-panel">
      <h2 className="panel-title">天命任务</h2>
      <div className="task-card">
        <div className="task-name">
          {getEventIcon(currentEvent.type)} {currentEvent.name}
        </div>
        <div className="task-desc">{currentEvent.description}</div>
        <div style={{ fontSize: '12px', color: '#d4af37', marginBottom: '10px' }}>
          难度：{'★'.repeat(Math.ceil(currentEvent.difficulty))}
        </div>
      </div>

      <h3 style={{ color: '#d4af37', fontSize: '16px', marginBottom: '15px' }}>
        选择星宿与铭文组合：
      </h3>

      {currentEvent.options.map((option, index) => {
        const isSelected = selectedOption?.constellationId === option.constellationId && 
                          selectedOption?.inscription === option.inscription;
        let btnClass = 'option-btn';
        if (selectedOption && isSelected) {
          btnClass += isCorrect ? ' correct' : ' wrong';
        }

        return (
          <button
            key={index}
            className={btnClass}
            onClick={() => !selectedOption && onOptionSelect(option.constellationId, option.inscription)}
            disabled={!!selectedOption}
          >
            <span className="const-name">{getConstellationName(option.constellationId)}</span>
            <span style={{ margin: '0 8px', color: '#a0b4cc' }}>+</span>
            <span style={{ color: '#e0f0ff' }}>{option.inscription}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TaskPanel;
