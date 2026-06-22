import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Point, RecognitionResult } from './shapeRecognizer';
import { recognizeShape } from './shapeRecognizer';
import type { GeometryParams } from './geometryGenerator';
import {
  createGeometry,
  updateMeshParams,
  cloneMesh,
  animateMeshSpawn,
  createOutline,
  setOutlineHover,
  exportGLTF,
  downloadBlob,
  generateThumbnail,
  getRandomColor,
  getShapeName,
  PRESET_COLORS
} from './geometryGenerator';
import {
  initControlPanel,
  getCurrentParams,
  setParams,
  PARAMS_CHANGE_EVENT,
  EXPORT_GLTF_EVENT,
  CLEAR_SCENE_EVENT,
  ADD_TO_GALLERY_EVENT
} from './controlPanel';

interface GalleryItemData {
  id: string;
  mesh: THREE.Mesh;
  params: GeometryParams;
  shapeType: string;
  thumbnail: string;
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let isDrawing = false;
let currentStroke: Point[] = [];
let allStrokes: Point[][] = [];
let lastRecognition: RecognitionResult | null = null;
let rawPointsForRecognition: Point[] = [];

let threeRenderer: THREE.WebGLRenderer;
let threeScene: THREE.Scene;
let threeCamera: THREE.PerspectiveCamera;
let threeControls: OrbitControls;
let meshes: THREE.Mesh[] = [];
let outlines: THREE.LineSegments[] = [];
let selectedMesh: THREE.Mesh | null = null;
let hoveredMesh: THREE.Mesh | null = null;
let raycaster: THREE.Raycaster;
let pointer: THREE.Vector2;

let galleryItems: GalleryItemData[] = [];
const MAX_GALLERY_ITEMS = 8;

function initDrawingCanvas(): void {
  canvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;
  const wrapper = canvas.parentElement as HTMLElement;
  const resizeCanvas = () => {
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.scale(dpr, dpr);
    redrawCanvas();
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const getCanvasPoint = (e: MouseEvent | TouchEvent): Point | null => {
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const p = getCanvasPoint(e);
    if (!p) return;
    isDrawing = true;
    currentStroke = [p];
    rawPointsForRecognition = [p];
    allStrokes = [currentStroke];
    lastRecognition = null;
    hideRecognitionLabel();
    (document.getElementById('generate-btn') as HTMLButtonElement).disabled = true;
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const p = getCanvasPoint(e);
    if (!p) return;
    rawPointsForRecognition.push(p);
    if (currentStroke.length > 0) {
      const last = currentStroke[currentStroke.length - 1];
      const dist = Math.sqrt((p.x - last.x) ** 2 + (p.y - last.y) ** 2);
      if (dist > 1) {
        currentStroke.push(p);
        drawStrokeSegment(last, p);
      }
    }
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    isDrawing = false;
    if (rawPointsForRecognition.length >= 5) {
      lastRecognition = recognizeShape(rawPointsForRecognition);
      showRecognitionLabel(lastRecognition);
      drawFittedShape(lastRecognition);
      (document.getElementById('generate-btn') as HTMLButtonElement).disabled = false;
    }
  };

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', endDrawing);
  canvas.addEventListener('mouseleave', endDrawing);
  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', endDrawing);
}

function drawGrid(): void {
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect();
  ctx.strokeStyle = '#e5e5e5';
  ctx.lineWidth = 0.5;
  const spacing = 20;
  ctx.beginPath();
  for (let x = 0; x <= rect.width; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
  }
  for (let y = 0; y <= rect.height; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
  }
  ctx.stroke();
}

function drawStrokeSegment(p1: Point, p2: Point): void {
  if (!ctx) return;
  ctx.strokeStyle = '#00BFFF';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function drawFittedShape(recognition: RecognitionResult): void {
  if (!ctx || recognition.fittedPoints.length < 2) return;
  ctx.save();
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  const pts = recognition.fittedPoints;
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function redrawCanvas(): void {
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, rect.width, rect.height);
  drawGrid();
  for (const stroke of allStrokes) {
    for (let i = 1; i < stroke.length; i++) {
      drawStrokeSegment(stroke[i - 1], stroke[i]);
    }
  }
  if (lastRecognition) {
    drawFittedShape(lastRecognition);
  }
}

function clearCanvas(): void {
  allStrokes = [];
  currentStroke = [];
  rawPointsForRecognition = [];
  lastRecognition = null;
  hideRecognitionLabel();
  (document.getElementById('generate-btn') as HTMLButtonElement).disabled = true;
  redrawCanvas();
}

function showRecognitionLabel(recognition: RecognitionResult): void {
  const label = document.getElementById('recognition-label') as HTMLDivElement;
  const names: Record<string, string> = {
    circle: '圆形',
    rect: '矩形',
    triangle: '三角形',
    polygon: '不规则多边形'
  };
  const name = names[recognition.type] || '未知形状';
  const conf = Math.round(recognition.confidence * 100);
  label.textContent = `检测到${name}，置信度 ${conf}%`;
  label.classList.add('show');
}

function hideRecognitionLabel(): void {
  const label = document.getElementById('recognition-label') as HTMLDivElement;
  label.classList.remove('show');
}

function initThreeScene(): void {
  const container = document.getElementById('three-container') as HTMLElement;
  const canvasEl = document.getElementById('three-canvas') as HTMLCanvasElement;
  threeRenderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
  threeRenderer.setPixelRatio(window.devicePixelRatio);
  threeRenderer.shadowMap.enabled = true;
  threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

  threeScene = new THREE.Scene();
  threeScene.background = null;
  threeScene.fog = new THREE.FogExp2(0x1a1a3e, 0.08);

  const aspect = container.clientWidth / container.clientHeight;
  threeCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
  threeCamera.position.set(4, 3, 4);

  threeControls = new OrbitControls(threeCamera, threeRenderer.domElement);
  threeControls.enableDamping = true;
  threeControls.dampingFactor = 0.08;
  threeControls.minDistance = 2;
  threeControls.maxDistance = 10;
  threeControls.rotateSpeed = 0.8;
  threeControls.zoomSpeed = 0.8;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  threeScene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 6, 3);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 30;
  dirLight.shadow.camera.left = -8;
  dirLight.shadow.camera.right = 8;
  dirLight.shadow.camera.top = 8;
  dirLight.shadow.camera.bottom = -8;
  threeScene.add(dirLight);

  const gridHelper = new THREE.GridHelper(12, 24, 0x2a2a5e, 0x1f1f4e);
  (gridHelper.material as THREE.Material).transparent = true;
  (gridHelper.material as THREE.Material).opacity = 0.4;
  threeScene.add(gridHelper);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  const resizeThree = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    threeRenderer.setSize(w, h);
    threeCamera.aspect = w / h;
    threeCamera.updateProjectionMatrix();
  };
  resizeThree();
  window.addEventListener('resize', resizeThree);

  setupThreeInteraction();

  function animate() {
    requestAnimationFrame(animate);
    threeControls.update();
    threeRenderer.render(threeScene, threeCamera);
  }
  animate();
}

function setupThreeInteraction(): void {
  const container = document.getElementById('three-container') as HTMLElement;
  const toolbar = document.getElementById('mesh-toolbar') as HTMLDivElement;

  const updatePointer = (e: MouseEvent) => {
    const rect = threeRenderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  };

  container.addEventListener('mousemove', (e) => {
    updatePointer(e);
    raycaster.setFromCamera(pointer, threeCamera);
    const intersects = raycaster.intersectObjects(meshes, false);
    const newHovered = intersects.length > 0 ? (intersects[0].object as THREE.Mesh) : null;
    if (newHovered !== hoveredMesh) {
      if (hoveredMesh) {
        const outline = outlines.find(o => o.userData.targetMesh === hoveredMesh);
        if (outline) setOutlineHover(outline, false);
      }
      hoveredMesh = newHovered;
      if (hoveredMesh) {
        const outline = outlines.find(o => o.userData.targetMesh === hoveredMesh);
        if (outline) setOutlineHover(outline, true);
      }
      container.style.cursor = newHovered ? 'pointer' : 'grab';
    }
  });

  container.addEventListener('click', (e) => {
    updatePointer(e);
    raycaster.setFromCamera(pointer, threeCamera);
    const intersects = raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      selectedMesh = intersects[0].object as THREE.Mesh;
      const params = selectedMesh.userData.originalParams as GeometryParams;
      if (params) setParams(params);
      toolbar.style.left = `${e.offsetX + 10}px`;
      toolbar.style.top = `${e.offsetY - 20}px`;
      toolbar.classList.add('show');
    } else {
      selectedMesh = null;
      toolbar.classList.remove('show');
    }
  });

