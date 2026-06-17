import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TrackNode, TRACK_CONFIGS } from './engine/trackNode';
import { AudioMixer, PlayMode } from './engine/audioMixer';
import { ParticleSystem } from './engine/particleSystem';
import { ControlPanel } from './ui/controlPanel';

class App {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  
  private tracks: TrackNode[] = [];
  private audioMixer: AudioMixer;
  private particleSystem: ParticleSystem;
  private controlPanel: ControlPanel;
  
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  private selectedTrack: TrackNode | null = null;
  private hoveredTrack: TrackNode | null = null;
  private isDragging: boolean = false;
  private dragPlane: THREE.Plane;
  
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private fps: number = 0;
  
  private animationId: number | null = null;
  private clock: THREE.Clock;
  
  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragPlane = new THREE.Plane();
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0D1117);
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 50, 100);
    this.camera.lookAt(0, 0, 0);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 300;
    this.controls.enablePan = false;
    this.controls.mouseButtons = {
      LEFT: null as any,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE
    };
    
    this.audioMixer = new AudioMixer();
    this.particleSystem = new ParticleSystem(this.scene);
    this.controlPanel = new ControlPanel(this.container, this.audioMixer);
    
    this.setupLights();
    this.setupGrid();
    this.createTracks();
    this.setupEventListeners();
    this.setupUICallbacks();
    
    this.audioMixer.setOnProgressCallback((time, duration) => {
      this.controlPanel.updateProgress(time, duration);
    });
    
    this.animate();
  }
  
  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -300;
    directionalLight.shadow.camera.right = 300;
    directionalLight.shadow.camera.top = 300;
    directionalLight.shadow.camera.bottom = -300;
    this.scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0x6C63FF, 0.3);
    fillLight.position.set(-50, 50, -50);
    this.scene.add(fillLight);
  }
  
  private setupGrid(): void {
    const gridHelper = new THREE.GridHelper(
      800,
      40,
      0x1A1A2E,
      0x1A1A2E
    );
    gridHelper.position.y = -50;
    (gridHelper.material as THREE.Material).opacity = 0.3;
    (gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(gridHelper);
  }
  
  private createTracks(): void {
    TRACK_CONFIGS.forEach(config => {
      const track = new TrackNode(config);
      this.scene.add(track.group);
      this.tracks.push(track);
      this.audioMixer.registerTrack(track);
    });
  }
  
  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  private setupUICallbacks(): void {
    this.controlPanel.setOnPlayClick(() => {
      this.audioMixer.play(this.tracks);
      this.controlPanel.setPlaying(true);
    });
    
    this.controlPanel.setOnPauseClick(() => {
      this.audioMixer.pause();
      this.controlPanel.setPlaying(false);
    });
    
    this.controlPanel.setOnSeek((time) => {
      this.audioMixer.seek(time);
      if (this.audioMixer.isPlaying) {
        this.audioMixer.play(this.tracks);
      }
    });
    
    this.controlPanel.setOnPlayModeChange((mode) => {
      this.audioMixer.playMode = mode;
    });
    
    this.controlPanel.setOnTrackParameterChange((track) => {
      this.audioMixer.setTrackVolume(track.id, track.volume);
      this.audioMixer.setTrackPitch(track.id, track.pitch);
      this.audioMixer.setTrackSpeed(track.id, track.speed);
    });
  }
  
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  private updateMouse(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  private getTrackFromMesh(mesh: THREE.Object3D): TrackNode | null {
    const trackId = mesh.userData.trackId;
    if (!trackId) return null;
    return this.tracks.find(t => t.id === trackId) || null;
  }
  
  private onMouseMove(event: MouseEvent): void {
    this.updateMouse(event);
    
    if (this.isDragging && this.selectedTrack) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      const intersection = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
        this.selectedTrack.position = intersection;
      }
      return;
    }
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const trackMeshes = this.tracks.map(t => t.mesh);
    const intersects = this.raycaster.intersectObjects(trackMeshes);
    
    if (intersects.length > 0) {
      const track = this.getTrackFromMesh(intersects[0].object);
      if (track && track !== this.hoveredTrack) {
        if (this.hoveredTrack && this.hoveredTrack !== this.selectedTrack) {
          document.body.style.cursor = 'default';
        }
        this.hoveredTrack = track;
        document.body.style.cursor = 'pointer';
        this.controlPanel.showTrackInfo(track);
      }
    } else {
      if (this.hoveredTrack && this.hoveredTrack !== this.selectedTrack) {
        document.body.style.cursor = 'default';
        this.controlPanel.showTrackInfo(null);
      }
      this.hoveredTrack = null;
    }
  }
  
  private onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const trackMeshes = this.tracks.map(t => t.mesh);
    const intersects = this.raycaster.intersectObjects(trackMeshes);
    
    if (intersects.length > 0) {
      const track = this.getTrackFromMesh(intersects[0].object);
      if (track) {
        if (this.selectedTrack && this.selectedTrack !== track) {
          this.selectedTrack.isSelected = false;
        }
        
        track.isSelected = true;
        this.selectedTrack = track;
        this.isDragging = true;
        track.isDragging = true;
        this.controls.enabled = false;
        this.controlPanel.setSelectedTrack(track);
        
        this.dragPlane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 1, 0),
          track.position
        );
        
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        this.dragPlane.normal.copy(cameraDirection).negate();
        this.dragPlane.constant = -this.dragPlane.normal.dot(track.position);
        
        document.body.style.cursor = 'grabbing';
      }
    } else {
      if (this.selectedTrack) {
        this.selectedTrack.isSelected = false;
        this.selectedTrack = null;
        this.controlPanel.setSelectedTrack(null);
      }
    }
  }
  
  private onMouseUp(event: MouseEvent): void {
    if (event.button !== 0) return;
    
    if (this.isDragging && this.selectedTrack) {
      this.isDragging = false;
      this.selectedTrack.isDragging = false;
      this.controls.enabled = true;
      document.body.style.cursor = 'pointer';
    }
  }
  
  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    const deltaTime = this.clock.getDelta();
    
    this.controls.update();
    
    this.tracks.forEach(track => {
      track.update(deltaTime);
    });
    
    this.particleSystem.update(deltaTime, this.tracks);
    
    this.tracks.forEach(track => {
      const particles = this.particleSystem['particles'];
      particles.forEach((particle: any) => {
        particle.mesh.lookAt(this.camera.position);
      });
    });
    
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
      this.controlPanel.updateFPS(this.fps, this.particleSystem.totalParticles);
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.tracks.forEach(track => {
      this.scene.remove(track.group);
      track.dispose();
    });
    
    this.particleSystem.dispose();
    this.audioMixer.dispose();
    this.controlPanel.dispose();
    
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
    
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  
  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
});
