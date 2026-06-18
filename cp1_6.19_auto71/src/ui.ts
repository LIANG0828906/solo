import * as THREE from 'three';
import { getConcentrationAt, getMixEfficiency } from './particles';
import { ChannelData } from './channel';

export interface UICallbacks {
  onChannelChange: (type: 'Y' | 'T' | 'serpentine') => void;
  onFlowRatioChange: (ratio: number) => void;
  onResetView: () => void;
}

let fpsEl: HTMLElement;
let mixEl: HTMLElement;
let infoLabel: HTMLElement;
let container: HTMLElement;
let cameraRef: THREE.Camera;
let channelDataRef: ChannelData;
let flowARef = 1;
let flowBRef = 1;
let rendererRef: THREE.WebGLRenderer;
let infoLabelTimer: ReturnType<typeof setTimeout> | null = null;

export function createUI(callbacks: UICallbacks): void {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    .ctrl-panel {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 56px;
      background: #16213E;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 0 24px;
      z-index: 100;
      font-family: 'Inter', sans-serif;
      animation: slideDown 0.3s ease-out;
      border-bottom: 1px solid rgba(15, 52, 96, 0.5);
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    }

    @keyframes slideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .ctrl-panel label {
      color: #E0E0E0;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
    }

    .ctrl-panel select,
    .ctrl-panel button {
      background: #0F3460;
      color: #E0E0E0;
      border: 1px solid rgba(15, 52, 96, 0.8);
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: border-color 0.2s, transform 0.2s;
      outline: none;
    }

    .ctrl-panel select:hover,
    .ctrl-panel button:hover {
      border-color: rgba(30, 80, 140, 1);
      filter: brightness(1.2);
    }

    .ctrl-panel select:focus,
    .ctrl-panel button:focus {
      border-color: #4ECDC4;
      box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.2);
    }

    .ctrl-panel button:active {
      transform: scale(0.97);
    }

    .slider-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .slider-group input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 140px;
      height: 6px;
      background: #0F3460;
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    }

    .slider-group input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      background: #FFFFFF;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
    }

    .slider-group input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.1);
    }

    .slider-group input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      background: #FFFFFF;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .slider-group input[type="range"]::-moz-range-thumb:hover {
      transform: scale(1.1);
    }

    .slider-group input[type="range"]::-moz-range-track {
      height: 6px;
      background: #0F3460;
      border-radius: 3px;
    }

    .ratio-display {
      color: #4ECDC4;
      font-size: 13px;
      font-weight: 600;
      min-width: 42px;
      text-align: center;
    }

    .fps-counter {
      position: fixed;
      bottom: 16px;
      right: 16px;
      font-family: 'Inter', monospace;
      font-size: 12px;
      color: #00FF88;
      z-index: 100;
      pointer-events: none;
    }

    .mix-display {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .mix-display .mix-val {
      color: #FF6B6B;
      font-size: 13px;
      font-weight: 600;
    }

    .info-label {
      position: fixed;
      pointer-events: none;
      z-index: 200;
      background: rgba(22, 33, 62, 0.92);
      color: #E0E0E0;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-family: 'Inter', monospace;
      line-height: 1.6;
      border: 1px solid rgba(78, 205, 196, 0.3);
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      opacity: 0;
      transition: opacity 0.2s ease-in;
      backdrop-filter: blur(8px);
    }

    .info-label.visible {
      opacity: 1;
    }

    @media (max-width: 767px) {
      .ctrl-panel {
        top: auto;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: #0F1B33;
        flex-wrap: nowrap;
        gap: 12px;
        padding: 0 12px;
        overflow-x: auto;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .ctrl-panel label { font-size: 11px; }
      .ctrl-panel select,
      .ctrl-panel button { padding: 5px 10px; font-size: 11px; }
      .slider-group input[type="range"] { width: 100px; }

      .fps-counter {
        bottom: auto;
        right: auto;
        top: 8px;
        left: 8px;
      }
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'ctrl-panel';
  panel.innerHTML = `
    <label>通道模板</label>
    <select id="channel-select">
      <option value="Y">Y型</option>
      <option value="T">T型</option>
      <option value="serpentine">蛇形</option>
    </select>
    <div class="slider-group">
      <label>流速比 A:B</label>
      <input type="range" id="flow-ratio" min="0.1" max="5.0" step="0.1" value="1.0" />
      <span class="ratio-display" id="ratio-display">1.0:1</span>
    </div>
    <div class="mix-display">
      <label>混合效率</label>
      <span class="mix-val" id="mix-val">0%</span>
    </div>
    <button id="reset-btn">重置视角</button>
  `;
  document.body.appendChild(panel);

  fpsEl = document.createElement('div');
  fpsEl.className = 'fps-counter';
  document.body.appendChild(fpsEl);

  mixEl = document.getElementById('mix-val')!;
  infoLabel = document.createElement('div');
  infoLabel.className = 'info-label';
  document.body.appendChild(infoLabel);

  const channelSelect = document.getElementById('channel-select') as HTMLSelectElement;
  channelSelect.addEventListener('change', () => {
    callbacks.onChannelChange(channelSelect.value as 'Y' | 'T' | 'serpentine');
  });

  const flowSlider = document.getElementById('flow-ratio') as HTMLInputElement;
  const ratioDisplay = document.getElementById('ratio-display')!;
  flowSlider.addEventListener('input', () => {
    const val = parseFloat(flowSlider.value);
    ratioDisplay.textContent = `${val.toFixed(1)}:1`;
    callbacks.onFlowRatioChange(val);
  });

  document.getElementById('reset-btn')!.addEventListener('click', () => {
    callbacks.onResetView();
  });

  container = document.getElementById('canvas-container')!;
}

export function setCameraRef(cam: THREE.Camera): void {
  cameraRef = cam;
}

export function setRendererRef(renderer: THREE.WebGLRenderer): void {
  rendererRef = renderer;
}

export function setChannelDataRef(data: ChannelData): void {
  channelDataRef = data;
}

export function setFlowRef(a: number, b: number): void {
  flowARef = a;
  flowBRef = b;
}

export function updateUI(fps: number, mixEfficiency: number): void {
  fpsEl.textContent = `${fps} FPS`;
  mixEl.textContent = `${Math.round(mixEfficiency)}%`;
}

export function setupClickHandler(scene: THREE.Scene): void {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  container.addEventListener('click', (event: MouseEvent) => {
    if (!cameraRef || !channelDataRef) return;

    const rect = rendererRef.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef);

    const channelGroup = scene.getObjectByName('channelGroup');
    if (!channelGroup) return;

    const meshes: THREE.Mesh[] = [];
    channelGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });

    const intersects = raycaster.intersectObjects(meshes);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const conc = getConcentrationAt(point, channelDataRef, flowARef, flowBRef);

      infoLabel.innerHTML =
        `坐标: (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})<br>` +
        `浓度: A:${conc.a}% B:${conc.b}%`;

      const screenPos = point.clone().project(cameraRef);
      const x = (screenPos.x * 0.5 + 0.5) * rect.width + rect.left;
      const y = (-screenPos.y * 0.5 + 0.5) * rect.height + rect.top;

      infoLabel.style.left = `${x + 12}px`;
      infoLabel.style.top = `${y - 20}px`;
      infoLabel.classList.add('visible');

      if (infoLabelTimer) clearTimeout(infoLabelTimer);
      infoLabelTimer = setTimeout(() => {
        infoLabel.classList.remove('visible');
      }, 3000);
    } else {
      infoLabel.classList.remove('visible');
    }
  });
}