  container.addEventListener('mouseleave', () => {
    if (hoveredMesh) {
      const outline = outlines.find(o => o.userData.targetMesh === hoveredMesh);
      if (outline) setOutlineHover(outline, false);
      hoveredMesh = null;
    }
  });

  (document.getElementById('btn-delete') as HTMLButtonElement).addEventListener('click', () => {
    if (selectedMesh) {
      removeMesh(selectedMesh);
      selectedMesh = null;
      toolbar.classList.remove('show');
    }
  });

  (document.getElementById('btn-clone') as HTMLButtonElement).addEventListener('click', () => {
    if (selectedMesh) {
      const cloned = cloneMesh(selectedMesh);
      addMeshToScene(cloned);
      animateMeshSpawn(cloned);
      selectedMesh = cloned;
      const params = cloned.userData.originalParams as GeometryParams;
      if (params) setParams(params);
    }
  });

  (document.getElementById('btn-reset') as HTMLButtonElement).addEventListener('click', () => {
    if (selectedMesh) {
      const originalParams = selectedMesh.userData.originalParams as GeometryParams;
      if (originalParams) {
        setParams(originalParams);
        updateMeshParams(selectedMesh, originalParams);
      }
    }
  });
}

function addMeshToScene(mesh: THREE.Mesh): void {
  meshes.push(mesh);
  const outline = createOutline(mesh);
  outlines.push(outline);
  threeScene.add(mesh);
}

