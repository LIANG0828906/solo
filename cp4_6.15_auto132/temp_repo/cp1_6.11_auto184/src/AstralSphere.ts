import * as THREE from 'three';

const STAR_NAMES = [
  '角', '亢', '氐', '房', '心', '尾', '箕',
  '斗', '牛', '女', '虚', '危', '室', '壁',
  '奎', '娄', '胃', '昴', '毕', '觜', '参',
  '井', '鬼', '柳', '星', '张', '翼', '轸'
];

const SPHERE_RADIUS = 4;
const GRID_COLOR = 0xA0C4FF;
const STAR_COLOR = 0xFFD700;

export class AstralSphere {
  group: THREE.Group;
  private sphere: THREE.Mesh;
  private starMeshes: THREE.Mesh[] = [];
  private currentHour = 0;
  private baseRotation = 0;
  private highlightedStarIndex = -1;
  private highlightTimer = 0;

  constructor() {
    this.group = new THREE.Group();
    this.buildSphere();
    this.buildStars();
    this.group.position.set(0, 3, -5);
  }

  private buildSphere() {
    const geom = new THREE.SphereGeometry(SPHERE_RADIUS, 32, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: GRID_COLOR,
      transparent: true,
      opacity: 0.08,
      wireframe: true,
      side: THREE.BackSide
    });
    this.sphere = new THREE.Mesh(geom, mat);
    this.group.add(this.sphere);

    const lineMat = new THREE.LineBasicMaterial({ color: GRID_COLOR, transparent: true, opacity: 0.2 });

    for (let i = 0; i < 12; i++) {
      const phi = (i / 12) * Math.PI;
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= 64; j++) {
        const theta = (j / 64) * Math.PI * 2;
        const r = SPHERE_RADIUS * 1.001;
        points.push(new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        ));
      }
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeom, lineMat);
      this.group.add(line);
    }

    for (let i = 0; i < 24; i++) {
      const theta = (i / 24) * Math.PI * 2;
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= 64; j++) {
        const phi = (j / 64) * Math.PI;
        const r = SPHERE_RADIUS * 1.001;
        points.push(new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        ));
      }
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeom, lineMat);
      this.group.add(line);
    }
  }

  private buildStars() {
    for (let i = 0; i < 28; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / 28);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const brightness = 0.02 + (i % 5) * 0.0075;
      const r = SPHERE_RADIUS * 0.98;

      const geom = new THREE.SphereGeometry(brightness, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: STAR_COLOR,
        transparent: true,
        opacity: 0.9
      });
      const star = new THREE.Mesh(geom, mat);
      star.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      this.group.add(star);
      this.starMeshes.push(star);
    }
  }

  setHour(hour: number) {
    if (hour === this.currentHour) return;
    const prevHour = this.currentHour;
    this.currentHour = hour;
    const quarterHours = Math.round((hour - prevHour) * 4);
    this.baseRotation += (quarterHours * 3) * (Math.PI / 180);
    this.group.rotation.y = this.baseRotation;

    const starIndex = hour % 28;
    this.highlightStar(starIndex);
  }

  highlightStar(starIndex: number) {
    this.highlightedStarIndex = starIndex;
    this.highlightTimer = 0.5;
  }

  update(deltaTime: number) {
    if (this.highlightTimer > 0) {
      this.highlightTimer -= deltaTime;
      const blink = Math.sin(this.highlightTimer * Math.PI * 8) > 0;
      for (let i = 0; i < this.starMeshes.length; i++) {
        const mat = this.starMeshes[i].material as THREE.MeshBasicMaterial;
        if (i === this.highlightedStarIndex) {
          mat.opacity = blink ? 1.0 : 0.3;
          this.starMeshes[i].scale.setScalar(blink ? 2.0 : 1.0);
        } else {
          mat.opacity = 0.9;
          this.starMeshes[i].scale.setScalar(1.0);
        }
      }
      if (this.highlightTimer <= 0) {
        this.highlightTimer = 0;
        this.highlightedStarIndex = -1;
        for (const mesh of this.starMeshes) {
          (mesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
          mesh.scale.setScalar(1.0);
        }
      }
    }
  }

  setResponsiveScale(scale: number) {
    this.group.scale.setScalar(scale);
  }

  setResponsivePosition(x: number, y: number, z: number) {
    this.group.position.set(x, y, z);
  }
}

export { STAR_NAMES };
