import { SimulationEngine } from './engine/simulationEngine';
import { SceneRenderer } from './renderer/sceneRenderer';
import { useSimulationStore } from './stores/simulationStore';

const app = document.getElementById('app')!;

const renderer = new SceneRenderer(app);
const engine = new SimulationEngine(100);

renderer.initParticles(engine.getParticles());

let animationId: number;
let frameCount = 0;
let fpsUpdateTime = 0;

function createControlPanel(): HTMLDivElement {
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    width: 240px;
    background: rgba(15, 15, 30, 0.85);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    padding: 16px;
    color: white;
    font-family: monospace;
    z-index: 1000;
    user-select: none;
  `;
  
  const title = document.createElement('div');
  title.textContent = '分子动力学模拟沙盒';
  title.style.cssText = `
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 16px;
    color: #6C63FF;
    text-align: center;
  `;
  panel.appendChild(title);
  
  const controls = [
    {
      label: '粒子数量',
      key: 'particleCount',
      min: 50,
      max: 500,
      step: 10,
      value: 100,
      color: '#6C63FF'
    },
    {
      label: '温度',
      key: 'temperature',
      min: 0.1,
      max: 5.0,
      step: 0.1,
      value: 1.0
    },
    {
      label: '引力系数',
      key: 'gravityCoeff',
      min: 0.0,
      max: 2.0,
      step: 0.01,
      value: 1.0
    },
    {
      label: '斥力系数',
      key: 'repulsionCoeff',
      min: 0.0,
      max: 2.0,
      step: 0.01,
      value: 1.0
    }
  ];
  
  controls.forEach(control => {
    const controlDiv = document.createElement('div');
    controlDiv.style.cssText = 'margin-bottom: 16px;';
    
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
    
    const sliderId = `slider-${control.key}`;
    
    const label = document.createElement('label');
    label.textContent = control.label;
    label.htmlFor = sliderId;
    label.style.cssText = 'font-size: 12px; color: white;';
    
    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = control.value.toString();
    valueDisplay.style.cssText = 'font-size: 10px; color: #B0B0D0;';
    
    header.appendChild(label);
    header.appendChild(valueDisplay);
    controlDiv.appendChild(header);
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = sliderId;
    slider.name = control.label;
    slider.min = control.min.toString();
    slider.max = control.max.toString();
    slider.step = control.step.toString();
    slider.value = control.value.toString();
    slider.style.cssText = `
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.1);
      outline: none;
      -webkit-appearance: none;
      transition: all 0.2s ease;
      cursor: pointer;
    `;
    
    const accentColor = control.color || '#6C63FF';
    
    const style = document.createElement('style');
    style.textContent = `
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: ${accentColor};
        cursor: pointer;
        transition: all 0.2s ease;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }
      input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: ${accentColor};
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
      }
      input[type="range"]::-moz-range-thumb:hover {
        transform: scale(1.2);
      }
    `;
    panel.appendChild(style);
    
    slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      valueDisplay.textContent = value.toString();
      
      const store = useSimulationStore.getState();
      
      switch (control.key) {
        case 'particleCount':
          store.setParticleCount(value);
          engine.setParticleCount(value);
          renderer.initParticles(engine.getParticles());
          break;
        case 'temperature':
          store.setTemperature(value);
          break;
        case 'gravityCoeff':
          store.setGravityCoeff(value);
          break;
        case 'repulsionCoeff':
          store.setRepulsionCoeff(value);
          break;
      }
    });
    
    controlDiv.appendChild(slider);
    panel.appendChild(controlDiv);
  });
  
  const buttonsDiv = document.createElement('div');
  buttonsDiv.style.cssText = 'display: flex; gap: 8px; margin-bottom: 12px;';
  
  const playPauseBtn = document.createElement('button');
  playPauseBtn.textContent = '暂停';
  playPauseBtn.style.cssText = `
    flex: 1;
    height: 40px;
    background: #6C63FF;
    color: white;
    border: none;
    border-radius: 6px;
    font-family: monospace;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  `;
  
  playPauseBtn.addEventListener('mouseenter', () => {
    playPauseBtn.style.background = '#5A52D9';
  });
  
  playPauseBtn.addEventListener('mouseleave', () => {
    playPauseBtn.style.background = '#6C63FF';
  });
  
  playPauseBtn.addEventListener('click', () => {
    const store = useSimulationStore.getState();
    const newState = !store.isRunning;
    store.setRunning(newState);
    playPauseBtn.textContent = newState ? '暂停' : '运行';
  });
  
  const resetBtn = document.createElement('button');
  resetBtn.textContent = '重置';
  resetBtn.style.cssText = `
    flex: 1;
    height: 40px;
    background: #6C63FF;
    color: white;
    border: none;
    border-radius: 6px;
    font-family: monospace;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  `;
  
  resetBtn.addEventListener('mouseenter', () => {
    resetBtn.style.background = '#5A52D9';
  });
  
  resetBtn.addEventListener('mouseleave', () => {
    resetBtn.style.background = '#6C63FF';
  });
  
  resetBtn.addEventListener('click', () => {
    useSimulationStore.getState().reset();
    engine.reset();
    renderer.initParticles(engine.getParticles());
    
    const sliders = panel.querySelectorAll('input[type="range"]');
    const displays = panel.querySelectorAll('span:nth-child(2)');
    const defaultValues = [100, 1.0, 1.0, 1.0];
    
    sliders.forEach((slider, index) => {
      (slider as HTMLInputElement).value = defaultValues[index].toString();
      if (displays[index]) {
        displays[index].textContent = defaultValues[index].toString();
      }
    });
    
    playPauseBtn.textContent = '暂停';
  });
  
  buttonsDiv.appendChild(playPauseBtn);
  buttonsDiv.appendChild(resetBtn);
  panel.appendChild(buttonsDiv);
  
  return panel;
}

function createPerformanceMonitor(): HTMLDivElement {
  const monitor = document.createElement('div');
  monitor.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    padding: 8px 12px;
    font-family: monospace;
    font-size: 14px;
    color: #00FF88;
    z-index: 1000;
    user-select: none;
  `;
  
  const fpsDiv = document.createElement('div');
  fpsDiv.textContent = 'FPS: 60';
  
  const particlesDiv = document.createElement('div');
  particlesDiv.textContent = '粒子: 100';
  
  const modeDiv = document.createElement('div');
  modeDiv.textContent = '模式: 球体';
  
  monitor.appendChild(fpsDiv);
  monitor.appendChild(particlesDiv);
  monitor.appendChild(modeDiv);
  
  return monitor;
}

