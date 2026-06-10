import * as THREE from 'three';

class CollisionSystem {
  constructor(scene, starSystem, onStardustCollected) {
    this.scene = scene;
    this.starSystem = starSystem;
    this.onStardustCollected = onStardustCollected;

    this.maxParticles = 200;
    this.activeExplosions = [];
    this.stardustParticles = [];
    this.particlePool = [];

    this.initParticlePool();
  }

  initParticlePool() {
    const poolSize = this.maxParticles;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(poolSize * 3);
    const colors = new Float32Array(poolSize * 3);
    const sizes = new Float32Array(poolSize);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particlesMesh = new THREE.Points(geometry, material);
    this.scene.add(this.particlesMesh);

    for (let i = 0; i < poolSize; i++) {
      this.particlePool.push({
        active: false,
        index: i,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        maxLife: 1.5,
        size: 1,
        type: 'explosion'
      });
    }

    this.positionsAttr = this.particlesMesh.geometry.attributes.position;
    this.colorsAttr = this.particlesMesh.geometry.attributes.color;
    this.sizesAttr = this.particlesMesh.geometry.attributes.size;
  }

  checkCollisions() {
    const bodies = this.starSystem.getBodies ? this.starSystem.getBodies() : [];
    const collisions = [];

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const bodyA = bodies[i];
        const bodyB = bodies[j];

        if (!bodyA.mesh || !bodyB.mesh) continue;

        const distance = bodyA.mesh.position.distanceTo(bodyB.mesh.position);
        const radiusA = bodyA.radius || 1;
        const radiusB = bodyB.radius || 1;

        if (distance < radiusA + radiusB) {
          collisions.push({ bodyA, bodyB });
        }
      }
    }

    for (const collision of collisions) {
      this.handleCollision(collision.bodyA, collision.bodyB);
    }
  }

  handleCollision(bodyA, bodyB) {
    const midPoint = new THREE.Vector3()
      .addVectors(bodyA.mesh.position, bodyB.mesh.position)
      .multiplyScalar(0.5);

    const color1 = bodyA.color || new THREE.Color(0xffffff);
    const color2 = bodyB.color || new THREE.Color(0xffffff);

    this.createExplosion(midPoint, color1, color2);
    this.spawnStardust(midPoint, color1, color2);

    if (this.starSystem.removeBody) {
      this.starSystem.removeBody(bodyA);
      this.starSystem.removeBody(bodyB);
    }
  }

  createExplosion(position, color1, color2) {
    const particleCount = Math.min(50, this.getAvailableParticleCount());

    if (particleCount < 10) return;

    const mixedColor = new THREE.Color().lerpColors(color1, color2, 0.5);

    for (let i = 0; i < particleCount; i++) {
      const particle = this.getInactiveParticle();
      if (!particle) break;

      particle.active = true;
      particle.type = 'explosion';
      particle.position.copy(position);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 2 + Math.random() * 3;

      particle.velocity.set(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );

      const colorVariation = Math.random();
      if (colorVariation < 0.33) {
        particle.color.copy(color1);
      } else if (colorVariation < 0.66) {
        particle.color.copy(color2);
      } else {
        particle.color.copy(mixedColor);
      }

      particle.life = 1.5;
      particle.maxLife = 1.5;
      particle.size = 0.8 + Math.random() * 0.4;
    }

    this.activeExplosions.push({
      position: position.clone(),
    });
  }

  spawnStardust(position, color1, color2) {
    const stardustCount = 5 + Math.floor(Math.random() * 6);

    for (let i = 0; i < stardustCount; i++) {
      const particle = this.getInactiveParticle();
      if (!particle) break;

      particle.active = true;
      particle.type = 'stardust';
      particle.position.copy(position);

      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3
      );
      particle.position.add(offset);

      particle.velocity.set(
        (Math.random() - 0.5) * 0.5,
        1 + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      );

      particle.color.copy(color1).lerp(color2, Math.random());
      particle.life = 3;
      particle.maxLife = 3;
      particle.size = 0.5 + Math.random() * 0.3;

      this.stardustParticles.push(particle);
    }

    if (this.onStardustCollected) {
      this.onStardustCollected(stardustCount);
    }
  }

  getAvailableParticleCount() {
    return this.particlePool.filter(p => !p.active).length;
  }

  getInactiveParticle() {
    return this.particlePool.find(p => !p.active);
  }

  update(deltaTime) {
    this.checkCollisions();

    const positions = this.positionsAttr.array;
    const colors = this.colorsAttr.array;
    const sizes = this.sizesAttr.array;

    for (let i = 0; i < this.particlePool.length; i++) {
      const particle = this.particlePool[i];

      if (!particle.active) {
        sizes[i] = 0;
        continue;
      }

      particle.life -= deltaTime;

      if (particle.life <= 0) {
        particle.active = false;

        const stardustIndex = this.stardustParticles.indexOf(particle);
        if (stardustIndex > -1) {
          this.stardustParticles.splice(stardustIndex, 1);
        }

        sizes[i] = 0;
        continue;
      }

      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));

      if (particle.type === 'explosion') {
        particle.velocity.multiplyScalar(0.98);
      } else if (particle.type === 'stardust') {
        particle.velocity.y += deltaTime * 0.5;
      }

      const alpha = particle.life / particle.maxLife;

      const idx = i * 3;
      positions[idx] = particle.position.x;
      positions[idx + 1] = particle.position.y;
      positions[idx + 2] = particle.position.z;

      colors[idx] = particle.color.r;
      colors[idx + 1] = particle.color.g;
      colors[idx + 2] = particle.color.b;

      sizes[i] = particle.size * alpha;
    }

    this.positionsAttr.needsUpdate = true;
    this.colorsAttr.needsUpdate = true;
    this.sizesAttr.needsUpdate = true;

    this.activeExplosions = this.activeExplosions.filter(e => {
      return this.particlePool.some(p => p.active && p.type === 'explosion');
    });
  }

  dispose() {
    if (this.particlesMesh) {
      this.scene.remove(this.particlesMesh);
      this.particlesMesh.geometry.dispose();
      this.particlesMesh.material.dispose();
    }
  }
}

export default CollisionSystem;
