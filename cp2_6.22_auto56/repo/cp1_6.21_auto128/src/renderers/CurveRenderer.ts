import * as THREE from 'three';
import type { SceneManager } from '../core/SceneManager';
import type { GraphEngine } from '../core/GraphEngine';
import type { StarEdge, StarNode } from '../types';

const CURVE_FLOW_PERIOD = 4.0;
const SWING_PERIOD = 2.0;
const COLOR_START = new THREE.Color('#8B5CF6');
const COLOR_END = new THREE.Color('#EC4899');
const SUB_POINT_RADIUS = 0.05;
const TUBE_RADIUS = 0.04;
const TUBE_TUBULAR_SEGMENTS = 80;
const TUBE_RADIAL_SEGMENTS = 8;

export class CurveRenderer {
  private sceneManager: SceneManager;
  private graph: GraphEngine;
  private container: THREE.Group;

  private edgeMeshes: Map<string, { tube: THREE.Mesh; glowTube: THREE.Mesh; flowLine: THREE.Line }> = new Map();
  private subPointMeshes: Map<string, THREE.Mesh[]> = new Map();

  private needRebuild: boolean = true;

  private _tmpVec1 = new THREE.Vector3();
  private _tmpVec2 = new THREE.Vector3();
  private _tmpVec3 = new THREE.Vector3();

  constructor(sceneManager: SceneManager, graph: GraphEngine) {
    this.sceneManager = sceneManager;
    this.graph = graph;
    this.container = new THREE.Group();
    this.sceneManager.addObject(this.container);

    this.graph.onUpdate(() => {
      this.needRebuild = true;
      this.updateClosedLoopState();
    });

    this.sceneManager.onFrame(this.update.bind(this));
  }

  private updateClosedLoopState(): void {
    this.sceneManager.setHasClosedLoop(this.graph.hasAnyFace());
  }

  public rebuild(): void {
    this.needRebuild = true;
  }

