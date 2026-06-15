import * as THREE from 'three';
import { createGallery } from './gallery';
import { Artwork, ArtworkData, ArtworkClickEvent } from './artwork';

const artworksData: ArtworkData[] = [
  {
    id: '1',
    title: '晨曦微光',
    author: '林雨晴',
    year: 2023,
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800'
  },
  {
    id: '2',
    title: '梦境森林',
    author: '张墨白',
    year: 2024,
    imageUrl: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800'
  },
  {
    id: '3',
    title: '城市印象',
    author: '陈思远',
    year: 2023,
    imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800'
  },
  {
    id: '4',
    title: '海洋之心',
    author: '王蓝',
    year: 2024,
    imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800'
  },
  {
    id: '5',
    title: '秋日私语',
    author: '李知秋',
    year: 2023,
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800'
  },
  {
    id: '6',
    title: '星空漫步',
    author: '赵星河',
    year: 2024,
    imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800'
  }
];

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let galleryGroup: THREE.Group;
let artworks: Artwork[] = [];
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;

let isDragging = false;
let previousMouseX = 0;
let targetTheta = Math.PI / 5;
let currentTheta = Math.PI / 5;
let targetDistance = 17;
let currentDistance = 17;
const minDistance = 5;
const maxDistance = 30;
const dampingFactor = 0.2;

let currentFloatingArtwork: Artwork | null = null;
let isFullscreen = false;

const overlay = document.getElementById('overlay') as HTMLDivElement;
const artworkInfo = document.getElementById('artwork-info') as HTMLDivElement;
const artworkTitle = document.getElementById('artwork-title') as HTMLDivElement;
const artworkAuthor = document.getElementById('artwork-author') as HTMLDivElement;
const artworkYear = document.getElementById('artwork-year') as HTMLDivElement;
const fullscreenBtn = document.getElementById('fullscreen-btn') as HTMLButtonElement;
const fullscreenView = document.getElementById('fullscreen-view') as HTMLDivElement;
const fullscreenImage = document.getElementById('fullscreen-image') as HTMLImageElement;

const warmLightColor = new THREE.Color().setHSL(0.08, 0.6, 0.7);

function init(): void {
  const container = document.getElementById('canvas-container') as HTMLDivElement;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 2, targetDistance);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  setupLighting();
  setupGallery();
  setupEventListeners();
  animate();
}

function setupLighting(): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const spotLight1 = new THREE.SpotLight(warmLightColor, 1.5, 30, Math.PI / 6, 0.4, 1);
  spotLight1.position.set(-5, 4.5, -4);
  spotLight1.target.position.set(-5, 2.5, -5);
  spotLight1.castShadow = true;
  spotLight1.shadow.mapSize.width = 1024;
  spotLight1.shadow.mapSize.height = 1024;
  scene.add(spotLight1);
  scene.add(spotLight1.target);

  const spotLight2 = new THREE.SpotLight(warmLightColor, 1.5, 30, Math.PI / 6, 0.4, 1);
  spotLight2.position.set(5, 4.5, -4);
  spotLight2.target.position.set(5, 2.5, -5);
  spotLight2.castShadow = true;
  spotLight2.shadow.mapSize.width = 1024;
  spotLight2.shadow.mapSize.height = 1024;
  scene.add(spotLight2);
  scene.add(spotLight2.target);

  const spotLight3 = new THREE.SpotLight(warmLightColor, 1.2, 30, Math.PI / 6, 0.4, 1);
  spotLight3.position.set(-5, 4.5, 4);
  spotLight3.target.position.set(-5, 2.5, 5);
  spotLight3.castShadow = true;
  scene.add(spotLight3);
  scene.add(spotLight3.target);

  const spotLight4 = new THREE.SpotLight(warmLightColor, 1.2, 30, Math.PI / 6, 0.4, 1);
  spotLight4.position.set(5, 4.5, 4);
  spotLight4.target.position.set(5, 2.5, 5);
  spotLight4.castShadow = true;
  scene.add(spotLight4);
  scene.add(spotLight4.target);
}

function setupGallery(): void {
  const { group, artworks: artworkList } = createGallery(artworksData);
  galleryGroup = group;
  artworks = artworkList;
  scene.add(galleryGroup);
}

