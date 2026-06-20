import * as THREE from 'three';
import GUI from 'lil-gui';
import { camera, controls, raycaster, mouse, renderer } from './scene';
import { buildingMeshes, highlightBuilding, unhighlightBuilding, getBuildingData, BuildingData } from './cityModel';
import { currentHour, currentHeatType, HeatType, heatTypes, updateHeatmapData, switchHeatType, getHeatValue, getHeatTypeLabel } from './heatmap';

export let gui: GUI;
export let hoveredBuilding: THREE.Mesh | null = null;
export let selectedBuilding: THREE.Mesh | null = null;

let statusDisplay: HTMLElement;
let tooltip: HTMLElement;
let isPlaying: boolean = false;
let playInterval: number | null = null;
let cameraAnimationId: number | null = null;

const guiParams = {
  hour: 12,
  '热力类型': '人口密度',
  '播放动画': () => togglePlay(),
  isPlaying: false
};

export function initUI(): void {
  statusDisplay = document.getElementById('status-display')!;
  tooltip = document.getElementById('tooltip')!;
  
  initGui();
  initMouseEvents();
  updateStatusDisplay();
}

function initGui(): void {
  gui = new GUI({ title: '控制面板' });
  gui.domElement.style.position = 'fixed';
  gui.domElement.style.bottom = '20px';
  gui.domElement.style.right = '20px';
  gui.domElement.style.zIndex = '100';
  
  gui.add(guiParams, 'hour', 0, 23, 1)
    .name('时间（小时）')
    .onChange((value: number) => {
      updateHeatmapData(value);
      updateStatusDisplay();
    });
  
  const heatTypeOptions: { [key: string]: HeatType } = {};
  for (const type of heatTypes) {
    heatTypeOptions[type.label] = type.value;
  }
  
  gui.add(guiParams, '热力类型', heatTypeOptions)
    .name('热力类型')
    .onChange((value: HeatType) => {
      switchHeatType(value);
      updateStatusDisplay();
    });
  
  gui.add(guiParams, '播放动画').name('播放/暂停');
}

function togglePlay(): void {
  isPlaying = !isPlaying;
  guiParams.isPlaying = isPlaying;
  
  if (isPlaying) {
    playInterval = window.setInterval(() => {
      let newHour = Math.floor(guiParams.hour) + 1;
      if (newHour > 23) newHour = 0;
      guiParams.hour = newHour;
      gui.controllers.forEach(c => {
        if (c.property === 'hour') {
          c.setValue(newHour);
        }
      });
      updateHeatmapData(newHour);
      updateStatusDisplay();
    }, 1000);
  } else {
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
  }
}

function initMouseEvents(): void {
  renderer.domElement.addEventListener('mousemove', handleMouseMove);
  renderer.domElement.addEventListener('click', handleClick);
  renderer.domElement.addEventListener('mouseleave', handleMouseLeave);
}

function handleMouseMove(event: MouseEvent): void {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(buildingMeshes);
  
  if (intersects.length > 0) {
    const mesh = intersects[0].object as THREE.Mesh;
    
    if (hoveredBuilding !== mesh) {
      if (hoveredBuilding && hoveredBuilding !== selectedBuilding) {
        unhighlightBuilding(hoveredBuilding, true);
      }
      
      hoveredBuilding = mesh;
      highlightBuilding(mesh, true);
      
      const buildingData = getBuildingData(mesh);
      if (buildingData) {
        showTooltip(event.clientX, event.clientY, buildingData);
      }
    } else {
      const buildingData = getBuildingData(mesh);
      if (buildingData) {
        updateTooltipPosition(event.clientX, event.clientY, buildingData);
      }
    }
  } else {
    if (hoveredBuilding && hoveredBuilding !== selectedBuilding) {
      unhighlightBuilding(hoveredBuilding, true);
    }
    hoveredBuilding = null;
    hideTooltip();
  }
}

function handleClick(event: MouseEvent): void {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(buildingMeshes);
  
  if (intersects.length > 0) {
    const mesh = intersects[0].object as THREE.Mesh;
    
    if (selectedBuilding && selectedBuilding !== mesh) {
      unhighlightBuilding(selectedBuilding, false);
    }
    
    selectedBuilding = mesh;
    highlightBuilding(mesh, false);
    
    focusCamera(mesh);
    
    setTimeout(() => {
      if (selectedBuilding === mesh) {
        unhighlightBuilding(mesh, false);
        selectedBuilding = null;
      }
    }, 3000);
  }
}

function handleMouseLeave(): void {
  if (hoveredBuilding && hoveredBuilding !== selectedBuilding) {
    unhighlightBuilding(hoveredBuilding, true);
  }
  hoveredBuilding = null;
  hideTooltip();
}

function showTooltip(x: number, y: number, buildingData: BuildingData): void {
  const heatValue = getHeatValue(buildingData.id);
  const heatLabel = getHeatTypeLabel();
  const percentage = Math.round(heatValue * 100);
  
  tooltip.textContent = `Bldg ${buildingData.id + 1} | ${heatLabel} ${percentage}%`;
  tooltip.style.display = 'block';
  updateTooltipPosition(x, y, buildingData);
}

function updateTooltipPosition(x: number, y: number, _buildingData: BuildingData): void {
  const offsetX = 15;
  const offsetY = 15;
  
  let tooltipX = x + offsetX;
  let tooltipY = y + offsetY;
  
  const tooltipRect = tooltip.getBoundingClientRect();
  if (tooltipX + tooltipRect.width > window.innerWidth) {
    tooltipX = x - tooltipRect.width - offsetX;
  }
  if (tooltipY + tooltipRect.height > window.innerHeight) {
    tooltipY = y - tooltipRect.height - offsetY;
  }
  
  tooltip.style.left = `${tooltipX}px`;
  tooltip.style.top = `${tooltipY}px`;
}

function hideTooltip(): void {
  tooltip.style.display = 'none';
}

function focusCamera(mesh: THREE.Mesh): void {
  if (cameraAnimationId) {
    cancelAnimationFrame(cameraAnimationId);
  }
  
  const buildingData = getBuildingData(mesh);
  if (!buildingData) return;
  
  const targetPosition = new THREE.Vector3(
    mesh.position.x,
    mesh.position.y,
    mesh.position.z
  );
  
  const cameraOffset = new THREE.Vector3(6, 5, 6);
  const targetCameraPosition = targetPosition.clone().add(cameraOffset);
  
  const startPosition = camera.position.clone();
  const startTarget = controls.target.clone();
  const duration = 2000;
  const startTime = performance.now();
  
  function animate(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(progress);
    
    camera.position.lerpVectors(startPosition, targetCameraPosition, easedProgress);
    controls.target.lerpVectors(startTarget, targetPosition, easedProgress);
    controls.update();
    
    if (progress < 1) {
      cameraAnimationId = requestAnimationFrame(animate);
    } else {
      cameraAnimationId = null;
    }
  }
  
  cameraAnimationId = requestAnimationFrame(animate);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function updateStatusDisplay(): void {
  const hourStr = currentHour.toString().padStart(2, '0');
  const typeLabel = getHeatTypeLabel(currentHeatType);
  statusDisplay.textContent = `${typeLabel} - ${hourStr}:00`;
}

export function updateClockDisplay(): void {
  updateStatusDisplay();
}
