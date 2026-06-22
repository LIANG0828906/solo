import * as THREE from 'three';
import { NetworkObject } from '../pipeline/PipeNetworkGenerator';
import { PipelineNode, PipelineSegment, getNodeById, getSegmentById, PIPELINE_TYPE_NAMES } from '../data/mockData';

export interface IntersectionResult {
  id: string;
  type: 'node' | 'segment';
  properties: Record<string, string | number | boolean>;
}

export interface PropertyDict {
  [key: string]: string | number | boolean;
}

export class PipeInteractionManager {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private objects: THREE.Object3D[] = [];
  private hoveredId: string | null = null;
  private selectedId: string | null = null;
  private onHoverChange: ((id: string | null) => void) | null = null;
  private onSelectChange: ((id: string | null) => void) | null = null;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 100;
    this.mouse = new THREE.Vector2();
  }

  setObjects(objects: THREE.Object3D[]): void {
    this.objects = objects;
  }

  setOnHoverChange(callback: (id: string | null) => void): void {
    this.onHoverChange = callback;
  }

  setOnSelectChange(callback: (id: string | null) => void): void {
    this.onSelectChange = callback;
  }

  updateMouse(clientX: number, clientY: number, domElement: HTMLElement): void {
    const rect = domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  detectHover(camera: THREE.Camera): string | null {
    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(this.objects, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      const id = mesh.userData.id;
      if (id && id !== this.hoveredId) {
        this.hoveredId = id;
        if (this.onHoverChange) this.onHoverChange(id);
      }
      return id;
    } else {
      if (this.hoveredId !== null) {
        this.hoveredId = null;
        if (this.onHoverChange) this.onHoverChange(null);
      }
      return null;
    }
  }

  detectClick(camera: THREE.Camera): string | null {
    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(this.objects, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      const id = mesh.userData.id;
      this.selectedId = id;
      if (this.onSelectChange) this.onSelectChange(id);
      return id;
    } else {
      this.selectedId = null;
      if (this.onSelectChange) this.onSelectChange(null);
      return null;
    }
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  getHoveredId(): string | null {
    return this.hoveredId;
  }

  getIntersectedObject(
    camera: THREE.Camera,
    networkObjects: Map<string, NetworkObject>,
  ): IntersectionResult | null {
    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(this.objects, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      const userData = mesh.userData;
      const id = userData.id;
      const type = userData.type;

      const properties = this.buildProperties(id, type, networkObjects);
      return { id, type, properties };
    }
    return null;
  }

  private buildProperties(
    id: string,
    type: 'node' | 'segment',
    networkObjects: Map<string, NetworkObject>,
  ): PropertyDict {
    const props: PropertyDict = {};

    if (type === 'node') {
      const node = getNodeById(id);
      const netObj = networkObjects.get(id);
      if (node) {
        props['名称'] = node.name;
        props['类型'] = PIPELINE_TYPE_NAMES[netObj?.pipelineType || ''] || '';
        props['埋深'] = `${node.depth} 米`;
        props['坐标'] = `(${node.x.toFixed(1)}, ${node.y.toFixed(1)}, ${node.z.toFixed(1)})`;
      }
    } else if (type === 'segment') {
      const result = getSegmentById(id);
      const netObj = networkObjects.get(id);
      if (result) {
        const { segment, pipeline } = result;
        props['名称'] = `管段 ${segment.id}`;
        props['类型'] = PIPELINE_TYPE_NAMES[netObj?.pipelineType || ''] || pipeline.type;
        props['管径'] = `${(segment.diameter * 100).toFixed(0)} mm`;
        props['材质'] = segment.material;
        props['状态'] = segment.status;
        props['异常'] = segment.isAbnormal;
      }
    }

    return props;
  }

  getObjectProperties(id: string, type: 'node' | 'segment', networkObjects: Map<string, NetworkObject>): PropertyDict {
    return this.buildProperties(id, type, networkObjects);
  }

  clearSelection(): void {
    this.selectedId = null;
    if (this.onSelectChange) this.onSelectChange(null);
  }
}
