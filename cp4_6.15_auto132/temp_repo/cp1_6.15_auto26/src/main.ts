import * as THREE from 'three';
import { Earth } from './core/Earth';
import { Timeline } from './core/Timeline';
import { seismicData, plateBoundaries } from './data/SeismicData';
import type { SeismicRecord } from './data/SeismicData';
import type { SeismicPoint } from './core/SeismicPoint';
import type { PlateBoundary } from './core/PlateBoundary';

interface GlobalState {
  currentDate: Date;
  selectedEarthquake: SeismicRecord | null;
  selectedPoint: SeismicPoint | null;
  visibleEarthquakes: SeismicRecord[];
  stats: {
    count: number;
    maxMagnitude: number;
  };
}

const state: GlobalState = {
  currentDate: new Date(),
  selectedEarthquake: null,
  selectedPoint: null,
  visibleEarthquakes: [],
  stats: {
    count: 0,
    maxMagnitude: 0
  }
};

let earth: Earth;
let timeline: Timeline;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let statsPanel: HTMLElement;
let infoWindow: HTMLElement | null = null;
let animationId: number;

function init(): void {
  const app = document.getElementById('app');
  if (!app) {
    throw new Error('App container not found');
  }
  
  app.style.background = 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)';
  app.style.position = 'relative';
  app.style.overflow = 'hidden';
  
  createUI(app);
  
  const container = document.createElement('div');
  container.id = 'earth-container';
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  app.appendChild(container);
  
  const timelineContainer = document.createElement('div');
  timelineContainer.id = 'timeline-container';
  timelineContainer.style.position = 'absolute';
  timelineContainer.style.bottom = '24px';
  timelineContainer.style.left = '50%';
  timelineContainer.style.transform = 'translateX(-50%)';
  timelineContainer.style.width = '90%';
  timelineContainer.style.maxWidth = '900px';
  timelineContainer.style.zIndex = '100';
  app.appendChild(timelineContainer);
  
  earth = new Earth(container);
  earth.addSeismicPoints(seismicData);
  earth.addPlateBoundaries(plateBoundaries);
  
  raycaster = new THREE.Raycaster();
  raycaster.params.Line = { threshold: 0.05 };
  mouse = new THREE.Vector2();
  
  timeline = new Timeline('timeline-container', seismicData, handleDateChange);
  
  state.currentDate = timeline.getCurrentDate();
  updateVisibleEarthquakes();
  
  setupEventListeners(app);
  handleResize();
  animate();
}

function createUI(app: HTMLElement): void {
  statsPanel = document.createElement('div');
  statsPanel.id = 'stats-panel';
  statsPanel.style.position = 'absolute';
  statsPanel.style.top = '24px';
  statsPanel.style.left = '24px';
  statsPanel.style.padding = '24px';
  statsPanel.style.background = 'rgba(255, 255, 255, 0.1)';
  statsPanel.style.backdropFilter = 'blur(20px)';
  statsPanel.style.borderRadius = '16px';
  statsPanel.style.border = '1px solid rgba(255, 255, 255, 0.15)';
  statsPanel.style.color = '#ffffff';
  statsPanel.style.minWidth = '220px';
  statsPanel.style.zIndex = '100';
  statsPanel.style.transform = 'translateX(-100%)';
  statsPanel.style.opacity = '0';
  statsPanel.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
  statsPanel.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
  
  statsPanel.innerHTML = `
    <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 2px;">
      当日统计
    </div>
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">地震次数</div>
        <div id="stat-count" style="font-size: 36px; font-weight: 700; background: linear-gradient(135deg, #00d4ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          0
        </div>
      </div>
      <div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">最大震级</div>
        <div id="stat-max" style="font-size: 36px; font-weight: 700; background: linear-gradient(135deg, #ff6b6b, #ffd93d); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          0.0
        </div>
      </div>
    </div>
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
      <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 8px;">图例说明</div>
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #fff5e6;"></div>
          <span>浅层地震 (0-200km)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #8b0000;"></div>
          <span>深层地震 (500-700km)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 20px; height: 2px; background: #00ffff;"></div>
          <span>板块边界</span>
        </div>
      </div>
    </div>
  `;
  
  app.appendChild(statsPanel);
  
  requestAnimationFrame(() => {
    statsPanel.style.transform = 'translateX(0)';
    statsPanel.style.opacity = '1';
  });
  
  const title = document.createElement('div');
  title.style.position = 'absolute';
  title.style.top = '24px';
  title.style.right = '24px';
  title.style.color = '#ffffff';
  title.style.textAlign = 'right';
  title.style.zIndex = '100';
  title.style.pointerEvents = 'none';
  title.innerHTML = `
    <div style="font-size: 28px; font-weight: 700; letter-spacing: 2px; background: linear-gradient(135deg, #00d4ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
      全球地震活动
    </div>
    <div style="font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 4px;">
      3D可视化探索系统
    </div>
  `;
  app.appendChild(title);
}

