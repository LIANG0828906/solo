import * as THREE from 'three';

export interface SceneModuleOptions {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  getState: () => any;
}

const typeColors: { [key: string]: number } = {
  fire: 0xef4444,
  water: 0x3b82f6,
  earth: 0x84cc16,
  wind: 0x22d3ee,
  light: 0xfbbf24,
};

export class SceneModule {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private getState: () => any;
  
  private ground: THREE.Group;
  private altar: THREE.Group;
  private runeInscription: THREE.Mesh | null = null;
  private inscriptionTexture: THREE.CanvasTexture | null = null;
  private fragmentMeshes: Map<number, THREE.Mesh> = new Map();
  private particles: THREE.Points | null = null;
  private particleCount: number = 200;
  private energyRing: THREE.Mesh | null = null;
  private energyRingActive: boolean = false;
  private energyRingTime: number = 0;
  private energyRingDuration: number = 1.5;
  private altarSlots: THREE.Group[] = [];
  private clock: THREE.Clock = new THREE.Clock();
  
  private fragmentBaseY: number = 0.8;
  private fragmentFloatSpeed: number = 2;
  private fragmentRotationSpeed: number = 0.5;

  constructor(options: SceneModuleOptions) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.getState = options.getState;
    
    this.ground = new THREE.Group();
    this.altar = new THREE.Group();
    
    this.setupBackground();
    this.createGround();
    this.createAltar();
    this.createParticles();
    this.setupLighting();
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0B0D17');
    gradient.addColorStop(1, '#1A1F3A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.scene.background = texture;
  }

  private createGround(): void {
    const gridSize = 50;
    const gridDivisions = 50;
    
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x6366f1, 0x312e81);
    gridHelper.position.y = 0;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    this.ground.add(gridHelper);
    
    const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    this.ground.add(ground);
    
    const edgeGeometry = new THREE.RingGeometry(24, 25, 64);
    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = 0.01;
    this.ground.add(edge);
    
