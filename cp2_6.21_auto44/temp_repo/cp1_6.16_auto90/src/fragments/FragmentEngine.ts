import * as THREE from 'three';
import { EventEmitter } from 'node:events';

export type FragmentType = 'bowl_rim' | 'bottle_body' | 'painted';

export interface Fragment {
  id: string;
  type: FragmentType;
  vertices: THREE.Vector2[];
  symbolId: number;
  mesh: THREE.Mesh;
  group: THREE.Group | null;
  isDragging: boolean;
  isSnapped: boolean;
}

export interface FragmentEngineOptions {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

export class FragmentEngine extends EventEmitter {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private fragments: Fragment[];
  private groups: THREE.Group[];
  private dragPlane: THREE.Plane;
  private dragOffset: THREE.Vector3;
  private draggedFragment: Fragment | null;
  private shadowMesh: THREE.Mesh | null;
  private colors: number[];
  private symbolTypes: string[];
  private readonly FRAGMENT_COUNT_MIN = 12;
  private readonly FRAGMENT_COUNT_MAX = 16;
  private readonly SNAP_DISTANCE = 0.5;
  private readonly MAX_DISTANCE_FROM_CENTER = 5;
  private readonly EXTRUDE_DEPTH = 0.15;
  private readonly SYMBOL_COUNT = 5;

  constructor(options: FragmentEngineOptions) {
    super();
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.fragments = [];
    this.groups = [];
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.dragOffset = new THREE.Vector3();
    this.draggedFragment = null;
    this.shadowMesh = null;
    this.colors = [0x8B4513, 0xD2B48C, 0xB22222];
    this.symbolTypes = ['spiral', 'triangle', 'circle', 'wave'];
  }

  public generateFragments(): Fragment[] {
    this.clearFragments();
    const fragmentCount = Math.floor(Math.random() * (this.FRAGMENT_COUNT_MAX - this.FRAGMENT_COUNT_MIN + 1)) + this.FRAGMENT_COUNT_MIN;
    const fragmentsPerSymbol = this.distributeFragments(fragmentCount, this.SYMBOL_COUNT);
    
    let fragmentIndex = 0;
    for (let symbolId = 0; symbolId < this.SYMBOL_COUNT; symbolId++) {
      const count = fragmentsPerSymbol[symbolId] ?? 0;
      for (let i = 0; i < count; i++) {
        const fragment = this.createFragment(fragmentIndex, symbolId);
        this.fragments.push(fragment);
        this.scene.add(fragment.mesh);
        fragmentIndex++;
      }
    }
    
    return this.fragments;
  }

  private distributeFragments(total: number, symbols: number): number[] {
    const distribution: number[] = [];
    let remaining = total;
    
    for (let i = 0; i < symbols; i++) {
      if (i === symbols - 1) {
        distribution.push(remaining);
      } else {
        const min = 2;
        const max = Math.min(4, remaining - (symbols - i - 1) * 2);
        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        distribution.push(count);
        remaining -= count;
      }
    }
    
    return distribution;
  }

  private createFragment(index: number, symbolId: number): Fragment {
    const types: FragmentType[] = ['bowl_rim', 'bottle_body', 'painted'];
    const type = types[Math.floor(Math.random() * types.length)] as FragmentType;
    const vertices = this.generateIrregularPolygon();
    const geometry = this.createExtrudeGeometry(vertices);
    const material = this.createFragmentMaterial(symbolId);
    const mesh = new THREE.Mesh(geometry, material);
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.MAX_DISTANCE_FROM_CENTER;
    mesh.position.set(
      Math.cos(angle) * distance,
      this.EXTRUDE_DEPTH / 2,
      Math.sin(angle) * distance
    );
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.userData.fragmentIndex = index;
    
    return {
      id: `fragment_${index}`,
      type,
      vertices,
      symbolId,
      mesh,
      group: null,
      isDragging: false,
      isSnapped: false
    };
  }

  private generateIrregularPolygon(): THREE.Vector2[] {
    const vertexCount = Math.floor(Math.random() * 5) + 3;
    const vertices: THREE.Vector2[] = [];
    const baseRadius = 0.5 + Math.random() * 0.5;
    
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      const radiusVariation = 0.7 + Math.random() * 0.6;
      const radius = baseRadius * radiusVariation;
      vertices.push(new THREE.Vector2(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      ));
    }
    
    return vertices;
  }

