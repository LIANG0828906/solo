import * as THREE from 'three';
import type { SceneManager } from '../core/SceneManager';
import type { GraphEngine } from '../core/GraphEngine';
import type { StarNode } from '../types';

const SELECTED_COLOR = new THREE.Color('#FFD700');
const BREATH_PERIOD = 3.0;
const PULSE_DURATION = 1.5;

export class PointRenderer {
  private sceneManager: SceneManager;
  private graph: GraphEngine;
  private container: THREE.Group;
  private nodeObjects: Map<string, { mesh: THREE.Mesh; halo: THREE.Mesh; pulse: THREE.Mesh | null }> = new Map();

  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private isDragging: boolean = false;
  private dragNodeId: string | null = null;
  private dragPlane: THREE.Plane;
  private dragOffset: THREE.Vector3 = new THREE.Vector3();
  private isShiftDown: boolean = false;
  private didDrag: boolean = false;
  private downPosition: { x: number; y: number } = { x: 0, y: 0 };

  private needRebuild: boolean = true;

  constructor(sceneManager: SceneManager, graph: GraphEngine) {
    this.sceneManager = sceneManager;
    this.graph = graph;
    this.container = new THREE.Group();
    this.sceneManager.addObject(this.container);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this.graph.onUpdate(() => {
      this.needRebuild = true;
    });

    this.sceneManager.onFrame(this.update.bind(this));
    this.bindEvents();
  }

  private bindEvents(): void {
    const canvas = this.sceneManager.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  public dispose(): void {
    const canvas = this.sceneManager.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') {
      this.isShiftDown = true;
    }
    if (e.key === 'Escape') {
      this.graph.deselectAll();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') {
      this.isShiftDown = false;
    }
  };

