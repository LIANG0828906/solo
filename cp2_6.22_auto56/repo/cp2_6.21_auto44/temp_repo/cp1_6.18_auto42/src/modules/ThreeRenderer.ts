import * as THREE from 'three';
import { PathPoint } from './SampleApi';

export type ThemeType = 'neon' | 'aurora' | 'sunset';

interface ThemeColors {
  horizontalStart: string;
  horizontalEnd: string;
  verticalStart: string;
  verticalEnd: string;
  particleColors: string[];
}

const themes: Record<ThemeType, ThemeColors> = {
  neon: {
    horizontalStart: '#FF6B6B',
    horizontalEnd: '#FFD93D',
    verticalStart: '#6BCB77',
    verticalEnd: '#4D96FF',
    particleColors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF']
  },
  aurora: {
    horizontalStart: '#00D9FF',
    horizontalEnd: '#7C3AED',
    verticalStart: '#10B981',
    verticalEnd: '#06B6D4',
    particleColors: ['#00D9FF', '#7C3AED', '#10B981', '#06B6D4']
  },
  sunset: {
    horizontalStart: '#F97316',
    horizontalEnd: '#EC4899',
    verticalStart: '#FBBF24',
    verticalEnd: '#EF4444',
    particleColors: ['#F97316', '#EC4899', '#FBBF24', '#EF4444']
  }
};

interface CurveData {
  mesh: THREE.Line;
  glowMesh: THREE.Line;
  originalPath: PathPoint[];
  baseColorStart: THREE.Color;
  baseColorEnd: THREE.Color;
  isHorizontal: boolean;
  pulsePhase: number;
  originalLinewidth: number;
  originalGlowOpacity: number;
  originalGlowRadius: number;
}

export interface SelectedPathInfo {
  path: PathPoint[];
  pointCount: number;
  length: number;
}

export interface RendererOptions {
  container: HTMLElement;
  onPathClick?: (info: SelectedPathInfo) => void;
}

