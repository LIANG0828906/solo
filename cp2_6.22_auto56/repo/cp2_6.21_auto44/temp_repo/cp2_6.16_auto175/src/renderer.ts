import * as THREE from 'three';
import {
  Particle,
  FieldParams,
  Stats,
  ACCENT_COLOR,
  TEXT_COLOR,
  FIELD_REGION_RADIUS,
  FIELD_REGION_HEIGHT
} from './types';
import { ParticleSystem } from './particleSystem';

export class Renderer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  webglRenderer: THREE.WebGLRenderer;
  private particleInstancedMesh: THREE.InstancedMesh | null = null;
  private trailLines: Map<number, THREE.Line> = new Map();
  private fieldCylinder: THREE.Mesh | null = null;
  private fieldFlowLines: THREE.Group | null = null;
  private crosshairGroup: THREE.Group | null = null;
  private glowMeshes: Map<number, THREE.Mesh> = new Map();
  private dummy = new THREE.Object3D();
  private tempColor = new THREE.Color();
  private clock = new THREE.Clock();

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    this.camera.position.set(15, 10, 15);
    this.camera.lookAt(0, 0, 0);

    this.webglRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.webglRenderer.setSize(container.clientWidth, container.clientHeight);
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.webglRenderer.setClearColor(0x000000, 0);
    container.appendChild(this.webglRenderer.domElement);

    this.setupScene();
    this.createFieldCylinder();
    this.createCrosshair();
  }

  private setupScene() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(40, 40, 0x1a1a3e, 0x0d0d2b);
    gridHelper.position.y = -FIELD_REGION_HEIGHT / 2;
    this.scene.add(gridHelper);
  }

  createFieldCylinder() {
    const geometry = new THREE.CylinderGeometry(
      FIELD_REGION_RADIUS,
      FIELD_REGION_RADIUS,
      FIELD_REGION_HEIGHT,
      64,
      1,
      true
    );
    const material = new THREE.MeshPhongMaterial({
      color: 0x1a4a8a,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.fieldCylinder = new THREE.Mesh(geometry, material);
    this.scene.add(this.fieldCylinder);

    this.fieldFlowLines = new THREE.Group();
    const numFlowLines = 8;
    for (let i = 0; i < numFlowLines; i++) {
      const angle = (i / numFlowLines) * Math.PI * 2;
      const points: THREE.Vector3[] = [];
      const segments = 100;
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const y = -FIELD_REGION_HEIGHT / 2 + t * FIELD_REGION_HEIGHT;
        const spiralAngle = angle + t * Math.PI * 4;
        const r = FIELD_REGION_RADIUS * 0.98;
        points.push(new THREE.Vector3(
          r * Math.cos(spiralAngle),
          y,
          r * Math.sin(spiralAngle)
        ));
      }
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x4488cc,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      this.fieldFlowLines.add(line);
    }
    this.scene.add(this.fieldFlowLines);
  }

  createCrosshair() {
    this.crosshairGroup = new THREE.Group();
    const arrowLen = 0.6;
    const arrowRadius = 0.08;
    const positions = [
      { pos: new THREE.Vector3(1, 1, 0), rot: new THREE.Euler(0, 0, -Math.PI / 4) },
      { pos: new THREE.Vector3(-1, 1, 0), rot: new THREE.Euler(0, 0, Math.PI / 4) },
      { pos: new THREE.Vector3(1, -1, 0), rot: new THREE.Euler(0, 0, Math.PI / 4 + Math.PI / 2) },
      { pos: new THREE.Vector3(-1, -1, 0), rot: new THREE.Euler(0, 0, -Math.PI / 4 - Math.PI / 2) }
    ];
    for (const { pos, rot } of positions) {
      const coneGeo = new THREE.ConeGeometry(arrowRadius, arrowLen, 6);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.copy(pos.multiplyScalar(12));
      cone.rotation.copy(rot);
      this.crosshairGroup.add(cone);
    }
    this.crosshairGroup.visible = false;
    this.scene.add(this.crosshairGroup);
  }

  updateParticles(particles: Particle[]) {
    this.updateInstancedMesh(particles);
    this.updateTrails(particles);
    this.updateGlowEffects(particles);
  }

  private updateInstancedMesh(particles: Particle[]) {
    if (this.particleInstancedMesh) {
      this.scene.remove(this.particleInstancedMesh);
      this.particleInstancedMesh.geometry.dispose();
      (this.particleInstancedMesh.material as THREE.Material).dispose();
    }

    if (particles.length === 0) return;

    const geo = new THREE.SphereGeometry(1, 12, 8);
    const mat = new THREE.MeshPhongMaterial({
      vertexColors: false,
      shininess: 80
    });

    this.particleInstancedMesh = new THREE.InstancedMesh(geo, mat, particles.length);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const scale = p.type === 'electron' ? 0.15 : 0.2;
      this.dummy.position.copy(p.position);
      this.dummy.scale.setScalar(scale * (p.highlight ? p.glowScale : 1));
      this.dummy.updateMatrix();
      this.particleInstancedMesh.setMatrixAt(i, this.dummy.matrix);
      this.particleInstancedMesh.setColorAt(i, p.color);
    }

    this.particleInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.particleInstancedMesh.instanceColor) {
      this.particleInstancedMesh.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.particleInstancedMesh);
  }

  private updateTrails(particles: Particle[]) {
    for (const [id, line] of this.trailLines) {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.trailLines.clear();

    for (const p of particles) {
      if (p.trail.length < 2) continue;

      const positions = new Float32Array(p.trail.length * 3);
      const colors = new Float32Array(p.trail.length * 4);

      for (let i = 0; i < p.trail.length; i++) {
        positions[i * 3] = p.trail[i].x;
        positions[i * 3 + 1] = p.trail[i].y;
        positions[i * 3 + 2] = p.trail[i].z;

        const alpha = i / p.trail.length;
        colors[i * 4] = p.color.r;
        colors[i * 4 + 1] = p.color.g;
        colors[i * 4 + 2] = p.color.b;
        colors[i * 4 + 3] = alpha * 0.6;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.LineBasicMaterial({
        color: p.color,
        transparent: true,
        opacity: 0.4,
        depthWrite: false
      });

      const line = new THREE.Line(geometry, material);
      this.trailLines.set(p.id, line);
      this.scene.add(line);
    }
  }

  private updateGlowEffects(particles: Particle[]) {
    for (const [id, mesh] of this.glowMeshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.glowMeshes.clear();

    for (const p of particles) {
      if (!p.highlight) continue;

      const glowGeo = new THREE.SphereGeometry(1, 16, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: p.color,
        transparent: true,
        opacity: 0.25,
        depthWrite: false
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      const scale = (p.type === 'electron' ? 0.15 : 0.2) * p.glowScale * 2.5;
      glowMesh.position.copy(p.position);
      glowMesh.scale.setScalar(scale);
      this.scene.add(glowMesh);
      this.glowMeshes.set(p.id, glowMesh);
    }
  }

  updateFieldFlow(time: number) {
    if (!this.fieldFlowLines) return;
    const period = 3;
    const offset = (time % period) / period;
    for (const child of this.fieldFlowLines.children) {
      child.position.y = offset * (FIELD_REGION_HEIGHT / 10);
    }
  }

  showCrosshair(show: boolean) {
    if (this.crosshairGroup) {
      this.crosshairGroup.visible = show;
    }
  }

  updateCamera(theta: number, phi: number, distance: number) {
    const x = distance * Math.sin(phi) * Math.cos(theta);
    const y = distance * Math.cos(phi);
    const z = distance * Math.sin(phi) * Math.sin(theta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.webglRenderer.setSize(width, height);
  }

  render() {
    this.webglRenderer.render(this.scene, this.camera);
  }

  dispose() {
    this.webglRenderer.dispose();
  }
}
