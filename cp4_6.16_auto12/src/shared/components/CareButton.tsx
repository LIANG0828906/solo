import { useState, useRef, useCallback, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { CareType, CARE_THRESHOLDS } from '../../modules/plants/plantsStore';
import { useThrottledAction } from '../utils/debounce';

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

const spinKeyframes = keyframes`
  from { transform: rotate(0deg) translateZ(0); }
  to { transform: rotate(360deg) translateZ(0); }
`;

const rippleKeyframes = keyframes`
  0% {
    transform: scale(0) translateZ(0);
    opacity: 1;
  }
  100% {
    transform: scale(4) translateZ(0);
    opacity: 0;
  }
`;

const StyledButton = styled.button<{ $color: string; $size: string; $loading: boolean }>`
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
  transition:
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease,
    background 0.3s ease;
  -webkit-tap-highlight-color: transparent;
  transform: translateZ(0);
  will-change: transform;
  overflow: hidden;
  background: ${({ $color, $loading }) => ($loading ? $color : `${$color}15`)};
  color: ${({ $color }) => $color};
  box-shadow: 0 2px 12px ${({ $color }) => `${$color}33`};

  padding: ${({ $size }) =>
    $size === 'sm' ? '8px 16px' : $size === 'lg' ? '16px 32px' : '12px 24px'};
  font-size: ${({ $size }) =>
    $size === 'sm' ? '13px' : $size === 'lg' ? '17px' : '15px'};

  &:active:not(:disabled) {
    transform: scale(0.95) translateZ(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const IconSpan = styled.span<{ $loading: boolean }>`
  display: inline-flex;
  font-size: 1.2em;
  transform: translateZ(0);
  animation: ${({ $loading }) => ($loading ? spinKeyframes : 'none')} 0.8s linear infinite;
`;

const LabelSpan = styled.span`
  display: inline-flex;
  transform: translateZ(0);
`;

const RippleSpan = styled.span`
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transform: scale(0) translateZ(0);
  animation: ${rippleKeyframes} 0.6s ease-out forwards;
  pointer-events: none;
  will-change: transform, opacity;
`;

export default function CareButton({ type, onClick, disabled = false, size = 'md' }: CareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const config = CARE_CONFIG[type];

  const throttledOnClick = useThrottledAction(onClick, 500);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;

      const button = btnRef.current;
      if (button) {
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        const rippleSize = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${rippleSize}px`;
        ripple.style.left = `${e.clientX - rect.left - rippleSize / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - rippleSize / 2}px`;
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      }

      setIsLoading(true);
      try {
        await throttledOnClick();
      } finally {
        setIsLoading(false);
      }
    },
    [throttledOnClick, disabled, isLoading],
  );

  return (
    <StyledButton
      ref={btnRef}
      $color={config.color}
      $size={size}
      $loading={isLoading}
      onClick={handleClick}
      disabled={disabled || isLoading}
      title={`${config.label}（${CARE_THRESHOLDS[type]}天周期）`}
      data-testid={`care-button-${type}`}
    >
      <IconSpan $loading={isLoading}>{isLoading ? '⏳' : config.icon}</IconSpan>
      <LabelSpan>{config.label}</LabelSpan>
    </StyledButton>
  );
}
