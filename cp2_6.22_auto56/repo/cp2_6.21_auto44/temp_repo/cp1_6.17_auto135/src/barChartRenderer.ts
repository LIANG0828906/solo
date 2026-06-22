import * as THREE from 'three';
import type { DataItem } from './dataParser';

type EventType = 'bar:hover' | 'bar:click' | 'bar:doubleClick';

interface BarChartRendererOptions {
  barWidth?: number;
  barDepth?: number;
  minHeight?: number;
  maxHeight?: number;
  colorStart?: string;
  colorEnd?: string;
  radius?: number;
  heightScale?: number;
}

interface BarObject {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  topMesh: THREE.Mesh;
  labelSprite: THREE.Sprite;
  nameSprite: THREE.Sprite;
  borderMesh?: THREE.LineSegments;
  originalHeight: number;
  targetHeight: number;
  currentHeight: number;
  baseColor: THREE.Color;
  data: DataItem;
  index: number;
  isHovered: boolean;
  isSelected: boolean;
  flashIntensity: number;
}

interface ShatterPiece {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  life: number;
  maxLife: number;
}

type EventCallback = (data: { data: DataItem; index: number; bar: BarObject }) => void;

export class BarChartRenderer {
  private scene: THREE.Scene;
  private barsGroup: THREE.Group;
  private bars: BarObject[] = [];
  private shatterPieces: ShatterPiece[] = [];
  private options: Required<Omit<BarChartRendererOptions, 'heightScale'>> & { heightScale: number };
  private eventListeners: Map<EventType, EventCallback[]> = new Map();
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredBar: BarObject | null = null;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;

  constructor(scene: THREE.Scene, options: BarChartRendererOptions = {}) {
    this.scene = scene;
    this.barsGroup = new THREE.Group();
    this.scene.add(this.barsGroup);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.options = {
      barWidth: 10,
      barDepth: 10,
      minHeight: 20,
      maxHeight: 200,
      colorStart: '#2ECC71',
      colorEnd: '#E74C3C',
      radius: 100,
      heightScale: 1,
      ...options,
    };
  }

  on(event: EventType, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: EventType, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  private emit(event: EventType, data: { data: DataItem; index: number; bar: BarObject }): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    listeners.forEach((cb) => cb(data));
  }

  setHeightScale(scale: number): void {
    this.options.heightScale = scale;
    this.bars.forEach((bar) => {
      bar.targetHeight = bar.isSelected
        ? bar.originalHeight * 1.3 * this.options.heightScale
        : bar.originalHeight * this.options.heightScale;
    });
  }

  setRadius(radius: number): void {
    this.options.radius = radius;
    this.layoutBars();
  }

  render(data: DataItem[]): void {
    this.clearBars();
    this.createBars(data);
    this.layoutBars();
    this.startAnimationLoop();
  }

  transitionToData(data: DataItem[]): void {
    this.shatterBars();
    setTimeout(() => {
      this.render(data);
    }, 300);
  }