  private updatePointer(event: PointerEvent): void {
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private getIntersectedNode(): StarNode | null {
    const meshes: THREE.Mesh[] = [];
    this.nodeObjects.forEach((obj) => meshes.push(obj.mesh));
    this.raycaster.setFromCamera(this.pointer, this.sceneManager.camera);
    const intersects = this.raycaster.intersectObjects(meshes, false);
    if (intersects.length === 0) return null;
    const mesh = intersects[0].object as THREE.Mesh;
    const id = mesh.userData.nodeId as string;
    return this.graph.getNodeById(id) || null;
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    this.updatePointer(e);
    this.downPosition = { x: e.clientX, y: e.clientY };
    this.didDrag = false;

    const node = this.getIntersectedNode();
    if (!node) {
      if (!this.isShiftDown) {
        this.sceneManager.controls.enabled = true;
      }
      return;
    }

    if (this.isShiftDown) {
      this.graph.initiateConnect(node.id);
      this.sceneManager.controls.enabled = false;
      return;
    }

    this.sceneManager.controls.enabled = false;
    this.isDragging = true;
    this.dragNodeId = node.id;
    this.didDrag = false;
    this.graph.setNodeDragging(node.id, true);
    this.graph.selectNode(node.id);

    const groupInverse = new THREE.Matrix4().copy(this.container.matrixWorld).invert();
    const ray = this.raycaster.ray.clone();
    ray.origin.applyMatrix4(groupInverse);
    ray.direction.transformDirection(groupInverse);

    const worldPos = node.position.clone();
    const cameraDir = new THREE.Vector3();
    this.sceneManager.camera.getWorldDirection(cameraDir);
    const localCamDir = cameraDir.clone().transformDirection(groupInverse).normalize();

    this.dragPlane.setFromNormalAndCoplanarPoint(localCamDir, worldPos);

    const hitPoint = new THREE.Vector3();
    ray.intersectPlane(this.dragPlane, hitPoint);
    if (hitPoint) {
      this.dragOffset.copy(worldPos).sub(hitPoint);
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    this.updatePointer(e);
    if (this.isShiftDown) {
      this.sceneManager.controls.enabled = false;
    }
    if (!this.isDragging || !this.dragNodeId) return;

    const dx = e.clientX - this.downPosition.x;
    const dy = e.clientY - this.downPosition.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      this.didDrag = true;
    }

    const groupInverse = new THREE.Matrix4().copy(this.container.matrixWorld).invert();
    const ray = this.raycaster.ray.clone();
    ray.origin.applyMatrix4(groupInverse);
    ray.direction.transformDirection(groupInverse);

    const hitPoint = new THREE.Vector3();
    ray.intersectPlane(this.dragPlane, hitPoint);
    if (hitPoint) {
      const newPos = hitPoint.add(this.dragOffset);
      this.graph.updateNodePosition(this.dragNodeId, newPos);
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.button !== 0) return;

    if (this.isDragging && this.dragNodeId) {
      this.graph.setNodeDragging(this.dragNodeId, false);
      if (!this.didDrag) {
        this.graph.selectNode(this.dragNodeId);
      }
    }

    this.isDragging = false;
    this.dragNodeId = null;
    this.didDrag = false;

    if (!this.isShiftDown) {
      this.sceneManager.controls.enabled = true;
    }
  };

  public rebuild(): void {
    this.needRebuild = true;
  }

  private doRebuild(): void {
    while (this.container.children.length > 0) {
      const child = this.container.children[0] as THREE.Mesh;
      this.container.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const m = child.material as THREE.Material | THREE.Material[];
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
        else m.dispose();
      }
    }
    this.nodeObjects.clear();

    const glowIntensity = this.graph.config.glowIntensity;

    for (const node of this.graph.nodes.values()) {
      const baseRadius = node.baseScale;

      const geometry = new THREE.SphereGeometry(baseRadius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: node.baseColor,
        emissive: node.baseColor,
        emissiveIntensity: 0.5 * glowIntensity,
        metalness: 0.3,
        roughness: 0.4,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(node.position);
      mesh.userData.nodeId = node.id;

      const haloGeometry = new THREE.SphereGeometry(baseRadius * 1.8, 32, 32);
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: node.baseColor,
        transparent: true,
        opacity: 0.15 * glowIntensity,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const halo = new THREE.Mesh(haloGeometry, haloMaterial);
      halo.position.copy(node.position);

      this.container.add(mesh);
      this.container.add(halo);
      this.nodeObjects.set(node.id, { mesh, halo, pulse: null });
    }
    this.needRebuild = false;
  }

  private spawnPulse(nodeId: string): void {
    const node = this.graph.getNodeById(nodeId);
    if (!node) return;
    const entry = this.nodeObjects.get(nodeId);
    if (!entry) return;

    const pulseGeometry = new THREE.RingGeometry(0.3, 0.35, 64);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: SELECTED_COLOR,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.copy(node.position);
    this.container.add(pulse);
    entry.pulse = pulse;
  }

  private update(time: number, _delta: number): void {
    if (this.needRebuild) {
      this.doRebuild();
    }

    const glowIntensity = this.graph.config.glowIntensity;

    for (const node of this.graph.nodes.values()) {
      const entry = this.nodeObjects.get(node.id);
      if (!entry) continue;

      const breath = 0.5 + 0.5 * Math.sin((time / BREATH_PERIOD) * Math.PI * 2 + node.breathSeed);
      const breathScale = 1.0 + 0.1 * breath;

      let scale: number;
      let color: THREE.Color;
      let emissiveIntensity: number;
      let opacity: number;

      if (node.isSelected || node.isDragging) {
        scale = 0.4 / node.baseScale * breathScale;
        color = SELECTED_COLOR;
        emissiveIntensity = 1.2 * glowIntensity;
        opacity = 1;
      } else {
        scale = breathScale;
        color = node.baseColor;
        emissiveIntensity = (0.3 + 0.4 * breath) * glowIntensity;
        opacity = 0.85 + 0.15 * breath;
      }

      entry.mesh.position.copy(node.position);
      entry.mesh.scale.setScalar(scale);
      const meshMat = entry.mesh.material as THREE.MeshStandardMaterial;
      meshMat.color.copy(color);
      meshMat.emissive.copy(color);
      meshMat.emissiveIntensity = emissiveIntensity;
      meshMat.opacity = opacity;

      entry.halo.position.copy(node.position);
      entry.halo.scale.setScalar(scale * 1.5);
      const haloMat = entry.halo.material as THREE.MeshBasicMaterial;
      haloMat.color.copy(color);
      haloMat.opacity = (node.isSelected ? 0.4 : 0.15) * glowIntensity * (0.7 + 0.3 * breath);

      if ((node.isSelected || node.isDragging) && !entry.pulse) {
        this.spawnPulse(node.id);
      }
    }

    for (const [nodeId, entry] of this.nodeObjects) {
      const node = this.graph.getNodeById(nodeId);
      if (!node || !entry.pulse) continue;
      const pulse = entry.pulse;
      const pulseMat = pulse.material as THREE.MeshBasicMaterial;

      node.pulsePhase += 1 / (60 * PULSE_DURATION);
      if (node.pulsePhase >= 1) {
        node.pulsePhase = 0;
        if (!node.isSelected && !node.isDragging) {
          this.container.remove(pulse);
          pulse.geometry.dispose();
          pulseMat.dispose();
          entry.pulse = null;
          continue;
        }
      }

      const t = node.pulsePhase;
      const ringScale = 0.5 + t * 4.5;
      pulse.scale.setScalar(ringScale);
      pulseMat.opacity = Math.max(0, 0.9 * (1 - t));

      const cameraDir = new THREE.Vector3();
      this.sceneManager.camera.getWorldDirection(cameraDir);
      pulse.lookAt(pulse.position.clone().add(cameraDir));
    }
  }
}
