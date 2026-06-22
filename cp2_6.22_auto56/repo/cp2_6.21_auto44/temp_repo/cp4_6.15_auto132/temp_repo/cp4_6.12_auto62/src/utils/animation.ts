import type { FlowNode } from '../types';

export function generateCSSAnimation(node: FlowNode): string {
  const { trigger, duration, easing } = node.animation;
  const easingValue = easing === 'cubic-bezier' ? 'cubic-bezier(0.4, 0, 0.2, 1)' : easing;
  
  let triggerComment = '';
  let selector = '.element';
  
  switch (trigger) {
    case 'click':
      triggerComment = '/* 点击触发 - 需要JavaScript配合 */';
      selector = '.element:active, .element.clicked';
      break;
    case 'hover':
      triggerComment = '/* 悬停触发 */';
      selector = '.element:hover';
      break;
    case 'load':
      triggerComment = '/* 页面加载触发 */';
      selector = '.element';
      break;
    case 'timer':
      triggerComment = '/* 定时触发 - 需要JavaScript配合 */';
      selector = '.element';
      break;
  }
  
  return `${triggerComment}
${selector} {
  animation: stateTransition_${node.id} ${duration}ms ${easingValue};
}

@keyframes stateTransition_${node.id} {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 节点状态: ${node.name} */
/* 背景色: ${node.color} */`;
}

export function generateJSAnimation(node: FlowNode): string {
  const { trigger, duration, easing } = node.animation;
  const easingValue = easing === 'cubic-bezier' ? 'cubic-bezier(0.4, 0, 0.2, 1)' : easing;
  
  let triggerCode = '';
  
  switch (trigger) {
    case 'click':
      triggerCode = `element.addEventListener('click', () => playAnimation());`;
      break;
    case 'hover':
      triggerCode = `element.addEventListener('mouseenter', () => playAnimation());`;
      break;
    case 'load':
      triggerCode = `window.addEventListener('load', () => playAnimation());`;
      break;
    case 'timer':
      triggerCode = `setInterval(() => playAnimation(), ${duration * 2});`;
      break;
  }
  
  return `// 节点: ${node.name}
// 动画配置 - 触发器: ${trigger}, 持续时间: ${duration}ms, 缓动: ${easingValue}

const element = document.querySelector('.element');

function playAnimation() {
  element.animate([
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(1.1)', opacity: 0.8, offset: 0.5 },
    { transform: 'scale(1)', opacity: 1 }
  ], {
    duration: ${duration},
    easing: '${easingValue}',
    fill: 'forwards'
  });
}

${triggerCode}`;
}

export function getEasingFunction(easing: string): (t: number) => number {
  switch (easing) {
    case 'linear':
      return (t) => t;
    case 'ease-in':
      return (t) => t * t * t;
    case 'ease-out':
      return (t) => 1 - Math.pow(1 - t, 3);
    case 'ease':
    case 'cubic-bezier':
    default:
      return (t) => {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
  }
}
