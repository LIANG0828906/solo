import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Pipeline, getNodeById } from '../data/mockData';

export type CameraMode = 'birdseye' | 'tour' | 'manual';

export interface TourState {
  isActive: boolean;
  currentNodeIndex: number;
  currentPipelineId: string | null;
  speed: number;
}

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private mode: CameraMode = 'birdseye';
  private tourState: TourState = {
    isActive: false,
    currentNodeIndex: 0,
    currentPipelineId: null,
    speed: 2,
  };
  private tourPipeline: Pipeline | null = null;
  private tourProgress: number = 0;
  private tourFromPos: THREE.Vector3 = new THREE.Vector3();
  private tourToPos: THREE.Vector3 = new THREE.Vector3();
  private tourFromTarget: THREE.Vector3 = new THREE.Vector3();
  private tourToTarget: THREE.Vector3 = new THREE.Vector3();
  private currentSegmentLength: number = 0;
  private onTourComplete: (() => void) | null = null;
  private onTourNodeChange: ((nodeId: string) => void) | null = null;

  private birdseyePosition = new THREE.Vector3(25, 25, 25);
  private birdseyeTarget = new THREE.Vector3(0, -2, 0);

  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    this.camera = camera;
    this.controls = controls;
    this.setBirdseye();
  }

  setBirdseye(): void {
    this.mode = 'birdseye';
    this.stopTour();
    this.animateTo(this.birdseyePosition, this.birdseyeTarget, 1);
  }

  flyToNode(nodeId: string, duration: number = 1): Promise<void> {
    return new Promise((resolve) => {
      const node = getNodeById(nodeId);
      if (!node) {
        resolve();
        return;
      }

      this.mode = 'manual';
      const targetPos = new THREE.Vector3(node.x, node.y + 3, node.z + 5);
      const lookAt = new THREE.Vector3(node.x, node.y, node.z);
      this.animateTo(targetPos, lookAt, duration, resolve);
    });
  }

  startTour(pipeline: Pipeline, speed: number = 2): void {
    if (pipeline.nodes.length < 2) return;

    this.tourPipeline = pipeline;
    this.tourState = {
      isActive: true,
      currentNodeIndex: 0,
      currentPipelineId: pipeline.id,
      speed,
    };
    this.tourProgress = 0;
    this.mode = 'tour';
    this.controls.enabled = false;

    const firstNode = pipeline.nodes[0];
    const secondNode = pipeline.nodes[1];

    const startPos = new THREE.Vector3(firstNode.x, firstNode.y + 2, firstNode.z - 3);
    const startTarget = new THREE.Vector3(firstNode.x, firstNode.y, firstNode.z);

    this.camera.position.copy(startPos);
    this.controls.target.copy(startTarget);

    this.prepareNextSegment();

    if (this.onTourNodeChange) {
      this.onTourNodeChange(firstNode.id);
    }
  }

  stopTour(): void {
    if (this.tourState.isActive) {
      this.tourState.isActive = false;
      this.controls.enabled = true;
      if (this.onTourComplete) {
        this.onTourComplete();
      }
    }
  }

  isTourActive(): boolean {
    return this.tourState.isActive;
  }

  getTourState(): TourState {
    return { ...this.tourState };
  }

  setOnTourComplete(callback: () => void): void {
    this.onTourComplete = callback;
  }

  setOnTourNodeChange(callback: (nodeId: string) => void): void {
    this.onTourNodeChange = callback;
  }

  update(deltaTime: number): void {
    if (this.tourState.isActive && this.tourPipeline) {
      this.tourProgress += (deltaTime * this.tourState.speed) / this.currentSegmentLength;

      if (this.tourProgress >= 1) {
        this.tourState.currentNodeIndex++;
        this.tourProgress = 0;

        if (this.tourState.currentNodeIndex >= this.tourPipeline.nodes.length - 1) {
          this.stopTour();
          this.setBirdseye();
          return;
        }

        this.prepareNextSegment();

        const currentNode = this.tourPipeline.nodes[this.tourState.currentNodeIndex];
        if (this.onTourNodeChange) {
          this.onTourNodeChange(currentNode.id);
        }
      }

      const t = this.tourProgress;
      const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const camPos = new THREE.Vector3().lerpVectors(this.tourFromPos, this.tourToPos, easedT);
      const target = new THREE.Vector3().lerpVectors(this.tourFromTarget, this.tourToTarget, easedT);

      this.camera.position.copy(camPos);
      this.controls.target.copy(target);
      this.controls.update();
    }
  }

  private prepareNextSegment(): void {
    if (!this.tourPipeline) return;

    const nodes = this.tourPipeline.nodes;
    const idx = this.tourState.currentNodeIndex;
    const fromNode = nodes[idx];
    const toNode = nodes[idx + 1];

    if (!fromNode || !toNode) return;

    this.tourFromPos.set(fromNode.x, fromNode.y + 2, fromNode.z - 3);
    this.tourToPos.set(toNode.x, toNode.y + 2, toNode.z - 3);

    this.tourFromTarget.set(fromNode.x, fromNode.y, fromNode.z);
    this.tourToTarget.set(toNode.x, toNode.y, toNode.z);

    this.currentSegmentLength = Math.sqrt(
      Math.pow(toNode.x - fromNode.x, 2) + Math.pow(toNode.y - fromNode.y, 2) + Math.pow(toNode.z - fromNode.z, 2),
    );
    if (this.currentSegmentLength < 0.1) this.currentSegmentLength = 0.1;
  }

  private animateTo(targetPos: THREE.Vector3, lookAt: THREE.Vector3, duration: number, onComplete?: () => void): void {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();

    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const pos = new THREE.Vector3().lerpVectors(startPos, targetPos, eased);
      const target = new THREE.Vector3().lerpVectors(startTarget, lookAt, eased);

      this.camera.position.copy(pos);
      this.controls.target.copy(target);
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    };

    animate();
  }

  setBirdseyeView(pos: THREE.Vector3, target: THREE.Vector3): void {
    this.birdseyePosition = pos;
    this.birdseyeTarget = target;
  }
}
