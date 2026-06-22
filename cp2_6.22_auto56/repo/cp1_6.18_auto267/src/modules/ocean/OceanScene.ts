import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vWaveHeight;

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    float wave1 = sin(pos.x * 0.2 + uTime * 0.8) * 1.5;
    float wave2 = sin(pos.z * 0.4 + uTime * 0.6) * 1.0;
    float wave3 = sin((pos.x + pos.z) * 0.3 + uTime * 1.0) * 0.7;
    float wave4 = sin((pos.x * 0.8 - pos.z * 0.5) + uTime * 1.2) * 0.5;
    
    float totalWave = wave1 + wave2 + wave3 + wave4;
    pos.y += totalWave;
    vWaveHeight = totalWave;
    
    vec3 newPosition = pos;
    vPosition = newPosition;
    
    float dx = 0.1;
    float dz = 0.1;
    float h1 = sin((pos.x + dx) * 0.2 + uTime * 0.8) * 1.5
             + sin(pos.z * 0.4 + uTime * 0.6) * 1.0
             + sin((pos.x + dx + pos.z) * 0.3 + uTime * 1.0) * 0.7
             + sin(((pos.x + dx) * 0.8 - pos.z * 0.5) + uTime * 1.2) * 0.5;
    float h2 = sin(pos.x * 0.2 + uTime * 0.8) * 1.5
             + sin((pos.z + dz) * 0.4 + uTime * 0.6) * 1.0
             + sin((pos.x + pos.z + dz) * 0.3 + uTime * 1.0) * 0.7
             + sin((pos.x * 0.8 - (pos.z + dz) * 0.5) + uTime * 1.2) * 0.5;
    
    vec3 tangentX = normalize(vec3(dx, h1 - totalWave, 0.0));
    vec3 tangentZ = normalize(vec3(0.0, h2 - totalWave, dz));
    vNormal = normalize(cross(tangentZ, tangentX));
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColorShallow;
  uniform vec3 uColorDeep;
  uniform vec3 uLightDir;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vWaveHeight;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightDir);
    
    float fresnel = pow(1.0 - max(dot(normal, vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
    
    float depthFactor = smoothstep(-2.0, 3.0, vWaveHeight);
    vec3 waterColor = mix(uColorDeep, uColorShallow, depthFactor);
    
    float specular = pow(max(dot(reflect(-lightDir, normal), vec3(0.0, 1.0, 0.0)), 0.0), 32.0);
    vec3 specularColor = vec3(1.0, 1.0, 1.0) * specular * 0.6;
    
    vec3 finalColor = waterColor + specularColor + fresnel * vec3(0.3, 0.5, 0.7);
    
    gl_FragColor = vec4(finalColor, uOpacity);
  }
`;

export class OceanScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private oceanMesh: THREE.Mesh;
  private oceanMaterial: THREE.ShaderMaterial;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private container: HTMLElement;
  private clock: THREE.Clock;
  private isDragging: boolean;
  private lastMouseX: number;
  private lastMouseY: number;
  private cameraDistance: number;
  private cameraTheta: number;
  private cameraPhi: number;
  private cameraTarget: THREE.Vector3;
  private onRightClickCallback: ((point: THREE.Vector3) => void) | null;
  private onCameraChangeCallback: ((state: { distance: number; theta: number; phi: number }) => void) | null;
  private animationId: number;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.cameraDistance = 50;
    this.cameraTheta = Math.PI / 4;
    this.cameraPhi = Math.PI / 4;
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.onRightClickCallback = null;
    this.onCameraChangeCallback = null;
    this.animationId = 0;

    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0F172A, 1);
    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFFF4CC, 0.8);
    directionalLight.position.set(50, 80, 50);
    this.scene.add(directionalLight);

    this.oceanMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorShallow: { value: new THREE.Color(0x0096C7) },
        uColorDeep: { value: new THREE.Color(0x023E8A) },
        uLightDir: { value: new THREE.Vector3(50, 80, 50).normalize() },
        uOpacity: { value: 0.8 }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    const oceanGeometry = new THREE.PlaneGeometry(200, 200, 128, 128);
    oceanGeometry.rotateX(-Math.PI / 2);
    this.oceanMesh = new THREE.Mesh(oceanGeometry, this.oceanMaterial);
    this.scene.add(this.oceanMesh);

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('resize', this.onResize);
  }

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    } else if (e.button === 2) {
      this.handleRightClick(e);
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.isDragging) {
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;
      
      this.cameraTheta -= deltaX * 0.005;
      this.cameraPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.cameraPhi - deltaY * 0.005));
      
      this.updateCameraPosition();
      this.onCameraChangeCallback?.({
        distance: this.cameraDistance,
        theta: this.cameraTheta,
        phi: this.cameraPhi
      });
      
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isDragging = false;
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * 0.05;
    this.cameraDistance = Math.max(5, Math.min(100, this.cameraDistance + delta));
    this.updateCameraPosition();
    this.onCameraChangeCallback?.({
      distance: this.cameraDistance,
      theta: this.cameraTheta,
      phi: this.cameraPhi
    });
  };

  private onResize = () => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  private handleRightClick(e: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.oceanMesh);

    if (intersects.length > 0) {
      this.onRightClickCallback?.(intersects[0].point);
    }
  }

  private updateCameraPosition() {
    const x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    this.camera.position.set(
      x + this.cameraTarget.x,
      y + this.cameraTarget.y,
      z + this.cameraTarget.z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getOceanMesh(): THREE.Mesh {
    return this.oceanMesh;
  }

  onRightClick(callback: (point: THREE.Vector3) => void) {
    this.onRightClickCallback = callback;
  }

  onCameraChange(callback: (state: { distance: number; theta: number; phi: number }) => void) {
    this.onCameraChangeCallback = callback;
  }

  setCameraState(distance: number, theta: number, phi: number) {
    this.cameraDistance = distance;
    this.cameraTheta = theta;
    this.cameraPhi = phi;
    this.updateCameraPosition();
  }

  start() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const elapsedTime = this.clock.getElapsedTime();
      this.oceanMaterial.uniforms.uTime.value = elapsedTime;
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  stop() {
    cancelAnimationFrame(this.animationId);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
