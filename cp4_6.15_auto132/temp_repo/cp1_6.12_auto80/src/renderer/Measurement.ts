import * as THREE from 'three';
import { MoleculeRenderer } from './MoleculeRenderer';

export class MeasurementTool {
  private renderer: MoleculeRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  private firstAtomId: string | null;
  private secondAtomId: string | null;
  private isActive: boolean;

  private dashedLine: THREE.Line | null;
  private arrowHelper: THREE.ArrowHelper | null;
  private labelElement: HTMLElement | null;

  private labelTextElement: HTMLElement | null;

  private startMarker: THREE.Mesh | null;
  private endMarker: THREE.Mesh | null;

  constructor(renderer: MoleculeRenderer) {
    this.renderer = renderer;
    this.scene = renderer.getScene();
    this.camera = renderer.getCamera();

    this.firstAtomId = null;
    this.secondAtomId = null;
    this.isActive = false;

    this.dashedLine = null;
    this.arrowHelper = null;
    this.startMarker = null;
    this.endMarker = null;

    this.labelElement = null;
    this.labelTextElement = null;
  }

  public setActive(active: boolean): void {
    this.isActive = active;
    if (!active) {
      this.clearMeasurement();
    }
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public handleAtomClick(atomId: string): void {
    if (!this.isActive) return;

    if (this.firstAtomId === null) {
      this.firstAtomId = atomId;
      this.createStartMarker(atomId);
    } else if (this.secondAtomId === null && atomId !== this.firstAtomId) {
      this.secondAtomId = atomId;
      this.createEndMarker(atomId);
      this.createDashedLine();
      this.updateLabel();
    } else {
      this.clearMeasurement();
      this.firstAtomId = atomId;
      this.createStartMarker(atomId);
    }
  }

  private createStartMarker(atomId: string): void {
    const pos = this.renderer.getAtomWorldPosition(atomId);
    if (!pos) return;

    const geo = new THREE.SphereGeometry(0.15, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.9 });
    this.startMarker = new THREE.Mesh(geo, mat);
    this.startMarker.position.copy(pos);
    this.scene.add(this.startMarker);
  }

  private createEndMarker(atomId: string): void {
    const pos = this.renderer.getAtomWorldPosition(atomId);
    if (!pos) return;

    const geo = new THREE.SphereGeometry(0.15, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.9 });
    this.endMarker = new THREE.Mesh(geo, mat);
    this.endMarker.position.copy(pos);
    this.scene.add(this.endMarker);
  }

  private createDashedLine(): void {
    if (!this.firstAtomId || !this.secondAtomId) return;

    const start = this.renderer.getAtomWorldPosition(this.firstAtomId);
    const end = this.renderer.getAtomWorldPosition(this.secondAtomId);
    if (!start || !end) return;

    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const dir = direction.clone().normalize();

    const points = [start.clone(), end.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineDashedMaterial({
      color: 0xffd700,
      dashSize: 0.15,
      gapSize: 0.1,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });

    this.dashedLine = new THREE.Line(geometry, material);
    this.dashedLine.computeLineDistances();
    this.scene.add(this.dashedLine);

    const arrowDir = dir.clone();
    const arrowLength = length * 0.4;
    const arrowStart = start.clone().add(dir.clone().multiplyScalar(length * 0.3));
    this.arrowHelper = new THREE.ArrowHelper(
      arrowDir,
      arrowStart,
      arrowLength,
      0xffd700,
      0.2,
      0.1
    );
    this.scene.add(this.arrowHelper);
  }

  public updateLabel(): void {
    if (!this.firstAtomId || !this.secondAtomId) return;

    const start = this.renderer.getAtomWorldPosition(this.firstAtomId);
    const end = this.renderer.getAtomWorldPosition(this.secondAtomId);
    if (!start || !end) return;

    const distance = start.distanceTo(end);
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    const screenPos = this.worldToScreen(midPoint);

    if (!this.labelElement) {
      this.labelElement = document.getElementById('measurement-label');
      this.labelTextElement = document.getElementById('measurement-text');
    }

    if (this.labelElement && this.labelTextElement) {
      this.labelTextElement.textContent = distance.toFixed(3) + ' Å';
      this.labelElement.style.left = screenPos.x + 'px';
      this.labelElement.style.top = (screenPos.y - 20) + 'px';
      this.labelElement.classList.remove('hidden');
    }
  }

  private worldToScreen(position: THREE.Vector3): { x: number; y: number } {
    const vector = position.clone();
    vector.project(this.camera);

    const canvas = this.renderer.getRenderer().domElement;
    const rect = canvas.getBoundingClientRect();

    return {
      x: rect.left + (vector.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-vector.y * 0.5 + 0.5) * rect.height
    };
  }

  public clearMeasurement(): void {
    this.firstAtomId = null;
    this.secondAtomId = null;

    if (this.dashedLine) {
      this.scene.remove(this.dashedLine);
      this.dashedLine.geometry.dispose();
      (this.dashedLine.material as THREE.Material).dispose();
      this.dashedLine = null;
    }

    if (this.arrowHelper) {
      this.scene.remove(this.arrowHelper);
      this.arrowHelper = null;
    }

    if (this.startMarker) {
      this.scene.remove(this.startMarker);
      this.startMarker.geometry.dispose();
      (this.startMarker.material as THREE.Material).dispose();
      this.startMarker = null;
    }

    if (this.endMarker) {
      this.scene.remove(this.endMarker);
      this.endMarker.geometry.dispose();
      (this.endMarker.material as THREE.Material).dispose();
      this.endMarker = null;
    }

    if (this.labelElement) {
      this.labelElement.classList.add('hidden');
    }
  }

  public update(): void {
    if (this.firstAtomId && this.secondAtomId) {
      this.updateLabel();
    }
  }

  public getFirstAtomId(): string | null {
    return this.firstAtomId;
  }

  public getSecondAtomId(): string | null {
    return this.secondAtomId;
  }

  public getDistance(): number | null {
    if (!this.firstAtomId || !this.secondAtomId) return null;
    const start = this.renderer.getAtomWorldPosition(this.firstAtomId);
    const end = this.renderer.getAtomWorldPosition(this.secondAtomId);
    if (!start || !end) return null;
    return start.distanceTo(end);
  }
}
