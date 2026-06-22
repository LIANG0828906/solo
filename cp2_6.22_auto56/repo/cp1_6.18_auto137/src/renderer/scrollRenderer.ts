import * as THREE from 'three';
import { useSnapshotStore, Snapshot } from '../stores/snapshotStore';

interface FrameData {
  mesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  imageMesh: THREE.Mesh;
  overlayMesh: THREE.Mesh;
  loadingCanvas: HTMLCanvasElement;
  snapshot: Snapshot;
  isAnimating: boolean;
  animationStartTime: number;
  hasPlayed: boolean;
}

export class ScrollRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private frames: FrameData[] = [];
  private keys: Record<string, boolean> = {};
  private yaw = 0;
  private pitch = 0;
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private readonly MOVE_SPEED = 2;
  private readonly SENSITIVITY = 0.002;
  private readonly TRIGGER_DISTANCE = 3;
  private readonly ANIMATION_DURATION = 1500;
  private readonly WALL_WIDTH = 6;
  private readonly WALL_HEIGHT = 4;
  private readonly FRAME_WIDTH = 2;
  private readonly FRAME_HEIGHT = 1.5;
  private readonly FRAME_SPACING = 2.5;
  private readonly END_POSITION = 25;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private onFrameClick: ((snapshot: Snapshot) => void) | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor(container: HTMLElement, onFrameClick?: (snapshot: Snapshot) => void) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a14);
    this.scene.fog = new THREE.Fog(0x0a0a14, 5, 35);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.6, 5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight(0xffe0b3, 0.4);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(0, 3, 5);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(this.directionalLight);

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.onFrameClick = onFrameClick || null;

    this.createCorridor();
    this.createFrames();
    this.setupEventListeners(container);
  }

  private createCorridor(): void {
    const floorGeometry = new THREE.PlaneGeometry(5, 60);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a14,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 5);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const gridHelper = new THREE.GridHelper(60, 60, 0x2a2a40, 0x1a1a2e);
    gridHelper.position.set(0, 0.001, 5);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0.1,
    });

    const leftWallGeometry = new THREE.PlaneGeometry(60, this.WALL_HEIGHT);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-2.5, this.WALL_HEIGHT / 2, 5);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWallGeometry = new THREE.PlaneGeometry(60, this.WALL_HEIGHT);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(2.5, this.WALL_HEIGHT / 2, 5);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    const ceilingGeometry = new THREE.PlaneGeometry(5, 60);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d0d1a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, this.WALL_HEIGHT, 5);
    this.scene.add(ceiling);

    const endWallGeometry = new THREE.PlaneGeometry(5, this.WALL_HEIGHT);
    const endWall = new THREE.Mesh(endWallGeometry, wallMaterial);
    endWall.position.set(0, this.WALL_HEIGHT / 2, -25);
    this.scene.add(endWall);
  }

  private createFrames(): void {
    const snapshots = useSnapshotStore.getState().snapshots;

    snapshots.forEach((snapshot) => {
      const x = snapshot.wall === 'left' ? -2.2 : 2.2;
      const z = -snapshot.positionZ;
      const y = 1.8;
      const rotationY = snapshot.wall === 'left' ? Math.PI / 2 : -Math.PI / 2;

      const frameGroup = new THREE.Group();

      const frameBorderGeometry = new THREE.BoxGeometry(this.FRAME_WIDTH + 0.1, this.FRAME_HEIGHT + 0.1, 0.1);
      const frameBorderMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.8,
      });
      const frameBorder = new THREE.Mesh(frameBorderGeometry, frameBorderMaterial);
      frameBorder.castShadow = true;
      frameBorder.receiveShadow = true;
      frameGroup.add(frameBorder);

      const glowGeometry = new THREE.PlaneGeometry(this.FRAME_WIDTH + 0.3, this.FRAME_HEIGHT + 0.3);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x6c63ff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.z = 0.06;
      frameGroup.add(glowMesh);

      const loadingCanvas = document.createElement('canvas');
      loadingCanvas.width = 512;
      loadingCanvas.height = 384;
      const loadingCtx = loadingCanvas.getContext('2d')!;
      loadingCtx.fillStyle = '#1a1a2e';
      loadingCtx.fillRect(0, 0, 512, 384);

      const texture = new THREE.CanvasTexture(loadingCanvas);
      texture.needsUpdate = true;

      const imageGeometry = new THREE.PlaneGeometry(this.FRAME_WIDTH, this.FRAME_HEIGHT);
      const imageMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
      });
      const imageMesh = new THREE.Mesh(imageGeometry, imageMaterial);
      imageMesh.position.z = 0.051;
      frameGroup.add(imageMesh);

      const overlayGeometry = new THREE.PlaneGeometry(this.FRAME_WIDTH, this.FRAME_HEIGHT);
      const overlayMaterial = new THREE.MeshBasicMaterial({
        color: 0x0a0a14,
        transparent: true,
        opacity: 1,
      });
      const overlayMesh = new THREE.Mesh(overlayGeometry, overlayMaterial);
      overlayMesh.position.z = 0.052;
      frameGroup.add(overlayMesh);

      frameGroup.position.set(x, y, z);
      frameGroup.rotation.y = rotationY;
      this.scene.add(frameGroup);

      this.frames.push({
        mesh: frameBorder,
        glowMesh,
        imageMesh,
        overlayMesh,
        loadingCanvas,
        snapshot,
        isAnimating: false,
        animationStartTime: 0,
        hasPlayed: false,
      });

      this.loadImageTexture(snapshot.imageUrl, texture, imageMaterial);
    });
  }

  private loadImageTexture(url: string, targetTexture: THREE.CanvasTexture, material: THREE.MeshBasicMaterial): void {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        const canvas = targetTexture.image as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        const img = texture.image as HTMLImageElement;
        
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, w, h);
        targetTexture.needsUpdate = true;
        material.map = targetTexture;
        material.needsUpdate = true;
      },
      undefined,
      () => {
        const canvas = targetTexture.image as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#2a2a40');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6c63ff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📷', canvas.width / 2, canvas.height / 2);
        targetTexture.needsUpdate = true;
        material.map = targetTexture;
        material.needsUpdate = true;
      }
    );
  }

  private setupEventListeners(container: HTMLElement): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    container.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    container.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        this.yaw -= deltaX * this.SENSITIVITY;
        this.pitch -= deltaY * this.SENSITIVITY;
        this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    container.addEventListener('click', (e) => {
      const rect = container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshes = this.frames.map((f) => f.mesh);
      const intersects = this.raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const frame = this.frames.find((f) => f.mesh === intersects[0].object);
        if (frame && this.onFrameClick) {
          this.onFrameClick(frame.snapshot);
        }
      }
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });
  }

  private updateMovement(delta: number): void {
    const forward = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      0,
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const movement = new THREE.Vector3();

    if (this.keys['KeyW']) movement.add(forward);
    if (this.keys['KeyS']) movement.sub(forward);
    if (this.keys['KeyA']) movement.sub(right);
    if (this.keys['KeyD']) movement.add(right);

    if (movement.length() > 0) {
      movement.normalize().multiplyScalar(this.MOVE_SPEED * delta);

      const newPos = this.camera.position.clone().add(movement);
      newPos.x = Math.max(-2.3, Math.min(2.3, newPos.x));
      newPos.y = 1.6;
      newPos.z = Math.max(-24, Math.min(10, newPos.z));

      this.camera.position.copy(newPos);
    }

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  private updateLighting(): void {
    const progress = Math.max(0, Math.min(1, (5 - this.camera.position.z) / 30));
    
    const coolColor = new THREE.Color().setHSL(0.1, 0.5, 0.7);
    const warmColor = new THREE.Color().setHSL(0.12, 0.8, 0.8);
    
    const currentColor = coolColor.clone().lerp(warmColor, progress);
    this.ambientLight.color.copy(currentColor);
    
    const intensity = 0.3 + progress * 0.3;
    this.ambientLight.intensity = intensity;
  }

  private updateFrameAnimations(currentTime: number): void {
    const cameraPos = this.camera.position.clone();

    this.frames.forEach((frame) => {
      const framePos = frame.mesh.parent!.position.clone();
      const distance = cameraPos.distanceTo(framePos);

      if (distance <= this.TRIGGER_DISTANCE && !frame.hasPlayed && !frame.isAnimating) {
        frame.isAnimating = true;
        frame.animationStartTime = currentTime;
        frame.hasPlayed = true;
      }

      if (frame.isAnimating) {
        const elapsed = currentTime - frame.animationStartTime;
        const progress = Math.min(1, elapsed / this.ANIMATION_DURATION);

        this.drawLoadingAnimation(frame, progress);

        const glowMaterial = frame.glowMesh.material as THREE.MeshBasicMaterial;
        const glowIntensity = Math.sin(progress * Math.PI) * 0.3;
        glowMaterial.opacity = glowIntensity;

        const imageMaterial = frame.imageMesh.material as THREE.MeshBasicMaterial;
        imageMaterial.opacity = progress;

        const overlayMaterial = frame.overlayMesh.material as THREE.MeshBasicMaterial;
        overlayMaterial.opacity = 1 - progress;

        if (progress >= 1) {
          frame.isAnimating = false;
          this.fadeOutGlow(frame, currentTime);
        }
      } else if (frame.hasPlayed) {
        const glowMaterial = frame.glowMesh.material as THREE.MeshBasicMaterial;
        const pulse = Math.sin(currentTime * 0.002) * 0.05 + 0.05;
        glowMaterial.opacity = pulse;
      }
    });
  }

  private drawLoadingAnimation(frame: FrameData, progress: number): void {
    const canvas = frame.loadingCanvas;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const stripeCount = 8;
    const visibleStripes = Math.floor(progress * stripeCount);

    for (let i = 0; i < visibleStripes; i++) {
      const y = (i / stripeCount) * canvas.height;
      const height = canvas.height / stripeCount - 4;
      const alpha = Math.min(1, progress * stripeCount - i);
      ctx.fillStyle = `rgba(108, 99, 255, ${alpha * 0.3})`;
      ctx.fillRect(0, y + 2, canvas.width, height);
    }

    const barY = canvas.height - 40;
    const barWidth = canvas.width - 40;
    const barHeight = 4;
    const barX = 20;

    ctx.fillStyle = '#2a2a40';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#6c63ff';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    const texture = frame.imageMesh.material as THREE.MeshBasicMaterial;
    if (texture.map) {
      (texture.map as THREE.CanvasTexture).needsUpdate = true;
    }
  }

  private fadeOutGlow(frame: FrameData, startTime: number): void {
    const fadeDuration = 500;
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / fadeDuration);
      const glowMaterial = frame.glowMesh.material as THREE.MeshBasicMaterial;
      glowMaterial.opacity = 0.3 * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  public animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const currentTime = performance.now();

    this.updateMovement(delta);
    this.updateLighting();
    this.updateFrameAnimations(currentTime);

    this.renderer.render(this.scene, this.camera);
  }

  public start(): void {
    this.animate();
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public dispose(): void {
    this.stop();
    this.renderer.dispose();
    
    this.frames.forEach((frame) => {
      (frame.glowMesh.material as THREE.Material).dispose();
      (frame.imageMesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (frame.imageMesh.material as THREE.Material).dispose();
      (frame.overlayMesh.material as THREE.Material).dispose();
      frame.glowMesh.geometry.dispose();
      frame.imageMesh.geometry.dispose();
      frame.overlayMesh.geometry.dispose();
      frame.mesh.geometry.dispose();
      (frame.mesh.material as THREE.Material).dispose();
    });

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  public getCameraPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  public getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
}
