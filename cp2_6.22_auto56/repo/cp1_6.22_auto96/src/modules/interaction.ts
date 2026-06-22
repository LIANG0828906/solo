import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as d3 from 'd3';
import {
  LayerData,
  getLayers,
  updateLayerOpacity,
  getLayerBoundaryDepths,
} from './stratigraphy';

interface LayerEntry {
  data: LayerData;
  mesh: THREE.Mesh;
  edges: THREE.LineSegments | null;
}

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let controls: OrbitControls;
let layers: Map<string, LayerEntry>;
let labelRenderer: CSS2DRenderer;
let infoPanel: HTMLElement | null = null;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let selectedLayerId: string | null = null;
let highlightTime = 0;
let boreholeMode = false;
const boreholes: {
  group: THREE.Group;
  line: THREE.Mesh;
  targetHeight: number;
  progress: number;
}[] = [];

const initialCameraPos = new THREE.Vector3(15, 12, 15);
const initialTarget = new THREE.Vector3(0, 0, 0);

export interface InteractionApi {
  enableBoreholeMode: (enabled: boolean) => void;
  resetView: () => void;
  exportScreenshot: () => void;
  isBoreholeMode: () => boolean;
}

export function initInteraction(
  cam: THREE.PerspectiveCamera,
  scn: THREE.Scene,
  ctrl: OrbitControls,
  container: HTMLElement
): InteractionApi {
  camera = cam;
  scene = scn;
  controls = ctrl;
  layers = getLayers();
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(container.clientWidth, container.clientHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(labelRenderer.domElement);

  createInfoPanel();

  container.addEventListener('click', onMouseClick);

  const resizeHandler = () => {
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener('resize', resizeHandler);

  return {
    enableBoreholeMode,
    resetView,
    exportScreenshot: () => exportScreenshotInternal(container),
    isBoreholeMode: () => boreholeMode,
  };
}

function createInfoPanel(): void {
  infoPanel = document.createElement('div');
  infoPanel.id = 'info-panel';
  infoPanel.style.cssText = `
    position: absolute;
    top: 16px;
    right: 16px;
    width: 250px;
    padding: 18px 18px 20px;
    background: rgba(45, 45, 68, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 210, 255, 0.3);
    border-radius: 10px;
    color: #e0e0e0;
    font-size: 13px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 100;
    opacity: 0;
    transform: translateX(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
  `;
  infoPanel.innerHTML = `
    <div style="color: #00d2ff; font-size: 15px; font-weight: 600; margin-bottom: 14px; letter-spacing: 0.5px;">岩层信息</div>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div>
        <div style="color: #888; font-size: 11px; margin-bottom: 3px;">岩层名称</div>
        <div id="layer-name" style="color: #fff; font-size: 15px; font-weight: 500;">—</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <div style="color: #888; font-size: 11px; margin-bottom: 3px;">深度范围 (m)</div>
          <div id="layer-depth" style="color: #00d2ff; font-size: 14px; font-family: 'Courier New', monospace;">—</div>
        </div>
        <div>
          <div style="color: #888; font-size: 11px; margin-bottom: 3px;">预估厚度 (m)</div>
          <div id="layer-thickness" style="color: #00d2ff; font-size: 14px; font-family: 'Courier New', monospace;">—</div>
        </div>
      </div>
      <div>
        <div style="color: #888; font-size: 11px; margin-bottom: 3px;">岩石密度 (g/cm³)</div>
        <div id="layer-density" style="color: #00d2ff; font-size: 14px; font-family: 'Courier New', monospace;">—</div>
      </div>
      <div style="margin-top: 6px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
        <div style="color: #888; font-size: 11px; margin-bottom: 8px;">透明度调节</div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <input id="opacity-slider" type="range" min="0.05" max="1" step="0.05" value="0.75"
            style="flex: 1; height: 4px; -webkit-appearance: none; appearance: none;
              background: linear-gradient(to right, #00d2ff 0%, #00d2ff 75%, rgba(255,255,255,0.15) 75%);
              border-radius: 2px; outline: none; cursor: pointer;">
          <span id="opacity-value" style="color: #00d2ff; font-size: 12px; width: 32px; text-align: right;
            font-family: 'Courier New', monospace;">0.75</span>
        </div>
      </div>
    </div>
  `;
  document.getElementById('app')!.appendChild(infoPanel);

  const slider = infoPanel.querySelector('#opacity-slider') as HTMLInputElement;
  const opacityValue = infoPanel.querySelector('#opacity-value') as HTMLElement;

  const updateSliderBg = (val: number) => {
    const pct = ((val - 0.05) / 0.95) * 100;
    slider.style.background = `linear-gradient(to right, #00d2ff 0%, #00d2ff ${pct}%, rgba(255,255,255,0.15) ${pct}%)`;
  };

  slider.addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    opacityValue.textContent = val.toFixed(2);
    updateSliderBg(val);
    if (selectedLayerId) {
      updateLayerOpacity(selectedLayerId, val);
    }
  });
  updateSliderBg(0.75);

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    #opacity-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #00d2ff;
      border: 2px solid #fff;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(0, 210, 255, 0.6);
    }
    #opacity-slider::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #00d2ff;
      border: 2px solid #fff;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(0, 210, 255, 0.6);
    }
    @media (max-width: 768px) {
      #info-panel {
        top: auto !important;
        right: 0 !important;
        left: 0 !important;
        bottom: 60px !important;
        width: auto !important;
        margin: 0 12px;
        border-radius: 10px 10px 0 0;
        transform: translateY(100%);
      }
      #info-panel.visible {
        transform: translateY(0) !important;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

