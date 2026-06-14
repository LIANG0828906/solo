import * as THREE from 'three';

export interface Annotation {
  id: number;
  position: THREE.Vector3;
  text: string;
  marker: THREE.Sprite;
  label: THREE.Sprite;
  highlighted: boolean;
}

export class AnnotationSystem {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private annotations: Map<number, Annotation> = new Map();
  private nextId: number = 1;

  private isDragging: boolean = false;
  private draggedAnnotation: Annotation | null = null;
  private dragStartPosition: THREE.Vector3 = new THREE.Vector3();
  private mouseDownScreen: { x: number; y: number } = { x: 0, y: 0 };
  private dragThreshold: number = 5;
  private hasDragged: boolean = false;

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouseVector: THREE.Vector2 = new THREE.Vector2();

  private onAnnotationClick?: (annotation: Annotation) => void;
  private onAnnotationAdd?: (position: THREE.Vector3) => void;

  private pointCloudMesh?: THREE.Points;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.bindEvents();
  }

  public setPointCloudMesh(mesh: THREE.Points): void {
    this.pointCloudMesh = mesh;
  }

  public setOnAnnotationClick(callback: (annotation: Annotation) => void): void {
    this.onAnnotationClick = callback;
  }

  public setOnAnnotationAdd(callback: (position: THREE.Vector3) => void): void {
    this.onAnnotationAdd = callback;
  }

  public getAnnotations(): Annotation[] {
    return Array.from(this.annotations.values());
  }

  public getAnnotation(id: number): Annotation | undefined {
    return this.annotations.get(id);
  }

  public updateAnnotationText(id: number, text: string): void {
    const annotation = this.annotations.get(id);
    if (!annotation) return;
    annotation.text = text.substring(0, 100);
    this.updateLabelTexture(annotation);
  }

  public deleteAnnotation(id: number): void {
    const annotation = this.annotations.get(id);
    if (!annotation) return;

    this.scene.remove(annotation.marker);
    this.scene.remove(annotation.label);

    const markerMat = annotation.marker.material as THREE.SpriteMaterial;
    if (markerMat.map) {
      markerMat.map.dispose();
    }
    markerMat.dispose();

    const labelMat = annotation.label.material as THREE.SpriteMaterial;
    if (labelMat.map) {
      labelMat.map.dispose();
    }
    labelMat.dispose();

    annotation.marker.geometry.dispose();
    annotation.label.geometry.dispose();

    this.annotations.delete(id);
  }

  public highlightAnnotation(id: number, highlight: boolean): void {
    const annotation = this.annotations.get(id);
    if (!annotation) return;
    annotation.highlighted = highlight;
    this.updateMarkerVisual(annotation);
  }

  public addAnnotation(position: THREE.Vector3, text: string = '新标注'): Annotation {
    const id = this.nextId++;

    const marker = this.createMarkerSprite();
    marker.position.copy(position);

    const label = this.createLabelSprite(text);
    label.position.copy(position).add(new THREE.Vector3(0, 1.8, 0));

    this.scene.add(marker);
    this.scene.add(label);

    const annotation: Annotation = {
      id,
      position: position.clone(),
      text: text.substring(0, 100),
      marker,
      label,
      highlighted: false,
    };

    this.annotations.set(id, annotation);
    return annotation;
  }

  private createMarkerTexture(highlighted: boolean = false, dragging: boolean = false): THREE.Texture {
    const size = dragging ? 64 : 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    const radius = size / 2 - 4;
    const centerX = size / 2;
    const centerY = size / 2;

    if (dragging || highlighted) {
      ctx.shadowColor = '#92400e';
      ctx.shadowBlur = dragging ? 16 : 10;
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = highlighted ? '#fcd34d' : '#fbbf24';
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = highlighted ? '#92400e' : '#b45309';
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  private createLabelTexture(text: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    const fontSize = 48;
    const padding = 20;
    ctxFont(canvas, fontSize);
    const ctx = canvas.getContext('2d')!;

    const textWidth = ctx.measureText(text).width;
    canvas.width = Math.max(60, textWidth + padding * 2);
    canvas.height = fontSize + padding * 2;

    ctxFont(canvas, fontSize);

    const bgColor = 'rgba(15, 23, 42, 0.9)';
    const borderColor = '#fbbf24';
    const textColor = '#f1f5f9';

    ctx.fillStyle = bgColor;
    roundRect(ctx, 2, 2, canvas.width - 4, canvas.height - 4, 8);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = borderColor;
    roundRect(ctx, 2, 2, canvas.width - 4, canvas.height - 4, 8);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  private createMarkerSprite(): THREE.Sprite {
    const texture = this.createMarkerTexture();
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.2, 1.2, 1);
    sprite.renderOrder = 999;
    return sprite;
  }

  private createLabelSprite(text: string): THREE.Sprite {
    const texture = this.createLabelTexture(text);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const sprite = new THREE.Sprite(material);
    const aspect = texture.image.width / texture.image.height;
    sprite.scale.set(Math.max(2, aspect * 0.8), 0.8, 1);
    sprite.renderOrder = 1000;
    return sprite;
  }

  private updateMarkerVisual(annotation: Annotation): void {
    const oldTexture = (annotation.marker.material as THREE.SpriteMaterial).map;
    const isDragging = this.draggedAnnotation?.id === annotation.id;
    const newTexture = this.createMarkerTexture(annotation.highlighted, isDragging);
    (annotation.marker.material as THREE.SpriteMaterial).map = newTexture;
    annotation.marker.material.needsUpdate = true;
    if (oldTexture) oldTexture.dispose();

    const baseScale = isDragging ? 1.6 : 1.2;
    annotation.marker.scale.set(baseScale, baseScale, 1);
  }

  private updateLabelTexture(annotation: Annotation): void {
    const oldTexture = (annotation.label.material as THREE.SpriteMaterial).map;
    const newTexture = this.createLabelTexture(annotation.text);
    (annotation.label.material as THREE.SpriteMaterial).map = newTexture;
    annotation.label.material.needsUpdate = true;
    const aspect = newTexture.image.width / newTexture.image.height;
    annotation.label.scale.set(Math.max(2, aspect * 0.8), 0.8, 1);
    if (oldTexture) oldTexture.dispose();
  }

  public update(): void {
    for (const annotation of this.annotations.values()) {
      annotation.label.position.copy(annotation.position).add(new THREE.Vector3(0, 1.8, 0));
    }
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', this.onMouseDown);
    dom.addEventListener('mousemove', this.onMouseMove);
    dom.addEventListener('mouseup', this.onMouseUp);
  }

  public dispose(): void {
    const dom = this.renderer.domElement;
    dom.removeEventListener('mousedown', this.onMouseDown);
    dom.removeEventListener('mousemove', this.onMouseMove);
    dom.removeEventListener('mouseup', this.onMouseUp);
  }

  private pickAnnotation(event: MouseEvent): Annotation | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseVector.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVector.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVector, this.camera);

    const sprites: THREE.Sprite[] = [];
    for (const ann of this.annotations.values()) {
      sprites.push(ann.marker);
    }

    const intersects = this.raycaster.intersectObjects(sprites, false);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      for (const ann of this.annotations.values()) {
        if (ann.marker === obj) return ann;
      }
    }
    return null;
  }

  private pickPointCloud(event: MouseEvent): THREE.Vector3 | null {
    if (!this.pointCloudMesh) return null;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseVector.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVector.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVector, this.camera);
    const intersects = this.raycaster.intersectObject(this.pointCloudMesh, false);

    if (intersects.length > 0 && intersects[0].point) {
      return intersects[0].point.clone();
    }

    const direction = new THREE.Vector3();
    this.raycaster.ray.direction.clone(direction);
    const origin = this.raycaster.ray.origin.clone();
    const groundPoint = origin.clone().add(direction.multiplyScalar(40));
    if (groundPoint.y < 0) {
      const t = -origin.y / direction.y;
      if (t > 0) {
        return origin.clone().add(this.raycaster.ray.direction.clone().multiplyScalar(t));
      }
    }
    return groundPoint;
  }

  private onMouseDown = (event: MouseEvent): void => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest('#control-panel') || target.closest('#annotation-panel') || target.closest('#minimap-container') || target.closest('#instructions')) {
      return;
    }

    const picked = this.pickAnnotation(event);
    this.mouseDownScreen = { x: event.clientX, y: event.clientY };
    this.hasDragged = false;

    if (picked) {
      this.isDragging = true;
      this.draggedAnnotation = picked;
      this.dragStartPosition.copy(picked.position);
      this.updateMarkerVisual(picked);
    }
  };

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging || !this.draggedAnnotation) return;

    const dx = event.clientX - this.mouseDownScreen.x;
    const dy = event.clientY - this.mouseDownScreen.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.dragThreshold) {
      this.hasDragged = true;
    }

    if (this.hasDragged) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouseVector.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseVector.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouseVector, this.camera);

      const dir = this.raycaster.ray.direction.clone();
      const origin = this.raycaster.ray.origin.clone();
      const t = (this.dragStartPosition.y - origin.y) / (dir.y || 0.001);
      if (t > 0) {
        const newPos = origin.add(dir.multiplyScalar(t));
        if (newPos) {
          this.draggedAnnotation.position.copy(newPos);
          this.draggedAnnotation.marker.position.copy(newPos);
        }
      }
    }
  };

  private onMouseUp = (event: MouseEvent): void => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest('#control-panel') || target.closest('#annotation-panel') || target.closest('#minimap-container') || target.closest('#instructions')) {
      return;
    }

    if (this.draggedAnnotation) {
      const wasDragging = this.hasDragged;
      const finishedAnnotation = this.draggedAnnotation;
      this.updateMarkerVisual(finishedAnnotation);
      this.isDragging = false;
      this.draggedAnnotation = null;

      if (wasDragging) {
        return;
      }

      if (this.onAnnotationClick) {
        this.onAnnotationClick(finishedAnnotation);
      }
      return;
    }

    const clickedAnnotation = this.pickAnnotation(event);
    if (clickedAnnotation && this.onAnnotationClick) {
      this.onAnnotationClick(clickedAnnotation);
      return;
    }

    const pickedPoint = this.pickPointCloud(event);
    if (pickedPoint && this.onAnnotationAdd) {
      this.onAnnotationAdd(pickedPoint);
    }
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function ctxFont(canvas: HTMLCanvasElement, size: number): void {
  const ctx = canvas.getContext('2d')!;
  ctx.font = `bold ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
}
