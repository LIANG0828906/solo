import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HeatmapRenderer } from './heatmapRenderer';
import { parseCSV, getBounds, DataBounds, TimeSlice } from './dataProcessor';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let heatmapRenderer: HeatmapRenderer;
let gridHelper: THREE.GridHelper;

let timeSlices: TimeSlice[] = [];
let currentSliceIndex: number = 0;
let isPlaying: boolean = false;
let playbackSpeed: number = 1;
let lastUpdateTime: number = 0;
let updateInterval: number = 500;

let dataBounds: DataBounds | null = null;
let gridLabelSprites: THREE.Sprite[] = [];

function init(): void {
  const container = document.getElementById('canvas-container')!;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 22, 22);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 80;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;

  createGrid();

  heatmapRenderer = new HeatmapRenderer(100000);
  heatmapRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  scene.add(heatmapRenderer.points);

  window.addEventListener('resize', onWindowResize);

  setupUI();
  generateMockData();

  animate();
}

function createGrid(): void {
  gridHelper = new THREE.GridHelper(20, 20, 0x334155, 0x334155);
  gridHelper.position.y = 0;
  (gridHelper.material as THREE.Material).opacity = 0.2;
  (gridHelper.material as THREE.Material).transparent = true;
  scene.add(gridHelper);
}

function createTextSprite(text: string, color: string = '#94a3b8', fontSize: number = 12): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 256;
  canvas.height = 64;
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3, 0.75, 1);
  return sprite;
}

function updateGridLabels(): void {
  gridLabelSprites.forEach((s) => scene.remove(s));
  gridLabelSprites = [];

  if (!dataBounds) {
    const labels = ['-10', '-5', '0', '5', '10'];
    labels.forEach((label, i) => {
      const x = -10 + i * 5;
      const sprite = createTextSprite(label, '#94a3b8', 12);
      sprite.position.set(x, 0.1, -10.5);
      scene.add(sprite);
      gridLabelSprites.push(sprite);

      const sprite2 = createTextSprite(label, '#94a3b8', 12);
      sprite2.position.set(-10.5, 0.1, -x);
      sprite2.rotation.y = -Math.PI / 2;
      scene.add(sprite2);
      gridLabelSprites.push(sprite2);
    });
    return;
  }

  const lonLabels: string[] = [];
  const latLabels: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const lon = dataBounds.centerLon + (t - 0.5) * dataBounds.spanLon * (20 / 18);
    const lat = dataBounds.centerLat + (t - 0.5) * dataBounds.spanLat * (20 / 18);
    lonLabels.push(lon.toFixed(4) + '°');
    latLabels.push(lat.toFixed(4) + '°');
  }

  for (let i = 0; i <= 4; i++) {
    const x = -10 + i * 5;
    const sprite = createTextSprite(lonLabels[i], '#94a3b8', 12);
    sprite.position.set(x, 0.1, -10.8);
    scene.add(sprite);
    gridLabelSprites.push(sprite);
  }

  for (let i = 0; i <= 4; i++) {
    const z = -10 + i * 5;
    const sprite = createTextSprite(latLabels[4 - i], '#94a3b8', 12);
    sprite.position.set(-10.8, 0.1, z);
    scene.add(sprite);
    gridLabelSprites.push(sprite);
  }
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  heatmapRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function generateMockData(): void {
  const centerLon = 116.4074;
  const centerLat = 39.9042;
  const span = 0.015;
  const numPoints = 2000;
  const totalSlices = 48;

  const slices: TimeSlice[] = [];

  const points: Array<{ lon: number; lat: number; baseFlow: number }> = [];
  for (let i = 0; i < numPoints; i++) {
    const lon = centerLon + (Math.random() - 0.5) * span;
    const lat = centerLat + (Math.random() - 0.5) * span;
    const baseFlow = 20 + Math.random() * 150;
    points.push({ lon, lat, baseFlow });
  }

  const scale = 18 / span;

  for (let s = 0; s < totalSlices; s++) {
    const positions = new Float32Array(numPoints * 3);
    const values = new Float32Array(numPoints);

    const hour = s / 2;
    const rushFactor = Math.max(
      Math.exp(-Math.pow(hour - 8, 2) / 4),
      Math.exp(-Math.pow(hour - 18, 2) / 4)
    );
    const nightFactor = Math.exp(-Math.pow(hour - 3, 2) / 2);

    for (let i = 0; i < numPoints; i++) {
      const p = points[i];
      const jitter = 0.6 + Math.random() * 0.8;
      let flow = p.baseFlow * (0.3 + rushFactor * 0.7 + nightFactor * 0.1) * jitter;
      flow = Math.max(5, flow);

      positions[i * 3] = (p.lon - centerLon) * scale;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = -(p.lat - centerLat) * scale;
      values[i] = flow;
    }

    slices.push({ time: s, positions, values });
  }

  timeSlices = slices;
  dataBounds = {
    centerLon,
    centerLat,
    spanLon: span,
    spanLat: span,
  };

  updateGridLabels();
  updateCurrentSlice();
  updateStats();
  updateDataInfo();
}

