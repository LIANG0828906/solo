import * as THREE from 'three';

class SceneManager {
  private scene: THREE.Scene;
  private trajectoryLines: Map<string, THREE.Line> = new Map();

  constructor(scene?: THREE.Scene) {
    this.scene = scene ?? new THREE.Scene();
    if (!scene) {
      this.scene.background = new THREE.Color('#0B0C10');
    }
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  private hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) {
      r = c; g = x; b = 0;
    } else if (h < 120) {
      r = x; g = c; b = 0;
    } else if (h < 180) {
      r = 0; g = c; b = x;
    } else if (h < 240) {
      r = 0; g = x; b = c;
    } else if (h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return { r: r + m, g: g + m, b: b + m };
  }

  addTrajectoryLine(points: { x: number; y: number; z: number }[], id: string): void {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < points.length; i++) {
      positions.push(points[i].x, points[i].y, points[i].z);
      const hue = (i / Math.max(points.length - 1, 1)) * 360;
      const rgb = this.hsvToRgb(hue, 1, 1);
      colors.push(rgb.r, rgb.g, rgb.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 3 });
    const line = new THREE.Line(geometry, material);
    this.trajectoryLines.set(id, line);
    this.scene.add(line);
  }

  updateTrajectoryLine(points: { x: number; y: number; z: number }[], id: string): void {
    const existingLine = this.trajectoryLines.get(id);
    if (!existingLine) {
      this.addTrajectoryLine(points, id);
      return;
    }

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < points.length; i++) {
      positions.push(points[i].x, points[i].y, points[i].z);
      const hue = (i / Math.max(points.length - 1, 1)) * 360;
      const rgb = this.hsvToRgb(hue, 1, 1);
      colors.push(rgb.r, rgb.g, rgb.b);
    }

    const geometry = existingLine.geometry as THREE.BufferGeometry;
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }

  removeTrajectoryLine(id: string): void {
    const line = this.trajectoryLines.get(id);
    if (!line) return;

    this.scene.remove(line);
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
    this.trajectoryLines.delete(id);
  }

  clearAll(): void {
    const ids = [...this.trajectoryLines.keys()];
    for (const id of ids) {
      this.removeTrajectoryLine(id);
    }
  }

  createGroundPlane(): THREE.Plane {
    return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }

  dispose(): void {
    this.clearAll();
  }
}

export default SceneManager;
