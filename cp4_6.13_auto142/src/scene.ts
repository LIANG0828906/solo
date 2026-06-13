import * as THREE from 'three';

interface SubSculptureData {
  group: THREE.Group;
  baseRadius: number;
  currentRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  selfRotationSpeed: THREE.Vector3;
  meshes: THREE.Mesh[];
  basePositions: Float32Array[];
  morphPositions: Float32Array[];
}

interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  baseSizes: Float32Array;
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  
  private mainSculptureGroup: THREE.Group;
  private mainMeshes: THREE.Mesh[] = [];
  private mainBasePositions: Float32Array[] = [];
  private mainMorphPositions: Float32Array[] = [];
  
  private subSculptures: SubSculptureData[] = [];
  private orbitRings: THREE.Line[] = [];
  
  private particles: THREE.Points | null = null;
  private particleData: ParticleData | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particleMaterial: THREE.PointsMaterial | null = null;
  
  private isExploding: boolean = false;
  private explodeProgress: number = 0;
  private explodeDirection: number = 0;
  private explodeRandomOffsets: THREE.Vector3[] = [];
  
  private isPaused: boolean = false;
  private initialCameraPosition: THREE.Vector3;
  
  private readonly warmColor = new THREE.Color(0xff6b35);
  private readonly coolColor = new THREE.Color(0x7b2cbf);
  
  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 0, 15);
    this.initialCameraPosition = this.camera.position.clone();
    
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    this.mainSculptureGroup = new THREE.Group();
    
    this.setupLighting();
    this.createMainSculpture();
    this.createOrbitSculptures();
    this.createParticles();
  }
  
  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0xffffff, 0.8, 100);
    pointLight1.position.set(10, 10, 10);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xffffff, 0.8, 100);
    pointLight2.position.set(-10, -10, 10);
    this.scene.add(pointLight2);
  }
  
  private createMorphedGeometry(type: string, size: number): {
    geometry: THREE.BufferGeometry;
    basePositions: Float32Array;
    morphPositions: Float32Array;
  } {
    let geometry: THREE.BufferGeometry;
    
    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(size, size, size, 4, 4, 4);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(size * 0.6, 16, 16);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(size * 0.6, 1);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(size * 0.5, size * 0.2, 12, 24);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(size * 0.4, size, 16);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(size * 0.3, size * 0.3, size, 16);
        break;
      default:
        geometry = new THREE.BoxGeometry(size, size, size);
    }
    
    const positionAttr = geometry.getAttribute('position');
    if (!positionAttr) {
      return { geometry, basePositions: new Float32Array(0), morphPositions: new Float32Array(0) };
    }
    
    const vertexCount = positionAttr.count;
    const basePositions = new Float32Array(positionAttr.array as Float32Array);
    const morphPositions = new Float32Array(vertexCount * 3);
    
    geometry.computeVertexNormals();
    const normalAttr = geometry.getAttribute('normal');
    
    if (normalAttr) {
      for (let i = 0; i < vertexCount; i++) {
        const x = positionAttr.getX(i);
        const y = positionAttr.getY(i);
        const z = positionAttr.getZ(i);
        
        const nx = normalAttr.getX(i);
        const ny = normalAttr.getY(i);
        const nz = normalAttr.getZ(i);
        
        const distance = Math.sqrt(x * x + y * y + z * z);
        const spikeFactor = 1.5 + 0.5 * Math.sin(distance * 3 + type.length);
        const noise = 0.3 * Math.sin(x * 5) * Math.cos(y * 5) * Math.sin(z * 5);
        
        const morphScale = spikeFactor + noise;
        
        morphPositions[i * 3] = x + nx * distance * (morphScale - 1);
        morphPositions[i * 3 + 1] = y + ny * distance * (morphScale - 1);
        morphPositions[i * 3 + 2] = z + nz * distance * (morphScale - 1);
      }
    }
    
    return { geometry, basePositions, morphPositions };
  }
  
  private createMainSculpture(): void {
    const geometryTypes = ['cube', 'sphere', 'icosahedron', 'torus', 'cone', 'cylinder'];
    const offsets = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.2, 0.8, 0.3),
      new THREE.Vector3(-1.0, 0.5, -0.5),
      new THREE.Vector3(0.5, -1.0, 0.4),
      new THREE.Vector3(-0.8, -0.6, 0.6),
      new THREE.Vector3(0.3, 0.3, -0.8)
    ];
    
    geometryTypes.forEach((type, index) => {
      const { geometry, basePositions, morphPositions } = this.createMorphedGeometry(type, 1.2);
      
      const material = new THREE.MeshPhongMaterial({
        color: this.warmColor.clone(),
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(offsets[index]);
      
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.6 
      });
      const wireframe = new THREE.LineSegments(edges, lineMaterial);
      mesh.add(wireframe);
      
      this.mainSculptureGroup.add(mesh);
      this.mainMeshes.push(mesh);
      this.mainBasePositions.push(basePositions);
      this.mainMorphPositions.push(morphPositions);
    });
    
    this.scene.add(this.mainSculptureGroup);
  }
  
  private createOrbitRing(radius: number): THREE.Line {
    const points: THREE.Vector3[] = [];
    const segments = 64;
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      ));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0x4a4a6a,
      dashSize: 0.3,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.4
    });
    
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    
    return line;
  }
  
  private createOrbitSculptures(): void {
    const geometryTypes = ['cube', 'sphere', 'icosahedron', 'torus', 'cone', 'cylinder'];
    const orbitRadii = [3.5, 4.2, 5.0, 5.8, 6.5, 7.2];
    const orbitSpeeds = [0.3, 0.4, 0.25, 0.35, 0.28, 0.32];
    const initialAngles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];
    
    geometryTypes.forEach((type, index) => {
      const { geometry, basePositions, morphPositions } = this.createMorphedGeometry(type, 0.5);
      
      const material = new THREE.MeshPhongMaterial({
        color: this.warmColor.clone(),
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.5 
      });
      const wireframe = new THREE.LineSegments(edges, lineMaterial);
      mesh.add(wireframe);
      
      const group = new THREE.Group();
      group.add(mesh);
      
      const ring = this.createOrbitRing(orbitRadii[index]);
      ring.rotation.x = Math.PI / 6;
      ring.rotation.z = index * 0.1;
      this.scene.add(ring);
      this.orbitRings.push(ring);
      
      this.scene.add(group);
      
      this.subSculptures.push({
        group,
        baseRadius: orbitRadii[index],
        currentRadius: orbitRadii[index],
        orbitSpeed: orbitSpeeds[index],
        orbitAngle: initialAngles[index],
        selfRotationSpeed: new THREE.Vector3(
          0.1 + Math.random() * 0.2,
          0.1 + Math.random() * 0.2,
          0.1 + Math.random() * 0.1
        ),
        meshes: [mesh],
        basePositions: [basePositions],
        morphPositions: [morphPositions]
      });
      
      this.explodeRandomOffsets.push(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize());
    });
  }
  
  private createParticles(): void {
    const particleCount = 4000;
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const baseSizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const radius = 20 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      const hue = Math.random();
      const saturation = 0.7 + Math.random() * 0.3;
      const lightness = 0.5 + Math.random() * 0.4;
      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      const depthFactor = 1 - (radius - 20) / 80;
      baseSizes[i] = 0.5 + depthFactor * 1.5;
    }
    
    this.particleData = { positions, colors, baseSizes };
    
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    this.particleMaterial = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);
  }
  
  updateMorph(morphFactor: number, time: number): void {
    const currentColor = this.warmColor.clone().lerp(this.coolColor, morphFactor);
    
    this.mainMeshes.forEach((mesh, index) => {
      const positionAttr = mesh.geometry.getAttribute('position');
      if (!positionAttr) return;
      
      const basePositions = this.mainBasePositions[index];
      const morphPositions = this.mainMorphPositions[index];
      
      for (let i = 0; i < positionAttr.count; i++) {
        const baseX = basePositions[i * 3];
        const baseY = basePositions[i * 3 + 1];
        const baseZ = basePositions[i * 3 + 2];
        
        const morphX = morphPositions[i * 3];
        const morphY = morphPositions[i * 3 + 1];
        const morphZ = morphPositions[i * 3 + 2];
        
        positionAttr.setXYZ(
          i,
          baseX + (morphX - baseX) * morphFactor,
          baseY + (morphY - baseY) * morphFactor,
          baseZ + (morphZ - baseZ) * morphFactor
        );
      }
      positionAttr.needsUpdate = true;
      
      const material = mesh.material as THREE.MeshPhongMaterial;
      const hueOffset = Math.sin(time * 0.5 + index * 0.5) * 0.1;
      const adjustedColor = currentColor.clone();
      adjustedColor.offsetHSL(hueOffset, 0, 0);
      material.color.copy(adjustedColor);
    });
    
    this.subSculptures.forEach((sub, subIndex) => {
      sub.meshes.forEach((mesh, meshIndex) => {
        const positionAttr = mesh.geometry.getAttribute('position');
        if (!positionAttr) return;
        
        const basePositions = sub.basePositions[meshIndex];
        const morphPositions = sub.morphPositions[meshIndex];
        
        for (let i = 0; i < positionAttr.count; i++) {
          const baseX = basePositions[i * 3];
          const baseY = basePositions[i * 3 + 1];
          const baseZ = basePositions[i * 3 + 2];
          
          const morphX = morphPositions[i * 3];
          const morphY = morphPositions[i * 3 + 1];
          const morphZ = morphPositions[i * 3 + 2];
          
          positionAttr.setXYZ(
            i,
            baseX + (morphX - baseX) * morphFactor,
            baseY + (morphY - baseY) * morphFactor,
            baseZ + (morphZ - baseZ) * morphFactor
          );
        }
        positionAttr.needsUpdate = true;
        
        const material = mesh.material as THREE.MeshPhongMaterial;
        const hueOffset = Math.sin(time * 0.5 + subIndex * 0.8) * 0.1;
        const adjustedColor = currentColor.clone();
        adjustedColor.offsetHSL(hueOffset, 0, 0);
        material.color.copy(adjustedColor);
      });
    });
  }
  
  updateSubSculptures(deltaTime: number): void {
    this.subSculptures.forEach((sub) => {
      sub.orbitAngle += sub.orbitSpeed * deltaTime;
      
      const x = Math.cos(sub.orbitAngle) * sub.currentRadius;
      const y = Math.sin(sub.orbitAngle) * sub.currentRadius * Math.cos(Math.PI / 6);
      const z = Math.sin(sub.orbitAngle) * sub.currentRadius * Math.sin(Math.PI / 6);
      
      sub.group.position.set(x, y, z);
      
      sub.meshes.forEach(mesh => {
        mesh.rotation.x += sub.selfRotationSpeed.x * deltaTime;
        mesh.rotation.y += sub.selfRotationSpeed.y * deltaTime;
        mesh.rotation.z += sub.selfRotationSpeed.z * deltaTime;
      });
    });
  }
  
  updateParticles(time: number, mouseX: number, mouseY: number): void {
    if (!this.particles || !this.particleData || !this.particleGeometry) return;
    
    this.particles.rotation.y = time * 0.02;
    this.particles.rotation.x = time * 0.01;
    
    const mouseInfluence = (mouseX - 0.5) * 0.5;
    const sizeVariation = 0.8 + (mouseY - 0.5) * 0.4;
    
    if (this.particleMaterial) {
      this.particleMaterial.size = 1.0 * sizeVariation;
    }
    
    const colorAttr = this.particleGeometry.getAttribute('color');
    if (!colorAttr) return;
    
    for (let i = 0; i < colorAttr.count; i++) {
      const x = this.particleData.positions[i * 3];
      const y = this.particleData.positions[i * 3 + 1];
      const z = this.particleData.positions[i * 3 + 2];
      
      const distance = Math.sqrt(x * x + y * y + z * z);
      const depthFactor = 1 - (distance - 20) / 80;
      
      const hue = (time * 0.02 + i * 0.0001 + mouseInfluence) % 1;
      const saturation = 0.7 + Math.random() * 0.3;
      const lightness = 0.4 + depthFactor * 0.4;
      
      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      colorAttr.setXYZ(i, color.r, color.g, color.b);
    }
    colorAttr.needsUpdate = true;
  }
  
  triggerExplode(): void {
    if (this.isExploding) return;
    
    this.isExploding = true;
    this.explodeDirection = this.explodeProgress < 0.5 ? 1 : -1;
    
    this.explodeRandomOffsets = this.subSculptures.map(() => 
      new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize()
    );
  }
  
  updateExplosion(deltaTime: number): void {
    if (!this.isExploding) return;
    
    const explodeSpeed = 0.5;
    
    if (this.explodeDirection > 0) {
      this.explodeProgress += deltaTime * explodeSpeed;
      if (this.explodeProgress >= 1) {
        this.explodeProgress = 1;
        this.explodeDirection = -1;
      }
    } else {
      this.explodeProgress -= deltaTime * explodeSpeed;
      if (this.explodeProgress <= 0) {
        this.explodeProgress = 0;
        this.isExploding = false;
        this.explodeDirection = 0;
      }
    }
    
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    const easedProgress = easeInOutCubic(this.explodeProgress);
    const maxExpand = 2.5;
    
    this.subSculptures.forEach((sub, index) => {
      const expandFactor = 1 + (maxExpand - 1) * easedProgress;
      sub.currentRadius = sub.baseRadius * expandFactor;
      
      const randomOffset = this.explodeRandomOffsets[index];
      sub.group.position.x += randomOffset.x * easedProgress * 0.5;
      sub.group.position.y += randomOffset.y * easedProgress * 0.5;
      sub.group.position.z += randomOffset.z * easedProgress * 0.5;
    });
  }
  
  togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }
  
  isAnimationPaused(): boolean {
    return this.isPaused;
  }
  
  resetCamera(): void {
    this.camera.position.copy(this.initialCameraPosition);
    this.camera.lookAt(0, 0, 0);
  }
  
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  getScene(): THREE.Scene {
    return this.scene;
  }
  
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
  
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  
  onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}