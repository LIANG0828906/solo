import * as THREE from 'three';

const MOVE_SPEED = 10;
const BOOST_MULTIPLIER = 1.5;
const BOOST_DURATION = 2;
const BOOST_COOLDOWN = 3;
const JUMP_HEIGHT = 3;
const JUMP_DURATION = 0.8;
const INITIAL_SPEED = 10;
const MAX_SPEED = 30;
const SPEED_INCREMENT = 2;
const SPEED_INCREMENT_SCORE = 1000;

export class Player {
  private scene: THREE.Scene;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private velocity = new THREE.Vector3();
  private speed = INITIAL_SPEED;
  private isJumping = false;
  private jumpTime = 0;
  private jumpStartY = 0;
  private isBoosting = false;
  private boostTime = 0;
  private boostCooldown = 0;
  private energy = 100;
  private maxEnergy = 100;
  private lives = 3;
  private isHit = false;
  private hitTime = 0;
  private trailParticles: THREE.Mesh[] = [];
  private particlePool: THREE.Mesh[] = [];
  private maxParticles = 50;
  private particleLifetime = 0.6;
  private activeParticles: { mesh: THREE.Mesh; life: number; maxLife: number }[] = [];

  private keys: { [key: string]: boolean } = {
    'KeyA': false,
    'KeyD': false,
    'KeyW': false,
    'Space': false
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 0.5, 0);
    this.mesh = this.createMotorcycle();
    this.scene.add(this.mesh);
    this.initParticleSystem();
    this.setupControls();
  }

  private createMotorcycle(): THREE.Group {
    const group = new THREE.Group();
    const scale = 1.3;

    const bodyGeometry = new THREE.BoxGeometry(0.6 * scale, 0.3 * scale, 2 * scale);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x111122,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x220044,
      emissiveIntensity: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4 * scale;
    group.add(body);

    const cockpitGeometry = new THREE.BoxGeometry(0.4 * scale, 0.25 * scale, 0.7 * scale);
    const cockpitMaterial = new THREE.MeshStandardMaterial({
      color: 0x00FFFF,
      emissive: 0x00FFFF,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.9
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.75 * scale, -0.2 * scale);
    group.add(cockpit);

    const frontLightGeometry = new THREE.SphereGeometry(0.15 * scale, 8, 8);
    const frontLightMaterial = new THREE.MeshStandardMaterial({
      color: 0x00FFFF,
      emissive: 0x00FFFF,
      emissiveIntensity: 2.5
    });
    
    const leftLight = new THREE.Mesh(frontLightGeometry, frontLightMaterial);
    leftLight.position.set(-0.2 * scale, 0.45 * scale, -1 * scale);
    group.add(leftLight);

    const rightLight = new THREE.Mesh(frontLightGeometry, frontLightMaterial.clone());
    rightLight.position.set(0.2 * scale, 0.45 * scale, -1 * scale);
    group.add(rightLight);

    const wheelGeometry = new THREE.TorusGeometry(0.3 * scale, 0.1 * scale, 8, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF00FF,
      emissive: 0xFF00FF,
      emissiveIntensity: 1.5
    });

    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.y = Math.PI / 2;
    frontWheel.position.set(0, 0.3 * scale, -0.8 * scale);
    group.add(frontWheel);

    const rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial.clone());
    rearWheel.rotation.y = Math.PI / 2;
    rearWheel.position.set(0, 0.3 * scale, 0.8 * scale);
    group.add(rearWheel);

    const tailGeometry = new THREE.ConeGeometry(0.25 * scale, 0.6 * scale, 8);
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF00FF,
      emissive: 0xFF00FF,
      emissiveIntensity: 1.5
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.rotation.x = Math.PI;
    tail.position.set(0, 0.5 * scale, 1.2 * scale);
    group.add(tail);

    const engineGlowGeometry = new THREE.SphereGeometry(0.2 * scale, 8, 8);
    const engineGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x9933FF,
      transparent: true,
      opacity: 0.8
    });
    const engineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
    engineGlow.position.set(0, 0.35 * scale, 0.9 * scale);
    group.add(engineGlow);

    const stripeGeometry = new THREE.BoxGeometry(0.05 * scale, 0.02 * scale, 1.8 * scale);
    const stripeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00FFFF,
      transparent: true,
      opacity: 0.9
    });
    const leftStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    leftStripe.position.set(-0.25 * scale, 0.56 * scale, 0);
    group.add(leftStripe);

    const rightStripe = new THREE.Mesh(stripeGeometry, stripeMaterial.clone());
    rightStripe.position.set(0.25 * scale, 0.56 * scale, 0);
    group.add(rightStripe);

    group.position.copy(this.position);
    return group;
  }

  private initParticleSystem() {
    for (let i = 0; i < this.maxParticles; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: 0x9933FF,
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.visible = false;
      this.scene.add(particle);
      this.particlePool.push(particle);
    }
  }

  private emitTrailParticle() {
    if (this.activeParticles.length >= this.maxParticles) return;

    let particle: THREE.Mesh | undefined;
    for (const p of this.particlePool) {
      if (!p.visible) {
        particle = p;
        break;
      }
    }

    if (!particle) return;

    particle.visible = true;
    particle.position.set(
      this.position.x + (Math.random() - 0.5) * 0.3,
      this.position.y + 0.3 + Math.random() * 0.2,
      this.position.z + 1.2
    );
    (particle.material as THREE.MeshBasicMaterial).opacity = 1;
    (particle.material as THREE.MeshBasicMaterial).color.setHex(0x9933FF);
    particle.scale.setScalar(1);

    this.activeParticles.push({
      mesh: particle,
      life: this.particleLifetime,
      maxLife: this.particleLifetime
    });
  }

  private updateTrailParticles(deltaTime: number) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life -= deltaTime;

      if (p.life <= 0) {
        p.mesh.visible = false;
        this.activeParticles.splice(i, 1);
      } else {
        const t = p.life / p.maxLife;
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = t;
        p.mesh.scale.setScalar(t);
        
        const color = new THREE.Color();
        color.setHSL(0.75 * t + 0.6, 1, 0.6);
        (p.mesh.material as THREE.MeshBasicMaterial).color = color;
      }
    }
  }

  private setupControls() {
    document.addEventListener('keydown', (e) => {
      if (e.code in this.keys) {
        this.keys[e.code] = true;
        if (e.code === 'Space') {
          e.preventDefault();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code in this.keys) {
        this.keys[e.code] = false;
      }
    });
  }

  update(deltaTime: number, score: number) {
    const baseSpeed = INITIAL_SPEED + Math.floor(score / SPEED_INCREMENT_SCORE) * SPEED_INCREMENT;
    this.speed = Math.min(MAX_SPEED, baseSpeed);

    let currentSpeed = this.speed;
    
    if (this.boostCooldown > 0) {
      this.boostCooldown -= deltaTime;
    }

    if (this.isBoosting) {
      this.boostTime -= deltaTime;
      if (this.boostTime <= 0) {
        this.isBoosting = false;
        this.boostCooldown = BOOST_COOLDOWN;
      } else {
        currentSpeed *= BOOST_MULTIPLIER;
      }
    }

    if (this.keys['KeyW'] && !this.isBoosting && this.boostCooldown <= 0 && this.energy >= 20) {
      this.isBoosting = true;
      this.boostTime = BOOST_DURATION;
      this.energy -= 20;
    }

    let moveX = 0;
    if (this.keys['KeyA']) moveX -= 1;
    if (this.keys['KeyD']) moveX += 1;

    if (moveX !== 0) {
      this.velocity.x = moveX * MOVE_SPEED;
    } else {
      this.velocity.x *= 0.9;
    }

    if (this.keys['Space'] && !this.isJumping) {
      this.isJumping = true;
      this.jumpTime = JUMP_DURATION;
      this.jumpStartY = this.position.y;
    }

    if (this.isJumping) {
      this.jumpTime -= deltaTime;
      const t = 1 - this.jumpTime / JUMP_DURATION;
      const jumpProgress = Math.sin(t * Math.PI);
      this.position.y = this.jumpStartY + jumpProgress * JUMP_HEIGHT;

      if (this.jumpTime <= 0) {
        this.isJumping = false;
        this.position.y = this.jumpStartY;
      }
    }

    this.position.x += this.velocity.x * deltaTime;

    const roadWidth = 10;
    this.position.x = Math.max(-roadWidth / 2 + 0.5, Math.min(roadWidth / 2 - 0.5, this.position.x));

    if (this.isHit) {
      this.hitTime -= deltaTime;
      if (this.hitTime <= 0) {
        this.isHit = false;
        this.mesh.visible = true;
      } else {
        this.mesh.visible = Math.floor(this.hitTime * 10) % 2 === 0;
      }
    }

    if (this.isBoosting) {
      for (let i = 0; i < 3; i++) {
        this.emitTrailParticle();
      }
    } else {
      this.emitTrailParticle();
    }
    this.updateTrailParticles(deltaTime);

    this.mesh.position.copy(this.position);
    this.mesh.rotation.z = -this.velocity.x * 0.02;

    this.energy = Math.max(0, this.energy - deltaTime * 5);

    return currentSpeed;
  }

  takeDamage(): boolean {
    if (this.isHit) return false;

    this.lives--;
    this.isHit = true;
    this.hitTime = 1;
    this.speed *= 0.5;

    setTimeout(() => {
      this.speed = Math.min(MAX_SPEED, this.speed * 2);
    }, 1000);

    return this.lives <= 0;
  }

  collectEnergy() {
    this.energy = Math.min(this.maxEnergy, this.energy + 20);
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getSpeed(): number {
    return this.speed;
  }

  getEnergy(): number {
    return this.energy;
  }

  getMaxEnergy(): number {
    return this.maxEnergy;
  }

  getLives(): number {
    return this.lives;
  }

  isHitActive(): boolean {
    return this.isHit;
  }

  reset() {
    this.position.set(0, 0.5, 0);
    this.velocity.set(0, 0, 0);
    this.speed = INITIAL_SPEED;
    this.isJumping = false;
    this.jumpTime = 0;
    this.isBoosting = false;
    this.boostTime = 0;
    this.boostCooldown = 0;
    this.energy = this.maxEnergy;
    this.lives = 3;
    this.isHit = false;
    this.hitTime = 0;
    this.mesh.position.copy(this.position);
    this.mesh.visible = true;

    for (const p of this.activeParticles) {
      p.mesh.visible = false;
    }
    this.activeParticles = [];
  }

  getMesh(): THREE.Group {
    return this.mesh;
  }
}
