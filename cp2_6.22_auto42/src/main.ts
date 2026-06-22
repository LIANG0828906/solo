// 应用入口：初始化场景、相机、渲染器，加载控制面板UI，组合3D场景与数据模块

import { TyphoonScene } from '@/scene/TyphoonScene';
import { DataService, type DataPoint, type CityImpact } from '@/data/DataService';
import { ControlPanel } from '@/ui/ControlPanel';
import { CityInfoPanel } from '@/ui/CityInfoPanel';

async function bootstrap(): Promise<void> {
  const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement | null;
  const app = document.getElementById('app');
  if (!canvas || !app) {
    console.error('[Typhoon] #scene-canvas or #app not found');
    return;
  }

  // ========= 1. 加载数据（并行） =========
  let pathData: DataPoint[] = [];
  let cityData: CityImpact[] = [];
  try {
    [pathData, cityData] = await Promise.all([
      retry(() => DataService.fetchPath(), 3),
      retry(() => DataService.fetchCities(), 3),
    ]);
  } catch (e) {
    console.warn('[Typhoon] 后端数据获取失败，请确认 `npm run dev:back` 是否已启动 (port 3001)：', e);
    // 轻量降级：即便后端未启动，前端仍可启动并显示地球（以空数据占位）
    const banner = document.createElement('div');
    banner.textContent = '后端数据服务未连接 (http://localhost:3001)，请运行 npm run dev 同时启动后端';
    Object.assign(banner.style, {
      position: 'fixed',
      top: '72px',
      left: '32px',
      right: '32px',
      padding: '10px 14px',
      borderRadius: '10px',
      background: 'rgba(239,68,68,0.16)',
      color: '#ffb4b4',
      border: '1px solid rgba(239,68,68,0.4)',
      fontSize: '13px',
      zIndex: '20',
    });
    document.body.appendChild(banner);
  }

  // ========= 2. 初始化 3D 场景 =========
  const scene = new TyphoonScene(app, canvas, {
    onCityClick: (id) => cityPanel.openFor(id),
    onTimeStepChange: (s) => {
      panel.updateTimeStep(s);
      cityPanel.setCurrentStep(s);
      // 同步stats
      const pt = pathData[s];
      if (pt) {
        panel.updateStats({
          step: s,
          total: pathData.length,
          windSpeed: pt.windSpeed,
          pressure: pt.pressure,
          category: pt.category,
          lat: pt.lat,
          lng: pt.lng,
        });
      }
    },
  });

  if (pathData.length) scene.setPathData(pathData);
  if (cityData.length) scene.setCityData(cityData);

  // ========= 3. UI 控制面板 =========
  const panelHost = document.body;
  const panel = new ControlPanel(panelHost, {
    onPlay: () => {
      scene.play();
    },
    onPause: () => {
      scene.pause();
    },
    onReset: () => {
      scene.reset();
      panel.setPlaying(false);
    },
    onTimeStepChange: (step) => {
      scene.jumpTo(step);
      cityPanel.setCurrentStep(step);
      const pt = pathData[step];
      if (pt) {
        panel.updateStats({
          step,
          total: pathData.length,
          windSpeed: pt.windSpeed,
          pressure: pt.pressure,
          category: pt.category,
          lat: pt.lat,
          lng: pt.lng,
        });
      }
    },
    onSpeedChange: (mult) => scene.setSpeed(mult),
    onViewToggle: (mode) => scene.switchCameraMode(mode),
    onHeatmapToggle: (enabled) => scene.setHeatmapVisible(enabled),
  });

  // ========= 4. 城市信息面板 =========
  const cityPanel = new CityInfoPanel(document.body);
  cityPanel.setCityData(cityData);

  // ========= 5. 初始 stats 同步 =========
  if (pathData.length) {
    panel.updateTimeStep(0);
    const p = pathData[0];
    panel.updateStats({
      step: 0,
      total: pathData.length,
      windSpeed: p.windSpeed,
      pressure: p.pressure,
      category: p.category,
      lat: p.lat,
      lng: p.lng,
    });
  }

  // ========= 6. 启动渲染循环 =========
  scene.start();

  // 调试暴露
  (window as any).__typhoon = { scene, pathData, cityData, panel, cityPanel };
  console.info('[Typhoon] 启动完成。粒子数量 2600 · 时间步 72 · 城市数', cityData.length);
}

async function retry<T>(fn: () => Promise<T>, n: number, waitMs = 400): Promise<T> {
  let last: unknown;
  for (let i = 0; i < n; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  throw last;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
