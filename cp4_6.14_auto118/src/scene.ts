import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  private container: HTMLElement;
  private trailParticles: THREE.Points | null = null;
  private pathLine: THREE.Line | null = null;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId) || document.body;
    
    this.scene = new THREE.Scene();
    this.scene.background = null;
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(8, 6, 8);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.01;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 20;
    this.controls.target.set(0, 2, 0);
    
    this.setupLights();
    this.setupGround();
    this.setupAxes();
    this.setupEventListeners();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3a5f3a, 0.3);
    this.scene.add(hemisphereLight);
  }

  private setupGround(): void {
    const gridHelper = new THREE.GridHelper(20, 20, 0x94a3b8, 0x94a3b8);
    const gridMaterial = gridHelper.material as THREE.Material;
    gridMaterial.opacity = 0.3;
    gridMaterial.transparent = true;
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
    
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private setupAxes(): void {
    const axisLength = 1.5;
    
    const xGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, 0),
      new THREE.Vector3(axisLength, 0.01, 0)
    ]);
    const xMaterial = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
    const xAxis = new THREE.Line(xGeometry, xMaterial);
    this.scene.add(xAxis);
    
    const yGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, axisLength, 0)
    ]);
    const yMaterial = new THREE.LineBasicMaterial({ color: 0x22c55e, linewidth: 2 });
    const yAxis = new THREE.Line(yGeometry, yMaterial);
    this.scene.add(yAxis);
    
    const zGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, 0),
      new THREE.Vector3(0, 0.01, axisLength)
    ]);
    const zMaterial = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
    const zAxis = new THREE.Line(zGeometry, zMaterial);
    this.scene.add(zAxis);
    
    this.addAxisArrow(0xef4444, new THREE.Vector3(axisLength, 0.01, 0), new THREE.Vector3(1, 0, 0));
    this.addAxisArrow(0x22c55e, new THREE.Vector3(0, axisLength, 0), new THREE.Vector3(0, 1, 0));
    this.addAxisArrow(0x3b82f6, new THREE.Vector3(0, 0.01, axisLength), new THREE.Vector3(0, 0, 1));
  }

  private addAxisArrow(color: number, position: THREE.Vector3, direction: THREE.Vector3): void {
    const arrowGeometry = new THREE.ConeGeometry(0.08, 0.2, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.position.copy(position);
    arrow.lookAt(position.clone().add(direction));
    arrow.rotateX(Math.PI / 2);
    this.scene.add(arrow);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });
  }

  public addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  public showPath(waypoints: Array<[number, number, number]>): void {
    if (this.pathLine) {
      this.scene.remove(this.pathLine);
    }
    
    const points = waypoints.map(wp => new THREE.Vector3(wp[0], wp[1], wp[2]));
    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(200);
    
    const testPoint = curve.getPoint(0);
    console.log(`[Scene] CatmullRomCurve3 created with ${waypoints.length} waypoints, 200 sample points`);
    console.log(`[Scene] Curve test point at t=0: (${testPoint.x.toFixed(2)}, ${testPoint.y.toFixed(2)}, ${testPoint.z.toFixed(2)})`);
    console.log(`[Scene] Curve test point at t=0.5: (${curve.getPoint(0.5).x.toFixed(2)}, ${curve.getPoint(0.5).y.toFixed(2)}, ${curve.getPoint(0.5).z.toFixed(2)})`);
    
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const material = new THREE.LineDashedMaterial({
      color: 0x60a5fa,
      dashSize: 0.3,
      gapSize: 0.2,
      transparent: true,
      opacity: 0.5
    });
    
    this.pathLine = new THREE.Line(geometry, material);
    this.pathLine.computeLineDistances();
    this.scene.add(this.pathLine);
  }

  public hidePath(): void {
    if (this.pathLine) {
      this.scene.remove(this.pathLine);
      this.pathLine = null;
    }
  }

  public initTrailParticles(count: number): void {
    if (this.trailParticles) {
      this.scene.remove(this.trailParticles);
    }
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const alphas = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = 0;
      
      colors[i * 3] = 0.376;
      colors[i * 3 + 1] = 0.647;
      colors[i * 3 + 2] = 0.980;
      
      alphas[i] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.trailParticles = new THREE.Points(geometry, material);
    this.trailParticles.userData.alphas = alphas;
    this.trailParticles.userData.startColor = new THREE.Color(0x60a5fa);
    this.trailParticles.userData.endColor = new THREE.Color(0x8b5cf6);
    this.scene.add(this.trailParticles);
    
    console.log(`[Scene] Trail particles initialized: ${count} particles, color gradient from #60a5fa to #8b5cf6`);
  }

  public updateTrailParticles(particles: Array<{ pos: [number, number, number]; alpha: number; lifeProgress?: number }>): void {
    if (!this.trailParticles) return;
    
    const positions = this.trailParticles.geometry.attributes.position.array as Float32Array;
    const colors = this.trailParticles.geometry.attributes.color.array as Float32Array;
    const alphas = this.trailParticles.userData.alphas as Float32Array;
    const startColor = this.trailParticles.userData.startColor as THREE.Color;
    const endColor = this.trailParticles.userData.endColor as THREE.Color;
    
    const tempColor = new THREE.Color();
    
    for (let i = 0; i < particles.length; i++) {
      positions[i * 3] = particles[i].pos[0];
      positions[i * 3 + 1] = particles[i].pos[1];
      positions[i * 3 + 2] = particles[i].pos[2];
      alphas[i] = particles[i].alpha;
      
      const progress = particles[i].lifeProgress ?? (1 - particles[i].alpha);
      tempColor.copy(startColor).lerp(endColor, progress);
      
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
      
      if (i === 0 && particles[i].alpha > 0) {
        console.log(`[Scene] Trail particle[0] color: #${tempColor.getHexString()}, progress: ${progress.toFixed(2)}, alpha: ${particles[i].alpha.toFixed(2)}`);
      }
    }
    
    this.trailParticles.geometry.attributes.position.needsUpdate = true;
    this.trailParticles.geometry.attributes.color.needsUpdate = true;
  }

  public clearTrailParticles(): void {
    if (!this.trailParticles) return;
    
    const positions = this.trailParticles.geometry.attributes.position.array as Float32Array;
    const alphas = this.trailParticles.userData.alphas as Float32Array;
    
    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 1] = -100;
      alphas[i] = 0;
    }
    
    this.trailParticles.geometry.attributes.position.needsUpdate = true;
  }

  public render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
