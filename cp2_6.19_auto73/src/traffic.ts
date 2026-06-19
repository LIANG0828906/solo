import * as THREE from 'three';

interface TrafficPath {
  curve: THREE.CatmullRomCurve3;
  points: THREE.Points;
  particles: THREE.Points;
  particleCount: number;
  progress: number;
  speed: number;
  trailPositions: Float32Array;
}

export class TrafficManager {
  private scene: THREE.Scene;
  private paths: TrafficPath[] = [];
  private readonly pathCount = 5;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createTrafficPaths();
  }

  private createTrafficPaths(): void {
    for (let i = 0; i < this.pathCount; i++) {
      this.createSinglePath(i);
    }
  }

  private createSinglePath(index: number): void {
    const controlPoints = this.generatePathPoints(index);
    const curve = new THREE.CatmullRomCurve3(controlPoints, true, 'catmullrom', 0.5);

    const linePoints = curve.getPoints(200);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.15,
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(line);

    const particleCount = 30;
    const trailLength = 15;
    const totalPoints = particleCount * trailLength;

    const positions = new Float32Array(totalPoints * 3);
    const colors = new Float32Array(totalPoints * 3);
    const sizes = new Float32Array(totalPoints);

    for (let i = 0; i < totalPoints; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0.5;
      positions[i * 3 + 2] = 0;

      const trailIndex = i % trailLength;
      const alpha = 1 - trailIndex / trailLength;

      colors[i * 3] = 0.4 * alpha;
      colors[i * 3 + 1] = 0.8 * alpha;
      colors[i * 3 + 2] = 1.0 * alpha;

      sizes[i] = 0.08 + alpha * 0.12;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    this.scene.add(points);

    const headPositions = new Float32Array(particleCount * 3);
    const headColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      headColors[i * 3] = 0.7;
      headColors[i * 3 + 1] = 0.95;
      headColors[i * 3 + 2] = 1.0;
    }

    const headGeometry = new THREE.BufferGeometry();
    headGeometry.setAttribute('position', new THREE.BufferAttribute(headPositions, 3));
    headGeometry.setAttribute('color', new THREE.BufferAttribute(headColors, 3));

    const headMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const headParticles = new THREE.Points(headGeometry, headMaterial);
    this.scene.add(headParticles);

    this.paths.push({
      curve,
      points,
      particles: headParticles,
      particleCount,
      progress: Math.random(),
      speed: 0.0003 + Math.random() * 0.0004,
      trailPositions: positions,
    });
  }

  private generatePathPoints(index: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const halfArea = 55;
    const segments = 6 + index;

    const startAngle = (index / this.pathCount) * Math.PI * 2;
    const startX = Math.cos(startAngle) * halfArea * 0.7;
    const startZ = Math.sin(startAngle) * halfArea * 0.7;

    points.push(new THREE.Vector3(startX, 0.5, startZ));

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const angle = startAngle + t * Math.PI * 2 * (0.8 + (index % 3) * 0.15);
      const radius = halfArea * (0.3 + 0.5 * Math.sin(t * Math.PI + index));
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 15;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 15;
      points.push(new THREE.Vector3(
        THREE.MathUtils.clamp(x, -halfArea, halfArea),
        0.5,
        THREE.MathUtils.clamp(z, -halfArea, halfArea)
      ));
    }

    points.push(new THREE.Vector3(startX, 0.5, startZ));
    return points;
  }

  public update(time: number, deltaTime: number): void {
    this.paths.forEach((path) => {
      const positions = path.points.geometry.attributes.position.array as Float32Array;
      const headPositions = path.particles.geometry.attributes.position.array as Float32Array;
      const trailLength = 15;

      for (let i = 0; i < path.particleCount; i++) {
        const particleOffset = i / path.particleCount;

        for (let t = 0; t < trailLength; t++) {
          const progress = (path.progress + particleOffset - t * 0.002 + 1) % 1;
          const point = path.curve.getPointAt(progress);

          const idx = (i * trailLength + t) * 3;
          positions[idx] = point.x;
          positions[idx + 1] = point.y;
          positions[idx + 2] = point.z;
        }

        const headProgress = (path.progress + particleOffset + 1) % 1;
        const headPoint = path.curve.getPointAt(headProgress);
        headPositions[i * 3] = headPoint.x;
        headPositions[i * 3 + 1] = headPoint.y;
        headPositions[i * 3 + 2] = headPoint.z;
      }

      path.progress = (path.progress + path.speed * deltaTime) % 1;
      if (path.progress < 0) path.progress += 1;

      path.points.geometry.attributes.position.needsUpdate = true;
      path.particles.geometry.attributes.position.needsUpdate = true;
    });
  }
}