export class ThreeRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  private curves: CurveData[] = [];
  private particles: THREE.Points | null = null;
  private particleGroup: THREE.Group | null = null;
  
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private cameraDistance = 600;
  private cameraTheta = Math.PI / 4;
  private cameraPhi = Math.PI / 4;
  private targetCameraTheta = Math.PI / 4;
  private targetCameraPhi = Math.PI / 4;
  private targetCameraDistance = 600;
  
  private minZoom = 0.5;
  private maxZoom = 3;
  private baseDistance = 600;
  
  private currentTheme: ThemeType = 'neon';
  private animationId: number | null = null;
  private clock: THREE.Clock;
  
  private originalImage: HTMLCanvasElement | null = null;
  private onPathClick?: (info: SelectedPathInfo) => void;
  private selectedCurve: CurveData | null = null;
  
  private canvasScale = 0.5;
  
  constructor(options: RendererOptions) {
    this.container = options.container;
    this.onPathClick = options.onPathClick;
    this.clock = new THREE.Clock();
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0A14);
    
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
    this.updateCameraPosition();
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio * this.canvasScale);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    this.container.appendChild(this.renderer.domElement);
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.addAmbientLight();
    this.setupEventListeners();
    this.animate();
  }
  
  private addAmbientLight(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 0.8, 1000);
    pointLight.position.set(200, 200, 200);
    this.scene.add(pointLight);
  }
  
  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;
    
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('mouseleave', this.onMouseUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('click', this.onClick);
    
    window.addEventListener('resize', this.onResize);
  }
  
  private onMouseDown = (e: MouseEvent): void => {
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  };
  
  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;
    
    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;
    
    this.targetCameraTheta -= deltaX * 0.5 * Math.PI / 180;
    this.targetCameraPhi = Math.max(
      0.1,
      Math.min(Math.PI - 0.1, this.targetCameraPhi + deltaY * 0.5 * Math.PI / 180)
    );
    
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  };
  
  private onMouseUp = (): void => {
    this.isDragging = false;
  };
  
  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    this.targetCameraDistance = Math.max(
      this.baseDistance * this.minZoom,
      Math.min(this.baseDistance * this.maxZoom, this.targetCameraDistance * delta)
    );
  };
  
  private onClick = (e: MouseEvent): void => {
    if (this.isDragging) return;
    
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const curveMeshes = this.curves.map(c => c.mesh);
    const intersects = this.raycaster.intersectObjects(curveMeshes, true);
    
    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Line;
      const curveData = this.curves.find(c => c.mesh === clickedMesh || c.mesh === clickedMesh.parent);
      
      if (curveData) {
        this.selectCurve(curveData);
      }
    } else {
      this.deselectCurve();
    }
  };
  
  private selectCurve(curveData: CurveData): void {
    this.deselectCurve();
    
    this.selectedCurve = curveData;
    
    const material = curveData.mesh.material as THREE.LineBasicMaterial;
    const glowMaterial = curveData.glowMesh.material as THREE.LineBasicMaterial;
    
    material.linewidth = 5;
    glowMaterial.opacity = 0.6;
    
    const length = this.calculatePathLength(curveData.originalPath);
    
    if (this.onPathClick) {
      this.onPathClick({
        path: curveData.originalPath,
        pointCount: curveData.originalPath.length,
        length: Math.round(length)
      });
    }
  }
  
  private deselectCurve(): void {
    if (this.selectedCurve) {
      const material = this.selectedCurve.mesh.material as THREE.LineBasicMaterial;
      const glowMaterial = this.selectedCurve.glowMesh.material as THREE.LineBasicMaterial;
      
      material.linewidth = this.selectedCurve.originalLinewidth;
      glowMaterial.opacity = this.selectedCurve.originalGlowOpacity;
      
      this.selectedCurve = null;
    }
  }
  
  private calculatePathLength(path: PathPoint[]): number {
    let length = 0;
    for (let i = 1; i < path.length; i++) {
      length += Math.hypot(
        path[i].x - path[i - 1].x,
        path[i].y - path[i - 1].y
      );
    }
    return length;
  }
  
  private onResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  };
  
  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }
  
  public resetCamera(): void {
    this.targetCameraTheta = Math.PI / 4;
    this.targetCameraPhi = Math.PI / 4;
    this.targetCameraDistance = this.baseDistance;
  }
  
  public setTheme(theme: ThemeType): void {
    this.currentTheme = theme;
    const themeColors = themes[theme];
    
    this.curves.forEach((curveData, index) => {
      const startColor = curveData.isHorizontal 
        ? new THREE.Color(themeColors.horizontalStart)
        : new THREE.Color(themeColors.verticalStart);
      const endColor = curveData.isHorizontal 
        ? new THREE.Color(themeColors.horizontalEnd)
        : new THREE.Color(themeColors.verticalEnd);
      
      this.animateColorChange(curveData, startColor, endColor);
    });
    
    if (this.particles) {
      const geometry = this.particles.geometry as THREE.BufferGeometry;
      const colors = geometry.attributes.color as THREE.BufferAttribute;
      
      for (let i = 0; i < colors.count; i++) {
        const colorHex = themeColors.particleColors[
          Math.floor(Math.random() * themeColors.particleColors.length)
        ];
        const color = new THREE.Color(colorHex);
        colors.setXYZ(i, color.r, color.g, color.b);
      }
      colors.needsUpdate = true;
    }
  }
  
  private animateColorChange(
    curveData: CurveData,
    targetStart: THREE.Color,
    targetEnd: THREE.Color,
    duration: number = 1000
  ): void {
    const startTime = performance.now();
    const originalStart = curveData.baseColorStart.clone();
    const originalEnd = curveData.baseColorEnd.clone();
    
    const update = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const easeT = 1 - Math.pow(1 - t, 3);
      
      const currentStart = originalStart.clone().lerp(targetStart, easeT);
      const currentEnd = originalEnd.clone().lerp(targetEnd, easeT);
      
      this.updateCurveColors(curveData, currentStart, currentEnd);
      
      if (t < 1) {
        requestAnimationFrame(update);
      } else {
        curveData.baseColorStart.copy(targetStart);
        curveData.baseColorEnd.copy(targetEnd);
      }
    };
    
    update();
  }
  
  private updateCurveColors(
    curveData: CurveData,
    startColor: THREE.Color,
    endColor: THREE.Color
  ): void {
    const geometry = curveData.mesh.geometry as THREE.BufferGeometry;
    const colors = geometry.attributes.color as THREE.BufferAttribute;
    const glowGeometry = curveData.glowMesh.geometry as THREE.BufferGeometry;
    const glowColors = glowGeometry.attributes.color as THREE.BufferAttribute;
    
    const count = colors.count;
    
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const color = startColor.clone().lerp(endColor, t);
      
      colors.setXYZ(i, color.r, color.g, color.b);
      glowColors.setXYZ(i, color.r, color.g, color.b);
    }
    
    colors.needsUpdate = true;
    glowColors.needsUpdate = true;
  }
  
  public renderSketch(paths: PathPoint[][], originalImage?: HTMLCanvasElement): void {
    this.clearScene();
    this.originalImage = originalImage || null;
    
    const themeColors = themes[this.currentTheme];
    
    paths.forEach((path, pathIndex) => {
      if (path.length < 2) return;
      
      const curveData = this.createCurve(
        path,
        pathIndex,
        themeColors
      );
      
      this.curves.push(curveData);
      this.scene.add(curveData.mesh);
      this.scene.add(curveData.glowMesh);
    });
    
    this.createParticles(themeColors.particleColors);
  }
  
  private clearScene(): void {
    this.curves.forEach(curveData => {
      this.scene.remove(curveData.mesh);
      this.scene.remove(curveData.glowMesh);
      
      const geometry = curveData.mesh.geometry as THREE.BufferGeometry;
      const glowGeometry = curveData.glowMesh.geometry as THREE.BufferGeometry;
      const material = curveData.mesh.material as THREE.Material;
      const glowMaterial = curveData.glowMesh.material as THREE.Material;
      
      geometry.dispose();
      glowGeometry.dispose();
      material.dispose();
      glowMaterial.dispose();
    });
    
    this.curves = [];
    this.selectedCurve = null;
    
    if (this.particles) {
      this.scene.remove(this.particles);
      const geometry = this.particles.geometry as THREE.BufferGeometry;
      const material = this.particles.material as THREE.Material;
      geometry.dispose();
      material.dispose();
      this.particles = null;
    }
    
    if (this.particleGroup) {
      this.scene.remove(this.particleGroup);
      this.particleGroup = null;
    }
  }
  
  private createCurve(
    path: PathPoint[],
    index: number,
    themeColors: ThemeColors
  ): CurveData {
    const isHorizontal = this.isPathHorizontal(path);
    
    const startColor = isHorizontal 
      ? new THREE.Color(themeColors.horizontalStart)
      : new THREE.Color(themeColors.verticalStart);
    const endColor = isHorizontal 
      ? new THREE.Color(themeColors.horizontalEnd)
      : new THREE.Color(themeColors.verticalEnd);
    
    const threePoints: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];
    
    path.forEach((point, i) => {
      const x = point.x - 400;
      const y = -point.y + 300;
      const z = (Math.random() - 0.5) * 4;
      
      threePoints.push(new THREE.Vector3(x, y, z));
      
      const t = i / (path.length - 1);
      const color = startColor.clone().lerp(endColor, t);
      colors.push(color);
    });
    
    const curve = new THREE.CatmullRomCurve3(threePoints);
    const curvePoints = curve.getPoints(path.length * 3);
    
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    
    const curveColors: number[] = [];
    for (let i = 0; i < curvePoints.length; i++) {
      const t = i / (curvePoints.length - 1);
      const color = startColor.clone().lerp(endColor, t);
      curveColors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(curveColors, 3));
    
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 3,
      transparent: true,
      opacity: 1
    });
    
    const line = new THREE.Line(geometry, material);
    line.userData = { pathIndex: index };
    
    const glowGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    glowGeometry.setAttribute('color', new THREE.Float32BufferAttribute(curveColors, 3));
    
    const glowMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 6,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const glowLine = new THREE.Line(glowGeometry, glowMaterial);
    glowLine.userData = { pathIndex: index };
    
    return {
      mesh: line,
      glowMesh: glowLine,
      originalPath: path,
      baseColorStart: startColor.clone(),
      baseColorEnd: endColor.clone(),
      isHorizontal,
      pulsePhase: Math.random() * Math.PI * 2,
      originalLinewidth: 3,
      originalGlowOpacity: 0.4,
      originalGlowRadius: 6
    };
  }
  
  private isPathHorizontal(path: PathPoint[]): boolean {
    if (path.length < 2) return true;
    
    let dxTotal = 0;
    let dyTotal = 0;
    
    for (let i = 1; i < path.length; i++) {
      dxTotal += Math.abs(path[i].x - path[i - 1].x);
      dyTotal += Math.abs(path[i].y - path[i - 1].y);
    }
    
    return dxTotal >= dyTotal;
  }
  
  private createParticles(particleColors: string[]): void {
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const centerX = 0;
    const centerY = 0;
    const centerZ = 0;
    const radius = 350;
    
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.8 + Math.random() * 0.4);
      
      positions[i * 3] = centerX + r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = centerY + r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = centerZ + r * Math.cos(phi);
      
      const colorHex = particleColors[Math.floor(Math.random() * particleColors.length)];
      const color = new THREE.Color(colorHex);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.particleGroup = new THREE.Group();
    this.particleGroup.add(this.particles);
    this.scene.add(this.particleGroup);
  }
  
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    
    const elapsed = this.clock.getElapsedTime();
    const delta = this.clock.getDelta();
    
    this.cameraTheta += (this.targetCameraTheta - this.cameraTheta) * 0.1;
    this.cameraPhi += (this.targetCameraPhi - this.cameraPhi) * 0.1;
    this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * 0.1;
    
    this.updateCameraPosition();
    
    this.curves.forEach((curveData) => {
      const pulse = Math.sin(elapsed * 1.5 + curveData.pulsePhase) * 0.3 + 0.7;
      
      const material = curveData.mesh.material as THREE.LineBasicMaterial;
      const glowMaterial = curveData.glowMesh.material as THREE.LineBasicMaterial;
      
      if (curveData !== this.selectedCurve) {
        material.opacity = pulse;
        glowMaterial.opacity = 0.4 * pulse;
      }
    });
    
    if (this.particleGroup) {
      this.particleGroup.rotation.y += 0.2 * delta;
    }
    
    this.renderer.render(this.scene, this.camera);
  };
  
  public getOriginalImage(): HTMLCanvasElement | null {
    return this.originalImage;
  }
  
  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    
    window.removeEventListener('resize', this.onResize);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousedown', this.onMouseDown);
    canvas.removeEventListener('mousemove', this.onMouseMove);
    canvas.removeEventListener('mouseup', this.onMouseUp);
    canvas.removeEventListener('mouseleave', this.onMouseUp);
    canvas.removeEventListener('wheel', this.onWheel);
    canvas.removeEventListener('click', this.onClick);
    
    this.clearScene();
    this.renderer.dispose();
    
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }
}
