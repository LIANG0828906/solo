import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

const COLOR_PALETTE = [
  0x9B59B6,
  0x3498DB,
  0x2ECC71,
  0xF39C12,
];

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

interface Fragment {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationVelocity: THREE.Vector3;
  life: number;
}

export class Crystal {
  public id: string;
  public mesh: THREE.Group;
  public crystalMesh: THREE.Mesh;
  public edges: THREE.LineSegments;
  public position: THREE.Vector3;
  public hoverRing: THREE.Mesh;

  private color: number;
  private opacity: number;
  private height: number;
  private faces: number;
  private material: THREE.MeshPhysicalMaterial;
  private edgesMaterial: THREE.LineBasicMaterial;

  private isHovered: boolean = false;
  private isAnimating: boolean = false;
  private targetScale: number = 1;
  private currentScale: number = 1;

  private particles: Particle[] = [];
  private fragments: Fragment[] = [];
  private ringAnimationProgress: number = 0;
  private ringActive: boolean = false;

  private scene: THREE.Scene;
  private baseColor: number;

  constructor(position: THREE.Vector3, scene: THREE.Scene) {
    this.id = uuidv4();
    this.position = position.clone();
    this.scene = scene;

    this.faces = Math.floor(Math.random() * 7) + 6;
    this.height = Math.random() * 1.7 + 0.8;
    this.opacity = Math.random() * 0.3 + 0.6;
    this.baseColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    this.color = this.baseColor;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    this.mesh.userData.crystal = this;

    this.material = this.createMaterial();
    this.crystalMesh = new THREE.Mesh(this.generateGeometry(), this.material);
    this.crystalMesh.castShadow = true;
    this.crystalMesh.receiveShadow = true;

    this.edgesMaterial = this.createEdgesMaterial();
    this.edges = this.createEdges();

    this.hoverRing = this.createHoverRing();

    this.mesh.add(this.crystalMesh);
    this.mesh.add(this.edges);
    this.mesh.add(this.hoverRing);

    this.crystalMesh.userData.crystal = this;
    this.edges.userData.crystal = this;
  }

  private generateGeometry(): THREE.BufferGeometry {
    const bottomRadius = this.height * 0.25;
    const topRadius = bottomRadius * 0.4;
    const geometry = new THREE.CylinderGeometry(
      topRadius,
      bottomRadius,
      this.height,
      this.faces,
      1,
      false
    );

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      const jitterAmount = 0.05;
      const jitterX = (Math.random() - 0.5) * jitterAmount;
      const jitterY = y > 0 ? (Math.random() - 0.5) * jitterAmount * 0.5 : 0;
      const jitterZ = (Math.random() - 0.5) * jitterAmount;

      positions.setX(i, x + jitterX);
      positions.setY(i, y + jitterY + this.height * 0.5);
      positions.setZ(i, z + jitterZ);
    }

