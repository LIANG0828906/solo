import React, { useEffect, useState } from 'react';
import './RandomEventModal.css';

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface RandomEventModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  choices: [EventChoice, EventChoice];
  onChoice: (choiceId: string) => void;
  onClose?: () => void;
}

const RandomEventModal: React.FC<RandomEventModalProps> = ({
  isOpen,
  title,
  description,
  choices,
  onChoice,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setSelectedChoice(null);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleChoiceClick = (choiceId: string) => {
    if (isAnimating) return;
    setSelectedChoice(choiceId);
  };

  const handleConfirm = () => {
    if (!selectedChoice || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      onChoice(selectedChoice);
      setIsAnimating(false);
    }, 500);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose && !isAnimating) {
      onClose();
    }
  };

  if (!isVisible && !isOpen) return null;

  return (
    <div
      className={`event-modal-backdrop ${isOpen ? 'open' : 'closed'}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div className={`event-modal ${isOpen ? 'open' : 'closed'}`}>
        <div className="modal-decoration">
          <div className="deco-line top"></div>
          <div className="deco-line bottom"></div>
        </div>

        <div className="modal-header">
          <div className="ink-splash"></div>
          <h2 id="event-modal-title" className="modal-title">{title}</h2>
          <div className="modal-divider"></div>
        </div>

        <div className="modal-body">
          <p className="modal-description">{description}</p>

          <div className="choices-container">
            {choices.map((choice, index) => (
              <button
                key={choice.id}
                className={`choice-card ${selectedChoice === choice.id ? 'selected' : ''}`}
                onClick={() => handleChoiceClick(choice.id)}
                disabled={isAnimating}
                style={{ animationDelay: `${0.3 + index * 0.15}s` }}
              >
                <div className="choice-icon">{choice.icon}</div>
                <div className="choice-content">
                  <h4 className="choice-label">{choice.label}</h4>
                  <p className="choice-desc">{choice.description}</p>
                </div>
                <div className="choice-marker">
                  {selectedChoice === choice.id && <span className="marker-dot"></span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={!selectedChoice || isAnimating}
          >
            <span className="confirm-text">
              {isAnimating ? '处理中...' : '做出选择'}
            </span>
            <div className="confirm-ink"></div>
          </button>
        </div>

        <div className="modal-corner tl"></div>
        <div className="modal-corner tr"></div>
        <div className="modal-corner bl"></div>
        <div className="modal-corner br"></div>
      </div>
    </div>
  );
};

export default RandomEventModal;
