import * as THREE from 'three';
import { EarthquakeRecord } from '../data';
import { EARTH_RADIUS } from '../moduleA/SceneManager';
import { UIModule } from './UIModule';

interface BubbleData {
  mesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  record: EarthquakeRecord;
  baseScale: number;
  phase: number;
  entered: boolean;
  enterProgress: number;
  selected: boolean;
}

export class QuakeBubbleManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private uiModule: UIModule;
  private earthGroup: THREE.Group;
  private bubbles: BubbleData[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedBubble: BubbleData | null = null;
  private elapsedTime: number = 0;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    earthGroup: THREE.Group,
    uiModule: UIModule
  ) {
    this.scene = scene;
    this.camera = camera;
    this.earthGroup = earthGroup;
    this.uiModule = uiModule;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  loadData(records: EarthquakeRecord[]): void {
    this.clearBubbles();

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const bubble = this.createBubble(record, i);
      this.bubbles.push(bubble);
      this.earthGroup.add(bubble.mesh);
      this.earthGroup.add(bubble.glowMesh);
    }
  }

  private createBubble(record: EarthquakeRecord, index: number): BubbleData {
    const size = this.getSizeByMagnitude(record.magnitude);
    const color = this.getColorByDepth(record.depth);

    const geometry = new THREE.SphereGeometry(size, 12, 12);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.85,
    });

    const mesh = new THREE.Mesh(geometry, material);
    const pos = this.latLngToVector3(record.lat, record.lng, EARTH_RADIUS * 1.01);
    mesh.position.copy(pos);
    mesh.name = `quake_${record.id}`;
    mesh.scale.set(0.01, 0.01, 0.01);

    const glowGeometry = new THREE.SphereGeometry(size * 2.2, 12, 12);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(pos);
    glowMesh.scale.set(0.01, 0.01, 0.01);

    return {
      mesh,
      glowMesh,
      record,
      baseScale: 1,
      phase: Math.random() * Math.PI * 2,
      entered: false,
      enterProgress: 0,
      selected: false,
    };
  }

  private getSizeByMagnitude(mag: number): number {
    if (mag < 4) return 0.04;
    if (mag < 6) return 0.08;
    return 0.14;
  }

  private getColorByDepth(depth: number): number {
    const maxDepth = 700;
    const t = Math.min(depth / maxDepth, 1);

    const r = 1.0;
    const g = 0.4 * (1 - t);
    const b = t * 0.8;

    return new THREE.Color(r, g, b).getHex();
  }

  private latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lng + 180) * Math.PI) / 180;
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  update(dt: number): void {
    this.elapsedTime += dt;

    for (const bubble of this.bubbles) {
      if (!bubble.entered) {
        bubble.enterProgress += dt * 2.5;
        if (bubble.enterProgress >= 1) {
          bubble.enterProgress = 1;
          bubble.entered = true;
        }
        const ease = 1 - Math.pow(1 - bubble.enterProgress, 3);
        const s = ease * bubble.baseScale;
        bubble.mesh.scale.set(s, s, s);
        bubble.glowMesh.scale.set(s, s, s);
      }

      if (bubble.entered && !bubble.selected) {
        const flicker = 0.7 + 0.3 * Math.sin(this.elapsedTime * 3 + bubble.phase);
        (bubble.mesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.4 * flicker;
        (bubble.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.08 + 0.12 * flicker;
      }

      if (bubble.selected) {
        const pulse = 1.0 + 0.15 * Math.sin(this.elapsedTime * 5);
        const s = bubble.baseScale * pulse * 1.3;
        bubble.mesh.scale.set(s, s, s);
        bubble.glowMesh.scale.set(s, s, s);
        (bubble.mesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
        (bubble.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.35;
      }
    }
  }

  handleClick(event: MouseEvent): void {
    const rect = (this.camera as any).rendererDOMElement?.getBoundingClientRect();
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const rect2 = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect2.left) / rect2.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect2.top) / rect2.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = this.bubbles.map((b) => b.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const bubble = this.bubbles.find((b) => b.mesh === hitMesh);
      if (bubble) {
        this.selectBubble(bubble);
        return;
      }
    }

    this.deselectBubble();
  }

  private selectBubble(bubble: BubbleData): void {
    if (this.selectedBubble) {
      this.selectedBubble.selected = false;
    }
    this.selectedBubble = bubble;
    bubble.selected = true;
    this.uiModule.showQuakeCard(bubble.record);
  }

  deselectBubble(): void {
    if (this.selectedBubble) {
      this.selectedBubble.selected = false;
      this.selectedBubble = null;
    }
    this.uiModule.hideQuakeCard();
  }

  getVisibleCount(): number {
    return this.bubbles.filter((b) => b.entered).length;
  }

  getLatestQuake(): EarthquakeRecord | null {
    if (this.bubbles.length === 0) return null;
    const sorted = [...this.bubbles].sort(
      (a, b) => new Date(b.record.time).getTime() - new Date(a.record.time).getTime()
    );
    return sorted[0].record;
  }

  getMagnitudeStats(): { range: string; count: number }[] {
    const records = this.bubbles.map((b) => b.record);
    return [
      { range: '0-3', count: records.filter((r) => r.magnitude >= 0 && r.magnitude < 3).length },
      { range: '3-5', count: records.filter((r) => r.magnitude >= 3 && r.magnitude < 5).length },
      { range: '5-7', count: records.filter((r) => r.magnitude >= 5 && r.magnitude < 7).length },
      { range: '7+', count: records.filter((r) => r.magnitude >= 7).length },
    ];
  }

  private clearBubbles(): void {
    for (const bubble of this.bubbles) {
      this.earthGroup.remove(bubble.mesh);
      this.earthGroup.remove(bubble.glowMesh);
      bubble.mesh.geometry.dispose();
      (bubble.mesh.material as THREE.Material).dispose();
      bubble.glowMesh.geometry.dispose();
      (bubble.glowMesh.material as THREE.Material).dispose();
    }
    this.bubbles = [];
    this.selectedBubble = null;
  }

  dispose(): void {
    this.clearBubbles();
  }
}
