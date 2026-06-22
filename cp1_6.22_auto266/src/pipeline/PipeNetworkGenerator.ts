import * as THREE from 'three';
import { Pipeline, PipelineNode, PipelineSegment } from '../data/mockData';

export interface NetworkObject {
  id: string;
  type: 'node' | 'segment';
  mesh: THREE.Mesh;
  data: PipelineNode | PipelineSegment;
  pipelineType: string;
  pipelineId: string;
  originalColor: THREE.Color;
}

export interface GeneratedNetwork {
  objects: NetworkObject[];
  nodeMap: Map<string, NetworkObject>;
  segmentMap: Map<string, NetworkObject>;
}

const nodeGeometryCache = new Map<number, THREE.SphereGeometry>();
const tubeGeometryCache = new Map<string, THREE.TubeGeometry>();

function getNodeGeometry(radius: number): THREE.SphereGeometry {
  const key = Math.round(radius * 1000);
  if (!nodeGeometryCache.has(key)) {
    const geo = new THREE.SphereGeometry(radius, 24, 24);
    nodeGeometryCache.set(key, geo);
  }
  return nodeGeometryCache.get(key)!;
}

function getTubeGeometry(points: THREE.Vector3[], radius: number): THREE.TubeGeometry {
  const key = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`).join('|') + `|r${radius}`;
  if (!tubeGeometryCache.has(key)) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, Math.max(20, points.length * 8), radius, 12, false);
    tubeGeometryCache.set(key, geo);
  }
  return tubeGeometryCache.get(key)!;
}

export class PipeNetworkGenerator {
  private nodeMap: Map<string, NetworkObject> = new Map();
  private segmentMap: Map<string, NetworkObject> = new Map();
  private objects: NetworkObject[] = [];

  generateNetwork(pipelines: Pipeline[]): GeneratedNetwork {
    this.clear();

    for (const pipeline of pipelines) {
      const color = new THREE.Color(pipeline.color);

      for (const node of pipeline.nodes) {
        const geometry = getNodeGeometry(0.3);
        const material = new THREE.MeshPhongMaterial({
          color: color,
          emissive: color.clone().multiplyScalar(0.2),
          shininess: 80,
          transparent: true,
          opacity: 1,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(node.x, node.y, node.z);
        mesh.userData = { id: node.id, type: 'node', pipelineType: pipeline.type, pipelineId: pipeline.id };

        const netObj: NetworkObject = {
          id: node.id,
          type: 'node',
          mesh,
          data: node,
          pipelineType: pipeline.type,
          pipelineId: pipeline.id,
          originalColor: color.clone(),
        };
        this.nodeMap.set(node.id, netObj);
        this.objects.push(netObj);
      }

      for (const segment of pipeline.segments) {
        const fromNode = pipeline.nodes.find((n) => n.id === segment.fromNode);
        const toNode = pipeline.nodes.find((n) => n.id === segment.toNode);
        if (!fromNode || !toNode) continue;

        const midPoint = new THREE.Vector3(
          (fromNode.x + toNode.x) / 2,
          (fromNode.y + toNode.y) / 2 + 0.3,
          (fromNode.z + toNode.z) / 2,
        );

        const points = [
          new THREE.Vector3(fromNode.x, fromNode.y, fromNode.z),
          midPoint,
          new THREE.Vector3(toNode.x, toNode.y, toNode.z),
        ];

        const radius = Math.max(0.08, segment.diameter * 0.5);
        const geometry = getTubeGeometry(points, radius);
        const material = new THREE.MeshPhongMaterial({
          color: color,
          emissive: color.clone().multiplyScalar(0.15),
          shininess: 60,
          transparent: true,
          opacity: 1,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { id: segment.id, type: 'segment', pipelineType: pipeline.type, pipelineId: pipeline.id, isAbnormal: segment.isAbnormal };

        const netObj: NetworkObject = {
          id: segment.id,
          type: 'segment',
          mesh,
          data: segment,
          pipelineType: pipeline.type,
          pipelineId: pipeline.id,
          originalColor: color.clone(),
        };
        this.segmentMap.set(segment.id, netObj);
        this.objects.push(netObj);
      }
    }

    return {
      objects: this.objects,
      nodeMap: this.nodeMap,
      segmentMap: this.segmentMap,
    };
  }

  clear(): void {
    this.objects = [];
    this.nodeMap.clear();
    this.segmentMap.clear();
  }

  setVisibility(pipelineType: string, visible: boolean): void {
    for (const obj of this.objects) {
      if (obj.pipelineType === pipelineType) {
        obj.mesh.visible = visible;
      }
    }
  }

  setOpacity(opacity: number): void {
    for (const obj of this.objects) {
      const material = obj.mesh.material as THREE.MeshPhongMaterial;
      if (material.opacity !== opacity) {
        material.opacity = opacity;
        material.transparent = opacity < 1;
      }
    }
  }

  highlightObject(id: string, highlight: boolean): void {
    const obj = this.nodeMap.get(id) || this.segmentMap.get(id);
    if (!obj) return;

    const material = obj.mesh.material as THREE.MeshPhongMaterial;
    if (highlight) {
      const brightColor = obj.originalColor.clone().multiplyScalar(1.5);
      material.color.copy(brightColor);
      material.emissive.copy(brightColor.clone().multiplyScalar(0.4));
      obj.mesh.scale.setScalar(1.05);
    } else {
      material.color.copy(obj.originalColor);
      material.emissive.copy(obj.originalColor.clone().multiplyScalar(0.2));
      obj.mesh.scale.setScalar(1);
    }
  }

  getObjectsForRaycasting(): THREE.Object3D[] {
    return this.objects.map((o) => o.mesh);
  }

  getNetworkObject(mesh: THREE.Object3D): NetworkObject | undefined {
    return this.objects.find((o) => o.mesh === mesh);
  }
}
