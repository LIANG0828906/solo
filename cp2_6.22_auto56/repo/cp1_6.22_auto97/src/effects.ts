export interface Effect {
  id: string;
  title: string;
  description: string;
  className: string;
  codeTemplate: string;
}

export const effects: Effect[] = [
  {
    id: 'ripple',
    title: '水波纹效果',
    description: '点击时从触点扩散的圆形波纹',
    className: 'effect-ripple',
    codeTemplate: `.preview-element {
  position: relative;
  overflow: hidden;
}

.preview-element .ripple-wave {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  transform: scale(0);
  animation: ripple-animation 0.6s linear;
  pointer-events: none;
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}`
  },
  {
    id: 'elastic',
    title: '弹性缩放',
    description: '悬停时带有弹性回弹的缩放效果',
    className: 'effect-elastic',
    codeTemplate: `.preview-element:hover {
  animation: elastic-bounce 0.5s ease;
}

@keyframes elastic-bounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.15); }
  50% { transform: scale(0.9); }
  70% { transform: scale(1.05); }
  100% { transform: scale(1); }
}`
  },
  {
    id: 'rotate',
    title: '旋转悬浮',
    description: '悬停时轻微旋转并放大',
    className: 'effect-rotate',
    codeTemplate: `.preview-element {
  transition: all 0.3s ease;
}

.preview-element:hover {
  transform: rotate(5deg) scale(1.05);
}`
  },
  {
    id: 'sweep',
    title: '渐变扫光',
    description: '悬停时从左到右的高光扫过效果',
    className: 'effect-sweep',
    codeTemplate: `.preview-element {
  position: relative;
  overflow: hidden;
}

.preview-element::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transition: left 0.5s ease;
}

.preview-element:hover::before {
  left: 100%;
}`
  }
];

export function getEffectById(id: string): Effect | undefined {
  return effects.find(e => e.id === id);
}

export function getFirstEffect(): Effect {
  return effects[0];
}
