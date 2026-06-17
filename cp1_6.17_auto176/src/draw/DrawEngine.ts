import * as THREE from 'three';
import { sceneManager } from '../scene/SceneManager';
import { eventBus, Events } from '../utils/EventBus';
import { LightTrace, generateId, PRESET_COLORS, easeInOutQuad } from '../types';

class DrawEngine {
  private lightPen!: THREE.Mesh;
  private currentLine: THREE.LineSegments | null = null;
  private currentPoints: THREE.Vector3[] = [];
  private currentColor: string = PRESET_COLORS[0];
  private currentThickness: number = 0.1;
  private isDrawing: boolean = false;
  private isEditMode: boolean = false;
  private frameTraces: Map<string, { traces: LightTrace[], objects: THREE.Object3D[] }> = new Map();
  private currentFrameId: string | null = null;
  private displayObjects: THREE.Object3D[] = [];
  private selectedTraceId: string | null = null;
  private selectedObject: THREE.Object3D | null = null;

  init(): void {
    this.createLightPen();
    this.setupEventListeners();
    eventBus.on(Events.COLOR_CHANGED, (color: string) => this.setColor(color));
    eventBus.on(Events.THICKNESS_CHANGED, (thickness: number) => this.setThickness(thickness));
    eventBus.on(Events.SCENE_CLEAR, () => this.clearAll());
    eventBus.on(Events.EDIT_MODE_ENTER, (frameId: string) => this.enterEditMode(frameId));
    eventBus.on(Events.EDIT_MODE_EXIT, () => this.exitEditMode());
    eventBus.on(Events.TRACE_DELETED, (traceId: string) => this.deleteTrace(traceId));
  }

  private createLightPen(): void {
    const geometry = new THREE.SphereGeometry(0.08, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: this.currentColor,
      transparent: true,
      opacity: 0.9
    });
    this.lightPen = new THREE.Mesh(geometry, material);
    this.lightPen.userData.dynamic = true;
    this.lightPen.visible = false;
    
    const glowGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.currentColor,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.lightPen.add(glow);
    
