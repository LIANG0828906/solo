import * as THREE from 'three';
import { eventBus, EVENTS } from '../utils/EventBus';
import { ForceLink } from '../physics/ForceSimulator';
import { NodeData } from './NodeManager';

export interface LinkData extends ForceLink {
  curve: THREE.QuadraticBezierCurve3;
  line: THREE.Line;
  tension: number;
  vibrationOffset: number;
  vibrationStartTime: number | null;
  midOffset: number;
  currentColor: THREE.Color;
  targetColor: THREE.Color;
  isRemoving?: boolean;
}

const COLOR_HOT = new THREE.Color(0xFF6B35);
const COLOR_WARM = new THREE.Color(0xFFD166);
const COLOR_COOL = new THREE.Color(0x4ECDC4);

export class LinkManager {
  links: Map<string, LinkData> = new Map();
  private scene: THREE.Scene;
  private nodes: Map<string, NodeData>;
  private averageDistance: number = 5;
  private lineMaterial: THREE.LineBasicMaterial;

  constructor(scene: THREE.Scene, nodes: Map<string, NodeData>) {
    this.scene = scene;
    this.nodes = nodes;

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: COLOR_COOL,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
    });

    eventBus.on(EVENTS.LINK_REMOVE, (id: string) => {
      this.removeLink(id, true);
    });

    eventBus.on(EVENTS.NODE_REMOVE, (nodeId: string) => {
      this.removeLinksForNode(nodeId, true);
    });
  }

  addLink(sourceId: string, targetId: string): LinkData | null {
    if (sourceId === targetId) return null;
    if (this.linkExists(sourceId, targetId)) return null;

    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);

    if (!source || !target) return null;

    const id = this.generateId();
    const midOffset = 5 + Math.random() * 10;

    const curve = this.createBezierCurve(source.position, target.position, midOffset);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = this.lineMaterial.clone();
    const line = new THREE.Line(geometry, material);
    line.userData.linkId = id;

    this.scene.add(line);

    const distance = source.position.distanceTo(target.position);
    const link: LinkData = {
      id,
      sourceId,
      targetId,
      restLength: Math.max(distance, 3),
      curve,
      line,
      tension: 0,
      vibrationOffset: 0,
      vibrationStartTime: null,
      midOffset,
      currentColor: COLOR_COOL.clone(),
      targetColor: COLOR_COOL.clone(),
    };

    this.links.set(id, link);
    eventBus.emit(EVENTS.LINK_ADD, link);

    this.animateLinkIn(link);

    return link;
  }

  removeLink(id: string, animate: boolean = false): void {
    const link = this.links.get(id);
    if (!link) return;

    if (animate) {
      link.isRemoving = true;
      this.animateLinkOut(link, () => {
        this.cleanupLink(link);
      });
    } else {
      this.cleanupLink(link);
    }
  }

  removeLinksForNode(nodeId: string, animate: boolean = false): string[] {
    const removedLinkIds: string[] = [];

    this.links.forEach((link, id) => {
      if (link.sourceId === nodeId || link.targetId === nodeId) {
        removedLinkIds.push(id);
        this.removeLink(id, animate);
      }
    });

    return removedLinkIds;
  }

  private cleanupLink(link: LinkData): void {
    this.scene.remove(link.line);
    link.line.geometry.dispose();
    (link.line.material as THREE.Material).dispose();
    this.links.delete(link.id);
  }

  updateCurves(): void {
    this.links.forEach(link => {
      const source = this.nodes.get(link.sourceId);
      const target = this.nodes.get(link.targetId);

      if (!source || !target) return;

      let vibrationOffset = 0;
      if (link.vibrationStartTime !== null) {
        const elapsed = (performance.now() - link.vibrationStartTime) / 1000;
        if (elapsed < 0.1) {
          const amplitude = 0.05;
          vibrationOffset = amplitude * Math.sin(elapsed * Math.PI * 20) * Math.exp(-elapsed * 10);
        } else {
          link.vibrationStartTime = null;
        }
      }

      link.curve = this.createBezierCurve(
        source.position,
        target.position,
        link.midOffset + vibrationOffset * 20
      );

      const points = link.curve.getPoints(50);
      const positions = new Float32Array(points.length * 3);

      points.forEach((point, i) => {
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      });

      link.line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      link.line.geometry.attributes.position.needsUpdate = true;
    });
  }

  updateTensionColors(averageDistance: number): void {
    this.averageDistance = averageDistance;

    this.links.forEach(link => {
      const source = this.nodes.get(link.sourceId);
      const target = this.nodes.get(link.targetId);

      if (!source || !target) return;

      const distance = source.position.distanceTo(target.position);
      const ratio = distance / averageDistance;

      link.tension = Math.abs(ratio - 1);

      let newColor: THREE.Color;
      if (ratio < 0.4) {
        newColor = COLOR_HOT;
      } else if (ratio < 0.7) {
        const t = (ratio - 0.4) / 0.3;
        newColor = COLOR_HOT.clone().lerp(COLOR_WARM, t);
      } else {
        const t = Math.min((ratio - 0.7) / 0.3, 1);
        newColor = COLOR_WARM.clone().lerp(COLOR_COOL, t);
      }

      link.targetColor.copy(newColor);
      link.currentColor.lerp(link.targetColor, 0.1);

      const material = link.line.material as THREE.LineBasicMaterial;
      material.color.copy(link.currentColor);

      const tensionThreshold = 0.5;
      if (link.tension > tensionThreshold && link.vibrationStartTime === null) {
        this.triggerVibration(link.id);
      }
    });
  }

  triggerVibration(linkId: string): void {
    const link = this.links.get(linkId);
    if (!link) return;
    link.vibrationStartTime = performance.now();
  }

  getLinks(): ForceLink[] {
    const links: ForceLink[] = [];
    this.links.forEach(link => {
      if (!link.isRemoving) {
        links.push({
          id: link.id,
          sourceId: link.sourceId,
          targetId: link.targetId,
          restLength: link.restLength,
        });
      }
    });
    return links;
  }

  getConnectionCount(nodeId: string): number {
    let count = 0;
    this.links.forEach(link => {
      if ((link.sourceId === nodeId || link.targetId === nodeId) && !link.isRemoving) {
        count++;
      }
    });
    return count;
  }

  private linkExists(sourceId: string, targetId: string): boolean {
    for (const link of this.links.values()) {
      if (
        (link.sourceId === sourceId && link.targetId === targetId) ||
        (link.sourceId === targetId && link.targetId === sourceId)
      ) {
        return true;
      }
    }
    return false;
  }

  private createBezierCurve(
    start: THREE.Vector3,
    end: THREE.Vector3,
    offsetAmount: number
  ): THREE.QuadraticBezierCurve3 {
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    let perpendicular = new THREE.Vector3().crossVectors(direction, up).normalize();

    if (perpendicular.length() < 0.1) {
      perpendicular.set(1, 0, 0);
    }

    const randomDir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize();

    const controlPoint = mid.clone().add(
      randomDir.multiplyScalar(offsetAmount * 0.1)
    );

    return new THREE.QuadraticBezierCurve3(
      start.clone(),
      controlPoint,
      end.clone()
    );
  }

  private generateId(): string {
    return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private animateLinkIn(link: LinkData): void {
    const startTime = performance.now();
    const duration = 300;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const material = link.line.material as THREE.LineBasicMaterial;
      material.opacity = progress * 0.9;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private animateLinkOut(link: LinkData, callback: () => void): void {
    const startTime = performance.now();
    const duration = 300;
    const startOpacity = (link.line.material as THREE.LineBasicMaterial).opacity;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const material = link.line.material as THREE.LineBasicMaterial;
      material.opacity = startOpacity * (1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        callback();
      }
    };

    animate();
  }

  update(dt: number, time: number): void {
    this.updateCurves();
  }

  clearAll(): void {
    this.links.forEach(link => {
      this.scene.remove(link.line);
      link.line.geometry.dispose();
      (link.line.material as THREE.Material).dispose();
    });
    this.links.clear();
  }

  getLinkById(id: string): LinkData | undefined {
    return this.links.get(id);
  }

  getAllLinks(): Map<string, LinkData> {
    return this.links;
  }
}
