import * as THREE from 'three';

export function createGround(scene: THREE.Scene): THREE.GridHelper {
  const groundSize = 50;
  const divisions = 50;
  
  const gridHelper = new THREE.GridHelper(groundSize, divisions, 0x2D4059, 0x2D4059);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.3;
  gridHelper.position.y = 0;
  
  scene.add(gridHelper);
  
  return gridHelper;
}

export function createObstacles(scene: THREE.Scene, count: number = 10): THREE.Mesh[] {
  const obstacles: THREE.Mesh[] = [];
  
  for (let i = 0; i < count; i++) {
    const width = 0.5 + Math.random() * 2;
    const height = 0.2 + Math.random() * 0.6;
    const depth = 0.5 + Math.random() * 2;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3A3D4B,
      transparent: true,
      opacity: 0.6,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const obstacle = new THREE.Mesh(geometry, material);
    
    obstacle.position.x = (Math.random() - 0.5) * 40;
    obstacle.position.y = height / 2;
    obstacle.position.z = (Math.random() - 0.5) * 30;
    
    obstacle.rotation.y = Math.random() * Math.PI;
    
    scene.add(obstacle);
    obstacles.push(obstacle);
  }
  
  return obstacles;
}

export function createWindArrow(scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group();
  
  const coneGeometry = new THREE.ConeGeometry(0.5, 2, 8);
  const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xE94560 });
  const cone = new THREE.Mesh(coneGeometry, coneMaterial);
  cone.rotation.x = Math.PI / 2;
  cone.position.y = 0;
  
  const cylinderGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
  const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0xE94560 });
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  cylinder.rotation.x = Math.PI / 2;
  cylinder.position.y = -1.75;
  
  group.add(cone);
  group.add(cylinder);
  
  group.position.set(0, 0.5, 0);
  
  scene.add(group);
  
  return group;
}

export function updateWindArrow(arrow: THREE.Group, degrees: number): void {
  const rad = (degrees * Math.PI) / 180;
  arrow.rotation.y = -rad;
}

export class FPSCounter {
  private element: HTMLElement;
  private frames = 0;
  private lastTime = performance.now();
  private fps = 0;

  constructor(elementId: string) {
    const el = document.getElementById(elementId);
    if (!el) {
      throw new Error(`Element with id "${elementId}" not found`);
    }
    this.element = el;
  }

  public update(): void {
    this.frames++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;
      this.element.textContent = `FPS: ${this.fps}`;
    }
  }

  public getFPS(): number {
    return this.fps;
  }
}

export function updateParticleCount(elementId: string, count: number): void {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = `粒子数: ${count}`;
  }
}

export function hideLoadingOverlay(overlayId: string): void {
  const overlay = document.getElementById(overlayId);
  if (overlay) {
    overlay.classList.add('hidden');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 500);
  }
}

export function setupLights(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);
  
  const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3A3D4B, 0.3);
  scene.add(hemisphereLight);
}

export function setupFog(scene: THREE.Scene): void {
  scene.fog = new THREE.FogExp2(0x1A1A2E, 0.015);
}
