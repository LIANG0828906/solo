import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { TerrainData, MarkerData } from './types';

interface MarkerObject {
  mesh: THREE.Mesh;
  label: THREE.Sprite;
  data: MarkerData;
  originalScale: number;
}

interface SceneManagerOptions {
  container: HTMLElement;
  onMarkerClick: (marker: MarkerData) => void;
  onMarkerHover: (marker: MarkerData | null) => void;
}

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private terrainMesh: THREE.Mesh | null = null;
  private wireframe: THREE.LineSegments | null = null;
  private markers: MarkerObject[] = [];
  private hoveredMarker: MarkerObject | null = null;
  private animationFrameId: number | null = null;

  private onMarkerClick: (marker: MarkerData) => void;
  private onMarkerHover: (marker: MarkerData | null) => void;

  private defaultCameraPosition = new THREE.Vector3(
    15 * Math.cos(Math.PI / 4),
    15 * Math.sin(Math.PI / 4),
    15 * Math.sin(Math.PI / 4)
  );

  constructor(options: SceneManagerOptions) {
    this.container = options.container;
    this.onMarkerClick = options.onMarkerClick;
    this.onMarkerHover = options.onMarkerHover;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
  }

  private init(): void {
    this.setupRenderer();
    this.setupCamera();
    this.setupControls();
    this.setupLighting();
    this.setupBackground();
    this.setupEventListeners();
    this.animate();
  }

  private setupRenderer(): void {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);
  }

  private setupCamera(): void {
    this.camera.position.copy(this.defaultCameraPosition);
    this.camera.lookAt(0, 0, 2.5);
  }

  private setupControls(): void {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 1;
    this.controls.panSpeed = 1;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
    this.controls.target.set(0, 0, 2.5);
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-10, 5, -10);
    this.scene.add(fillLight);
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1A1A3A');
    gradient.addColorStop(1, '#0B0B1A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('mousemove', this.handleMouseMove);
    this.renderer.domElement.addEventListener('click', this.handleClick);
  }

  private handleResize = (): void => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  private handleMouseMove = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.checkHover();
  };

  private handleClick = (): void => {
    if (this.hoveredMarker) {
      this.onMarkerClick(this.hoveredMarker.data);
    }
  };

  private checkHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.markers.map((m) => m.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const marker = this.markers.find((m) => m.mesh === clickedMesh);

      if (marker && marker !== this.hoveredMarker) {
        if (this.hoveredMarker) {
          this.setMarkerScale(this.hoveredMarker, 1);
          this.hoveredMarker.label.visible = false;
        }
        this.hoveredMarker = marker;
        this.setMarkerScale(marker, 1.2);
        marker.label.visible = true;
        this.onMarkerHover(marker.data);
        this.renderer.domElement.style.cursor = 'pointer';
      }
    } else if (this.hoveredMarker) {
      this.setMarkerScale(this.hoveredMarker, 1);
      this.hoveredMarker.label.visible = false;
      this.hoveredMarker = null;
      this.onMarkerHover(null);
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  private setMarkerScale(marker: MarkerObject, scale: number): void {
    const targetScale = marker.originalScale * scale;
    marker.mesh.scale.set(targetScale, targetScale, targetScale);
  }

  public updateTerrain(terrainData: TerrainData): void {
    this.clearTerrain();
    this.createTerrain(terrainData);
    this.createMarkers(terrainData.markers);
  }

  private clearTerrain(): void {
    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.terrainMesh.geometry.dispose();
      (this.terrainMesh.material as THREE.Material).dispose();
      this.terrainMesh = null;
    }

    if (this.wireframe) {
      this.scene.remove(this.wireframe);
      this.wireframe.geometry.dispose();
      (this.wireframe.material as THREE.Material).dispose();
      this.wireframe = null;
    }

    this.markers.forEach((marker) => {
      this.scene.remove(marker.mesh);
      this.scene.remove(marker.label);
      marker.mesh.geometry.dispose();
      (marker.mesh.material as THREE.Material).dispose();
      const spriteMaterial = marker.label.material as THREE.SpriteMaterial;
      if (spriteMaterial.map) {
        spriteMaterial.map.dispose();
      }
      spriteMaterial.dispose();
    });
    this.markers = [];
    this.hoveredMarker = null;
  }

  private createTerrain(terrainData: TerrainData): void {
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(terrainData.vertices.length * 3);
    const colors = new Float32Array(terrainData.vertices.length * 3);

    terrainData.vertices.forEach((vertex, i) => {
      positions[i * 3] = vertex.position[0];
      positions[i * 3 + 1] = vertex.position[2];
      positions[i * 3 + 2] = vertex.position[1];
      colors[i * 3] = vertex.color[0];
      colors[i * 3 + 1] = vertex.color[1];
      colors[i * 3 + 2] = vertex.color[2];
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(terrainData.indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.1,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = true;
    this.scene.add(this.terrainMesh);

    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
    });
    this.wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    this.scene.add(this.wireframe);
  }

  private createMarkers(markersData: MarkerData[]): void {
    const baseGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    baseGeometry.translate(0, 0.5, 0);

    markersData.forEach((data) => {
      const geometry = baseGeometry.clone();
      geometry.scale(1, data.height, 1);

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(data.color[0], data.color[1], data.color[2]),
        transparent: true,
        opacity: 0.7,
        metalness: 0.3,
        roughness: 0.5,
        emissive: new THREE.Color(data.color[0], data.color[1], data.color[2]),
        emissiveIntensity: 0.2,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(data.x, 0, data.y);
      mesh.castShadow = true;
      mesh.userData = { markerData: data };

      const label = this.createLabel(data.value.toFixed(2));
      label.position.set(data.x, data.height + 0.5, data.y);
      label.visible = false;

      this.scene.add(mesh);
      this.scene.add(label);

      this.markers.push({
        mesh,
        label,
        data,
        originalScale: 1,
      });
    });
  }

  private createLabel(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.font = 'bold 32px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    context.shadowColor = 'rgba(0, 0, 0, 0.8)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    context.fillStyle = '#ffffff';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1);

    return sprite;
  }

  public resetCamera(): void {
    this.camera.position.copy(this.defaultCameraPosition);
    this.controls.target.set(0, 0, 2.5);
    this.controls.update();
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('mousemove', this.handleMouseMove);
    this.renderer.domElement.removeEventListener('click', this.handleClick);

    this.clearTerrain();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
