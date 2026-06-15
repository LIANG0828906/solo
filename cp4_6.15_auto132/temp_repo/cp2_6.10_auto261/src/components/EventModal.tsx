import React, { useEffect, useCallback } from 'react';
import { CelestialEvent, Constellation } from '../types';
import { playTickSound } from '../utils';

interface EventModalProps {
  event: CelestialEvent | null;
  constellations: Constellation[];
  countdown: number;
  onSelect: (constellationId: string, inscription: string) => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, constellations, countdown, onSelect }) => {
  const getConstellationName = (id: string) => {
    const c = constellations.find((c) => c.id === id);
    return c ? c.name : '未知星宿';
  };

  const handleTick = useCallback(() => {
    if (countdown > 0 && countdown <= 5) {
      playTickSound();
    }
  }, [countdown]);

  useEffect(() => {
    handleTick();
  }, [countdown, handleTick]);

  if (!event) return null;

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

  const countdownPercent = (countdown / event.timeLimit) * 100;
  const isUrgent = countdown <= 5;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">
          {getEventIcon(event.type)} {event.name}
        </h2>
        
        <div className="countdown-text" style={{ color: isUrgent ? '#ff6b6b' : '#d4af37' }}>
          ⏱ 剩余 {countdown.toFixed(1)} 秒
        </div>
        
        <div className="countdown-bar">
          <div 
            className="countdown-fill" 
            style={{ 
              width: `${countdownPercent}%`,
              background: isUrgent 
                ? 'linear-gradient(90deg, #ff0000, #ff6b6b)' 
                : 'linear-gradient(90deg, #c0392b, #ff6b6b)'
            }}
          />
        </div>

        <div className="task-desc" style={{ marginBottom: '20px', fontSize: '15px' }}>
          {event.description}
        </div>

        <div className="modal-options">
          {event.options.map((option, index) => (
            <button
              key={index}
              className="modal-option"
              onClick={() => onSelect(option.constellationId, option.inscription)}
            >
              <span style={{ color: '#d4af37', fontWeight: 'bold' }}>
                {getConstellationName(option.constellationId)}
              </span>
              <span style={{ margin: '0 10px', color: '#a0b4cc' }}>+</span>
              <span style={{ color: '#e0f0ff' }}>{option.inscription}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventModal;