  private createExtrudeGeometry(vertices: THREE.Vector2[]): THREE.ExtrudeGeometry {
    const shape = new THREE.Shape();
    const firstVertex = vertices[0]!;
    shape.moveTo(firstVertex.x, firstVertex.y);
    for (let i = 1; i < vertices.length; i++) {
      const vertex = vertices[i]!;
      shape.lineTo(vertex.x, vertex.y);
    }
    shape.closePath();
    
    return new THREE.ExtrudeGeometry(shape, {
      depth: this.EXTRUDE_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 1
    });
  }

  private createFragmentMaterial(symbolId: number): THREE.MeshStandardMaterial {
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    const symbolTexture = this.createSymbolTexture(symbolId);
    
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.2,
      map: symbolTexture,
      side: THREE.DoubleSide
    });
  }

  private createSymbolTexture(symbolId: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.strokeStyle = '#2C1810';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const symbolType = this.symbolTypes[symbolId % this.symbolTypes.length];
    const offsetX = Math.random() * 60 - 30;
    const offsetY = Math.random() * 60 - 30;
    
    ctx.save();
    ctx.translate(128 + offsetX, 128 + offsetY);
    
    switch (symbolType) {
      case 'spiral':
        this.drawSpiral(ctx);
        break;
      case 'triangle':
        this.drawTriangle(ctx);
        break;
      case 'circle':
        this.drawCircle(ctx);
        break;
      case 'wave':
        this.drawWave(ctx);
        break;
    }
    
    ctx.restore();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private drawSpiral(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    for (let i = 0; i < 720; i++) {
      const angle = (i * Math.PI) / 180;
      const radius = (i / 720) * 80;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  private drawTriangle(ctx: CanvasRenderingContext2D): void {
    const size = 70;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.866, size * 0.5);
    ctx.lineTo(-size * 0.866, size * 0.5);
    ctx.closePath();
    ctx.stroke();
  }

  private drawCircle(ctx: CanvasRenderingContext2D): void {
    const rings = 3;
    for (let r = 1; r <= rings; r++) {
      ctx.beginPath();
      ctx.arc(0, 0, (r / rings) * 80, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawWave(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    for (let x = -80; x <= 80; x += 2) {
      const y = Math.sin((x / 80) * Math.PI * 3) * 20;
      if (x === -80) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  public startDrag(event: MouseEvent): void {
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const meshes = this.fragments.map(f => f.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);
    
    if (intersects.length > 0) {
      const firstIntersect = intersects[0]!;
      const intersectedMesh = firstIntersect.object as THREE.Mesh;
      const fragmentIndex = intersectedMesh.userData.fragmentIndex;
      const fragment = this.fragments[fragmentIndex];
      
      if (fragment) {
        this.draggedFragment = fragment;
        fragment.isDragging = true;
        
        const targetObject = fragment.group || fragment.mesh;
        this.raycaster.ray.intersectPlane(this.dragPlane, this.dragOffset);
        this.dragOffset.sub(targetObject.position);
        
        this.createShadow(targetObject.position);
      }
    }
  }

  public onDrag(event: MouseEvent): void {
    if (!this.draggedFragment) return;
    
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersection);
    
    const targetObject = this.draggedFragment.group || this.draggedFragment.mesh;
    targetObject.position.copy(intersection.sub(this.dragOffset));
    targetObject.position.y = this.EXTRUDE_DEPTH / 2 + 0.1;
    
    this.updateShadow(targetObject.position);
    this.checkSnap(this.draggedFragment);
  }

  public endDrag(): void {
    if (this.draggedFragment) {
      this.draggedFragment.isDragging = false;
      
      const targetObject = this.draggedFragment.group || this.draggedFragment.mesh;
      targetObject.position.y = this.EXTRUDE_DEPTH / 2;
      
      this.draggedFragment = null;
      this.removeShadow();
    }
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private createShadow(position: THREE.Vector3): void {
    const shadowGeometry = new THREE.RingGeometry(0.3, 0.8, 32);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    this.shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.set(position.x, 0.01, position.z);
    this.scene.add(this.shadowMesh);
  }

  private updateShadow(position: THREE.Vector3): void {
    if (this.shadowMesh) {
      this.shadowMesh.position.set(position.x, 0.01, position.z);
    }
  }

  private removeShadow(): void {
    if (this.shadowMesh) {
      this.scene.remove(this.shadowMesh);
      this.shadowMesh.geometry.dispose();
      (this.shadowMesh.material as THREE.Material).dispose();
      this.shadowMesh = null;
    }
  }

  public checkSnap(fragment: Fragment): void {
    const fragmentPos = new THREE.Vector3();
    const fragmentObject = fragment.group || fragment.mesh;
    fragmentObject.getWorldPosition(fragmentPos);
    
    for (const other of this.fragments) {
      if (other.id === fragment.id) continue;
      if (other.symbolId !== fragment.symbolId) continue;
      
      const otherObject = other.group || other.mesh;
      const otherPos = new THREE.Vector3();
      otherObject.getWorldPosition(otherPos);
      
      const distance = fragmentPos.distanceTo(otherPos);
      
      if (distance < this.SNAP_DISTANCE) {
        this.mergeFragments(fragment, other);
        break;
      }
    }
  }

  public mergeFragments(fragmentA: Fragment, fragmentB: Fragment): void {
    const objectA = fragmentA.group || fragmentA.mesh;
    const objectB = fragmentB.group || fragmentB.mesh;
    
    if (objectA === objectB) return;
    
    let group: THREE.Group;
    let targetPos: THREE.Vector3;
    
    if (fragmentA.group && fragmentB.group) {
      group = fragmentA.group;
      targetPos = new THREE.Vector3();
      objectA.getWorldPosition(targetPos);
      
      while (fragmentB.group.children.length > 0) {
        const child = fragmentB.group.children[0]!;
        objectA.attach(child);
        const frag = this.getFragmentByMesh(child as THREE.Mesh);
        if (frag) {
          frag.group = group;
          frag.isSnapped = true;
        }
      }
      
      this.scene.remove(fragmentB.group);
      this.groups = this.groups.filter(g => g !== fragmentB.group);
      fragmentB.group = null;
    } else if (fragmentA.group) {
      group = fragmentA.group;
      targetPos = new THREE.Vector3();
      objectA.getWorldPosition(targetPos);
      
      this.scene.remove(objectB);
      objectA.attach(objectB);
      objectB.position.sub(targetPos);
      fragmentB.group = group;
      fragmentB.isSnapped = true;
    } else if (fragmentB.group) {
      group = fragmentB.group;
      targetPos = new THREE.Vector3();
      objectB.getWorldPosition(targetPos);
      
      this.scene.remove(objectA);
      objectB.attach(objectA);
      objectA.position.sub(targetPos);
      fragmentA.group = group;
      fragmentA.isSnapped = true;
    } else {
      group = new THREE.Group();
      targetPos = new THREE.Vector3();
      objectA.getWorldPosition(targetPos);
      group.position.copy(targetPos);
      
      this.scene.remove(objectA);
      this.scene.remove(objectB);
      
      group.add(objectA);
      group.add(objectB);
      
      objectA.position.sub(targetPos);
      objectB.position.sub(targetPos);
      
      fragmentA.group = group;
      fragmentB.group = group;
      fragmentA.isSnapped = true;
      fragmentB.isSnapped = true;
      
      this.scene.add(group);
      this.groups.push(group);
    }
    
    objectA.position.x = 0;
    objectA.position.z = 0;
    objectB.position.x = 0;
    objectB.position.z = 0;
    
    this.emit('fragmentsMerged', {
      fragmentA,
      fragmentB,
      group,
      symbolId: fragmentA.symbolId
    });
  }

  private getFragmentByMesh(mesh: THREE.Mesh): Fragment | undefined {
    return this.fragments.find(f => f.mesh === mesh);
  }

  public getFragmentById(id: string): Fragment | undefined {
    return this.fragments.find(f => f.id === id);
  }

  public getFragments(): Fragment[] {
    return this.fragments;
  }

  public getGroups(): THREE.Group[] {
    return this.groups;
  }

  private clearFragments(): void {
    for (const fragment of this.fragments) {
      if (fragment.mesh.geometry) {
        fragment.mesh.geometry.dispose();
      }
      if (fragment.mesh.material) {
        const materials = Array.isArray(fragment.mesh.material)
          ? fragment.mesh.material
          : [fragment.mesh.material];
        materials.forEach(m => m.dispose());
      }
      if (fragment.group) {
        this.scene.remove(fragment.group);
      } else {
        this.scene.remove(fragment.mesh);
      }
    }
    this.fragments = [];
    this.groups = [];
    this.removeShadow();
  }

  public reset(): void {
    this.clearFragments();
    this.generateFragments();
  }

  public update(): void {
  }
}
