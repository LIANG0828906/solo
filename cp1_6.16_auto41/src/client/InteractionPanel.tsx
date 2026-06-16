import { memo, useCallback } from 'react';
import type { InteractionType } from './types';
import { useCooldown } from './hooks/useCooldown';
import './InteractionPanel.css';

interface InteractionPanelProps {
  onInteract: (type: InteractionType) => void;
  disabled?: boolean;
}

const buttons: Array<{ type: InteractionType; icon: string; label: string; color: string }> = [
  { type: 'feed', icon: '🍖', label: '喂养', color: '#FF6B6B' },
  { type: 'clean', icon: '💧', label: '清洁', color: '#74B9FF' },
  { type: 'play', icon: '⚽', label: '玩耍', color: '#55EFC4' },
];

const InteractionPanel = memo(function InteractionPanel({
  onInteract,
  disabled = false,
}: InteractionPanelProps) {
  const feedCooldown = useCooldown(5);
  const cleanCooldown = useCooldown(5);
  const playCooldown = useCooldown(5);

  const getCooldown = (type: InteractionType) => {
    switch (type) {
      case 'feed': return feedCooldown;
      case 'clean': return cleanCooldown;
      case 'play': return playCooldown;
    }
  };

  const handleClick = useCallback((type: InteractionType) => {
    const cooldown = getCooldown(type);
    if (cooldown.isCooldown || disabled) return;
    
    cooldown.startCooldown();
    onInteract(type);
  }, [onInteract, disabled, feedCooldown, cleanCooldown, playCooldown]);

  return (
    <div className="interaction-panel">
      <div className="buttons-container">
        {buttons.map((btn, index) => {
          const cooldown = getCooldown(btn.type);
          const isDisabled = cooldown.isCooldown || disabled;
          
          return (
            <button
              key={btn.type}
              className={`interaction-btn ${isDisabled ? 'disabled' : ''}`}
              style={{ ['--btn-color' as string]: btn.color, '--index' as string]: index }}
              onClick={() => handleClick(btn.type)}
              disabled={isDisabled}
            >
              <span className="btn-icon">{btn.icon}</span>
              <span className="btn-label">{btn.label}</span>
              {cooldown.isCooldown && (
                <div className="cooldown-overlay">
                  <span className="cooldown-time">{cooldown.timeLeft}s</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default InteractionPanel;