function handleFileUpload(file: File): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    try {
      const slices = parseCSV(text);
      if (slices.length === 0) {
        alert('CSV解析失败，请检查格式：时间戳,纬度,经度,车流量');
        return;
      }
      timeSlices = slices;
      dataBounds = getBounds(text);
      currentSliceIndex = 0;
      updateGridLabels();
      updateCurrentSlice();
      updateStats();
      updateDataInfo();
      autoFitCamera();
    } catch (err) {
      alert('解析CSV出错：' + (err as Error).message);
    }
  };
  reader.readAsText(file);
}

function autoFitCamera(): void {
  if (!dataBounds) return;
  const maxSpan = Math.max(dataBounds.spanLon, dataBounds.spanLat);
  const scale = 18 / maxSpan;
  const distance = Math.max(20, 30);
  camera.position.set(0, distance, distance);
  controls.target.set(0, 0, 0);
  controls.update();
}

function formatTime(sliceIndex: number): string {
  const totalMinutes = sliceIndex * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function updateCurrentSlice(): void {
  if (timeSlices.length === 0) return;
  const slice = timeSlices[currentSliceIndex];
  heatmapRenderer.updateFromSlice(slice);

  const timeLabel = document.getElementById('timeLabel');
  if (timeLabel) timeLabel.textContent = formatTime(currentSliceIndex);

  const fill = document.getElementById('timelineFill');
  const thumb = document.getElementById('timelineThumb');
  const progress = (currentSliceIndex / 47) * 100;
  if (fill) fill.style.width = `${progress}%`;
  if (thumb) thumb.style.left = `${progress}%`;
}

function updateStats(): void {
  if (timeSlices.length === 0) return;
  const slice = timeSlices[currentSliceIndex];
  const values = slice.values;

  let total = 0;
  let maxVal = -Infinity;
  let minVal = Infinity;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    total += v;
    if (v > maxVal) maxVal = v;
    if (v < minVal) minVal = v;
  }

  const avg = total / values.length;

  updateStatValue('statTotal', Math.round(total).toLocaleString());
  updateStatValue('statAvg', Math.round(avg).toLocaleString());
  updateStatValue('statMax', Math.round(maxVal).toLocaleString());
  updateStatValue('statMin', Math.round(minVal).toLocaleString());
}

function updateStatValue(id: string, value: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('fading');
  setTimeout(() => {
    el.textContent = value;
    el.classList.remove('fading');
  }, 150);
}

function updateDataInfo(): void {
  const info = document.getElementById('dataInfo');
  if (!info || !dataBounds) return;
  info.textContent = `覆盖范围：${dataBounds.spanLat.toFixed(4)}° × ${dataBounds.spanLon.toFixed(4)}°`;
}

