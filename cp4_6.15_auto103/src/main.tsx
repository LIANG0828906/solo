import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import useSketchStore from './store/useSketchStore';

// 显式初始化 Zustand store
// Zustand 是全局单例模式，不需要 Provider
// 这里调用 getState() 确保 store 在应用启动时完成初始化
const storeInitialized = useSketchStore.getState();
console.log('🎨 Zustand Store 已初始化:', {
  原始图片URL: storeInitialized.originalImageUrl,
  图层分组数: storeInitialized.layerGroups.length,
  缩放比例: storeInitialized.zoom,
});

// 全局错误边界（开发模式）
if (import.meta.env.DEV) {
  window.addEventListener('error', (event) => {
    console.error('💥 全局错误:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 未处理的 Promise 拒绝:', event.reason);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 性能监控（开发模式）
if (import.meta.env.DEV) {
  let lastTime = performance.now();
  let frameCount = 0;

  function measureFPS() {
    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      if (fps < 50) {
        console.warn(`⚠️ 帧率低于 50fps: 当前 ${fps}fps`);
      }
      frameCount = 0;
      lastTime = currentTime;
    }
    requestAnimationFrame(measureFPS);
  }

  requestAnimationFrame(measureFPS);
  console.log('📊 性能监控已启动（目标: 50fps+）');
}