  private createBars(data: DataItem[]): void {
    const valueRange = 1000 - 100;
    const heightRange = this.options.maxHeight - this.options.minHeight;

    data.forEach((item, index) => {
      const normalizedValue = (item.value - 100) / valueRange;
      const height = this.options.minHeight + normalizedValue * heightRange;
      const baseColor = new THREE.Color(
        this.interpolateColor(this.options.colorStart, this.options.colorEnd, normalizedValue)
      );

      const barGroup = new THREE.Group();

      const bodyGeometry = new THREE.BoxGeometry(
        this.options.barWidth,
        height,
        this.options.barDepth
      );
      const bodyMaterial = new THREE.MeshPhongMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.6,
        shininess: 60,
        specular: 0x333333,
      });
      const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
      bodyMesh.position.y = height / 2;
      bodyMesh.userData.barIndex = index;
      bodyMesh.userData.isBar = true;

      const topGeometry = new THREE.BoxGeometry(
        this.options.barWidth,
        1.5,
        this.options.barDepth
      );
      const topMaterial = new THREE.MeshPhongMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.95,
        shininess: 100,
        specular: 0x666666,
        emissive: baseColor,
        emissiveIntensity: 0.15,
      });
      const topMesh = new THREE.Mesh(topGeometry, topMaterial);
      topMesh.position.y = height - 0.75;
      topMesh.userData.barIndex = index;
      topMesh.userData.isBar = true;

      const labelSprite = this.createValueLabel(item.value.toString());
      labelSprite.position.y = height + 20;
      labelSprite.visible = false;

      const nameSprite = this.createNameLabel(item.name);
      nameSprite.position.y = -12;
      nameSprite.visible = true;

      barGroup.add(bodyMesh, topMesh, labelSprite, nameSprite);

      const bar: BarObject = {
        group: barGroup,
        bodyMesh,
        topMesh,
        labelSprite,
        nameSprite,
        originalHeight: height,
        targetHeight: height * this.options.heightScale,
        currentHeight: 0,
        baseColor,
        data: item,
        index,
        isHovered: false,
        isSelected: false,
        flashIntensity: 0,
      };

      this.bars.push(bar);
      this.barsGroup.add(barGroup);
    });
  }

  private createValueLabel(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 6;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(32, 16, 1);

    return sprite;
  }

  private layoutBars(): void {
    const count = this.bars.length;
    const angleStep = (Math.PI * 2) / count;
    const radius = this.options.radius;

    this.bars.forEach((bar, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      bar.group.position.set(x, 0, z);
      bar.group.rotation.y = -angle + Math.PI / 2;
    });
  }

  private createNameLabel(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(24, 6, 1);

    return sprite;
  }

  private interpolateColor(colorStart: string, colorEnd: string, t: number): string {
    const start = new THREE.Color(colorStart);
    const end = new THREE.Color(colorEnd);
    const result = new THREE.Color().lerpColors(start, end, t);
    return `#${result.getHexString()}`;
  }

  handleMouseMove(event: MouseEvent, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  handleClick(): void {
    if (this.hoveredBar) {
      this.emit('bar:click', {
        data: this.hoveredBar.data,
        index: this.hoveredBar.index,
        bar: this.hoveredBar,
      });
    }
  }

  handleDoubleClick(): void {
    if (this.hoveredBar) {
      this.selectBar(this.hoveredBar.index);
      this.emit('bar:doubleClick', {
        data: this.hoveredBar.data,
        index: this.hoveredBar.index,
        bar: this.hoveredBar,
      });
    }
  }

  selectBar(index: number): void {
    this.bars.forEach((bar, i) => {
      if (i === index) {
        bar.isSelected = true;
        bar.targetHeight = bar.originalHeight * 1.3 * this.options.heightScale;
        this.addSelectionBorder(bar);
      } else if (bar.isSelected) {
        bar.isSelected = false;
        bar.targetHeight = bar.originalHeight * this.options.heightScale;
        this.removeSelectionBorder(bar);
      }
    });
  }

  private addSelectionBorder(bar: BarObject): void {
    if (bar.borderMesh) return;

    const borderGeometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(
        this.options.barWidth + 1.5,
        bar.currentHeight + 2,
        this.options.barDepth + 1.5
      )
    );
    const material = new THREE.LineBasicMaterial({
      color: 0xf1c40f,
      transparent: true,
      opacity: 1,
    });
    const border = new THREE.LineSegments(borderGeometry, material);
    border.position.y = bar.currentHeight / 2;
    bar.group.add(border);
    bar.borderMesh = border;
  }

  private removeSelectionBorder(bar: BarObject): void {
    if (bar.borderMesh) {
      bar.group.remove(bar.borderMesh);
      bar.borderMesh.geometry.dispose();
      (bar.borderMesh.material as THREE.Material).dispose();
      bar.borderMesh = undefined;
    }
  }

  getBarPosition(index: number): THREE.Vector3 {
    const bar = this.bars[index];
    if (!bar) return new THREE.Vector3();
    return bar.group.position.clone();
  }

  getBarsGroup(): THREE.Group {
    return this.barsGroup;
  }

  private clearBars(): void {
    this.bars.forEach((bar) => {
      this.barsGroup.remove(bar.group);
      bar.bodyMesh.geometry.dispose();
      (bar.bodyMesh.material as THREE.Material).dispose();
      bar.topMesh.geometry.dispose();
      (bar.topMesh.material as THREE.Material).dispose();
      (bar.labelSprite.material as THREE.SpriteMaterial).map?.dispose();
      (bar.labelSprite.material as THREE.Material).dispose();
      (bar.nameSprite.material as THREE.SpriteMaterial).map?.dispose();
      (bar.nameSprite.material as THREE.Material).dispose();
      if (bar.borderMesh) {
        bar.borderMesh.geometry.dispose();
        (bar.borderMesh.material as THREE.Material).dispose();
      }
    });
    this.bars = [];
    this.hoveredBar = null;
  }

  private shatterBars(): void {
    this.bars.forEach((bar) => {
      const pieceCount = 10;
      for (let i = 0; i < pieceCount; i++) {
        const geometry = new THREE.TetrahedronGeometry(2 + Math.random() * 4);
        const material = new THREE.MeshPhongMaterial({
          color: bar.baseColor,
          transparent: true,
          opacity: 0.85,
          shininess: 50,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(bar.group.position);
        mesh.position.y += bar.currentHeight * (0.2 + Math.random() * 0.6);

        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 60;
        const velocity = new THREE.Vector3(
          Math.cos(angle) * speed * 0.6,
          40 + Math.random() * 60,
          Math.sin(angle) * speed * 0.6
        );

        const rotationSpeed = new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        );

        this.shatterPieces.push({
          mesh,
          velocity,
          rotationSpeed,
          life: 0.6,
          maxLife: 0.6,
        });

        this.scene.add(mesh);
      }
    });

    this.bars.forEach((bar) => {
      bar.group.visible = false;
    });
  }

  private startAnimationLoop(): void {
    if (this.animationFrameId !== null) return;

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      const delta = this.clock.getDelta();
      this.update(delta);
    };

    animate();
  }

  private update(delta: number): void {
    this.updateRaycast();
    this.updateBars(delta);
    this.updateShatterPieces(delta);
  }

  private updateRaycast(): void {
    const camera = this.getCamera();
    if (!camera) return;

    this.raycaster.setFromCamera(this.mouse, camera);

    const barMeshes: THREE.Object3D[] = [];
    this.bars.forEach((bar) => {
      if (bar.group.visible) {
        barMeshes.push(bar.bodyMesh, bar.topMesh);
      }
    });

    const intersects = this.raycaster.intersectObjects(barMeshes);

    if (intersects.length > 0) {
      const firstHit = intersects[0].object;
      const barIndex = (firstHit.userData as { barIndex?: number }).barIndex;
      if (barIndex !== undefined && this.bars[barIndex]) {
        const bar = this.bars[barIndex];
        if (this.hoveredBar !== bar) {
          if (this.hoveredBar) {
            this.hoveredBar.isHovered = false;
            this.hoveredBar.targetHeight = this.hoveredBar.isSelected
              ? this.hoveredBar.originalHeight * 1.3 * this.options.heightScale
              : this.hoveredBar.originalHeight * this.options.heightScale;
            this.hoveredBar.labelSprite.visible = false;
          }
          this.hoveredBar = bar;
          bar.isHovered = true;
          bar.targetHeight = bar.originalHeight * 1.15 * this.options.heightScale;
          bar.flashIntensity = 1;
          bar.labelSprite.visible = true;
          this.emit('bar:hover', { data: bar.data, index: bar.index, bar });
        }
      }
    } else if (this.hoveredBar) {
      this.hoveredBar.isHovered = false;
      this.hoveredBar.targetHeight = this.hoveredBar.isSelected
        ? this.hoveredBar.originalHeight * 1.3 * this.options.heightScale
        : this.hoveredBar.originalHeight * this.options.heightScale;
      this.hoveredBar.labelSprite.visible = false;
      this.hoveredBar = null;
    }
  }

  private getCamera(): THREE.Camera | null {
    return (this.scene.userData as { camera?: THREE.Camera }).camera || null;
  }

  setCamera(camera: THREE.Camera): void {
    (this.scene.userData as { camera?: THREE.Camera }).camera = camera;
  }

  private updateBars(delta: number): void {
    const heightSpeed = 1 / 0.3;

    this.bars.forEach((bar) => {
      const diff = bar.targetHeight - bar.currentHeight;
      bar.currentHeight += diff * Math.min(delta * heightSpeed, 1);

      const scaleFactor = bar.currentHeight / bar.originalHeight;
      bar.bodyMesh.scale.y = scaleFactor;
      bar.bodyMesh.position.y = bar.currentHeight / 2;

      bar.topMesh.position.y = bar.currentHeight - 0.75;

      const bodyMat = bar.bodyMesh.material as THREE.MeshPhongMaterial;
      const topMat = bar.topMesh.material as THREE.MeshPhongMaterial;

      if (bar.flashIntensity > 0) {
        const flashColor = new THREE.Color(0xffffff);
        bodyMat.emissive.copy(flashColor);
        bodyMat.emissiveIntensity = bar.flashIntensity * 0.6;
        topMat.emissive.copy(flashColor);
        topMat.emissiveIntensity = bar.flashIntensity * 0.9;

        bar.flashIntensity -= delta / 0.1;
        if (bar.flashIntensity < 0) bar.flashIntensity = 0;
      } else {
        bodyMat.emissive.copy(bar.baseColor);
        bodyMat.emissiveIntensity = bar.isHovered || bar.isSelected ? 0.15 : 0.05;
        topMat.emissive.copy(bar.baseColor);
        topMat.emissiveIntensity = bar.isHovered || bar.isSelected ? 0.3 : 0.15;
      }

      bar.labelSprite.position.y = bar.currentHeight + 20;

      if (bar.borderMesh) {
        bar.borderMesh.position.y = bar.currentHeight / 2;
        bar.borderMesh.scale.y = scaleFactor;
      }
    });
  }

  private updateShatterPieces(delta: number): void {
    const gravity = -150;

    for (let i = this.shatterPieces.length - 1; i >= 0; i--) {
      const piece = this.shatterPieces[i];

      piece.velocity.y += gravity * delta;
      piece.mesh.position.add(piece.velocity.clone().multiplyScalar(delta));

      piece.mesh.rotation.x += piece.rotationSpeed.x * delta;
      piece.mesh.rotation.y += piece.rotationSpeed.y * delta;
      piece.mesh.rotation.z += piece.rotationSpeed.z * delta;

      piece.life -= delta;
      const opacity = Math.max(0, piece.life / piece.maxLife);
      (piece.mesh.material as THREE.MeshPhongMaterial).opacity = opacity * 0.85;

      if (piece.life <= 0) {
        this.scene.remove(piece.mesh);
        piece.mesh.geometry.dispose();
        (piece.mesh.material as THREE.Material).dispose();
        this.shatterPieces.splice(i, 1);
      }
    }
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.clearBars();
    this.shatterPieces.forEach((piece) => {
      this.scene.remove(piece.mesh);
      piece.mesh.geometry.dispose();
      (piece.mesh.material as THREE.Material).dispose();
    });
    this.shatterPieces = [];
    this.scene.remove(this.barsGroup);
  }
}