    this.scene.add(this.ground);
  }

  private createAltar(): void {
    const altarBase = new THREE.CylinderGeometry(2.5, 2.8, 0.5, 32);
    const altarMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e1e2e,
      metalness: 0.8,
      roughness: 0.3,
    });
    const base = new THREE.Mesh(altarBase, altarMaterial);
    base.position.y = 0.25;
    this.altar.add(base);
    
    const altarTop = new THREE.CylinderGeometry(2.2, 2.5, 0.3, 32);
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2d3f,
      metalness: 0.9,
      roughness: 0.2,
    });
    const top = new THREE.Mesh(altarTop, topMaterial);
    top.position.y = 0.65;
    this.altar.add(top);
    
    this.createInscription();
    this.createAltarSlots();
    this.scene.add(this.altar);
  }

  private createInscription(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 512, 512);
    
    ctx.strokeStyle = '#A78BFA';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#A78BFA';
    ctx.shadowBlur = 20;
    
    const centerX = 256;
    const centerY = 256;
    const maxRadius = 200;
    
    for (let ring = 0; ring < 3; ring++) {
      const radius = maxRadius - ring * 50;
      const segments = 8 + ring * 4;
      
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2 + ring * 0.3;
        const wobble = Math.sin(angle * 3) * 5;
        const x = centerX + Math.cos(angle) * (radius + wobble);
        const y = centerY + Math.sin(angle) * (radius + wobble);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    
    const runeSymbols = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ'];
    ctx.font = 'bold 24px serif';
    ctx.fillStyle = '#A78BFA';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const radius = 150;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(runeSymbols[i], 0, 0);
      ctx.restore();
    }
    
    this.inscriptionTexture = new THREE.CanvasTexture(canvas);
    this.inscriptionTexture.needsUpdate = true;
    this.inscriptionTexture.wrapS = THREE.RepeatWrapping;
    this.inscriptionTexture.wrapT = THREE.RepeatWrapping;
    
    const inscriptionGeometry = new THREE.CircleGeometry(2.2, 64);
    const inscriptionMaterial = new THREE.MeshBasicMaterial({
      map: this.inscriptionTexture,
      transparent: true,
      opacity: 0.8,
    });
    this.runeInscription = new THREE.Mesh(inscriptionGeometry, inscriptionMaterial);
    this.runeInscription.rotation.x = -Math.PI / 2;
    this.runeInscription.position.y = 0.81;
    this.altar.add(this.runeInscription);
  }

  private createAltarSlots(): void {
    const slotCount = 3;
    const slotRadius = 1.8;
    
    for (let i = 0; i < slotCount; i++) {
      const angle = (i / slotCount) * Math.PI * 2 - Math.PI / 2;
      const slotGroup = new THREE.Group();
      slotGroup.position.set(
        Math.cos(angle) * slotRadius,
        0.8,
        Math.sin(angle) * slotRadius
      );
      
      const slotRing = new THREE.TorusGeometry(0.3, 0.05, 8, 32);
      const slotMaterial = new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        emissive: 0x4338ca,
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.2,
      });
      const ring = new THREE.Mesh(slotRing, slotMaterial);
      ring.rotation.x = -Math.PI / 2;
      slotGroup.add(ring);
      
      const slotInner = new THREE.CircleGeometry(0.25, 32);
      const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0x1e1b4b,
        transparent: true,
        opacity: 0.5,
      });
      const inner = new THREE.Mesh(slotInner, innerMaterial);
      inner.rotation.x = -Math.PI / 2;
      inner.position.y = -0.01;
      slotGroup.add(inner);
      
      this.altarSlots.push(slotGroup);
      this.altar.add(slotGroup);
    }
  }

  private createParticles(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    
    for (let i = 0; i < this.particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 3;
      const height = Math.random() * 4;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      
      const color = new THREE.Color(0xa78bfa);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      sizes[i] = Math.random() * 2 + 1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(167, 139, 250, 1)');
    gradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.5)');
    gradient.addColorStop(1, 'rgba(167, 139, 250, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const particleTexture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.particles.position.y = 0.5;
    this.scene.add(this.particles);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404080, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);
    
    const altarLight = new THREE.PointLight(0xa78bfa, 2, 10);
    altarLight.position.set(0, 3, 0);
    this.altar.add(altarLight);
    
    const pointLight2 = new THREE.PointLight(0x6366f1, 1, 15);
    pointLight2.position.set(-5, 2, -5);
    this.scene.add(pointLight2);
    
    const pointLight3 = new THREE.PointLight(0x8b5cf6, 1, 15);
    pointLight3.position.set(5, 2, 5);
    this.scene.add(pointLight3);
  }

  public createFragment(fragment: { id: number; x: number; z: number; type: string }): THREE.Mesh {
    const geometry = new THREE.OctahedronGeometry(0.3, 0);
    
    const color = typeColors[fragment.type] || 0xf59e0b;
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.3,
      transparent: true,
      opacity: 0.9,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(fragment.x, this.fragmentBaseY, fragment.z);
    mesh.userData = { 
      fragmentId: fragment.id,
      type: fragment.type,
      floatOffset: Math.random() * Math.PI * 2,
      rotationOffset: Math.random() * Math.PI * 2,
    };
    
    const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);
    
    this.fragmentMeshes.set(fragment.id, mesh);
    this.scene.add(mesh);
    
    return mesh;
  }

  public removeFragment(id: number): void {
    const mesh = this.fragmentMeshes.get(id);
    if (mesh) {
      const animate = () => {
        mesh.scale.multiplyScalar(0.85);
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity *= 1.3;
        if (mesh.scale.x > 0.02) {
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(mesh);
          this.fragmentMeshes.delete(id);
        }
      };
      animate();
    }
  }

  public createEnergyRing(): void {
    if (this.energyRing) {
      this.scene.remove(this.energyRing);
    }
    
    const geometry = new THREE.RingGeometry(0.5, 1, 64);
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, '#A78BFA');
    gradient.addColorStop(0.5, '#F59E0B');
    gradient.addColorStop(1, '#A78BFA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    
    this.energyRing = new THREE.Mesh(geometry, material);
    this.energyRing.rotation.x = -Math.PI / 2;
    this.energyRing.position.y = 0.8;
    this.scene.add(this.energyRing);
    
    this.energyRingActive = true;
    this.energyRingTime = 0;
  }

  public updateSlots(slots: any[]): void {
    for (let i = 0; i < this.altarSlots.length; i++) {
      const slotGroup = this.altarSlots[i];
      const slotItem = slots[i];
      
      const ring = slotGroup.children[0] as THREE.Mesh;
      const ringMaterial = ring.material as THREE.MeshStandardMaterial;
      
      if (slotItem) {
        ringMaterial.emissiveIntensity = 1;
        ringMaterial.color.setHex(typeColors[slotItem.type] || 0x6366f1);
        ringMaterial.emissive.setHex(typeColors[slotItem.type] || 0x4338ca);
        
        if (slotGroup.children.length < 3) {
          const gemGeometry = new THREE.OctahedronGeometry(0.2, 0);
          const gemMaterial = new THREE.MeshStandardMaterial({
            color: typeColors[slotItem.type] || 0xf59e0b,
            emissive: typeColors[slotItem.type] || 0xf59e0b,
            emissiveIntensity: 0.8,
            metalness: 0.7,
            roughness: 0.2,
          });
          const gem = new THREE.Mesh(gemGeometry, gemMaterial);
          gem.position.y = 0.3;
          gem.name = 'slotGem';
          slotGroup.add(gem);
        }
      } else {
        ringMaterial.emissiveIntensity = 0.3;
        ringMaterial.color.setHex(0x6366f1);
        ringMaterial.emissive.setHex(0x4338ca);
        
        const gem = slotGroup.getObjectByName('slotGem');
        if (gem) {
          slotGroup.remove(gem);
        }
      }
    }
  }

  public resetParticles(boostMultiplier: number = 1): void {
    if (!this.particles) return;
    
    const count = Math.floor(this.particleCount * boostMultiplier);
    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < Math.min(count, this.particleCount); i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1 + Math.random() * 2;
      const height = Math.random() * 3;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  public update(deltaTime: number): void {
    const time = this.clock.getElapsedTime();
    
    this.updateFragments(time, deltaTime);
    this.updateInscription(time);
    this.updateParticles(time, deltaTime);
    this.updateEnergyRing(deltaTime);
    this.updateSlotGems(time);
  }

  private updateFragments(time: number, deltaTime: number): void {
    this.fragmentMeshes.forEach((mesh) => {
      const { floatOffset, rotationOffset } = mesh.userData;
      
      mesh.position.y = this.fragmentBaseY + Math.sin(time * this.fragmentFloatSpeed + floatOffset) * 0.2;
      
      mesh.rotation.y += this.fragmentRotationSpeed * deltaTime;
      mesh.rotation.x = Math.sin(time + rotationOffset) * 0.3;
    });
  }

  private updateInscription(time: number): void {
    if (this.inscriptionTexture) {
      this.inscriptionTexture.offset.x = time * 0.05;
      this.inscriptionTexture.offset.y = time * 0.03;
    }
    
    if (this.runeInscription) {
      const material = this.runeInscription.material as THREE.MeshBasicMaterial;
      material.opacity = 0.6 + Math.sin(time * 2) * 0.2;
    }
  }

  private updateParticles(time: number, deltaTime: number): void {
    if (!this.particles) return;
    
    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      const angle = Math.atan2(positions[i3 + 2], positions[i3]);
      const radius = Math.sqrt(positions[i3] ** 2 + positions[i3 + 2] ** 2);
      
      const newAngle = angle + deltaTime * 0.3;
      
      positions[i3] = Math.cos(newAngle) * radius;
      positions[i3 + 2] = Math.sin(newAngle) * radius;
      
      positions[i3 + 1] += Math.sin(time * 2 + i) * deltaTime * 0.5;
      positions[i3 + 1] = Math.max(0.1, Math.min(5, positions[i3 + 1]));
    }
    
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  private updateEnergyRing(deltaTime: number): void {
    if (!this.energyRingActive || !this.energyRing) return;
    
    this.energyRingTime += deltaTime;
    
    const progress = this.energyRingTime / this.energyRingDuration;
    
    if (progress >= 1) {
      this.energyRingActive = false;
      this.scene.remove(this.energyRing);
      this.energyRing = null;
      return;
    }
    
    const size = 0.5 + progress * 5.5;
    this.energyRing.scale.set(size, size, 1);
    
    const material = this.energyRing.material as THREE.MeshBasicMaterial;
    material.opacity = 1 - progress;
  }

  private updateSlotGems(time: number): void {
    for (const slotGroup of this.altarSlots) {
      const gem = slotGroup.getObjectByName('slotGem');
      if (gem) {
        gem.position.y = 0.3 + Math.sin(time * 3) * 0.1;
        gem.rotation.y = time * 2;
      }
    }
  }

  public getFragmentMeshes(): Map<number, THREE.Mesh> {
    return this.fragmentMeshes;
  }

  public getAltarPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, 0);
  }
}
