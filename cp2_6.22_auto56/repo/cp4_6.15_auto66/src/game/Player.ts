import * as THREE from 'three';
import { PlayerState, LANE_POSITIONS, JUMP_FORCE, GRAVITY, SLIDE_DURATION, MAX_PARTICLES } from '../types';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface PixelChunk {
  mesh: THREE.Mesh;
  originalLocal: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class Player {
  public group: THREE.Group;
  public state: PlayerState = 'idle';
  public currentLane: number = 1;
  public targetLane: number = 1;
  public yVelocity: number = 0;
  public slideTimer: number = 0;
  public isDead: boolean = false;

  private body: THREE.Group;
  private board: THREE.Mesh;
  private trailParticles: Particle[] = [];
  private pixelChunks: PixelChunk[] = [];
  private bodyChildren: THREE.Object3D[] = [];
  private particleGeometry: THREE.BoxGeometry;
  private chunkGeometry: THREE.BoxGeometry;
  private jumpCount: number = 0;

  private hitboxWidth = 1.2;
  private hitboxHeight = 2.0;
  private hitboxDepth = 1.0;

  private characterParts: THREE.Mesh[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.body = new THREE.Group();
    this.particleGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    this.chunkGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);

    this.board = this.createBoard();
    const character = this.createCharacter();

    this.body.add(character);
    this.group.add(this.board);
    this.group.add(this.body);

    this.group.position.set(LANE_POSITIONS[1], 0.5, 0);
  }

  private createBoard(): THREE.Mesh {
    const geo = new THREE.BoxGeometry(1.2, 0.1, 2.0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0;
    return mesh;
  }

  private createCharacter(): THREE.Group {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xbf40ff,
      emissive: 0x6a00b3,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.4,
    });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), bodyMat);
    torso.position.y = 0.9;
    group.add(torso);
    this.characterParts.push(torso);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0xffd54f,
        emissive: 0xff8f00,
        emissiveIntensity: 0.2,
      })
    );
    head.position.y = 1.5;
    group.add(head);
    this.characterParts.push(head);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.12, 0.15),
      new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x00e5ff,
        emissiveIntensity: 1.0,
      })
    );
    visor.position.set(0, 1.52, 0.18);
    group.add(visor);
    this.characterParts.push(visor);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.6, roughness: 0.3 });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), legMat);
    leftLeg.position.set(-0.15, 0.25, 0);
    group.add(leftLeg);
    this.characterParts.push(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), legMat);
    rightLeg.position.set(0.15, 0.25, 0);
    group.add(rightLeg);
    this.characterParts.push(rightLeg);

    const armMat = new THREE.MeshStandardMaterial({ color: 0xbf40ff, metalness: 0.4, roughness: 0.5 });
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.15), armMat);
    leftArm.position.set(-0.45, 0.85, 0);
    group.add(leftArm);
    this.characterParts.push(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.15), armMat);
    rightArm.position.set(0.45, 0.85, 0);
    group.add(rightArm);
    this.characterParts.push(rightArm);

    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        this.bodyChildren.push(obj);
      }
    });

    return group;
  }

  jump(): void {
    if (this.isDead) return;
    if (this.state === 'idle' || this.state === 'running') {
      this.state = 'jumping';
      this.yVelocity = JUMP_FORCE;
      this.jumpCount = 1;
      this.slideTimer = 0;
      this.spawnJumpParticles();
    } else if (this.state === 'jumping' && this.jumpCount < 2) {
      this.state = 'doubleJumping';
      this.yVelocity = JUMP_FORCE * 0.85;
      this.jumpCount = 2;
      this.spawnJumpParticles();
    }
  }

  slide(): void {
    if (this.isDead) return;
    if (this.state === 'idle' || this.state === 'running') {
      this.state = 'sliding';
      this.slideTimer = SLIDE_DURATION;
    }
  }

  moveLeft(): void {
    if (this.isDead) return;
    if (this.targetLane > 0) this.targetLane--;
  }

  moveRight(): void {
    if (this.isDead) return;
    if (this.targetLane < 2) this.targetLane++;
  }

  update(delta: number, scene: THREE.Scene): void {
    if (this.isDead) {
      this.updatePixelChunks(delta, scene);
      this.updateParticles(delta, scene);
      return;
    }

    const targetX = LANE_POSITIONS[this.targetLane];
    const diff = targetX - this.group.position.x;
    this.group.position.x += diff * Math.min(1, delta * 12);
    this.currentLane = this.targetLane;

    if (this.state === 'jumping' || this.state === 'doubleJumping') {
      this.yVelocity -= GRAVITY * delta;
      this.group.position.y += this.yVelocity * delta;

      if (this.group.position.y <= 0.5) {
        this.group.position.y = 0.5;
        this.yVelocity = 0;
        this.state = 'running';
        this.jumpCount = 0;
      }
    }

    if (this.state === 'sliding') {
      this.slideTimer -= delta;
      this.body.scale.y = 0.4;
      this.body.position.y = -0.3;
      this.hitboxHeight = 0.8;

      if (this.slideTimer <= 0) {
        this.state = 'running';
        this.body.scale.y = 1.0;
        this.body.position.y = 0;
        this.hitboxHeight = 2.0;
      }

      this.spawnSlideParticles();
    }

    if (this.state === 'running' || this.state === 'idle') {
      this.body.rotation.x = Math.sin(Date.now() * 0.01) * 0.05;
      this.board.rotation.z = Math.sin(Date.now() * 0.008) * 0.03;
    }

    this.updateParticles(delta, scene);
  }

  private spawnJumpParticles(): void {
    const colors = [0xbf40ff, 0x00e5ff, 0xff4081, 0xffd54f];
    for (let i = 0; i < 12; i++) {
      if (this.trailParticles.length >= MAX_PARTICLES) break;
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
      });
      const mesh = new THREE.Mesh(this.particleGeometry, mat);
      mesh.position.copy(this.group.position);
      mesh.position.y -= 0.3;
      mesh.position.x += (Math.random() - 0.5) * 0.5;
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        -Math.random() * 4 - 1,
        (Math.random() - 0.5) * 2
      );
      const maxLife = 0.5 + Math.random() * 0.5;
      this.trailParticles.push({ mesh, velocity: vel, life: maxLife, maxLife });
    }
  }

  private spawnSlideParticles(): void {
    if (Math.random() > 0.3) return;
    if (this.trailParticles.length >= MAX_PARTICLES) return;
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
    });
    const mesh = new THREE.Mesh(this.particleGeometry, mat);
    mesh.position.copy(this.group.position);
    mesh.position.y = 0.1;
    mesh.position.z += 0.8;
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 1,
      Math.random() * 0.5,
      Math.random() * 2 + 1
    );
    const maxLife = 0.3 + Math.random() * 0.3;
    this.trailParticles.push({ mesh, velocity: vel, life: maxLife, maxLife });
  }

  private updateParticles(delta: number, scene: THREE.Scene): void {
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.life -= delta;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        (p.mesh.material as THREE.MeshBasicMaterial).dispose();
        this.trailParticles.splice(i, 1);
        continue;
      }
      p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.y -= 5 * delta;
      const alpha = p.life / p.maxLife;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      p.mesh.scale.setScalar(alpha);
      if (!p.mesh.parent) {
        scene.add(p.mesh);
      }
    }
  }

  explode(scene: THREE.Scene): void {
    this.isDead = true;
    this.state = 'dead';

    this.shatterIntoPixelChunks(scene);

    const colors = [0xbf40ff, 0x00e5ff, 0xff4081, 0xffd54f];
    for (let i = 0; i < 30; i++) {
      if (this.trailParticles.length >= MAX_PARTICLES) break;
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
      });
      const mesh = new THREE.Mesh(this.particleGeometry, mat);
      mesh.position.copy(this.group.position);
      mesh.position.y += Math.random() * 1.5;
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 10 + 3,
        (Math.random() - 0.5) * 10
      );
      const maxLife = 0.8 + Math.random() * 1.2;
      this.trailParticles.push({ mesh, velocity: vel, life: maxLife, maxLife });
    }

    this.updatePixelChunks(0, scene);
  }

  private shatterIntoPixelChunks(scene: THREE.Scene): void {
    const partsToShatter = [...this.characterParts, this.board];

    const bbox = new THREE.Box3().setFromObject(this.group);
    const bboxSize = new THREE.Vector3();
    bbox.getSize(bboxSize);
    const bboxAvg = (bboxSize.x + bboxSize.y + bboxSize.z) / 3;
    const CHUNK_DIVISOR = 12;
    const chunkSize = Math.max(0.06, Math.min(0.25, bboxAvg / CHUNK_DIVISOR));
    console.log(`[Player] 包围盒尺寸: ${bboxSize.x.toFixed(2)}×${bboxSize.y.toFixed(2)}×${bboxSize.z.toFixed(2)} 平均值:${bboxAvg.toFixed(2)} → chunkSize:${chunkSize.toFixed(3)}`);

    for (const part of partsToShatter) {
      const worldPos = new THREE.Vector3();
      part.getWorldPosition(worldPos);

      const mat = part.material as THREE.MeshStandardMaterial;
      const chunkColor = mat?.color?.getHex() ?? 0xbf40ff;
      const emissiveColor = mat?.emissive?.getHex() ?? 0x000000;
      const emissiveIntensity = mat?.emissiveIntensity ?? 0;

      const geo = part.geometry as THREE.BoxGeometry;
      const params = geo?.parameters ?? { width: 0.5, height: 0.5, depth: 0.5 };
      const w = params.width ?? 0.4;
      const h = params.height ?? 0.4;
      const d = params.depth ?? 0.4;

      const nx = Math.max(2, Math.ceil(w / chunkSize));
      const ny = Math.max(2, Math.ceil(h / chunkSize));
      const nz = Math.max(2, Math.ceil(d / chunkSize));

      const totalChunks = nx * ny * nz;

      for (let ix = 0; ix < nx; ix++) {
        for (let iy = 0; iy < ny; iy++) {
          for (let iz = 0; iz < nz; iz++) {
            if (this.pixelChunks.length >= MAX_PARTICLES) break;

            const size = chunkSize * 0.6;
            const geoChunk = new THREE.BoxGeometry(size, size, size);
            const chunkMat = new THREE.MeshStandardMaterial({
              color: chunkColor,
              emissive: emissiveColor,
              emissiveIntensity: emissiveIntensity * 0.5,
              metalness: 0.7,
              roughness: 0.4,
              transparent: true,
            });

            const chunk = new THREE.Mesh(geoChunk, chunkMat);

            const localX = -w / 2 + chunkSize / 2 + ix * chunkSize + (Math.random() - 0.5) * chunkSize * 0.4;
            const localY = -h / 2 + chunkSize / 2 + iy * chunkSize + (Math.random() - 0.5) * chunkSize * 0.4;
            const localZ = -d / 2 + chunkSize / 2 + iz * chunkSize + (Math.random() - 0.5) * chunkSize * 0.4;

            const originalLocal = new THREE.Vector3(localX, localY, localZ);
            const worldChunkPos = new THREE.Vector3().copy(originalLocal).add(worldPos);

            chunk.position.copy(worldChunkPos);

            const explodeDir = worldChunkPos.clone().sub(this.group.position).normalize();
            explodeDir.x += (Math.random() - 0.5) * 0.5;
            explodeDir.y += Math.random() * 0.8 + 0.3;
            explodeDir.z += (Math.random() - 0.5) * 0.5;
            explodeDir.normalize();

            const speed = 3 + Math.random() * 7;
            const velocity = new THREE.Vector3(
              explodeDir.x * speed,
              explodeDir.y * speed + Math.random() * 4,
              explodeDir.z * speed
            );

            const angularVel = new THREE.Vector3(
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 10
            );

            scene.add(chunk);

            this.pixelChunks.push({
              mesh: chunk,
              originalLocal,
              velocity,
              angularVelocity: angularVel,
              life: 1.2 + Math.random() * 1.0,
              maxLife: 1.8 + Math.random() * 1.0,
            });
          }
        }
      }
    }

    for (const child of this.bodyChildren) {
      if (child instanceof THREE.Mesh) {
        child.visible = false;
      }
    }
    this.board.visible = false;
    this.body.visible = false;
  }

  private updatePixelChunks(delta: number, scene: THREE.Scene): void {
    for (let i = this.pixelChunks.length - 1; i >= 0; i--) {
      const chunk = this.pixelChunks[i];
      chunk.life -= delta;

      if (chunk.life <= 0) {
        scene.remove(chunk.mesh);
        chunk.mesh.geometry.dispose();
        const mat = chunk.mesh.material as THREE.MeshStandardMaterial;
        mat.dispose();
        this.pixelChunks.splice(i, 1);
        continue;
      }

      chunk.velocity.y -= 14 * delta;
      chunk.mesh.position.add(chunk.velocity.clone().multiplyScalar(delta));

      chunk.mesh.rotation.x += chunk.angularVelocity.x * delta;
      chunk.mesh.rotation.y += chunk.angularVelocity.y * delta;
      chunk.mesh.rotation.z += chunk.angularVelocity.z * delta;

      const alpha = Math.max(0, chunk.life / chunk.maxLife);
      const mat = chunk.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = alpha;
      mat.emissiveIntensity = 0.3 * alpha;

      const scale = 0.6 + alpha * 0.6;
      chunk.mesh.scale.setScalar(scale);
    }
  }

  reset(): void {
    this.isDead = false;
    this.state = 'running';
    this.currentLane = 1;
    this.targetLane = 1;
    this.yVelocity = 0;
    this.slideTimer = 0;
    this.jumpCount = 0;

    for (const child of this.bodyChildren) {
      if (child instanceof THREE.Mesh) {
        child.visible = true;
      }
    }
    this.board.visible = true;
    this.body.visible = true;
    this.body.scale.y = 1.0;
    this.body.position.y = 0;
    this.hitboxHeight = 2.0;
    this.group.position.set(LANE_POSITIONS[1], 0.5, 0);
  }

  getHitbox(): { x: number; y: number; z: number; width: number; height: number; depth: number } {
    return {
      x: this.group.position.x,
      y: this.group.position.y + this.hitboxHeight / 2,
      z: this.group.position.z,
      width: this.hitboxWidth,
      height: this.hitboxHeight,
      depth: this.hitboxDepth,
    };
  }
}