function setupUI(): void {
  const uploadZone = document.getElementById('uploadZone')!;
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const fileNameEl = document.getElementById('fileName')!;

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer?.files[0];
    if (file && file.name.endsWith('.csv')) {
      fileNameEl.textContent = file.name;
      handleFileUpload(file);
    }
  });
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      fileNameEl.textContent = file.name;
      handleFileUpload(file);
    }
  });

  const btnPlay = document.getElementById('btnPlay')!;
  const playIcon = document.getElementById('playIcon')!;
  btnPlay.addEventListener('click', () => {
    isPlaying = !isPlaying;
    updatePlayIcon();
  });

  function updatePlayIcon(): void {
    if (isPlaying) {
      playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    } else {
      playIcon.innerHTML = '<polygon points="5,3 19,12 5,21"/>';
    }
  }

  const btnPrev = document.getElementById('btnPrev')!;
  btnPrev.addEventListener('click', () => {
    if (timeSlices.length === 0) return;
    currentSliceIndex = (currentSliceIndex - 1 + 48) % 48;
    updateCurrentSlice();
    updateStats();
  });

  const btnNext = document.getElementById('btnNext')!;
  btnNext.addEventListener('click', () => {
    if (timeSlices.length === 0) return;
    currentSliceIndex = (currentSliceIndex + 1) % 48;
    updateCurrentSlice();
    updateStats();
  });

  document.querySelectorAll('.speed-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const speed = parseInt(btn.getAttribute('data-speed') || '1', 10);
      playbackSpeed = speed;
      updateInterval = 500 / speed;
    });
  });

  const timelineTrack = document.getElementById('timelineTrack')!;
  const timelineThumb = document.getElementById('timelineThumb')!;
  let isDragging = false;

  function handleTimelineClick(e: MouseEvent | Touch): void {
    const rect = timelineTrack.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let progress = x / rect.width;
    progress = Math.max(0, Math.min(1, progress));
    currentSliceIndex = Math.round(progress * 47);
    updateCurrentSlice();
    updateStats();
  }

  timelineTrack.addEventListener('click', handleTimelineClick);

  timelineThumb.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    isDragging = true;
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
  });

  function onDragMove(e: MouseEvent): void {
    if (!isDragging) return;
    handleTimelineClick(e);
  }

  function onDragEnd(): void {
    isDragging = false;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
  }

  const thresholdSlider = document.getElementById('thresholdSlider') as HTMLInputElement;
  const thresholdValue = document.getElementById('thresholdValue')!;
  const legendHigh = document.getElementById('legendHigh')!;
  const legendMid3 = document.getElementById('legendMid3')!;
  const legendMid2 = document.getElementById('legendMid2')!;
  const legendLow = document.getElementById('legendLow')!;

  thresholdSlider.addEventListener('input', () => {
    const val = parseInt(thresholdSlider.value, 10);
    thresholdValue.textContent = val.toString();
    legendHigh.textContent = val.toString();
    legendMid3.textContent = Math.round((val * 2) / 3).toString();
    legendMid2.textContent = Math.round(val / 3).toString();
    legendLow.textContent = '0';
    heatmapRenderer.setThreshold(val);
    if (timeSlices.length > 0) {
      updateCurrentSlice();
    }
  });

  const panelToggle = document.getElementById('panelToggle')!;
  const controlPanel = document.getElementById('controlPanel')!;
  panelToggle.addEventListener('click', () => {
    if (window.innerWidth < 768) {
      controlPanel.classList.toggle('expanded');
      controlPanel.classList.remove('collapsed');
    }
  });

  function checkResponsive(): void {
    if (window.innerWidth < 768) {
      controlPanel.classList.add('collapsed');
      controlPanel.classList.remove('expanded');
    } else {
      controlPanel.classList.remove('collapsed');
      controlPanel.classList.remove('expanded');
    }
  }
  checkResponsive();
  window.addEventListener('resize', checkResponsive);
}

function animate(): void {
  requestAnimationFrame(animate);
  controls.update();

  const now = performance.now();
  if (isPlaying && timeSlices.length > 0 && now - lastUpdateTime >= updateInterval) {
    currentSliceIndex = (currentSliceIndex + 1) % 48;
    updateCurrentSlice();
    updateStats();
    lastUpdateTime = now;
  }

  renderer.render(scene, camera);
}

init();