function removeMesh(mesh: THREE.Mesh): void {
  const idx = meshes.indexOf(mesh);
  if (idx >= 0) {
    meshes.splice(idx, 1);
  }
  const outlineIdx = outlines.findIndex(o => o.userData.targetMesh === mesh);
  if (outlineIdx >= 0) {
    const outline = outlines[outlineIdx];
    outlines.splice(outlineIdx, 1);
    outline.geometry.dispose();
    (outline.material as THREE.Material).dispose();
  }
  threeScene.remove(mesh);
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
}

function clearAllMeshes(): void {
  for (const mesh of [...meshes]) {
    removeMesh(mesh);
  }
  galleryItems = [];
  renderGallery();
}

function generate3D(): void {
  if (!lastRecognition) return;
  const params = getCurrentParams();
  const mesh = createGeometry(lastRecognition, rawPointsForRecognition, params);
  addMeshToScene(mesh);
  animateMeshSpawn(mesh);
  selectedMesh = mesh;
}

function addToGallery(): void {
  if (!selectedMesh) {
    alert('请先在3D场景中选择一个几何体');
    return;
  }
  if (galleryItems.length >= MAX_GALLERY_ITEMS) {
    alert(`对比画廊最多保存${MAX_GALLERY_ITEMS}个几何体`);
    return;
  }
  const params = selectedMesh.userData.originalParams as GeometryParams;
  const item: GalleryItemData = {
    id: 'gal_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    mesh: selectedMesh,
    params: { ...params },
    shapeType: selectedMesh.userData.shapeType || 'polygon',
    thumbnail: generateThumbnail(selectedMesh)
  };
  galleryItems.push(item);
  renderGallery();
}

function renderGallery(): void {
  const grid = document.getElementById('gallery-grid') as HTMLDivElement;
  grid.innerHTML = '';
  for (const item of galleryItems) {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.dataset.id = item.id;
    card.style.setProperty('--active-color', item.params.color);
    if (selectedMesh === item.mesh) {
      card.classList.add('active');
    }
    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumb';
    const img = document.createElement('img');
    img.src = item.thumbnail;
    img.alt = getShapeName(item.shapeType);
    thumb.appendChild(img);
    const label = document.createElement('div');
    label.className = 'gallery-label';
    label.textContent = `${getShapeName(item.shapeType)} - 尺寸${item.params.size.toFixed(1)}, 颜色${item.params.color}`;
    card.appendChild(thumb);
    card.appendChild(label);
    card.addEventListener('click', () => {
      selectedMesh = item.mesh;
      setParams(item.params);
      updateMeshParams(item.mesh, item.params);
      renderGallery();
    });
    grid.appendChild(card);
  }
}

function initMobileToggles(): void {
  const leftPanel = document.getElementById('control-panel') as HTMLElement;
  const rightPanel = document.getElementById('gallery') as HTMLElement;
  (document.getElementById('toggle-left') as HTMLButtonElement).addEventListener('click', () => {
    leftPanel.classList.toggle('open');
    rightPanel.classList.remove('open');
  });
  (document.getElementById('toggle-right') as HTMLButtonElement).addEventListener('click', () => {
    rightPanel.classList.toggle('open');
    leftPanel.classList.remove('open');
  });
}

function initEventListeners(): void {
  (document.getElementById('generate-btn') as HTMLButtonElement).addEventListener('click', generate3D);

  document.addEventListener(PARAMS_CHANGE_EVENT, ((e: CustomEvent) => {
    const params = e.detail as GeometryParams;
    if (selectedMesh) {
      updateMeshParams(selectedMesh, params);
      renderGallery();
    }
  }) as EventListener);

  document.addEventListener(ADD_TO_GALLERY_EVENT, addToGallery);

  document.addEventListener(EXPORT_GLTF_EVENT, async () => {
    if (meshes.length === 0) {
      alert('场景中没有几何体可导出');
      return;
    }
    try {
      const blob = await exportGLTF(threeScene);
      const filename = `sketch3d_${Date.now()}.glb`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请重试');
    }
  });

  document.addEventListener(CLEAR_SCENE_EVENT, () => {
    if (meshes.length === 0 && allStrokes.length === 0) return;
    if (confirm('确定要清空所有内容吗？')) {
      clearAllMeshes();
      clearCanvas();
      setParams({
        size: 1.0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        color: PRESET_COLORS[1]
      });
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initControlPanel('control-panel');
    initDrawingCanvas();
    initThreeScene();
    initMobileToggles();
    initEventListeners();
    (document.getElementById('loading') as HTMLDivElement).classList.add('hidden');
  }, 300);
});
