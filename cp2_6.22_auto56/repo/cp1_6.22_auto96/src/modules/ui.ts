import * as THREE from 'three';
import { InteractionApi } from './interaction';

interface ToolbarButton {
  id: string;
  icon: string;
  title: string;
  toggle?: boolean;
  onClick: (active: boolean, btn: HTMLButtonElement) => void;
}

export function initUI(interactionApi: InteractionApi, camera: THREE.PerspectiveCamera): void {
  createToolbar(interactionApi);
  createAxisIndicator(camera);
  addGlobalStyles();
}

function createToolbar(interactionApi: InteractionApi): void {
  const app = document.getElementById('app')!;

  const toolbar = document.createElement('div');
  toolbar.id = 'toolbar';
  toolbar.className = 'toolbar';
  toolbar.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 40px;
    background: rgba(45, 45, 68, 0.9);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-right: 1px solid rgba(0, 210, 255, 0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0;
    gap: 8px;
    z-index: 200;
  `;

  const buttons: ToolbarButton[] = [
    {
      id: 'rotate',
      icon: '⟳',
      title: '自动旋转',
      toggle: true,
      onClick: (active) => {
        const controls = (window as any).__orbitControls;
        if (controls) controls.autoRotate = active;
      },
    },
    {
      id: 'zoom-in',
      icon: '⊕',
      title: '放大',
      onClick: () => {
        const controls = (window as any).__orbitControls;
        const cam = (window as any).__camera;
        if (controls && cam) {
          const dir = new THREE.Vector3();
          cam.getWorldDirection(dir);
          cam.position.addScaledVector(dir, -2);
        }
      },
    },
    {
      id: 'zoom-out',
      icon: '⊖',
      title: '缩小',
      onClick: () => {
        const cam = (window as any).__camera;
        const controls = (window as any).__orbitControls;
        if (controls && cam) {
          const dir = new THREE.Vector3();
          cam.getWorldDirection(dir);
          cam.position.addScaledVector(dir, 2);
        }
      },
    },
    {
      id: 'borehole',
      icon: '⇩',
      title: '生成钻孔',
      toggle: true,
      onClick: (active, btn) => {
        interactionApi.enableBoreholeMode(active);
        if (active) {
          btn.style.background = 'rgba(0, 210, 255, 0.25)';
          btn.style.color = '#00d2ff';
          btn.style.boxShadow = '0 0 12px rgba(0, 210, 255, 0.4)';
        } else {
          btn.style.background = '';
          btn.style.color = '';
          btn.style.boxShadow = '';
        }
      },
    },
    {
      id: 'section',
      icon: '▤',
      title: '剖面视图',
      toggle: true,
      onClick: (active, btn) => {
        const layers = (window as any).__layers;
        if (!layers) return;
        layers.forEach((entry: any) => {
          const mat = entry.mesh.material as THREE.MeshPhysicalMaterial;
          if (active) {
            mat.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)];
          } else {
            mat.clippingPlanes = [];
          }
        });
        const renderer = (window as any).__renderer;
        if (renderer) renderer.localClippingEnabled = active;
        if (active) {
          btn.style.background = 'rgba(0, 210, 255, 0.25)';
          btn.style.color = '#00d2ff';
          btn.style.boxShadow = '0 0 12px rgba(0, 210, 255, 0.4)';
        } else {
          btn.style.background = '';
          btn.style.color = '';
          btn.style.boxShadow = '';
        }
      },
    },
    {
      id: 'reset',
      icon: '⌂',
      title: '重置视角',
      onClick: () => interactionApi.resetView(),
    },
    {
      id: 'screenshot',
      icon: '⬚',
      title: '导出截图',
      onClick: () => interactionApi.exportScreenshot(),
    },
  ];

  buttons.forEach((config) => {
    const btn = document.createElement('button');
    btn.className = 'toolbar-btn';
    btn.title = config.title;
    btn.innerHTML = `<span class="toolbar-icon">${config.icon}</span>`;
    btn.dataset.toggleState = 'false';

    btn.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 400);

      if (config.toggle) {
        const newState = btn.dataset.toggleState !== 'true';
        btn.dataset.toggleState = String(newState);
        config.onClick(newState, btn);
      } else {
        config.onClick(false, btn);
      }
    });

    toolbar.appendChild(btn);
  });

  const spacer = document.createElement('div');
  spacer.style.flex = '1';
  toolbar.appendChild(spacer);

  const title = document.createElement('div');
  title.textContent = 'Geo3D';
  title.style.cssText = `
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 11px;
    color: #00d2ff;
    letter-spacing: 3px;
    font-weight: 600;
    opacity: 0.7;
    padding: 12px 0;
    border-top: 1px solid rgba(0, 210, 255, 0.15);
  `;
  toolbar.appendChild(title);

  app.appendChild(toolbar);
}

function createAxisIndicator(camera: THREE.PerspectiveCamera): void {
  const app = document.getElementById('app')!;

  const container = document.createElement('div');
  container.id = 'axis-indicator';
  container.style.cssText = `
    position: fixed;
    right: 16px;
    bottom: 16px;
    width: 70px;
    height: 70px;
    background: rgba(45, 45, 68, 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 210, 255, 0.3);
    border-radius: 8px;
    z-index: 150;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const miniCanvas = document.createElement('canvas');
  miniCanvas.width = 70;
  miniCanvas.height = 70;
  miniCanvas.style.cssText = 'width: 70px; height: 70px;';
  container.appendChild(miniCanvas);

  app.appendChild(container);

  const miniScene = new THREE.Scene();
  const miniCam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  miniCam.position.set(3, 3, 3);
  miniCam.lookAt(0, 0, 0);

  const miniRenderer = new THREE.WebGLRenderer({
    canvas: miniCanvas,
    alpha: true,
    antialias: true,
  });
  miniRenderer.setPixelRatio(window.devicePixelRatio);

  const axisLen = 1.4;
  const createAxis = (dir: THREE.Vector3, color: number, label: string) => {
    const group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
    const points = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(axisLen)];
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geom, mat);
    group.add(line);

    const coneGeom = new THREE.ConeGeometry(0.08, 0.18, 8);
    const coneMat = new THREE.MeshBasicMaterial({ color });
    const cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.copy(dir.clone().multiplyScalar(axisLen));
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    group.add(cone);

    const labelDiv = document.createElement('div');
    labelDiv.textContent = label;
    labelDiv.style.cssText = `
      position: absolute;
      color: #${color.toString(16).padStart(6, '0')};
      font-size: 10px;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      pointer-events: none;
      text-shadow: 0 0 4px rgba(0,0,0,0.8);
    `;
    (group as any)._labelDiv = labelDiv;
    (group as any)._labelPos = dir.clone().multiplyScalar(axisLen + 0.25);
    container.appendChild(labelDiv);

    return group;
  };

  const axisX = createAxis(new THREE.Vector3(1, 0, 0), 0xff5577, 'X');
  const axisY = createAxis(new THREE.Vector3(0, 1, 0), 0x77ff77, 'Y');
  const axisZ = createAxis(new THREE.Vector3(0, 0, 1), 0x5599ff, 'Z');
  miniScene.add(axisX, axisY, axisZ);

  const centerGeom = new THREE.SphereGeometry(0.06, 8, 8);
  const centerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  miniScene.add(new THREE.Mesh(centerGeom, centerMat));

  const updateAxisLabels = () => {
    [axisX, axisY, axisZ].forEach((g) => {
      const div = (g as any)._labelDiv as HTMLElement;
      const pos = (g as any)._labelPos as THREE.Vector3;
      const projected = pos.clone().project(miniCam);
      const x = (projected.x * 0.5 + 0.5) * 70;
      const y = (-projected.y * 0.5 + 0.5) * 70;
      div.style.left = (x - 5) + 'px';
      div.style.top = (y - 7) + 'px';
    });
  };

  (window as any).__axisUpdate = () => {
    const q = camera.quaternion.clone();
    miniCam.position.set(3, 3, 3).applyQuaternion(q);
    miniCam.lookAt(0, 0, 0);
    miniRenderer.render(miniScene, miniCam);
    updateAxisLabels();
  };
}

function addGlobalStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .toolbar-btn {
      position: relative;
      width: 32px;
      height: 32px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      color: #a0a0b0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      overflow: hidden;
      outline: none;
      padding: 0;
    }
    .toolbar-btn:hover {
      color: #00d2ff;
      border-color: rgba(0, 210, 255, 0.3);
      background: rgba(0, 210, 255, 0.08);
    }
    .toolbar-btn:active {
      transform: scale(0.92);
    }
    .toolbar-icon {
      font-size: 16px;
      line-height: 1;
      font-weight: 600;
    }
    .ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      transform: scale(0);
      animation: ripple-anim 0.35s ease-out;
      pointer-events: none;
    }
    @keyframes ripple-anim {
      to {
        transform: scale(2);
        opacity: 0;
      }
    }
    .scene-container {
      position: absolute;
      left: 40px;
      right: 0;
      top: 0;
      bottom: 0;
      width: calc(100% - 40px);
    }
    .scene-container canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
    @media (max-width: 768px) {
      .toolbar {
        left: 0 !important;
        right: 0 !important;
        top: auto !important;
        bottom: 0 !important;
        width: auto !important;
        height: 56px !important;
        flex-direction: row !important;
        border-right: none !important;
        border-top: 1px solid rgba(0, 210, 255, 0.2) !important;
        padding: 0 12px !important;
        justify-content: space-around;
      }
      .toolbar > div[style*="writing-mode"] {
        display: none !important;
      }
      .scene-container {
        left: 0 !important;
        width: 100% !important;
        bottom: 56px;
      }
      #axis-indicator {
        bottom: 72px !important;
      }
    }
  `;
  document.head.appendChild(style);
}