function onMouseClick(event: MouseEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  if (boreholeMode) {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 5);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersect);
    if (intersect) {
      const bx = Math.max(-9.5, Math.min(9.5, intersect.x));
      const bz = Math.max(-9.5, Math.min(9.5, intersect.z));
      createBorehole(bx, bz);
    }
    return;
  }

  const meshes = Array.from(layers.values()).map((l) => l.mesh);
  const intersects = raycaster.intersectObjects(meshes, false);

  if (intersects.length > 0) {
    const hit = intersects[0].object as THREE.Mesh;
    const layerId = hit.userData.layerId as string;
    selectLayer(layerId);
  } else {
    clearSelection();
  }
}

function selectLayer(layerId: string): void {
  clearSelection();
  const entry = layers.get(layerId);
  if (!entry || !infoPanel) return;

  selectedLayerId = layerId;

  const edgesGeo = new THREE.EdgesGeometry(entry.mesh.geometry, 20);
  const edgesMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    linewidth: 2,
  });
  const edges = new THREE.LineSegments(edgesGeo, edgesMat);
  edges.position.copy(entry.mesh.position);
  scene.add(edges);
  entry.edges = edges;

  infoPanel.style.opacity = '1';
  infoPanel.style.transform = 'translateX(0)';
  infoPanel.style.pointerEvents = 'auto';
  infoPanel.classList.add('visible');

  const nameEl = infoPanel.querySelector('#layer-name') as HTMLElement;
  const depthEl = infoPanel.querySelector('#layer-depth') as HTMLElement;
  const thicknessEl = infoPanel.querySelector('#layer-thickness') as HTMLElement;
  const densityEl = infoPanel.querySelector('#layer-density') as HTMLElement;
  const slider = infoPanel.querySelector('#opacity-slider') as HTMLInputElement;
  const opacityVal = infoPanel.querySelector('#opacity-value') as HTMLElement;

  nameEl.textContent = entry.data.name;
  animateValue(depthEl, 0, `${entry.data.depthTop.toFixed(1)} ~ ${entry.data.depthBottom.toFixed(1)}`, 300);
  animateValue(thicknessEl, 0, entry.data.thickness.toFixed(1), 300);
  animateValue(densityEl, 0, entry.data.density.toFixed(2), 300);
  slider.value = entry.data.opacity.toString();
  opacityVal.textContent = entry.data.opacity.toFixed(2);
}

function animateValue(el: HTMLElement, from: number, to: string | number, duration: number): void {
  if (typeof to === 'string') {
    el.textContent = to;
    return;
  }
  const interpolator = d3.interpolateNumber(from, to);
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = d3.easeCubicOut(t);
    el.textContent = interpolator(eased).toFixed(2);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = String(to);
  };
  requestAnimationFrame(tick);
}

function clearSelection(): void {
  if (selectedLayerId) {
    const entry = layers.get(selectedLayerId);
    if (entry && entry.edges) {
      scene.remove(entry.edges);
      entry.edges.geometry.dispose();
      (entry.edges.material as THREE.Material).dispose();
      entry.edges = null;
    }
    selectedLayerId = null;
  }
  if (infoPanel) {
    infoPanel.style.opacity = '0';
    infoPanel.style.transform = 'translateX(20px)';
    infoPanel.style.pointerEvents = 'none';
    infoPanel.classList.remove('visible');
  }
}