  private clearAll(): void {
    while (this.container.children.length > 0) {
      const child = this.container.children[0];
      this.container.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
      const mat = (child as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (mat) {
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    }
    this.edgeMeshes.clear();
    this.subPointMeshes.clear();
  }

  private doRebuild(): void {
    this.clearAll();
    const glowIntensity = this.graph.config.glowIntensity;

    for (const edge of this.graph.edges.values()) {
      this.buildEdgeMeshes(edge, glowIntensity);
    }
    this.needRebuild = false;
  }

  private buildEdgeMeshes(edge: StarEdge, glowIntensity: number): void {
    const curve = edge.curve;

    const tubeGeometry = new THREE.TubeGeometry(curve, TUBE_TUBULAR_SEGMENTS, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS, false);
    const tubeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColorStart: { value: COLOR_START.clone() },
        uColorEnd: { value: COLOR_END.clone() },
        uGlow: { value: glowIntensity },
        uTime: { value: 0 },
        uFlowPhase: { value: edge.flowPhase },
        uFlowSpeed: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColorStart;
        uniform vec3 uColorEnd;
        uniform float uGlow;
        uniform float uTime;
        uniform float uFlowPhase;
        uniform float uFlowSpeed;

        void main() {
          vec3 baseColor = mix(uColorStart, uColorEnd, vUv.x);
          float flow = fract(vUv.x - uTime * 0.25 * uFlowSpeed + uFlowPhase);
          float stripe = smoothstep(0.0, 0.15, flow) * smoothstep(0.35, 0.2, flow);
          stripe += smoothstep(0.5, 0.65, flow) * smoothstep(0.85, 0.7, flow);
          float glowAmount = 0.6 + 1.6 * stripe;
          vec3 finalColor = baseColor * glowAmount;
          float alpha = 0.7 * uGlow + 0.3 * stripe;
          gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);

    const glowTubeGeometry = new THREE.TubeGeometry(curve, TUBE_TUBULAR_SEGMENTS, TUBE_RADIUS * 3, TUBE_RADIAL_SEGMENTS, false);
    const glowTubeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColorStart: { value: COLOR_START.clone() },
        uColorEnd: { value: COLOR_END.clone() },
        uGlow: { value: glowIntensity },
        uTime: { value: 0 },
        uFlowPhase: { value: edge.flowPhase },
        uFlowSpeed: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColorStart;
        uniform vec3 uColorEnd;
        uniform float uGlow;
        uniform float uTime;
        uniform float uFlowPhase;
        uniform float uFlowSpeed;

        void main() {
          vec3 baseColor = mix(uColorStart, uColorEnd, vUv.x);
          float radial = 1.0 - 2.0 * abs(vUv.y - 0.5);
          float radialFade = pow(radial, 2.0);
          float flow = fract(vUv.x - uTime * 0.25 * uFlowSpeed + uFlowPhase);
          float stripe = smoothstep(0.0, 0.2, flow) * smoothstep(0.4, 0.2, flow);
          stripe += smoothstep(0.5, 0.7, flow) * smoothstep(0.9, 0.7, flow);
          float intensity = 0.3 * radialFade + 0.8 * stripe * radialFade;
          gl_FragColor = vec4(baseColor * intensity, intensity * 0.6 * uGlow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const glowTube = new THREE.Mesh(glowTubeGeometry, glowTubeMaterial);

    const flowPts = curve.getPoints(200);
    const flowGeometry = new THREE.BufferGeometry().setFromPoints(flowPts);
    const flowMaterial = new THREE.LineBasicMaterial({
      color: COLOR_END,
      transparent: true,
      opacity: 0.4 * glowIntensity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flowLine = new THREE.Line(flowGeometry, flowMaterial);

    this.container.add(tube);
    this.container.add(glowTube);
    this.container.add(flowLine);
    this.edgeMeshes.set(edge.id, { tube, glowTube, flowLine });

    const subMeshes: THREE.Mesh[] = [];
    const subCount = edge.subPoints.length;
    for (let i = 0; i < subCount; i++) {
      const sub = edge.subPoints[i];
      const t = sub.offset;
      const subColor = COLOR_START.clone().lerp(COLOR_END, t);
      const subGeometry = new THREE.SphereGeometry(SUB_POINT_RADIUS, 16, 16);
      const subMaterial = new THREE.MeshBasicMaterial({
        color: subColor,
        transparent: true,
        opacity: 0.9 * glowIntensity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(subGeometry, subMaterial);
      mesh.userData.index = i;
      this.container.add(mesh);
      subMeshes.push(mesh);
    }
    this.subPointMeshes.set(edge.id, subMeshes);
  }

  private rebuildEdge(edgeId: string): void {
    const entry = this.edgeMeshes.get(edgeId);
    const subEntry = this.subPointMeshes.get(edgeId);
    if (entry) {
      for (const obj of [entry.tube, entry.glowTube, entry.flowLine]) {
        this.container.remove(obj);
        obj.geometry.dispose();
        const mat = obj.material as THREE.Material;
        if (mat) mat.dispose();
      }
      this.edgeMeshes.delete(edgeId);
    }
    if (subEntry) {
      for (const mesh of subEntry) {
        this.container.remove(mesh);
        mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material;
        if (mat) mat.dispose();
      }
      this.subPointMeshes.delete(edgeId);
    }
    const edge = this.graph.edges.get(edgeId);
    if (edge) {
      this.buildEdgeMeshes(edge, this.graph.config.glowIntensity);
    }
  }

  private syncEdges(): void {
    const currentEdgeIds = new Set(this.graph.edges.keys());
    const existingEdgeIds = new Set(this.edgeMeshes.keys());

    for (const id of existingEdgeIds) {
      if (!currentEdgeIds.has(id)) {
        const entry = this.edgeMeshes.get(id)!;
        for (const obj of [entry.tube, entry.glowTube, entry.flowLine]) {
          this.container.remove(obj);
          obj.geometry.dispose();
          const mat = obj.material as THREE.Material;
          if (mat) mat.dispose();
        }
        this.edgeMeshes.delete(id);
        const subEntry = this.subPointMeshes.get(id);
        if (subEntry) {
          for (const mesh of subEntry) {
            this.container.remove(mesh);
            mesh.geometry.dispose();
            const mat = mesh.material as THREE.Material;
            if (mat) mat.dispose();
          }
          this.subPointMeshes.delete(id);
        }
      }
    }

    let needRecheckEdges = false;
    for (const [id, edge] of this.graph.edges) {
      if (!existingEdgeIds.has(id)) {
        this.buildEdgeMeshes(edge, this.graph.config.glowIntensity);
      } else {
        const fromNode = this.graph.nodes.get(edge.from) as StarNode;
        const toNode = this.graph.nodes.get(edge.to) as StarNode;
        if (fromNode && toNode) {
          const startDist = edge.curve.getPointAt(0).distanceTo(fromNode.position);
          const endDist = edge.curve.getPointAt(1).distanceTo(toNode.position);
          if (startDist > 0.01 || endDist > 0.01) {
            needRecheckEdges = true;
            this.rebuildEdge(id);
          }
        }
      }
    }
  }

  private update(time: number, _delta: number): void {
    if (this.needRebuild) {
      this.doRebuild();
    } else {
      this.syncEdges();
    }

    const glowIntensity = this.graph.config.glowIntensity;
    const subAmplitude = this.graph.config.subPointAmplitude;
    const hasLoop = this.graph.hasAnyFace();
    const flowSpeedMul = hasLoop ? 2.0 : 1.0;

    for (const [edgeId, edge] of this.graph.edges) {
      const entry = this.edgeMeshes.get(edgeId);
      const subMeshes = this.subPointMeshes.get(edgeId);
      if (!entry) continue;

      const tubeMat = entry.tube.material as THREE.ShaderMaterial;
      const glowMat = entry.glowTube.material as THREE.ShaderMaterial;
      tubeMat.uniforms.uTime.value = time;
      tubeMat.uniforms.uGlow.value = glowIntensity;
      tubeMat.uniforms.uFlowSpeed.value = flowSpeedMul;
      glowMat.uniforms.uTime.value = time;
      glowMat.uniforms.uGlow.value = glowIntensity;
      glowMat.uniforms.uFlowSpeed.value = flowSpeedMul;

      if (subMeshes) {
        for (let i = 0; i < subMeshes.length; i++) {
          const mesh = subMeshes[i];
          const sub = edge.subPoints[i];
          if (!sub) continue;

          const basePoint = edge.curve.getPointAt(sub.offset);
          const tangent = edge.curve.getTangentAt(sub.offset).normalize();

          let normal: THREE.Vector3;
          const up = this._tmpVec3.set(0, 1, 0);
          const cross = this._tmpVec2.copy(tangent).cross(up);
          if (cross.lengthSq() < 0.001) {
            up.set(1, 0, 0);
            cross.copy(tangent).cross(up);
          }
          normal = cross.normalize();

          const binormal = this._tmpVec3.copy(tangent).cross(normal).normalize();

          const swingPhase = (time / SWING_PERIOD) * Math.PI * 2 + sub.phase;
          const swing = Math.sin(swingPhase) * subAmplitude;
          const swing2 = Math.cos(swingPhase * 1.3) * subAmplitude * 0.3;

          const finalPos = basePoint.clone()
            .add(normal.multiplyScalar(swing))
            .add(binormal.multiplyScalar(swing2));

          mesh.position.copy(finalPos);
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.9 * glowIntensity * (0.6 + 0.4 * Math.abs(Math.sin(swingPhase)));
        }
      }
    }
  }
}