function setupEventListeners(app: HTMLElement): void {
  const canvas = earth.getRenderer().domElement;
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('click', handleClick);
  window.addEventListener('resize', handleResize);
  
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (infoWindow && !infoWindow.contains(target) && target.id !== 'close-info') {
      const canvasEl = earth.getRenderer().domElement;
      if (!canvasEl.contains(target) && !statsPanel.contains(target)) {
        const timelineEl = document.getElementById('timeline-container');
        if (!timelineEl?.contains(target)) {
        }
      }
    }
  });
}

function handleMouseMove(event: MouseEvent): void {
  const canvas = earth.getRenderer().domElement;
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, earth.getCamera());
  
  const plateBoundaryList = earth.getPlateBoundaries();
  const hitZones = plateBoundaryList.map(pb => pb.getHitZone());
  
  const plateIntersects = raycaster.intersectObjects(hitZones, false);
  
  plateBoundaryList.forEach(pb => {
    pb.onHoverEnd();
  });
  
  let hoveredPlate: PlateBoundary | null = null;
  
  if (plateIntersects.length > 0) {
    const intersected = plateIntersects[0].object;
    const plateBoundary = plateBoundaryList.find(pb => 
      pb.getHitZone() === intersected || 
      pb.getLine() === intersected ||
      (intersected as any).userData?.plateBoundary === pb
    );
    if (plateBoundary) {
      plateBoundary.onHover(event.clientX, event.clientY);
      hoveredPlate = plateBoundary;
    }
  }
  
  const seismicPoints = earth.getSeismicPoints();
  const markers: THREE.Object3D[] = [];
  seismicPoints.forEach((sp) => {
    if (sp.isVisible()) {
      markers.push(sp.getMarker());
    }
  });
  
  const seismicIntersects = raycaster.intersectObjects(markers, false);
  
  if (seismicIntersects.length > 0) {
    canvas.style.cursor = 'pointer';
  } else if (hoveredPlate) {
    canvas.style.cursor = 'pointer';
  } else {
    canvas.style.cursor = 'grab';
  }
}

function handleClick(event: MouseEvent): void {
  const canvas = earth.getRenderer().domElement;
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, earth.getCamera());
  
  const seismicPoints = earth.getSeismicPoints();
  const allObjects: THREE.Object3D[] = [];
  const visiblePoints: SeismicPoint[] = [];
  seismicPoints.forEach((sp) => {
    if (sp.isVisible()) {
      visiblePoints.push(sp);
      allObjects.push(sp.getMarker());
    }
  });
  
  const intersects = raycaster.intersectObjects(allObjects, true);
  
  if (intersects.length > 0) {
    let intersectedObject = intersects[0].object;
    let seismicPoint: SeismicPoint | null = null;
    
    let current: THREE.Object3D | null = intersectedObject;
    while (current) {
      if ((current as any).userData?.seismicPoint) {
        seismicPoint = (current as any).userData.seismicPoint;
        break;
      }
      current = current.parent;
    }
    
    if (!seismicPoint) {
      seismicPoint = Array.from(seismicPoints.values()).find(
        sp => sp.getMarker() === intersectedObject
      ) || null;
    }
    
    if (seismicPoint) {
      handleEarthquakeClick(seismicPoint, event.clientX, event.clientY);
      return;
    }
  }
  
  if (state.selectedPoint) {
    closeInfoWindow();
  }
}

function handleEarthquakeClick(point: SeismicPoint, clientX: number, clientY: number): void {
  if (state.selectedPoint && state.selectedPoint !== point) {
    state.selectedPoint.hideRipple();
  }
  
  state.selectedPoint = point;
  state.selectedEarthquake = point.getRecord();
  
  point.showRipple();
  
  showInfoWindow(point.getRecord(), clientX, clientY);
}

