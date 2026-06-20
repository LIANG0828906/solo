import { parseGradient } from './parser';
import type { GradientConfig } from './parser';
import { ParticleSystem, type ParticleConfig } from './particles';
import { UIController, type Preset, exportSVG } from './ui';

const PRESETS: Preset[] = [
  { name: '极光梦境', css: 'linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)' },
  { name: '落日熔金', css: 'radial-gradient(circle, #F27121 0%, #E94057 50%, #8A2387 100%)' },
  { name: '深海幽蓝', css: 'linear-gradient(180deg, #0F2027 0%, #203A43 50%, #2C5364 100%)' },
  { name: '霓虹闪烁', css: 'conic-gradient(from 0deg, #ff0080, #ff8c00, #40e0d0, #ff0080)' },
  { name: '紫罗兰梦', css: 'linear-gradient(45deg, #834d9b 0%, #d04ed6 100%)' },
  { name: '晨曦微露', css: 'linear-gradient(90deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: '星际穿越', css: 'radial-gradient(ellipse at center, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
];

const DEFAULT_CONFIG: ParticleConfig = {
  count: 200,
  speed: 0.8,
  size: 4,
  alpha: 0.6,
};

const DEFAULT_CSS = PRESETS[0].css;

let particleSystem: ParticleSystem | null = null;
let uiController: UIController | null = null;
let currentGradient: GradientConfig | null = null;

function handleCodeChange(css: string): void {
  if (!particleSystem || !uiController) return;

  const result = parseGradient(css);
  uiController.updateErrorMarkers(result);

  if (result.success && result.gradient) {
    currentGradient = result.gradient;
    particleSystem.setGradient(result.gradient);
  }
}

function handleConfigChange(config: ParticleConfig): void {
  if (!particleSystem) return;
  particleSystem.setConfig(config);
}

function handleExport(): void {
  if (!particleSystem || !currentGradient || !uiController) return;

  uiController.showExportLoading();

  setTimeout(() => {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportSVG(particleSystem!, currentGradient!, `gradient-particles-${timestamp}.svg`);
    uiController!.hideExportLoading();
  }, 800);
}

function handleCanvasClick(): void {
  if (!particleSystem || !uiController) return;
  const locked = particleSystem.toggleLock();
  uiController.toggleLockIcon(locked);
}

function handleFpsUpdate(fps: number): void {
  if (uiController) {
    uiController.updateFps(fps);
  }
}

function init(): void {
  const canvas = document.getElementById('previewCanvas') as HTMLCanvasElement;
  const editor = document.getElementById('codeEditor') as HTMLTextAreaElement;

  if (!canvas || !editor) {
    console.error('缺少必要的DOM元素');
    return;
  }

  const initialResult = parseGradient(DEFAULT_CSS);
  if (!initialResult.success || !initialResult.gradient) {
    console.error('默认渐变解析失败');
    return;
  }

  currentGradient = initialResult.gradient;

  try {
    particleSystem = new ParticleSystem(
      canvas,
      currentGradient,
      DEFAULT_CONFIG,
      handleFpsUpdate
    );

    uiController = new UIController(editor, handleCodeChange);

    uiController.setupPresets(PRESETS);
    uiController.setupSliders(DEFAULT_CONFIG, handleConfigChange);
    uiController.setupExportButton(handleExport);
    uiController.setCode(DEFAULT_CSS);

    canvas.addEventListener('click', handleCanvasClick);

    window.addEventListener('resize', () => {
      if (particleSystem) {
        particleSystem.resize();
      }
    });

    particleSystem.start();

    console.log('CSS渐变粒子预览工具已启动');
  } catch (error) {
    console.error('初始化失败:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
