import * as THREE from 'three';

export interface GearParams {
  teeth: number;
  module: number;
  pressureAngle: number;
  color: string;
}

export class GearGenerator {
  static generateToothProfile(teeth: number, module: number, pressureAngle: number): THREE.Vector2[] {
    const pitchRadius = (teeth * module) / 2;
    const addendum = module;
    const dedendum = 1.25 * module;
    const outerRadius = pitchRadius + addendum;
    const rootRadius = pitchRadius - dedendum;
    const baseRadius = pitchRadius * Math.cos((pressureAngle * Math.PI) / 180);

    const toothAngle = (2 * Math.PI) / teeth;
    const halfToothAngle = toothAngle / 2;
    const profilePoints: THREE.Vector2[] = [];

    const involuteStartAngle = 0;
    const involuteEndAngle = Math.sqrt((outerRadius / baseRadius) ** 2 - 1);
    const involuteSteps = 20;

    const involuteCurve: THREE.Vector2[] = [];
    for (let i = 0; i <= involuteSteps; i++) {
      const t = involuteStartAngle + (involuteEndAngle - involuteStartAngle) * (i / involuteSteps);
      const x = baseRadius * (Math.cos(t) + t * Math.sin(t));
      const y = baseRadius * (Math.sin(t) - t * Math.cos(t));
      involuteCurve.push(new THREE.Vector2(x, y));
    }

    const lastPoint = involuteCurve[involuteCurve.length - 1];
    const lastAngle = Math.atan2(lastPoint.y, lastPoint.x);
    const rotationOffset = halfToothAngle - lastAngle;

    for (const point of involuteCurve) {
      const rotated = this.rotatePoint(point, rotationOffset);
      profilePoints.push(rotated);
    }

    const tipStartAngle = halfToothAngle;
    const tipEndAngle = toothAngle - halfToothAngle;
    const tipSteps = 5;
    for (let i = 1; i < tipSteps; i++) {
      const angle = tipStartAngle + (tipEndAngle - tipStartAngle) * (i / tipSteps);
      profilePoints.push(new THREE.Vector2(outerRadius * Math.cos(angle), outerRadius * Math.sin(angle)));
    }

    for (let i = involuteCurve.length - 1; i >= 0; i--) {
      const point = involuteCurve[i];
      const mirrored = new THREE.Vector2(point.x, -point.y);
      const rotated = this.rotatePoint(mirrored, -rotationOffset + toothAngle);
      profilePoints.push(rotated);
    }

    const rootStartAngle = toothAngle - halfToothAngle;
    const rootEndAngle = toothAngle + halfToothAngle;
    const rootSteps = 8;
    for (let i = 0; i <= rootSteps; i++) {
      const angle = rootStartAngle + (rootEndAngle - rootStartAngle) * (i / rootSteps);
      profilePoints.push(new THREE.Vector2(rootRadius * Math.cos(angle), rootRadius * Math.sin(angle)));
    }

    return profilePoints;
  }

  static buildGearMesh(params: GearParams): THREE.Group {
    const group = new THREE.Group();
    const profile = this.generateToothProfile(params.teeth, params.module, params.pressureAngle);
    const fullProfile: THREE.Vector2[] = [];
    const toothAngle = (2 * Math.PI) / params.teeth;

    for (let i = 0; i < params.teeth; i++) {
      const rotation = i * toothAngle;
      for (const point of profile) {
        const rotated = this.rotatePoint(point, rotation);
        fullProfile.push(rotated);
      }
    }

    const shape = new THREE.Shape();
    if (fullProfile.length > 0) {
      shape.moveTo(fullProfile[0].x, fullProfile[0].y);
      for (let i = 1; i < fullProfile.length; i++) {
        shape.lineTo(fullProfile[i].x, fullProfile[i].y);
      }
      shape.closePath();
    }

    const holeRadius = (params.teeth * params.module) / 2 * 0.2;
    if (holeRadius > params.module * 0.5) {
      const holePath = new THREE.Path();
      const holeSteps = 32;
      for (let i = 0; i <= holeSteps; i++) {
        const angle = (i / holeSteps) * Math.PI * 2;
        const x = Math.cos(angle) * holeRadius;
        const y = Math.sin(angle) * holeRadius;
        if (i === 0) holePath.moveTo(x, y);
        else holePath.lineTo(x, y);
      }
      shape.holes.push(holePath);
    }

    const extrudeSettings = {
      depth: params.module * 1.5,
      bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    const material = new THREE.MeshStandardMaterial({
      color: params.color,
      metalness: 0.3,
      roughness: 0.7,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: params.color,
      linewidth: 2
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edges.rotation.x = -Math.PI / 2;
    group.add(edges);

    group.userData.gearMesh = mesh;
    group.userData.edges = edges;

    return group;
  }

  private static rotatePoint(point: THREE.Vector2, angle: number): THREE.Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new THREE.Vector2(
      point.x * cos - point.y * sin,
      point.x * sin + point.y * cos
    );
  }

  static getPitchRadius(teeth: number, module: number): number {
    return (teeth * module) / 2;
  }
}