export function createBorehole(x: number, z: number): void {
  const group = new THREE.Group();

  const height = 10;
  const lineGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.001, 8);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x3388ff, transparent: true, opacity: 0.95 });
  const line = new THREE.Mesh(lineGeo, lineMat);
  line.position.set(x, 0, z);
  group.add(line);

  const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const bottomSphere = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), sphereMat);
  bottomSphere.position.set(x, -5, z);
  group.add(bottomSphere);

  const topSphere = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), sphereMat);
  topSphere.position.set(x, 5, z);
  topSphere.visible = false;
  group.add(topSphere);

  const boundaries = getLayerBoundaryDepths(x, z);
  const torusMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0 });
  boundaries.forEach((b) => {
    const worldY = 5 - b.depth;
    const torusGeo = new THREE.TorusGeometry(0.3, 0.03, 8, 24);
    const torus = new THREE.Mesh(torusGeo, torusMat.clone());
    torus.position.set(x, worldY, z);
    torus.rotation.x = Math.PI / 2;
    torus.userData.targetOpacity = 0.9;
    group.add(torus);

    const labelDiv = document.createElement('div');
    labelDiv.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      color: #00d2ff;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
      border: 1px solid rgba(0, 210, 255, 0.4);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    labelDiv.textContent = `${b.depth.toFixed(1)}m`;
    const label = new CSS2DObject(labelDiv);
    label.position.set(x + 0.5, worldY, z);
    label.userData.labelDiv = labelDiv;
    label.userData.targetOpacity = 1;
    group.add(label);
  });

  scene.add(group);
  boreholes.push({ group, line, targetHeight: height, progress: 0 });
}

export function enableBoreholeMode(enabled: boolean): void {
  boreholeMode = enabled;
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.style.cursor = enabled ? 'crosshair' : '';
  }
}

export function resetView(): void {
  animateCameraTo(initialCameraPos.clone(), initialTarget.clone(), 500);
}

function animateCameraTo(targetPos: THREE.Vector3, targetLook: THREE.Vector3, duration: number): void {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();

  const tick = () => {
    const t = Math.min(1, (performance.now() - startTime) / duration);
    const eased = d3.easeCubicOut(t);
    camera.position.lerpVectors(startPos, targetPos, eased);
    controls.target.lerpVectors(startTarget, targetLook, eased);
    controls.update();
    if (t < 1) requestAnimationFrame(tick);
  };
  tick();
}

function exportScreenshotInternal(container: HTMLElement): void {
  const renderer = container.querySelector('canvas') as HTMLCanvasElement;
  if (!renderer) return;
  const dataURL = renderer.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `geology-screenshot-${Date.now()}.png`;
  link.href = dataURL;
  link.click();
}

export function updateAnimation(elapsed: number, delta: number): void {
  highlightTime = elapsed;
  if (selectedLayerId) {
    const entry = layers.get(selectedLayerId);
    if (entry && entry.edges) {
      const pulse = 0.6 + 0.4 * Math.sin(elapsed * Math.PI);
      (entry.edges.material as THREE.LineBasicMaterial).opacity = pulse;
    }
  }

  boreholes.forEach((bh) => {
    if (bh.progress < 1) {
      bh.progress = Math.min(1, bh.progress + delta * 2);
      const eased = d3.easeCubicOut(bh.progress);
      const currentH = bh.targetHeight * eased;
      bh.line.scale.y = Math.max(0.001, currentH);
      bh.line.position.y = -5 + currentH / 2;

      bh.group.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry) {
          const worldY = child.position.y;
          const relY = worldY - (-5);
          if (relY <= currentH) {
            (child.material as THREE.MeshBasicMaterial).opacity =
              Math.min((child.userData as any).targetOpacity, (child.material as THREE.MeshBasicMaterial).opacity + delta * 3);
          }
        }
        if (child instanceof CSS2DObject) {
          const worldY = child.position.y;
          const relY = worldY - (-5);
          const labelDiv = (child.userData as any).labelDiv as HTMLElement;
          if (relY <= currentH && labelDiv) {
            labelDiv.style.opacity = String(Math.min(1, parseFloat(labelDiv.style.opacity || '0') + delta * 3));
          }
        }
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
          const worldY = child.position.y;
          if (worldY <= -5 + currentH + 0.01) {
            child.visible = true;
          }
        }
      });
    }
  });

  if (labelRenderer && scene && camera) {
    labelRenderer.render(scene, camera);
  }
}