const controlPanel = createControlPanel();
const performanceMonitor = createPerformanceMonitor();

document.body.appendChild(controlPanel);
document.body.appendChild(performanceMonitor);

let degraded = false;

function checkPerformance(fps: number): void {
  const store = useSimulationStore.getState();
  const particleCount = store.particleCount;
  
  if (fps < 30 && !degraded) {
    degraded = true;
    store.setRenderMode('points');
    store.setShowBonds(false);
    store.setShowTrails(false);
  } else if (fps > 45 && degraded) {
    degraded = false;
    store.setRenderMode('sphere');
    store.setShowBonds(particleCount <= 300);
    store.setShowTrails(particleCount <= 200);
  }
  
  if (particleCount > 200 && store.showTrails) {
    store.setShowTrails(false);
  }
  
  if (particleCount > 300 && store.showBonds) {
    store.setShowBonds(false);
  }
  
  const modeDiv = performanceMonitor.querySelector('div:nth-child(3)') as HTMLDivElement;
  modeDiv.textContent = `模式: ${store.mode === 'sphere' ? '球体' : '点'}`;
}

function animate(currentTime: number): void {
  animationId = requestAnimationFrame(animate);
  
  frameCount++;
  const deltaTime = currentTime - fpsUpdateTime;
  
  if (deltaTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / deltaTime);
    useSimulationStore.getState().setFps(fps);
    
    const fpsDiv = performanceMonitor.querySelector('div:nth-child(1)') as HTMLDivElement;
    fpsDiv.textContent = `FPS: ${fps}`;
    
    const particlesDiv = performanceMonitor.querySelector('div:nth-child(2)') as HTMLDivElement;
    particlesDiv.textContent = `粒子: ${useSimulationStore.getState().particleCount}`;
    
    checkPerformance(fps);
    
    frameCount = 0;
    fpsUpdateTime = currentTime;
  }
  
  engine.step();
  renderer.update(engine.getParticles());
  renderer.render();
}

animationId = requestAnimationFrame(animate);

window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(animationId);
  renderer.dispose();
});
