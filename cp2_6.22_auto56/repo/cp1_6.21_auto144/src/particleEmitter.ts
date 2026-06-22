import * as THREE from 'three';

export type ParticleType = 'electron' | 'proton' | 'alpha';

export interface SimulationParams {
  particleType: ParticleType;
  electricField: number;
  magneticField: number;
  initialSpeed: number;
  isPaused: boolean;
  isEmitting: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  glow: THREE.Mesh;
  trail: THREE.Line;
  trailPositions: THREE.Vector3[];
  velocity: THREE.Vector3;
  charge: number;
  mass: number;
  alive: boolean;
  birthTime: number;
}

const PARTICLE_CONFIG: Record<ParticleType, { charge: number; mass: number; color: number }> = {
  electron: { charge: -1, mass: 0.5, color: 0x3366FF },
  proton: { charge: 1, mass: 1, color: 0xFF3366 },
  alpha: { charge: 2, mass: 4, color: 0xFFFFFF }
};

const SCENE_BOUNDARY = 20;
const TRAIL_LENGTH = 20;
const MAX_PARTICLES = 500;
const EMIT_RATE = 10;
const PARTICLE_RADIUS = 0.08;

export function createParticleEmitter(scene: THREE.Scene) {
  const particles: Particle[] = [];
  let lastEmitTime = 0;
  let emitInterval = 1 / EMIT_RATE;
  let currentParams: SimulationParams = {
    particleType: 'electron',
    electricField: 0,
    magneticField: 0,
    initialSpeed: 5,
    isPaused: false,
    isEmitting: true
  };

  const particleGroup = new THREE.Group();
  scene.add(particleGroup);

  function createParticle(): Particle | null {
    if (particles.length >= MAX_PARTICLES) return null;

    const config = PARTICLE_CONFIG[currentParams.particleType];

    const geometry = new THREE.SphereGeometry(PARTICLE_RADIUS, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);

    const glowGeometry = new THREE.SphereGeometry(PARTICLE_RADIUS * 2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.4
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    const trailPositions: THREE.Vector3[] = [];
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      trailPositions.push(new THREE.Vector3(0, 0, 0));
    }

    const trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(TRAIL_LENGTH * 3);
    const colors = new Float32Array(TRAIL_LENGTH * 3);
    const colorObj = new THREE.Color(config.color);

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const alpha = 1 - (i / TRAIL_LENGTH);
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = colorObj.r * alpha;
      colors[i * 3 + 1] = colorObj.g * alpha;
      colors[i * 3 + 2] = colorObj.b * alpha;
    }

    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });
    const trail = new THREE.Line(trailGeometry, trailMaterial);

    particleGroup.add(mesh);
    particleGroup.add(trail);

    const velocity = new THREE.Vector3(0, 0, currentParams.initialSpeed);

    return {
      mesh,
      glow,
      trail,
      trailPositions,
      velocity,
      charge: config.charge,
      mass: config.mass,
      alive: true,
      birthTime: performance.now()
    };
  }

  function removeParticle(particle: Particle) {
    particleGroup.remove(particle.mesh);
    particleGroup.remove(particle.trail);
    particle.mesh.geometry.dispose();
    (particle.mesh.material as THREE.Material).dispose();
    particle.glow.geometry.dispose();
    (particle.glow.material as THREE.Material).dispose();
    particle.trail.geometry.dispose();
    (particle.trail.material as THREE.Material).dispose();
    particle.alive = false;
  }

  function clearAllParticles() {
    for (const particle of particles) {
      if (particle.alive) {
        removeParticle(particle);
      }
    }
    particles.length = 0;
  }

  function updateParticle(particle: Particle, dt: number, time: number) {
    if (!particle.alive || currentParams.isPaused) return;

    const E = new THREE.Vector3(currentParams.electricField * 0.01, 0, 0);
    const B = new THREE.Vector3(0, currentParams.magneticField * 0.01, 0);

    const v = particle.velocity;
    const q = particle.charge;
    const m = particle.mass;

    const lorentzForce = new THREE.Vector3()
      .addVectors(
        E.clone().multiplyScalar(q),
        new THREE.Vector3().crossVectors(v, B).multiplyScalar(q)
      );

    const acceleration = lorentzForce.divideScalar(m);
    particle.velocity.add(acceleration.multiplyScalar(dt));

    const speed = particle.velocity.length();
    if (speed > 30) {
      particle.velocity.normalize().multiplyScalar(30);
    }

    particle.mesh.position.add(particle.velocity.clone().multiplyScalar(dt));

    const breathCycle = (time % 1500) / 1500;
    const breathOpacity = 0.3 + 0.3 * Math.sin(breathCycle * Math.PI * 2);
    (particle.glow.material as THREE.MeshBasicMaterial).opacity = breathOpacity;
    particle.glow.scale.setScalar(1 + 0.2 * Math.sin(breathCycle * Math.PI * 2));

    particle.trailPositions.unshift(particle.mesh.position.clone());
    if (particle.trailPositions.length > TRAIL_LENGTH) {
      particle.trailPositions.pop();
    }

    const positionAttr = particle.trail.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const pos = particle.trailPositions[i] || particle.trailPositions[particle.trailPositions.length - 1];
      positionAttr.setXYZ(i, pos.x, pos.y, pos.z);
    }
    positionAttr.needsUpdate = true;

    const dist = particle.mesh.position.length();
    if (dist > SCENE_BOUNDARY) {
      removeParticle(particle);
    }
  }

  return {
    update(dt: number, time: number) {
      if (!currentParams.isPaused) {
        if (currentParams.isEmitting) {
          emitInterval = 1 / EMIT_RATE;
          if (time - lastEmitTime > emitInterval * 1000) {
            const newParticle = createParticle();
            if (newParticle) {
              particles.push(newParticle);
            }
            lastEmitTime = time;
          }
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        if (particle.alive) {
          updateParticle(particle, dt, time);
        } else {
          particles.splice(i, 1);
        }
      }
    },

    setParams(params: Partial<SimulationParams>) {
      const prevType = currentParams.particleType;
      currentParams = { ...currentParams, ...params };
      if (params.particleType !== undefined && params.particleType !== prevType) {
        clearAllParticles();
      }
      if (params.electricField !== undefined || params.magneticField !== undefined || params.initialSpeed !== undefined) {
        clearAllParticles();
      }
    },

    getParticleCount(): number {
      return particles.filter(p => p.alive).length;
    },

    getEmitRate(): number {
      return EMIT_RATE;
    },

    reset() {
      clearAllParticles();
      lastEmitTime = 0;
    },

    getCurrentParams(): SimulationParams {
      return { ...currentParams };
    }
  };
}

export type ParticleEmitter = ReturnType<typeof createParticleEmitter>;
