import * as THREE from 'three';

export interface Star {
  id: number;
  mesh: THREE.Mesh;
  baseScale: number;
  pulsePhase: number;
  color: THREE.Color;
  spawnProgress: number;
}

export interface Beam {
  id: number;
  startStar: Star;
  endStar: Star;
  curve: THREE.CatmullRomCurve3;
  tube: THREE.Mesh;
  flowParticles: THREE.Points;
  particleCount: number;
  particleSpeeds: Float32Array;
  opacity: number;
  lineWidth: number;
  targetLineWidth: number;
  spawnProgress: number;
  color: THREE.Color;
}

export class StarSystem {
  private scene: THREE.Scene;
  private stars: Star[] = [];
  private beams: Beam[] = [];
  private starIdCounter = 0;
  private beamIdCounter = 0;
  private starGroup: THREE.Group;
  private beamGroup: THREE.Group;
  private flowParticleGroup: THREE.Group;
  private raycaster: THREE.Raycaster;
  private clickPlane: THREE.Plane;
  private readonly BEAM_OFFSET = 0.1;
  private readonly BASE_STAR_SIZE = 0.3;
  private readonly BASE_BEAM_WIDTH = 0.02;
  private readonly FLOW_PARTICLE_COLOR = new THREE.Color('#60A5FA');

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.starGroup = new THREE.Group();
    this.beamGroup = new THREE.Group();
    this.flowParticleGroup = new THREE.Group();
    this.scene.add(this.starGroup);
    this.scene.add(this.beamGroup);
    this.scene.add(this.flowParticleGroup);
    this.raycaster = new THREE.Raycaster();
    this.clickPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  }

  getStarCount(): number {
    return this.stars.length;
  }

  getBeamCount(): number {
    return this.beams.length;
  }

  getStars(): Star[] {
    return this.stars;
  }

  getBeams(): Beam[] {
    return this.beams;
  }

  addStarAtWorldPosition(position: THREE.Vector3): Star {
    const star = this.createStar(position);
    this.stars.push(star);
    this.starGroup.add(star.mesh);

    if (this.stars.length >= 2) {
      const prevStar = this.stars[this.stars.length - 2];
      this.connectStars(prevStar, star);
    }

    return star;
  }

  addStarFromScreen(
    screenX: number,
    screenY: number,
    camera: THREE.Camera,
    canvas: HTMLCanvasElement
  ): Star | null {
    const rect = canvas.getBoundingClientRect();
    const x = ((screenX - rect.left) / rect.width) * 2 - 1;
    const y = -((screenY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const planeNormal = new THREE.Vector3();
    camera.getWorldDirection(planeNormal);
    this.clickPlane.setFromNormalAndCoplanarPoint(
      planeNormal.negate(),
      new THREE.Vector3(0, 0, 0)
    );

    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.clickPlane, intersectPoint);

    if (!intersectPoint) return null;

    const dist = camera.position.length();
    const clampedPos = intersectPoint.clampLength(0, dist * 0.8);

    return this.addStarAtWorldPosition(clampedPos);
  }

  private createStar(position: THREE.Vector3): Star {
    const color = this.randomHSLColor();
    const geometry = new THREE.SphereGeometry(this.BASE_STAR_SIZE, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.scale.set(0.01, 0.01, 0.01);

    const id = this.starIdCounter++;

    return {
      id,
      mesh,
      baseScale: 1,
      pulsePhase: Math.random() * Math.PI * 2,
      color: color.clone(),
      spawnProgress: 0
    };
  }

  connectStars(starA: Star, starB: Star): Beam | null {
    const existingBeam = this.findBeam(starA, starB);
    if (existingBeam) return null;

    const midPoint = new THREE.Vector3()
      .addVectors(starA.mesh.position, starB.mesh.position)
      .multiplyScalar(0.5);

    let offset = new THREE.Vector3(0, 0, 0);

    for (const beam of this.beams) {
      if (this.checkIntersection(starA.mesh.position, starB.mesh.position, beam)) {
        const dirAB = new THREE.Vector3()
          .subVectors(starB.mesh.position, starA.mesh.position)
          .normalize();
        const perp = new THREE.Vector3(0, 1, 0)
          .cross(dirAB)
          .normalize();

        if (perp.lengthSq() < 0.01) {
          perp.set(1, 0, 0).cross(dirAB).normalize();
        }

        offset.copy(perp.multiplyScalar(this.BEAM_OFFSET));

        const testMid = midPoint.clone().add(offset);
        const dirToCam = starA.mesh.position.clone().negate().normalize();
        if (testMid.dot(dirToCam) > midPoint.dot(dirToCam)) {
          offset.negate();
        }
        break;
      }
    }

    const controlPoint = midPoint.clone().add(offset);
    const curve = new THREE.CatmullRomCurve3([
      starA.mesh.position.clone(),
      controlPoint,
      starB.mesh.position.clone()
    ]);

    const mixedColor = starA.color.clone().lerp(starB.color, 0.5);
    const beam = this.createBeam(starA, starB, curve, mixedColor);

    this.beams.push(beam);
    this.beamGroup.add(beam.tube);
    this.flowParticleGroup.add(beam.flowParticles);

    return beam;
  }

  private createBeam(
    startStar: Star,
    endStar: Star,
    curve: THREE.CatmullRomCurve3,
    color: THREE.Color
  ): Beam {
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.001, 8, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);

    const particleCount = Math.max(5, Math.floor(curve.getLength() * 20));
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const point = curve.getPoint(t);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      colors[i * 3] = this.FLOW_PARTICLE_COLOR.r;
      colors[i * 3 + 1] = this.FLOW_PARTICLE_COLOR.g;
      colors[i * 3 + 2] = this.FLOW_PARTICLE_COLOR.b;

      particleSpeeds[i] = 0.3 + Math.random() * 0.4;
    }

    const flowGeometry = new THREE.BufferGeometry();
    flowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    flowGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const flowMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const flowParticles = new THREE.Points(flowGeometry, flowMaterial);

    const id = this.beamIdCounter++;

    return {
      id,
      startStar,
      endStar,
      curve,
      tube,
      flowParticles,
      particleCount,
      particleSpeeds,
      opacity: 0,
      lineWidth: 0,
      targetLineWidth: this.BASE_BEAM_WIDTH,
      spawnProgress: 0,
      color: color.clone()
    };
  }

  private findBeam(starA: Star, starB: Star): Beam | undefined {
    return this.beams.find(
      (b) =>
        (b.startStar.id === starA.id && b.endStar.id === starB.id) ||
        (b.startStar.id === starB.id && b.endStar.id === starA.id)
    );
  }

  private checkIntersection(
    posA: THREE.Vector3,
    posB: THREE.Vector3,
    beam: Beam
  ): boolean {
    const p1 = beam.startStar.mesh.position;
    const p2 = beam.endStar.mesh.position;

    const v1 = new THREE.Vector3().subVectors(posB, posA);
    const v2 = new THREE.Vector3().subVectors(p2, p1);
    const cross = new THREE.Vector3().crossVectors(v1, v2);
    const coplanar = Math.abs(
      new THREE.Vector3().subVectors(p1, posA).dot(cross)
    );

    if (coplanar > 0.5) return false;

    const denom = v1.x * v2.y - v1.y * v2.x;
    if (Math.abs(denom) < 0.0001) return false;

    const t =
      ((p1.x - posA.x) * v2.y - (p1.y - posA.y) * v2.x) / denom;
    const u =
      ((p1.x - posA.x) * v1.y - (p1.y - posA.y) * v1.x) / denom;

    if (t > 0.1 && t < 0.9 && u > 0.1 && u < 0.9) {
      const d = posA.distanceTo(p1);
      return d > 0.3;
    }

    return false;
  }

  clearAll(): void {
    for (const star of this.stars) {
      (star as Star & { clearAnim?: boolean }).clearAnim = true;
    }
    for (const beam of this.beams) {
      (beam as Beam & { clearAnim?: boolean }).clearAnim = true;
    }
  }

  private actuallyClearRemoved(): void {
    this.stars = this.stars.filter((s) => {
      const ext = s as Star & { clearAnim?: boolean; cleared?: boolean };
      if (ext.clearAnim && !ext.cleared) {
        ext.cleared = true;
        this.starGroup.remove(s.mesh);
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.Material).dispose();
        return false;
      }
      return !ext.clearAnim;
    });

    this.beams = this.beams.filter((b) => {
      const ext = b as Beam & { clearAnim?: boolean; cleared?: boolean };
      if (ext.clearAnim && !ext.cleared) {
        ext.cleared = true;
        this.beamGroup.remove(b.tube);
        this.flowParticleGroup.remove(b.flowParticles);
        b.tube.geometry.dispose();
        (b.tube.material as THREE.Material).dispose();
        b.flowParticles.geometry.dispose();
        (b.flowParticles.material as THREE.Material).dispose();
        return false;
      }
      return !ext.clearAnim;
    });
  }

  generateRandomConstellation(camera: THREE.Camera): void {
    this.clearAll();
    setTimeout(() => {
      const starCount = Math.floor(Math.random() * 8) + 8;
      const positions: THREE.Vector3[] = [];
      const dist = camera.position.length() * 0.5;

      for (let i = 0; i < starCount; i++) {
        let pos: THREE.Vector3;
        let attempts = 0;
        do {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = dist * (0.3 + Math.random() * 0.6);

          pos = new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          );
          attempts++;
        } while (
          attempts < 20 &&
          positions.some((p) => p.distanceTo(pos) < 1)
        );

        positions.push(pos);
      }

      const newStars: Star[] = [];
      for (const pos of positions) {
        const star = this.createStar(pos);
        this.stars.push(star);
        this.starGroup.add(star.mesh);
        newStars.push(star);
      }

      const connectionPairs: [number, number][] = [];
      for (let i = 0; i < newStars.length; i++) {
        for (let j = i + 1; j < newStars.length; j++) {
          connectionPairs.push([i, j]);
        }
      }

      const targetConnections = Math.floor(
        (newStars.length * (newStars.length - 1)) / 2 * 0.6
      );

      connectionPairs.sort((a, b) => {
        const distA = newStars[a[0]].mesh.position.distanceTo(
          newStars[a[1]].mesh.position
        );
        const distB = newStars[b[0]].mesh.position.distanceTo(
          newStars[b[1]].mesh.position
        );
        return distA - distB;
      });

      for (let i = 0; i < Math.min(targetConnections, connectionPairs.length); i++) {
        const [ai, bi] = connectionPairs[i];
        this.connectStars(newStars[ai], newStars[bi]);
      }
    }, 600);
  }

  update(delta: number, time: number): void {
    for (const star of this.stars) {
      const ext = star as Star & { clearAnim?: boolean };
      if (ext.clearAnim) {
        star.spawnProgress = Math.max(0, star.spawnProgress - delta * 2);
        const s = this.easeOutBack(star.spawnProgress) * this.BASE_STAR_SIZE;
        star.mesh.scale.set(s, s, s);
        const mat = star.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = star.spawnProgress;
      } else {
        if (star.spawnProgress < 1) {
          star.spawnProgress = Math.min(1, star.spawnProgress + delta * 3.3);
        }
        const pulse = 0.2 + 0.4 * (0.5 + 0.5 * Math.sin(time * Math.PI + star.pulsePhase));
        const baseSize = this.easeOutBack(star.spawnProgress);
        const finalScale = baseSize * (pulse / this.BASE_STAR_SIZE) * this.BASE_STAR_SIZE;
        star.mesh.scale.set(finalScale, finalScale, finalScale);
      }
    }

    for (const beam of this.beams) {
      const ext = beam as Beam & { clearAnim?: boolean };
      if (ext.clearAnim) {
        beam.spawnProgress = Math.max(0, beam.spawnProgress - delta * 2);
      } else {
        if (beam.spawnProgress < 1) {
          beam.spawnProgress = Math.min(1, beam.spawnProgress + delta * 2);
        }
      }

      const easedProgress = this.easeOutCubic(beam.spawnProgress);
      beam.opacity = easedProgress * 0.5;
      beam.lineWidth = easedProgress * beam.targetLineWidth;

      this.updateTubeGeometry(beam);
      this.updateFlowParticles(beam, delta);
    }

    this.actuallyClearRemoved();
  }

  private updateTubeGeometry(beam: Beam): void {
    if (beam.lineWidth <= 0.001) {
      beam.tube.visible = false;
      return;
    }
    beam.tube.visible = true;

    const mat = beam.tube.material as THREE.MeshBasicMaterial;
    mat.opacity = beam.opacity;
    mat.color = beam.color;

    const oldGeom = beam.tube.geometry as THREE.TubeGeometry;
    oldGeom.dispose();

    const newGeom = new THREE.TubeGeometry(
      beam.curve,
      64,
      Math.max(0.001, beam.lineWidth),
      8,
      false
    );
    beam.tube.geometry = newGeom;
  }

  private updateFlowParticles(beam: Beam, delta: number): void {
    const geometry = beam.flowParticles.geometry as THREE.BufferGeometry;
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;
    const material = beam.flowParticles.material as THREE.PointsMaterial;
    material.opacity = Math.min(0.8, beam.spawnProgress * 0.8);

    for (let i = 0; i < beam.particleCount; i++) {
      let t = (beam.particleSpeeds as Float32Array)[i];
      t = (t + delta * 0.15) % 1;
      (beam.particleSpeeds as Float32Array)[i] = t;

      const point = beam.curve.getPointAt(t);
      posArray[i * 3] = point.x;
      posArray[i * 3 + 1] = point.y;
      posArray[i * 3 + 2] = point.z;
    }

    positions.needsUpdate = true;
  }

  setBeamHoverBrightness(beam: Beam, hovered: boolean): void {
    const mat = beam.tube.material as THREE.MeshBasicMaterial;
    if (hovered) {
      const brightColor = beam.color.clone().multiplyScalar(1.3);
      mat.color.copy(brightColor);
    } else {
      mat.color.copy(beam.color);
    }
  }

  private randomHSLColor(): THREE.Color {
    const h = Math.random();
    return new THREE.Color().setHSL(h, 0.8, 0.7);
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  dispose(): void {
    for (const star of this.stars) {
      star.mesh.geometry.dispose();
      (star.mesh.material as THREE.Material).dispose();
    }
    for (const beam of this.beams) {
      beam.tube.geometry.dispose();
      (beam.tube.material as THREE.Material).dispose();
      beam.flowParticles.geometry.dispose();
      (beam.flowParticles.material as THREE.Material).dispose();
    }
    this.stars = [];
    this.beams = [];
    this.scene.remove(this.starGroup);
    this.scene.remove(this.beamGroup);
    this.scene.remove(this.flowParticleGroup);
  }
}
