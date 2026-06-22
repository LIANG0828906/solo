import { ComponentType, EventType } from './store/store';

export interface AnimationStyle {
  transition?: string;
  transform?: string;
  opacity?: number;
  boxShadow?: string;
  animation?: string;
}

export const BASE_TRANSITION = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

export function bounce(duration = 0.3): AnimationStyle {
  return {
    animation: `microBounce ${duration}s cubic-bezier(0.68, -0.55, 0.265, 1.55)`,
  };
}

export function fade(duration = 0.5): AnimationStyle {
  return {
    transition: `opacity ${duration}s ease`,
  };
}

export function rotate(deg: number, duration = 0.4): AnimationStyle {
  return {
    animation: `microRotate ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
  };
}

export function scale(from: number, to: number, duration = 0.2): AnimationStyle {
  return {
    animation: `microScaleBounce ${duration}s cubic-bezier(0.68, -0.55, 0.265, 1.55)`,
  };
}

export function floatUp(offset = 4, duration = 0.3): AnimationStyle {
  return {
    transform: `translateY(-${offset}px)`,
    boxShadow:
      '0 12px 24px rgba(99, 102, 241, 0.25)',
    transition: `all ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
  };
}

export function placeBounce(): AnimationStyle {
  return {
    animation: `placeBounce 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)`,
  };
}

export function fadeOut(duration = 0.5): AnimationStyle {
  return {
    animation: `fadeOutAnim ${duration}s ease forwards`,
  };
}

export function injectAnimationKeyframes(): string {
  return `
    @keyframes microBounce {
      0% { transform: scale(1); }
      30% { transform: scale(0.92); }
      50% { transform: scale(1.08); }
      70% { transform: scale(0.96); }
      100% { transform: scale(1); }
    }
    @keyframes microRotate {
      0% { transform: rotate(0deg); }
      50% { transform: rotate(90deg); }
      100% { transform: rotate(180deg); }
    }
    @keyframes microScaleBounce {
      0% { transform: scale(0.8); }
      60% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    @keyframes placeBounce {
      0% { transform: scale(0.8); }
      60% { transform: scale(1.06); }
      100% { transform: scale(1); }
    }
    @keyframes fadeOutAnim {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.85); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes logFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
}

export function getAnimationFor(
  componentType: ComponentType,
  eventType: EventType,
): AnimationStyle {
  switch (eventType) {
    case 'onClick':
      if (
        componentType === 'primary-button' || componentType === 'secondary-button' || componentType === 'modal') {
        return bounce(0.3);
      }
      if (componentType === 'switch') {
        return rotate(180, 0.4);
      }
      return bounce(0.3);

    case 'onHover':
      if (
        componentType === 'card' || componentType === 'accordion' || componentType === 'notification') {
        return floatUp(4, 0.3);
      }
      if (componentType === 'primary-button' || componentType === 'secondary-button') {
        return { transition: BASE_TRANSITION };
      }
      return {};

    case 'onLongPress':
      if (componentType === 'switch') {
        return rotate(180, 0.5);
      }
      return scale(1, 1.15, 0.3);

    default:
      return {};
  }
}
