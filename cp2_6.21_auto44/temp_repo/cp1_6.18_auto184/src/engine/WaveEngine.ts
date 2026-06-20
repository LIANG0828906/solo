import * as THREE from 'three';
import { DEFAULT_WAVE_CONFIG, PULSE_COLOR, BACKGROUND_COLOR, BACKGROUND_COLOR_END, VisualMode } from '../types';

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

interface PulseRing {
  mesh: THREE.Mesh;
  y: number;
  life: number;
  maxLife: number;
  startRadius: number;
  endRadius: number;
}

const vertexShader = `
  uniform float uWaveHeights[360];
  uniform float uWaveHeight;
  uniform float uTime;
  uniform float uIdleIntensity;
  varying float vHeightRatio;
  varying float vAmplitude;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float angle = atan(position.x, position.z);
    float angleIndex = (angle + 3.14159265) / (2.0 * 3.14159265) * 360.0;
    int idx = int(floor(angleIndex));
    if (idx >= 360) idx = 0;
    if (idx < 0) idx = 0;
    
    float amp = uWaveHeights[idx];
    float heightRatio = (position.y + 10.0) / 20.0;
    
    float idleWave = sin(angle * 3.0 + uTime * 2.0) * 0.3 + sin(angle * 5.0 - uTime * 1.5) * 0.2;
    idleWave *= uIdleIntensity * (0.5 + 0.5 * heightRatio);
    
    float totalAmp = max(amp, idleWave);
    
    vec3 newPosition = position;
    float displacement = totalAmp * uWaveHeight * (0.3 + 0.7 * heightRatio);
    vec3 normal = normalize(position - vec3(0.0, position.y, 0.0));
    newPosition += normal * displacement;
    
    vHeightRatio = heightRatio;
    vAmplitude = totalAmp;
    vNormal = normal;
    vPosition = newPosition;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;
  uniform float uHighlight;
  uniform float uModeBlend;
  uniform float uTime;
  
  varying float vHeightRatio;
  varying float vAmplitude;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 color = mix(uColorLow, uColorHigh, vHeightRatio);
    
    float ampBoost = 0.8 + 0.4 * vAmplitude;
    color *= ampBoost;
    
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.35;
    float lighting = ambient + diffuse * 0.65;
    
    color *= lighting;
    
    if (uHighlight > 0.5) {
      color *= 1.25;
    }
    
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    color += fresnel * 0.15;
    
    float alpha = mix(0.0, 1.0, uModeBlend);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export class WaveEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private waveMesh!: THREE.Mesh;
  private waveMaterial!: THREE.ShaderMaterial;
  private particles: ParticleData[] = [];
  private particleMesh!: THREE.InstancedMesh;
  private particleGeometry!: THREE.SphereGeometry;
  private pulseRings: PulseRing[] = [];
  private animationId: number | null = null;
  private timer: THREE.Timer;
  private time = 0;

  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private cameraAngle = { theta: 0, phi: Math.PI / 3 };
  private cameraDistance = 22;
  private targetCameraAngle = { theta: 0, phi: Math.PI / 3 };
  private targetCameraDistance = 22;
  private autoRotate = true;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredSegment = -1;

  private amplitudes: Float32Array = new Float32Array(360);
  private frequencies: Float32Array = new Float32Array(64);
  private hasAudio = false;

  private mode: VisualMode = 'hybrid';
  private modeBlend = 1;
  private targetModeBlend = 1;
  private particleTargetOpacity = 1;
  private particleOpacity = 1;

  private config = DEFAULT_WAVE_CONFIG;

  private onSeek?: (timeRatio: number) => void;

  private dummyObj: THREE.Object3D;

  constructor(container: HTMLElement, onSeek?: (timeRatio: number) => void) {
    this.container = container;
    this.onSeek = onSeek;
    this.timer = new THREE.Timer();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dummyObj = new THREE.Object3D();

    this.scene = new THREE.Scene();
    
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 2;
    bgCanvas.height = 512;
    const bgCtx = bgCanvas.getContext('2d')!;
    const gradient = bgCtx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, BACKGROUND_COLOR_END);
    gradient.addColorStop(0.5, BACKGROUND_COLOR);
    gradient.addColorStop(1, '#050510');
    bgCtx.fillStyle = gradient;
    bgCtx.fillRect(0, 0, 2, 512);
    const bgTexture = new THREE.CanvasTexture(bgCanvas);
    this.scene.background = bgTexture;

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
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    container.appendChild(this.renderer.domElement);

    this.createWaveMesh();
    this.createParticles();
    this.setupLighting();
    this.setupEventListeners();
    this.startAnimationLoop();
  }

  private createWaveMesh() {
    const geometry = new THREE.CylinderGeometry(
      this.config.cylinderRadius,
      this.config.cylinderRadius,
      this.config.cylinderHeight,
      this.config.segmentsX,
      this.config.segmentsY,
      true
    );

    const colorLow = new THREE.Color(this.config.colorLow);
    const colorHigh = new THREE.Color(this.config.colorHigh);

    const waveHeights = new Array(360).fill(0);

    this.waveMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uWaveHeights: { value: waveHeights },
        uWaveHeight: { value: this.config.waveHeight },
        uColorLow: { value: colorLow },
        uColorHigh: { value: colorHigh },
        uHighlight: { value: 0 },
        uModeBlend: { value: 1 },
        uTime: { value: 0 },
        uIdleIntensity: { value: 1 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.waveMesh = new THREE.Mesh(geometry, this.waveMaterial);
    this.scene.add(this.waveMesh);
  }

  private createParticles() {
    const MAX_PARTICLES = 2000;
    this.particleGeometry = new THREE.SphereGeometry(1, 6, 6);
    
    const particleMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.9,
    });

    this.particleMesh = new THREE.InstancedMesh(this.particleGeometry, particleMaterial, MAX_PARTICLES);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleMesh.count = 0;
    
    const colors = new Float32Array(MAX_PARTICLES * 3);
    this.particleMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    this.particleMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

    this.scene.add(this.particleMesh);
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(12, 18, 12);
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xe53935, 0.6, 40);
    pointLight1.position.set(-10, 6, -10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x1e88e5, 0.6, 40);
    pointLight2.position.set(10, -6, 10);
    this.scene.add(pointLight2);

    const rimLight = new THREE.PointLight(0x9c27b0, 0.3, 30);
    rimLight.position.set(0, 0, -15);
    this.scene.add(rimLight);
  }

  private setupEventListeners() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('mouseleave', this.onMouseUp);
    canvas.addEventListener('wheel', this.onWheel);
    canvas.addEventListener('dblclick', this.onDoubleClick);

    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd);

    window.addEventListener('resize', this.onResize);
  }

  private onMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.autoRotate = false;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  private onMouseMove = (e: MouseEvent) => {
    this.updateMouse(e.clientX, e.clientY);
    this.checkHover();

    if (!this.isDragging) return;

    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;

    this.targetCameraAngle.theta -= deltaX * 0.005;
    this.targetCameraAngle.phi += deltaY * 0.005;

    const minPhi = (Math.PI / 180) * 30;
    const maxPhi = (Math.PI / 180) * 120;
    this.targetCameraAngle.phi = Math.max(minPhi, Math.min(maxPhi, this.targetCameraAngle.phi));

    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  private onMouseUp = () => {
    this.isDragging = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.targetCameraDistance += e.deltaY * 0.02;
    this.targetCameraDistance = Math.max(10, Math.min(50, this.targetCameraDistance));
  };

  private onDoubleClick = (e: MouseEvent) => {
    this.updateMouse(e.clientX, e.clientY);
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.waveMesh);

    if (intersects.length > 0 && this.onSeek && this.hasAudio) {
      const point = intersects[0].point;
      const heightRatio = (point.y + this.config.cylinderHeight / 2) / this.config.cylinderHeight;
      const clampedRatio = Math.max(0, Math.min(1, heightRatio));
      
      this.createPulseRing(point.y);
      this.onSeek(clampedRatio);
      this.triggerHaptic();
    }
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      this.isDragging = true;
      this.autoRotate = false;
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!this.isDragging || e.touches.length !== 1) return;
    e.preventDefault();

    const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
    const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

    this.targetCameraAngle.theta -= deltaX * 0.005;
    this.targetCameraAngle.phi += deltaY * 0.005;

    const minPhi = (Math.PI / 180) * 30;
    const maxPhi = (Math.PI / 180) * 120;
    this.targetCameraAngle.phi = Math.max(minPhi, Math.min(maxPhi, this.targetCameraAngle.phi));

    this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  private onTouchEnd = () => {
    this.isDragging = false;
  };

  private onResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  private updateMouse(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  private checkHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.waveMesh);

    if (intersects.length > 0) {
      const uv = intersects[0].uv;
      if (uv) {
        const segmentIndex = Math.floor(uv.x * this.config.segmentsX);
        if (segmentIndex !== this.hoveredSegment) {
          this.hoveredSegment = segmentIndex;
          (this.waveMaterial.uniforms.uHighlight as THREE.Uniform<number>).value = 1;
        }
      }
    } else {
      if (this.hoveredSegment !== -1) {
        this.hoveredSegment = -1;
        (this.waveMaterial.uniforms.uHighlight as THREE.Uniform<number>).value = 0;
      }
    }
  }

  private createPulseRing(y: number) {
    const geometry = new THREE.TorusGeometry(this.config.cylinderRadius, 0.08, 12, 128);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(PULSE_COLOR),
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    mesh.rotation.x = Math.PI / 2;

    this.scene.add(mesh);

    this.pulseRings.push({
      mesh,
      y,
      life: 0,
      maxLife: 1.5,
      startRadius: this.config.cylinderRadius,
      endRadius: 12,
    });
  }

  private updatePulseRings(delta: number) {
    for (let i = this.pulseRings.length - 1; i >= 0; i--) {
      const ring = this.pulseRings[i];
      ring.life += delta;

      const progress = ring.life / ring.maxLife;
      const easedProgress = 1 - Math.pow(1 - progress, 2);

      const currentRadius = ring.startRadius + (ring.endRadius - ring.startRadius) * easedProgress;
      ring.mesh.scale.setScalar(currentRadius / ring.startRadius);

      const material = ring.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = (1 - easedProgress) * 0.8;

      if (ring.life >= ring.maxLife) {
        this.scene.remove(ring.mesh);
        ring.mesh.geometry.dispose();
        (ring.mesh.material as THREE.Material).dispose();
        this.pulseRings.splice(i, 1);
      }
    }
  }

  private emitParticles(delta: number) {
    const maxPerFrame = 30;
    const baseParticles = this.hasAudio ? 10 : 5;
    const ampMultiplier = this.hasAudio ? this.getAverageAmplitude() : 0.3;
    const particlesPerFrame = Math.min(maxPerFrame, Math.floor(baseParticles * (1 + ampMultiplier * 2)));
    const maxParticles = 2000;

    for (let i = 0; i < particlesPerFrame; i++) {
      if (this.particles.length >= maxParticles) {
        this.particles.shift();
      }

      const angle = Math.random() * Math.PI * 2;
      const heightRatio = Math.random();
      const y = (heightRatio - 0.5) * this.config.cylinderHeight;

      const angleIndex = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 360);
      const amplitude = this.hasAudio 
        ? this.amplitudes[Math.min(Math.max(angleIndex, 0), 359)] 
        : 0.3 + 0.3 * Math.sin(angle * 3 + this.time * 2);
      const radius = this.config.cylinderRadius + amplitude * this.config.waveHeight * (0.3 + 0.7 * heightRatio);

      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      const tangent = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
      const speed = 0.5 + Math.random() * 1.5;
      const velocity = tangent.multiplyScalar(speed);
      velocity.y = (Math.random() - 0.5) * 0.5;

      const colorLow = new THREE.Color(this.config.colorLow);
      const colorHigh = new THREE.Color(this.config.colorHigh);
      const color = colorLow.clone().lerp(colorHigh, heightRatio);

      const size = 0.05 + Math.random() * 0.1;

      this.particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity,
        color,
        size,
        life: 0,
        maxLife: 3,
      });
    }
  }

  private getAverageAmplitude(): number {
    let sum = 0;
    for (let i = 0; i < 360; i++) {
      sum += this.amplitudes[i];
    }
    return sum / 360;
  }

  private updateParticles(delta: number) {
    const colors = this.particleMesh.instanceColor as THREE.InstancedBufferAttribute;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.y -= 0.1 * delta;

      const alpha = 1 - p.life / p.maxLife;
      const size = p.size * (0.5 + 0.5 * alpha);

      this.dummyObj.position.copy(p.position);
      this.dummyObj.scale.setScalar(size);
      this.dummyObj.updateMatrix();
      this.particleMesh.setMatrixAt(i, this.dummyObj.matrix);

      colors.setXYZ(i, p.color.r, p.color.g, p.color.b);
    }

    this.particleMesh.count = this.particles.length;
    this.particleMesh.instanceMatrix.needsUpdate = true;
    colors.needsUpdate = true;
  }

  private updateCameraPosition() {
    const x = this.cameraDistance * Math.sin(this.cameraAngle.phi) * Math.sin(this.cameraAngle.theta);
    const y = this.cameraDistance * Math.cos(this.cameraAngle.phi);
    const z = this.cameraDistance * Math.sin(this.cameraAngle.phi) * Math.cos(this.cameraAngle.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  private updateWaveMesh() {
    const waveHeights = Array.from(this.amplitudes);
    (this.waveMaterial.uniforms.uWaveHeights as THREE.Uniform<number[]>).value = waveHeights;
    (this.waveMaterial.uniforms.uTime as THREE.Uniform<number>).value = this.time;
    (this.waveMaterial.uniforms.uIdleIntensity as THREE.Uniform<number>).value = this.hasAudio ? 0 : 1;
    
    let waveTarget = 0;
    let particleTarget = 0;

    switch (this.mode) {
      case 'wave':
        waveTarget = 1;
        particleTarget = 0;
        break;
      case 'particle':
        waveTarget = 0;
        particleTarget = 1;
        break;
      case 'hybrid':
        waveTarget = 1;
        particleTarget = 1;
        break;
    }

    this.targetModeBlend = waveTarget;
    this.particleTargetOpacity = particleTarget;

    this.modeBlend += (this.targetModeBlend - this.modeBlend) * 0.03;
    this.particleOpacity += (this.particleTargetOpacity - this.particleOpacity) * 0.03;

    (this.waveMaterial.uniforms.uModeBlend as THREE.Uniform<number>).value = this.modeBlend;

    const particleMaterial = this.particleMesh.material as THREE.MeshBasicMaterial;
    particleMaterial.opacity = 0.85 * this.particleOpacity;
  }

  private triggerHaptic() {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  }

  public updateAudioData(amplitudes: Float32Array, frequencies: Float32Array) {
    this.amplitudes = amplitudes;
    this.frequencies = frequencies;
    this.hasAudio = true;
  }

  public setHasAudio(has: boolean) {
    this.hasAudio = has;
  }

  public setMode(mode: VisualMode) {
    this.mode = mode;
  }

  private startAnimationLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      this.timer.update();
      const delta = Math.min(this.timer.getDelta(), 0.1);
      this.time += delta;

      if (this.autoRotate) {
        this.targetCameraAngle.theta += delta * 0.1;
      }

      this.cameraAngle.theta += (this.targetCameraAngle.theta - this.cameraAngle.theta) * 0.08;
      this.cameraAngle.phi += (this.targetCameraAngle.phi - this.cameraAngle.phi) * 0.08;
      this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * 0.08;
      this.updateCameraPosition();

      this.updateWaveMesh();
      this.emitParticles(delta);
      this.updateParticles(delta);
      this.updatePulseRings(delta);

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public dispose() {
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
    canvas.removeEventListener('dblclick', this.onDoubleClick);
    canvas.removeEventListener('touchstart', this.onTouchStart);
    canvas.removeEventListener('touchmove', this.onTouchMove);
    canvas.removeEventListener('touchend', this.onTouchEnd);

    this.waveMaterial.dispose();
    this.waveMesh.geometry.dispose();
    this.particleGeometry.dispose();
    (this.particleMesh.material as THREE.Material).dispose();
    this.renderer.dispose();

    for (const ring of this.pulseRings) {
      ring.mesh.geometry.dispose();
      (ring.mesh.material as THREE.Material).dispose();
    }

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