    sceneManager.addObject(this.lightPen);
  }

  private setupEventListeners(): void {
    const canvas = sceneManager.renderer.domElement;
    
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleMouseMove(e: MouseEvent): void {
    const point = sceneManager.getIntersectionPoint(e);
    if (!point) return;

    this.updatePenPosition(point);

    if (this.isEditMode && this.selectedObject && e.buttons === 1) {
      this.dragSelectedObject(point);
      return;
    }

    if (this.isDrawing && e.buttons === 1) {
      this.continueDrawing(point);
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    if (e.target !== sceneManager.renderer.domElement) return;

    const point = sceneManager.getIntersectionPoint(e);
    if (!point) return;

    if (this.isEditMode) {
      this.trySelectTrace(e);
      return;
    }

    this.startDrawing(point);
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button !== 0) return;
    
    if (this.isDrawing) {
      this.stopDrawing();
    }
  }

  private trySelectTrace(e: MouseEvent): void {
    const frameData = this.frameTraces.get(this.currentFrameId!);
    if (!frameData) return;

    const intersects = sceneManager.getRaycasterIntersects(e, frameData.objects);
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && !obj.userData.traceId) {
        obj = obj.parent;
      }
      if (obj.userData.traceId) {
        this.selectTrace(obj.userData.traceId, obj);
      }
    } else {
      this.deselectTrace();
    }
  }

  private selectTrace(traceId: string, obj: THREE.Object3D): void {
    this.deselectTrace();
    this.selectedTraceId = traceId;
    this.selectedObject = obj;
    
    obj.traverse((child) => {
      if (child instanceof THREE.LineSegments) {
        (child.material as THREE.LineBasicMaterial).opacity = 1;
        (child.material as THREE.LineBasicMaterial).color.setHex(0xFFFFFF);
      }
    });
  }

  private deselectTrace(): void {
    if (this.selectedObject && this.selectedTraceId) {
      const frameData = this.frameTraces.get(this.currentFrameId!);
      const trace = frameData?.traces.find(t => t.id === this.selectedTraceId);
      if (trace) {
        this.selectedObject.traverse((child) => {
          if (child instanceof THREE.LineSegments) {
            (child.material as THREE.LineBasicMaterial).opacity = 0.8;
            (child.material as THREE.LineBasicMaterial).color.set(trace.color);
          }
        });
      }
    }
    this.selectedTraceId = null;
    this.selectedObject = null;
  }

  private dragSelectedObject(point: THREE.Vector3): void {
    if (!this.selectedObject) return;
    
    const frameData = this.frameTraces.get(this.currentFrameId!);
    const trace = frameData?.traces.find(t => t.id === this.selectedTraceId);
    if (!trace) return;

    const delta = new THREE.Vector3().subVectors(point, this.selectedObject.position);
    this.selectedObject.position.add(delta);
    
    trace.points.forEach(p => {
      p.x += delta.x;
      p.y += delta.y;
      p.z += delta.z;
    });
  }

  private deleteTrace(traceId: string): void {
    const frameData = this.frameTraces.get(this.currentFrameId!);
    if (!frameData) return;

    const index = frameData.traces.findIndex(t => t.id === traceId);
    if (index > -1) {
      const obj = frameData.objects.find(o => o.userData.traceId === traceId);
      if (obj) {
        sceneManager.removeObject(obj);
        const objIndex = frameData.objects.indexOf(obj);
        if (objIndex > -1) frameData.objects.splice(objIndex, 1);
      }
      frameData.traces.splice(index, 1);
      this.selectedTraceId = null;
      this.selectedObject = null;
      
      eventBus.emit(Events.FRAME_CHANGED, this.currentFrameId);
    }
  }

  updatePenPosition(point: THREE.Vector3): void {
    this.lightPen.position.copy(point);
    this.lightPen.visible = true;
  }

  startDrawing(point: THREE.Vector3): void {
    if (this.isEditMode) return;
    
    this.isDrawing = true;
    this.currentPoints = [point.clone()];
    
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(6);
    vertices[0] = point.x;
    vertices[1] = point.y;
    vertices[2] = point.z;
    vertices[3] = point.x;
    vertices[4] = point.y;
    vertices[5] = point.z;
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: this.currentColor,
      transparent: true,
      opacity: 0.8,
      linewidth: Math.max(1, this.currentThickness * 10)
    });
    
    this.currentLine = new THREE.LineSegments(geometry, material);
    this.currentLine.userData.dynamic = true;
    sceneManager.addObject(this.currentLine);
    
    eventBus.emit(Events.DRAW_START);
  }

  continueDrawing(point: THREE.Vector3): void {
    if (!this.currentLine || this.currentPoints.length === 0) return;

    const lastPoint = this.currentPoints[this.currentPoints.length - 1];
    const distance = lastPoint.distanceTo(point);
    
    if (distance > 0.02) {
      this.currentPoints.push(point.clone());
      
      const newPositions = new Float32Array(this.currentPoints.length * 2 * 3);
      
      for (let i = 0; i < this.currentPoints.length - 1; i++) {
        const p1 = this.currentPoints[i];
        const p2 = this.currentPoints[i + 1];
        const idx = i * 6;
        newPositions[idx] = p1.x;
        newPositions[idx + 1] = p1.y;
        newPositions[idx + 2] = p1.z;
        newPositions[idx + 3] = p2.x;
        newPositions[idx + 4] = p2.y;
        newPositions[idx + 5] = p2.z;
      }
      
      this.currentLine.geometry.dispose();
      this.currentLine.geometry = new THREE.BufferGeometry();
      this.currentLine.geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    }
  }

  stopDrawing(): LightTrace | null {
    if (!this.isDrawing) return null;
    
    this.isDrawing = false;
    
    if (this.currentPoints.length < 2) {
      if (this.currentLine) {
        sceneManager.removeObject(this.currentLine);
        this.currentLine = null;
      }
      this.currentPoints = [];
      eventBus.emit(Events.DRAW_END, null);
      return null;
    }

    const trace: LightTrace = {
      id: generateId(),
      points: this.currentPoints.map(p => ({ x: p.x, y: p.y, z: p.z })),
      color: this.currentColor,
      thickness: this.currentThickness,
      createdAt: Date.now()
    };

    if (this.currentLine) {
      sceneManager.removeObject(this.currentLine);
      this.currentLine = null;
    }

    this.addTraceToCurrentFrame(trace);
    this.currentPoints = [];
    
    eventBus.emit(Events.DRAW_END, trace);
    return trace;
  }

  private addTraceToCurrentFrame(trace: LightTrace): void {
    if (!this.currentFrameId) return;
    
    let frameData = this.frameTraces.get(this.currentFrameId);
    if (!frameData) {
      frameData = { traces: [], objects: [] };
      this.frameTraces.set(this.currentFrameId, frameData);
    }
    
    frameData.traces.push(trace);
    const traceObject = this.createTraceObject(trace);
    frameData.objects.push(traceObject);
    sceneManager.addObject(traceObject);
  }

  private createTraceObject(trace: LightTrace): THREE.Group {
    const group = new THREE.Group();
    group.userData.traceId = trace.id;
    group.userData.dynamic = true;

    const positions: number[] = [];
    for (let i = 0; i < trace.points.length - 1; i++) {
      const p1 = trace.points[i];
      const p2 = trace.points[i + 1];
      positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: trace.color,
      transparent: true,
      opacity: 0.8,
      linewidth: Math.max(1, trace.thickness * 10)
    });
    
    const line = new THREE.LineSegments(geometry, material);
    group.add(line);

    const dotGeometry = new THREE.BufferGeometry();
    const dotPositions: number[] = [];
    trace.points.forEach(p => dotPositions.push(p.x, p.y, p.z));
    dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    
    const dotMaterial = new THREE.PointsMaterial({
      color: trace.color,
      size: trace.thickness,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const dots = new THREE.Points(dotGeometry, dotMaterial);
    group.add(dots);

    return group;
  }

  cancelDrawing(): void {
    this.isDrawing = false;
    if (this.currentLine) {
      sceneManager.removeObject(this.currentLine);
      this.currentLine = null;
    }
    this.currentPoints = [];
  }

  loadFrame(frameId: string, traces: LightTrace[], animate: boolean = false, cumulative: boolean = false): void {
    if (!cumulative) {
      this.clearDisplayObjects();
    }

    this.currentFrameId = frameId;
    
    let frameData = this.frameTraces.get(frameId);
    if (!frameData) {
      frameData = { traces: [...traces], objects: [] };
      this.frameTraces.set(frameId, frameData);
    }

    traces.forEach(trace => {
      const traceObject = this.createTraceObject(trace);
      frameData!.objects.push(traceObject);
      this.displayObjects.push(traceObject);
      
      if (animate) {
        traceObject.traverse((child) => {
          if (child instanceof THREE.LineSegments || child instanceof THREE.Points) {
            (child.material as THREE.Material).opacity = 0;
          }
        });
        sceneManager.addObject(traceObject);
        this.animateTraceIn(traceObject);
      } else {
        sceneManager.addObject(traceObject);
      }
    });
  }

  private animateTraceIn(obj: THREE.Object3D): void {
    const duration = 500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutQuad(progress);
      
      obj.traverse((child) => {
        if (child instanceof THREE.LineSegments) {
          (child.material as THREE.LineBasicMaterial).opacity = eased * 0.8;
        } else if (child instanceof THREE.Points) {
          (child.material as THREE.PointsMaterial).opacity = eased * 0.6;
        }
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  clearDisplayObjects(): void {
    this.displayObjects.forEach(obj => {
      sceneManager.removeObject(obj);
    });
    this.displayObjects = [];
  }

  getCurrentFrameTraces(): LightTrace[] {
    if (!this.currentFrameId) return [];
    return this.frameTraces.get(this.currentFrameId)?.traces || [];
  }

  setCurrentFrameId(frameId: string): void {
    this.currentFrameId = frameId;
    if (!this.frameTraces.has(frameId)) {
      this.frameTraces.set(frameId, { traces: [], objects: [] });
    }
  }

  setColor(color: string): void {
    this.currentColor = color;
    if (this.lightPen) {
      (this.lightPen.material as THREE.MeshBasicMaterial).color.set(color);
      this.lightPen.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshBasicMaterial).color.set(color);
        }
      });
    }
  }

  setThickness(thickness: number): void {
    this.currentThickness = thickness;
  }

  enterEditMode(frameId: string): void {
    this.isEditMode = true;
    this.lightPen.visible = false;
    this.currentFrameId = frameId;
    
    const frameData = this.frameTraces.get(frameId);
    if (frameData) {
      frameData.objects.forEach(obj => {
        obj.traverse((child) => {
          if (child instanceof THREE.LineSegments) {
            (child.material as THREE.LineBasicMaterial).opacity = 0.5;
          }
        });
      });
    }
  }

  exitEditMode(): void {
    this.deselectTrace();
    this.isEditMode = false;
    this.lightPen.visible = true;
    
    this.frameTraces.forEach((frameData) => {
      frameData.objects.forEach(obj => {
        obj.traverse((child) => {
          if (child instanceof THREE.LineSegments) {
            (child.material as THREE.LineBasicMaterial).opacity = 0.8;
          }
        });
      });
    });
  }

  isInEditMode(): boolean {
    return this.isEditMode;
  }

  getSelectedTraceId(): string | null {
    return this.selectedTraceId;
  }

  getFrameData(frameId: string): LightTrace[] | undefined {
    return this.frameTraces.get(frameId)?.traces;
  }

  clearAll(): void {
    this.clearDisplayObjects();
    this.frameTraces.forEach((frameData) => {
      frameData.objects.forEach(obj => sceneManager.removeObject(obj));
    });
    this.frameTraces.clear();
    this.currentFrameId = null;
    this.selectedTraceId = null;
    this.selectedObject = null;
    this.isEditMode = false;
    this.currentPoints = [];
    this.isDrawing = false;
    if (this.currentLine) {
      sceneManager.removeObject(this.currentLine);
      this.currentLine = null;
    }
  }
}

export const drawEngine = new DrawEngine();
