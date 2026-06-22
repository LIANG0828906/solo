import * as THREE from 'three';

const COLOR_LOW = new THREE.Color('#0099ff');
const COLOR_HIGH = new THREE.Color('#ff3300');
const BASE_COLOR = new THREE.Color('#b0b0b0');

export class HeatmapRenderer {
  private meshMap: Map<string, THREE.Mesh> = new Map();
  private currentColors: Map<string, THREE.Color> = new Map();
  private targetColors: Map<string, THREE.Color> = new Map();
  private transitionStartTime: Map<string, number> = new Map();
  private transitionDuration = 600;
  private enabled = false;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.meshMap.forEach((mesh, id) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.color.copy(BASE_COLOR);
      });
      this.currentColors.clear();
      this.targetColors.clear();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  registerMesh(id: string, mesh: THREE.Mesh) {
    this.meshMap.set(id, mesh);
    this.currentColors.set(id, BASE_COLOR.clone());
    this.targetColors.set(id, BASE_COLOR.clone());
  }

  unregisterMesh(id: string) {
    this.meshMap.delete(id);
    this.currentColors.delete(id);
    this.targetColors.delete(id);
    this.transitionStartTime.delete(id);
  }

  interpolateColor(t: number): THREE.Color {
    const clamped = Math.max(0, Math.min(1, t));
    const color = new THREE.Color();
    color.r = COLOR_LOW.r + (COLOR_HIGH.r - COLOR_LOW.r) * clamped;
    color.g = COLOR_LOW.g + (COLOR_HIGH.g - COLOR_LOW.g) * clamped;
    color.b = COLOR_LOW.b + (COLOR_HIGH.b - COLOR_LOW.b) * clamped;
    return color;
  }

  updateHeatValues(heatValues: Map<string, number>) {
    if (!this.enabled) return;
    const now = performance.now();
    heatValues.forEach((heat, id) => {
      const targetColor = this.interpolateColor(heat);
      this.targetColors.set(id, targetColor);
      this.transitionStartTime.set(id, now);
    });
  }

  updatePreview(heatValues: Map<string, number>) {
    if (!this.enabled) return;
    heatValues.forEach((heat, id) => {
      const mesh = this.meshMap.get(id);
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const color = this.interpolateColor(heat);
        mat.color.copy(color);
      }
    });
  }

  animate() {
    if (!this.enabled) return;
    const now = performance.now();
    this.meshMap.forEach((mesh, id) => {
      const startTime = this.transitionStartTime.get(id);
      if (!startTime) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const target = this.targetColors.get(id);
      const current = this.currentColors.get(id);
      if (!target || !current) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / this.transitionDuration);
      const eased = 1 - Math.pow(1 - progress, 3);
      mat.color.lerpColors(current, target, eased);
      if (progress >= 1) {
        current.copy(target);
        this.transitionStartTime.delete(id);
      }
    });
  }

  setTransitionDuration(ms: number) {
    this.transitionDuration = ms;
  }
}
