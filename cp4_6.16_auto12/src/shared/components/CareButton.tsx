import { useState, useRef, useCallback, useEffect } from 'react';
import { CareType, CARE_THRESHOLDS } from '../../modules/plants/plantsStore';

interface CareButtonProps {
  type: CareType;
  onClick: () => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CARE_CONFIG: Record<CareType, { label: string; icon: string; color: string }> = {
  water: { label: '浇水', icon: '💧', color: '#42A5F5' },
  fertilize: { label: '施肥', icon: '🌱', color: '#66BB6A' },
  repot: { label: '换盆', icon: '🪴', color: '#FFA726' },
};

const styles = `
  .care-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: var(--font-body);
    font-weight: 500;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.3s ease,
                background 0.3s ease;
    -webkit-tap-highlight-color: transparent;
    transform: translateZ(0);
    will-change: transform;
    overflow: hidden;
  }
  .care-btn:active:not(:disabled) {
    transform: scale(0.95) translateZ(0);
  }
  .care-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .care-btn--sm {
    padding: 8px 16px;
    font-size: 13px;
  }
  .care-btn--md {
    padding: 12px 24px;
    font-size: 15px;
  }
  .care-btn--lg {
    padding: 16px 32px;
    font-size: 17px;
  }
  .care-btn__icon {
    display: inline-flex;
    font-size: 1.2em;
    transform: translateZ(0);
  }
  .care-btn__label {
    display: inline-flex;
    transform: translateZ(0);
  }
  .care-btn__ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: scale(0) translateZ(0);
    animation: care-btn-ripple 0.6s ease-out forwards;
    pointer-events: none;
    will-change: transform, opacity;
  }
  @keyframes care-btn-ripple {
    0% {
      transform: scale(0) translateZ(0);
      opacity: 1;
    }
    100% {
      transform: scale(4) translateZ(0);
      opacity: 0;
    }
  }
  .care-btn.is-loading .care-btn__icon {
    animation: care-btn-spin 0.8s linear infinite;
  }
  @keyframes care-btn-spin {
    from { transform: rotate(0deg) translateZ(0); }
    to { transform: rotate(360deg) translateZ(0); }
  }
`;

let styleInjected = false;

export default function CareButton({ type, onClick, disabled = false, size = 'md' }: CareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const clickLockRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const config = CARE_CONFIG[type];

  useEffect(() => {
    if (!styleInjected && typeof document !== 'undefined') {
      const styleEl = document.createElement('style');
      styleEl.setAttribute('data-care-button-styles', 'true');
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
      styleInjected = true;
    }
  }, []);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading || clickLockRef.current) return;
      clickLockRef.current = true;

      const button = btnRef.current;
      if (button) {
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        ripple.className = 'care-btn__ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      }

      setIsLoading(true);
      try {
        await onClick();
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          clickLockRef.current = false;
        }, 300);
      }
    },
    [onClick, disabled, isLoading],
  );

  const bgColor = isLoading ? config.color : `${config.color}15`;
  const textColor = config.color;

  return (
    <button
      ref={btnRef}
      className={`care-btn care-btn--${size} ${isLoading ? 'is-loading' : ''}`}
      onClick={handleClick}
      disabled={disabled || isLoading}
      style={{
        background: bgColor,
        color: textColor,
        boxShadow: `0 2px 12px ${config.color}33`,
      }}
      title={`${config.label}（${CARE_THRESHOLDS[type]}天周期）`}
      data-testid={`care-button-${type}`}
    >
      <span className="care-btn__icon">{isLoading ? '⏳' : config.icon}</span>
      <span className="care-btn__label">{config.label}</span>
    </button>
  );
}
