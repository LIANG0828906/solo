import React from 'react';
import { createRoot } from 'react-dom/client';
import { SceneManager } from './core/SceneManager';
import { GraphEngine } from './core/GraphEngine';
import { PointRenderer } from './renderers/PointRenderer';
import { CurveRenderer } from './renderers/CurveRenderer';
import { FaceRenderer } from './renderers/FaceRenderer';
import { ControlPanel } from './ui/ControlPanel';
import type { SceneConfig } from './types';

const INITIAL_CONFIG: SceneConfig = {
  glowIntensity: 0.6,
  rotationSpeed: 0.005,
  subPointAmplitude: 0.3,
};

function initApp() {
  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    console.error('[StarWeaver] 找不到 three-canvas 元素');
    return;
  }

  const config: SceneConfig = { ...INITIAL_CONFIG };
  const sceneManager = new SceneManager(canvas, config);
  const graph = new GraphEngine(config);

  const pointRenderer = new PointRenderer(sceneManager, graph);
  const curveRenderer = new CurveRenderer(sceneManager, graph);
  const faceRenderer = new FaceRenderer(sceneManager, graph);

  const rootEl = document.getElementById('root');
  if (rootEl) {
    const root = createRoot(rootEl);
    root.render(
      React.createElement(ControlPanel, {
        initialConfig: { ...config },
        onConfigChange: (partial) => {
          Object.assign(config, partial);
          graph.updateConfig(partial);
          sceneManager.config = config;
        },
        onReset: () => {
          graph.reset();
        },
      })
    );
  }

  sceneManager.start();
  console.log('[StarWeaver] 星轨织造者已启动');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