    geometry.computeVertexNormals();
    return geometry;
  }

  private createMaterial(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: this.color,
      transparent: true,
      opacity: this.opacity,
      transmission: 0.6,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: this.color,
      emissiveIntensity: 0.15,
      side: THREE.DoubleSide,
    });
  }

  private createEdgesMaterial(): THREE.LineBasicMaterial {
    const edgeColor = new THREE.Color(this.color).multiplyScalar(1.3);
    return new THREE.LineBasicMaterial({
      color: edgeColor,
      transparent: true,
      opacity: 0.9,
    });
  }

  private createEdges(): THREE.LineSegments {
    const edgesGeometry = new THREE.EdgesGeometry(this.crystalMesh.geometry, 15);
    const edges = new THREE.LineSegments(edgesGeometry, this.edgesMaterial);
    return edges;
  }

  private createHoverRing(): THREE.Mesh {
    const ringGeometry = new THREE.RingGeometry(0.3, 0.32, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    return ring;
  }

  public hoverOn(): void {
    if (this.isHovered || this.isAnimating) return;
    this.isHovered = true;
    this.targetScale = 1.05;
    this.material.emissiveIntensity = 0.4;
    this.ringActive = true;
    this.ringAnimationProgress = 0;
  }

  public hoverOff(): void {
    if (!this.isHovered) return;
    this.isHovered = false;
    this.targetScale = 1;
    this.material.emissiveIntensity = 0.15;
  }

  public animateBurst(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.hoverOff();

    this.spawnFragments();
    this.spawnParticles();

    this.crystalMesh.visible = false;
    this.edges.visible = false;

    setTimeout(() => {
      this.regenCrystal();
    }, 500);
  }

  private spawnFragments(): void {
    const fragmentCount = Math.floor(Math.random() * 3) + 6;

    for (let i = 0; i < fragmentCount; i++) {
      const fragmentGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
      const fragmentMat = new THREE.MeshPhysicalMaterial({
        color: this.color,
        transparent: true,
        opacity: this.opacity,
        emissive: this.color,
        emissiveIntensity: 0.3,
      });

      const fragmentMesh = new THREE.Mesh(fragmentGeo, fragmentMat);
      fragmentMesh.position.copy(this.mesh.position);
      fragmentMesh.position.y += this.height * 0.5;

      const angle = (i / fragmentCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        1 + Math.random() * 2,
        Math.sin(angle) * speed
      );

      const rotationVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );

      this.scene.add(fragmentMesh);
      this.fragments.push({
        mesh: fragmentMesh,
        velocity,
        rotationVelocity,
        life: 1.5,
      });
    }
  }

  private spawnParticles(): void {
    const particleCount = Math.floor(Math.random() * 21) + 30;

    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 0.2 + 0.1;
      const particleGeo = new THREE.SphereGeometry(size, 8, 8);
      const particleColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
      const particleMat = new THREE.MeshBasicMaterial({
        color: particleColor,
        transparent: true,
        opacity: 1,
      });

      const particleMesh = new THREE.Mesh(particleGeo, particleMat);
      particleMesh.position.copy(this.mesh.position);
      particleMesh.position.y += this.height * 0.5;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2 + Math.random() * 3;
      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 1,
        Math.sin(phi) * Math.sin(theta) * speed
      );

      this.scene.add(particleMesh);
      this.particles.push({
        mesh: particleMesh,
        velocity,
        life: 2,
        maxLife: 2,
        size,
      });
    }
  }

  private regenCrystal(): void {
    this.faces = Math.floor(Math.random() * 7) + 6;
    this.height = Math.random() * 1.7 + 0.8;
    this.opacity = Math.random() * 0.3 + 0.6;

    const baseColorObj = new THREE.Color(this.baseColor);
    const hueShift = (Math.random() - 0.5) * 0.1;
    const hsl = { h: 0, s: 0, l: 0 };
    baseColorObj.getHSL(hsl);
    hsl.h = (hsl.h + hueShift + 1) % 1;
    hsl.s = Math.min(1, hsl.s + (Math.random() - 0.5) * 0.1);
    hsl.l = Math.min(0.8, Math.max(0.3, hsl.l + (Math.random() - 0.5) * 0.1));
    this.color = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l).getHex();

    const oldGeometry = this.crystalMesh.geometry;
    const oldEdgesGeometry = this.edges.geometry;

    this.crystalMesh.geometry = this.generateGeometry();
    this.material.color.setHex(this.color);
    this.material.opacity = this.opacity;
    this.material.emissive.setHex(this.color);

    const newEdgeColor = new THREE.Color(this.color).multiplyScalar(1.3);
    this.edgesMaterial.color.copy(newEdgeColor);
    this.edges.geometry.dispose();
    this.edges.geometry = new THREE.EdgesGeometry(this.crystalMesh.geometry, 15);

    oldGeometry.dispose();
    oldEdgesGeometry.dispose();

    this.animateGrow(0.5).then(() => {
      this.isAnimating = false;
    });
  }

  public animateShrink(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startScale = this.currentScale;
      const startTime = performance.now();

      const animate = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        this.currentScale = startScale * (1 - easeProgress);
        this.mesh.scale.setScalar(this.currentScale);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.crystalMesh.visible = false;
          this.edges.visible = false;
          resolve();
        }
      };

      animate();
    });
  }

  public animateGrow(duration: number): Promise<void> {
    return new Promise((resolve) => {
      this.crystalMesh.visible = true;
      this.edges.visible = true;

      const startScale = 0.01;
      const endScale = 1;
      const startTime = performance.now();

      const animate = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        this.currentScale = startScale + (endScale - startScale) * easeProgress;
        this.mesh.scale.setScalar(this.currentScale);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.currentScale = endScale;
          resolve();
        }
      };

      animate();
    });
  }

  public update(deltaTime: number): void {
    const scaleDiff = this.targetScale - this.currentScale;
    if (Math.abs(scaleDiff) > 0.001) {
      this.currentScale += scaleDiff * deltaTime * 8;
      this.mesh.scale.setScalar(this.currentScale);
    }

    if (this.ringActive) {
      this.ringAnimationProgress += deltaTime;
      const ringDuration = 1;
      const ringProgress = Math.min(this.ringAnimationProgress / ringDuration, 1);

      const ringMat = this.hoverRing.material as THREE.MeshBasicMaterial;
      const ringScale = 0.3 + ringProgress * 0.3;
      this.hoverRing.scale.setScalar(ringScale / 0.3);
      ringMat.opacity = (1 - ringProgress) * 0.6;

      if (ringProgress >= 1) {
        this.ringActive = false;
        ringMat.opacity = 0;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life -= deltaTime;

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        (particle.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      particle.velocity.y -= 3 * deltaTime;
      particle.mesh.position.addScaledVector(particle.velocity, deltaTime);
      (particle.mesh.material as THREE.MeshBasicMaterial).opacity = particle.life / particle.maxLife;
      particle.mesh.scale.setScalar(particle.life / particle.maxLife);
    }

    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const fragment = this.fragments[i];
      fragment.life -= deltaTime;

      if (fragment.life <= 0) {
        this.scene.remove(fragment.mesh);
        fragment.mesh.geometry.dispose();
        (fragment.mesh.material as THREE.Material).dispose();
        this.fragments.splice(i, 1);
        continue;
      }

      fragment.velocity.y -= 4 * deltaTime;
      fragment.mesh.position.addScaledVector(fragment.velocity, deltaTime);
      fragment.mesh.rotation.x += fragment.rotationVelocity.x * deltaTime;
      fragment.mesh.rotation.y += fragment.rotationVelocity.y * deltaTime;
      fragment.mesh.rotation.z += fragment.rotationVelocity.z * deltaTime;
      (fragment.mesh.material as THREE.MeshPhysicalMaterial).opacity =
        (fragment.life / 1.5) * this.opacity;
    }
  }

  public dispose(): void {
    this.scene.remove(this.mesh);
    this.crystalMesh.geometry.dispose();
    this.material.dispose();
    this.edges.geometry.dispose();
    this.edgesMaterial.dispose();
    this.hoverRing.geometry.dispose();
    (this.hoverRing.material as THREE.Material).dispose();

    for (const particle of this.particles) {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];

    for (const fragment of this.fragments) {
      this.scene.remove(fragment.mesh);
      fragment.mesh.geometry.dispose();
      (fragment.mesh.material as THREE.Material).dispose();
    }
    this.fragments = [];
  }
}
