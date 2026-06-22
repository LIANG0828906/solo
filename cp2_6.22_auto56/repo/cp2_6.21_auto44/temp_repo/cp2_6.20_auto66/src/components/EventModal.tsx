import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import DiceRoller from './DiceRoller';
import type { GameEvent, EventOption } from '../types';
import './EventModal.css';

interface EventModalProps {
  event: GameEvent;
  onSelectOption: (optionId: string) => void;
  onClose: () => void;
}

function EventModal({ event, onSelectOption, onClose }: EventModalProps) {
  const { eventResult, character } = useGameStore();
  const [selectedOption, setSelectedOption] = useState<EventOption | null>(null);
  const [showRoll, setShowRoll] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setSelectedOption(null);
    setShowRoll(false);
    setShowResult(false);
  }, [event]);

  const handleOptionClick = (option: EventOption) => {
    setSelectedOption(option);

    if (option.requiredCheck) {
      setShowRoll(true);
      setTimeout(() => {
        setShowRoll(false);
        setShowResult(true);
        onSelectOption(option.id);
      }, 1800);
    } else {
      setShowResult(true);
      onSelectOption(option.id);
    }
  };

  const handleContinue = () => {
    onClose();
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'treasure':
        return '📦';
      case 'trap':
        return '⚠️';
      case 'monster':
        return '👹';
      case 'npc':
        return '💬';
      default:
        return '❓';
    }
  };

  return (
    <div className="event-modal-overlay">
      <div className="event-modal parchment-panel fade-in">
        <div className="event-header">
          <span className="event-type-icon">{getEventTypeIcon(event.type)}</span>
          <h2 className="event-title">{event.title}</h2>
        </div>

        {!showResult ? (
          <>
            <p className="event-description">{event.description}</p>

            {showRoll && selectedOption?.requiredCheck && (
              <div className="event-dice-section">
                <DiceRoller
                  autoRoll
                  size="medium"
                  dc={selectedOption.requiredCheck.dc}
                  modifier={character ? Math.floor((character.attributes[selectedOption.requiredCheck.attribute] - 10) / 2) : 0}
                  showResult={true}
                />
              </div>
            )}

            {!showRoll && (
              <div className="event-options">
                {event.options.map((option) => (
                  <button
                    key={option.id}
                    className="event-option-btn"
                    onClick={() => handleOptionClick(option)}
                  >
                    <span className="option-text">{option.text}</span>
                    {option.requiredCheck && (
                      <span className="option-check">
                        (
                        {option.requiredCheck.attribute === 'strength' && '力量'}
                        {option.requiredCheck.attribute === 'dexterity' && '敏捷'}
                        {option.requiredCheck.attribute === 'constitution' && '体质'}
                        {option.requiredCheck.attribute === 'intelligence' && '智力'}
                        {option.requiredCheck.attribute === 'wisdom' && '感知'}
                        {option.requiredCheck.attribute === 'charisma' && '魅力'}
                        {' '}
                        DC {option.requiredCheck.dc})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="event-result fade-in">
            <p className={`result-message ${eventResult?.success ? 'success' : 'failure'}`}>
              {eventResult?.message || '...'}
            </p>

            <div className="result-changes">
              {eventResult?.healthChange && (
                <span className={`change-item ${eventResult.healthChange > 0 ? 'positive' : 'negative'}`}>
                  ❤️ {eventResult.healthChange > 0 ? '+' : ''}
                  {eventResult.healthChange} 生命
                </span>
              )}
              {eventResult?.manaChange && (
                <span className={`change-item ${eventResult.manaChange > 0 ? 'positive' : 'negative'}`}>
                  💧 {eventResult.manaChange > 0 ? '+' : ''}
                  {eventResult.manaChange} 法力
                </span>
              )}
              {eventResult?.goldChange && (
                <span className={`change-item ${eventResult.goldChange > 0 ? 'positive' : 'negative'}`}>
                  💰 {eventResult.goldChange > 0 ? '+' : ''}
                  {eventResult.goldChange} 金币
                </span>
              )}
              {eventResult?.experienceChange && (
                <span className="change-item positive">
                  ⭐ +{eventResult.experienceChange} 经验
                </span>
              )}
              {eventResult?.items && eventResult.items.length > 0 && (
                <div className="result-items">
                  <span>🎁 获得物品:</span>
                  {eventResult.items.map((item, i) => (
                    <span key={i} className="result-item">
                      {item.icon} {item.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button className="btn-primary continue-btn" onClick={handleContinue}>
              继续
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventModal;
