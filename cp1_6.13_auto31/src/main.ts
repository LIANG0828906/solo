import { Controller } from './controller';

function bootstrap(): void {
  try {
    new Controller('#app');
  } catch (e) {
    console.error('[KaleidoSnap] 初始化失败:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
