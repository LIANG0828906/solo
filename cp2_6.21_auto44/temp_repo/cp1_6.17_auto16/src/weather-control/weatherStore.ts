// ============================================================================
// 天气状态管理模块 - weatherStore.ts
// 职责: 定义天气类型枚举，使用 Zustand 管理全局天气状态
// 调用关系:
//   - 被 WeatherControlPanel.tsx 调用: setWeather 方法切换天气
//   - 被 ParticleCanvas.tsx 订阅: weather 状态驱动粒子渲染
//   - 被 App.tsx 订阅: weather 状态驱动背景色变化
//   - 被 ambientSound.ts 间接调用: 通过 WeatherControlPanel 触发音效切换
// 数据流向: WeatherControlPanel → setWeather → weatherStore → 各订阅组件
// ============================================================================

import { create } from 'zustand';

export enum WeatherType {
  Sunny = 'sunny',
  Rainy = 'rainy',
  Snowy = 'snowy',
  Stormy = 'stormy',
}

interface WeatherState {
  weather: WeatherType;
  setWeather: (w: WeatherType) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  weather: WeatherType.Sunny,
  setWeather: (weather) => set({ weather }),
}));