function showInfoWindow(record: SeismicRecord, clientX: number, clientY: number): void {
  if (infoWindow) {
    infoWindow.remove();
    infoWindow = null;
  }
  
  infoWindow = document.createElement('div');
  infoWindow.style.position = 'fixed';
  infoWindow.style.zIndex = '200';
  infoWindow.style.padding = '20px 24px';
  infoWindow.style.background = 'rgba(255, 255, 255, 0.95)';
  infoWindow.style.backdropFilter = 'blur(20px)';
  infoWindow.style.borderRadius = '16px';
  infoWindow.style.border = '1px solid rgba(255, 255, 255, 0.3)';
  infoWindow.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.4)';
  infoWindow.style.minWidth = '280px';
  infoWindow.style.transform = 'translate(-50%, -50%) scale(0.8)';
  infoWindow.style.opacity = '0';
  infoWindow.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  infoWindow.style.color = '#1a1a2e';
  
  const formatTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };
  
  const getMagnitudeColor = (mag: number): string => {
    if (mag >= 7) return '#ff4444';
    if (mag >= 6) return '#ff8800';
    if (mag >= 5) return '#ffcc00';
    return '#44cc44';
  };
  
  infoWindow.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
      <div>
        <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
          地震详情
        </div>
        <div style="font-size: 18px; font-weight: 700; color: #1a1a2e;">
          ${record.location}
        </div>
      </div>
      <button id="close-info" style="width: 28px; height: 28px; border: none; background: rgba(0,0,0,0.1); border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #666; transition: all 0.2s; line-height: 1;">
        ×
      </button>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div>
        <div style="font-size: 11px; color: #888; margin-bottom: 4px;">震级</div>
        <div style="font-size: 32px; font-weight: 700; color: ${getMagnitudeColor(record.magnitude)};">
          M ${record.magnitude.toFixed(1)}
        </div>
      </div>
      <div>
        <div style="font-size: 11px; color: #888; margin-bottom: 4px;">深度</div>
        <div style="font-size: 24px; font-weight: 600; color: #333;">
          ${record.depth.toFixed(0)} km
        </div>
      </div>
    </div>
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.1);">
      <div style="font-size: 11px; color: #888; margin-bottom: 4px;">发生时间</div>
      <div style="font-size: 14px; font-weight: 500; color: #333;">
        ${formatTime(record.time)}
      </div>
    </div>
    <div style="margin-top: 12px; display: flex; gap: 24px; font-size: 12px; color: #666;">
      <div>
        <span style="color: #888;">纬度：</span>
        ${record.latitude.toFixed(4)}°
      </div>
      <div>
        <span style="color: #888;">经度：</span>
        ${record.longitude.toFixed(4)}°
      </div>
    </div>
  `;
  
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  let posX = clientX;
  let posY = clientY - 120;
  
  if (posX < 160) posX = 160;
  if (posX > windowWidth - 160) posX = windowWidth - 160;
  if (posY < 120) posY = 120;
  if (posY > windowHeight - 100) posY = windowHeight - 100;
  
  infoWindow.style.left = `${posX}px`;
  infoWindow.style.top = `${posY}px`;
  
  document.body.appendChild(infoWindow);
  
  requestAnimationFrame(() => {
    if (infoWindow) {
      infoWindow.style.transform = 'translate(-50%, -50%) scale(1)';
      infoWindow.style.opacity = '1';
    }
  });
  
  const closeBtn = infoWindow.querySelector('#close-info');
  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeInfoWindow();
  });
}

function closeInfoWindow(): void {
  if (infoWindow) {
    infoWindow.style.transform = 'translate(-50%, -50%) scale(0.8)';
    infoWindow.style.opacity = '0';
    
    const win = infoWindow;
    setTimeout(() => {
      if (win && win.parentNode) {
        win.parentNode.removeChild(win);
      }
      if (infoWindow === win) {
        infoWindow = null;
      }
    }, 300);
  }
  
  if (state.selectedPoint) {
    state.selectedPoint.hideRipple();
    state.selectedPoint = null;
    state.selectedEarthquake = null;
  }
}

function handleDateChange(date: Date): void {
  state.currentDate = date;
  updateVisibleEarthquakes();
}

function updateVisibleEarthquakes(): void {
  const visible = timeline.filterRecordsByDate(seismicData, state.currentDate);
  
  const previousIds = new Set(state.visibleEarthquakes.map(r => r.id));
  const newVisibleIds = new Set(visible.map(r => r.id));
  
  const newIds = new Set(
    visible.filter(r => !previousIds.has(r.id)).map(r => r.id)
  );
  
  state.visibleEarthquakes = visible;
  state.stats.count = visible.length;
  state.stats.maxMagnitude = visible.length > 0
    ? Math.max(...visible.map(r => r.magnitude))
    : 0;
  
  earth.updateVisiblePoints(newVisibleIds, newIds);
  
  updateStatsPanel();
}

function updateStatsPanel(): void {
  const countEl = document.getElementById('stat-count');
  const maxEl = document.getElementById('stat-max');
  
  if (countEl) {
    countEl.textContent = state.stats.count.toString();
  }
  if (maxEl) {
    maxEl.textContent = state.stats.maxMagnitude.toFixed(1);
  }
}

function handleResize(): void {
  const container = document.getElementById('earth-container');
  if (!container) return;
  
  earth.onResize(container.clientWidth, container.clientHeight);
  
  const width = window.innerWidth;
  if (width < 1280 && width >= 768) {
    statsPanel.style.top = 'auto';
    statsPanel.style.bottom = '120px';
    statsPanel.style.left = '24px';
    statsPanel.style.transform = 'translateX(0)';
  } else {
    statsPanel.style.top = '24px';
    statsPanel.style.bottom = 'auto';
    statsPanel.style.left = '24px';
  }
}

function animate(): void {
  animationId = requestAnimationFrame(animate);
  
  const currentTime = performance.now();
  earth.update(currentTime);
}

function dispose(): void {
  cancelAnimationFrame(animationId);
  earth.dispose();
  timeline.dispose();
  
  if (infoWindow) {
    infoWindow.remove();
  }
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', dispose);