function setupEventListeners(): void {
  const canvas = renderer.domElement;

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('click', onCanvasClick);
  overlay.addEventListener('click', onOverlayClick);
  window.addEventListener('resize', onWindowResize);
  fullscreenBtn.addEventListener('click', onFullscreenClick);
  window.addEventListener('keydown', onKeyDown);

  document.addEventListener('artwork-click', onArtworkClick as EventListener);
}

function onMouseDown(event: MouseEvent): void {
  if (isFullscreen) return;
  isDragging = true;
  previousMouseX = event.clientX;
}

function onMouseUp(): void {
  isDragging = false;
}

function onMouseMove(event: MouseEvent): void {
  if (isDragging && !isFullscreen) {
    const deltaX = event.clientX - previousMouseX;
    targetTheta += deltaX * 0.005;
    previousMouseX = event.clientX;
  }

  updateMousePosition(event);
  updateCursor();
}

function onWheel(event: WheelEvent): void {
  if (isFullscreen) return;
  event.preventDefault();
  targetDistance += event.deltaY * 0.01;
  targetDistance = Math.max(minDistance, Math.min(maxDistance, targetDistance));
}

function updateMousePosition(event: MouseEvent): void {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function updateCursor(): void {
  if (isFullscreen) {
    document.body.style.cursor = 'default';
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const allTargets = artworks.flatMap(a => a.raycastTargets);
  const intersects = raycaster.intersectObjects(allTargets);

  if (intersects.length > 0) {
    document.body.style.cursor = 'pointer';
  } else if (isDragging) {
    document.body.style.cursor = 'grabbing';
  } else {
    document.body.style.cursor = 'grab';
  }
}

function onCanvasClick(event: MouseEvent): void {
  if (isFullscreen) return;
  if (isDragging) return;

  updateMousePosition(event);
  raycaster.setFromCamera(mouse, camera);

  for (const artwork of artworks) {
    const intersects = raycaster.intersectObjects(artwork.raycastTargets);
    if (intersects.length > 0) {
      const customEvent: ArtworkClickEvent = new CustomEvent('artwork-click', {
        detail: artwork.getData()
      }) as ArtworkClickEvent;
      document.dispatchEvent(customEvent);

      if (currentFloatingArtwork === artwork) {
        retractCurrentArtwork();
      } else {
        if (currentFloatingArtwork) {
          currentFloatingArtwork.retract();
        }
        artwork.float();
        currentFloatingArtwork = artwork;
        showArtworkInfo(artwork.getData());
      }
      return;
    }
  }
}

function onArtworkClick(event: ArtworkClickEvent): void {
  console.log('Artwork clicked:', event.detail);
}

function onOverlayClick(): void {
  if (isFullscreen) return;
  retractCurrentArtwork();
}

function retractCurrentArtwork(): void {
  if (currentFloatingArtwork) {
    currentFloatingArtwork.retract();
    currentFloatingArtwork = null;
  }
  hideArtworkInfo();
}

function showArtworkInfo(data: ArtworkData): void {
  artworkTitle.textContent = data.title;
  artworkAuthor.textContent = data.author;
  artworkYear.textContent = data.year.toString();

  overlay.classList.add('active');
  artworkInfo.classList.add('active');
  fullscreenBtn.classList.add('active');
  fullscreenImage.src = data.imageUrl;
}

function hideArtworkInfo(): void {
  overlay.classList.remove('active');
  artworkInfo.classList.remove('active');
  fullscreenBtn.classList.remove('active');
}

function onFullscreenClick(): void {
  isFullscreen = true;
  fullscreenView.classList.add('active');
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isFullscreen) {
    exitFullscreen();
  }
}

function exitFullscreen(): void {
  isFullscreen = false;
  fullscreenView.classList.remove('active');
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const lerpFactor = 1 - Math.exp(-delta / dampingFactor);

  currentTheta += (targetTheta - currentTheta) * lerpFactor;
  currentDistance += (targetDistance - currentDistance) * lerpFactor;

  const centerX = 0;
  const centerY = 2.5;
  const centerZ = 0;

  camera.position.x = centerX + Math.sin(currentTheta) * currentDistance;
  camera.position.y = centerY;
  camera.position.z = centerZ + Math.cos(currentTheta) * currentDistance;
  camera.lookAt(centerX, centerY, centerZ);

  renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init);
