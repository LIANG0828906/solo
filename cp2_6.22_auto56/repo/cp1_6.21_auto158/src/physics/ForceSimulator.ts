import * as THREE from 'three';
import { eventBus, EVENTS } from '../utils/EventBus';

export interface ForceNode {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

export interface ForceLink {
  id: string;
  sourceId: string;
  targetId: string;
  restLength: number;
}

export class ForceSimulator {
  isRunning: boolean = true;
  springStrength: number = 0.02;
  repulsionStrength: number = 8.0;
  centerStrength: number = 0.005;
  damping: number = 0.96;
  maxVelocity: number = 2.0;
  private averageDistance: number = 5.0;

  constructor() {
    eventBus.on(EVENTS.SIMULATION_TOGGLE, (running: boolean) => {
      this.isRunning = running;
    });

    eventBus.on(EVENTS.SIMULATION_RESET, () => {
      // Reset handled by main
    });
  }

  toggle(): boolean {
    this.isRunning = !this.isRunning;
    eventBus.emit(EVENTS.SIMULATION_TOGGLE, this.isRunning);
    return this.isRunning;
  }

  step(
    dt: number,
    nodes: Map<string, ForceNode>,
    links: ForceLink[]
  ): void {
    if (!this.isRunning || nodes.size === 0) return;

    const nodeArray = Array.from(nodes.values());
    const forces: Map<string, THREE.Vector3> = new Map();

    nodeArray.forEach(node => {
      forces.set(node.id, new THREE.Vector3());
    });

    this.applySpringForces(links, nodes, forces);
    this.applyRepulsionForces(nodeArray, forces);
    this.applyCenterForce(nodeArray, forces);

    nodeArray.forEach(node => {
      const force = forces.get(node.id)!;
      node.velocity.add(force.multiplyScalar(dt * 60));
      node.velocity.multiplyScalar(this.damping);

      const speed = node.velocity.length();
      if (speed > this.maxVelocity) {
        node.velocity.normalize().multiplyScalar(this.maxVelocity);
      }

      node.position.add(node.velocity.clone().multiplyScalar(dt * 60));
    });

    this.updateAverageDistance(nodeArray);
  }

  private applySpringForces(
    links: ForceLink[],
    nodes: Map<string, ForceNode>,
    forces: Map<string, THREE.Vector3>
  ): void {
    const tmp = new THREE.Vector3();

    links.forEach(link => {
      const source = nodes.get(link.sourceId);
      const target = nodes.get(link.targetId);

      if (!source || !target) return;

      tmp.subVectors(target.position, source.position);
      const distance = tmp.length();

      if (distance === 0) return;

      const displacement = distance - link.restLength;
      const forceMagnitude = this.springStrength * displacement;

      tmp.normalize().multiplyScalar(forceMagnitude);

      forces.get(source.id)!.add(tmp);
      forces.get(target.id)!.sub(tmp);
    });
  }

  private applyRepulsionForces(
    nodes: ForceNode[],
    forces: Map<string, THREE.Vector3>
  ): void {
    const tmp = new THREE.Vector3();
    const minDistance = 1.0;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        tmp.subVectors(a.position, b.position);
        let distance = tmp.length();

        if (distance < minDistance) {
          distance = minDistance;
        }

        const forceMagnitude = this.repulsionStrength / (distance * distance);
        tmp.normalize().multiplyScalar(forceMagnitude);

        forces.get(a.id)!.add(tmp);
        forces.get(b.id)!.sub(tmp);
      }
    }
  }

  private applyCenterForce(
    nodes: ForceNode[],
    forces: Map<string, THREE.Vector3>
  ): void {
    const center = new THREE.Vector3();

    nodes.forEach(node => {
      const force = forces.get(node.id)!;
      center.copy(node.position).multiplyScalar(-this.centerStrength);
      force.add(center);
    });
  }

  private updateAverageDistance(nodes: ForceNode[]): void {
    if (nodes.length < 2) {
      this.averageDistance = 5.0;
      return;
    }

    let totalDistance = 0;
    let count = 0;
    const tmp = new THREE.Vector3();

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        tmp.subVectors(nodes[i].position, nodes[j].position);
        totalDistance += tmp.length();
        count++;
      }
    }

    this.averageDistance = count > 0 ? totalDistance / count : 5.0;
  }

  getAverageDistance(): number {
    return this.averageDistance;
  }

  resetNodePositions(nodes: Map<string, ForceNode>): void {
    const minRadius = 6;
    const maxRadius = 12;
    const duration = 1500;
    const startTime = performance.now();

    const targetPositions = new Map<string, THREE.Vector3>();
    const startPositions = new Map<string, THREE.Vector3>();

    nodes.forEach((node, id) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = minRadius + Math.random() * (maxRadius - minRadius);

      const targetPos = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );

      targetPositions.set(id, targetPos);
      startPositions.set(id, node.position.clone());
      node.velocity.set(0, 0, 0);
    });

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = this.easeInOutCubic(progress);

      nodes.forEach((node, id) => {
        const start = startPositions.get(id)!;
        const target = targetPositions.get(id)!;
        node.position.lerpVectors(start, target, easeProgress);
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
