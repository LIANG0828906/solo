import * as THREE from 'three';
import { CONFIG, ShipState, eventEmitter } from './types';

export class PlayerShip {
  private scene: THREE.Scene;
  private mesh: THREE.Group = new THREE.Group();
  private state: ShipState;
  private keys: { [key: string]: boolean } = {};
  private boundingBox: THREE.Box3 = new THREE.Box3();
  private pitch: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.state = {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      energy: CONFIG.INITIAL_ENERGY,
      speed: 0,
      lap: 0,
      progress: 0,
      totalTime: 0,
      lastLapTime: 0,
      isStunned: false,
      stunTimer: 0,
      outOfControl: false,
      outOfControlTimer: 0,
    };
    this.createMesh();
    this.setupInput();
  }

  private createMesh(): void {
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.PLAYER_BODY,
      roughness: 0.6,
      metalness: 0.4,
    });
    
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.PLAYER_ACCENT,
      roughness: 0.3,
      metalness: 0.8,
    });

    const mainBody = new THREE.Mesh(
      new THREE.BoxGeometry(CONFIG.SHIP_LENGTH, CONFIG.SHIP_HEIGHT * 0.8, CONFIG.SHIP_WIDTH),
      bodyMaterial
    );
    mainBody.castShadow = true;
    this.mesh.add(mainBody);

    const frontCone = new THREE.Mesh(
      new THREE.ConeGeometry(CONFIG.SHIP_WIDTH * 0.4, CONFIG.SHIP_LENGTH * 0.4, 6),
      bodyMaterial
    );
    frontCone.rotation.z = -Math.PI / 2;
    frontCone.position.x = CONFIG.SHIP_LENGTH * 0.6;
    frontCone.castShadow = true;
    this.mesh.add(frontCone);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(CONFIG.SHIP_LENGTH * 0.3, CONFIG.SHIP_HEIGHT * 0.6, CONFIG.SHIP_WIDTH * 0.7),
      accentMaterial
    );
    cabin.position.y = CONFIG.SHIP_HEIGHT * 0.6;
    cabin.position.x = -CONFIG.SHIP_LENGTH * 0.1;
    cabin.castShadow = true;
    this.mesh.add(cabin);

    const leftWing = new THREE.Mesh(
      new THREE.BoxGeometry(CONFIG.SHIP_LENGTH * 0.4, CONFIG.SHIP_HEIGHT * 0.2, CONFIG.SHIP_WIDTH * 1.5),
      bodyMaterial
    );
    leftWing.position.z = CONFIG.SHIP_WIDTH * 0.8;
    leftWing.position.x = -CONFIG.SHIP_LENGTH * 0.1;
    leftWing.castShadow = true;
    this.mesh.add(leftWing);

    const rightWing = new THREE.Mesh(
      new THREE.BoxGeometry(CONFIG.SHIP_LENGTH * 0.4, CONFIG.SHIP_HEIGHT * 0.2, CONFIG.SHIP_WIDTH * 1.5),
      bodyMaterial
    );
    rightWing.position.z = -CONFIG.SHIP_WIDTH * 0.8;
    rightWing.position.x = -CONFIG.SHIP_LENGTH * 0.1;
    rightWing.castShadow = true;
    this.mesh.add(rightWing);

    const engine1 = new THREE.Mesh(
      new THREE.CylinderGeometry(CONFIG.SHIP_HEIGHT * 0.3, CONFIG.SHIP_HEIGHT * 0.35, CONFIG.SHIP_LENGTH * 0.3, 8),
      accentMaterial
    );
    engine1.rotation.z = Math.PI / 2;
    engine1.position.set(-CONFIG.SHIP_LENGTH * 0.5, 0, CONFIG.SHIP_WIDTH * 0.4);
    engine1.castShadow = true;
    this.mesh.add(engine1);

    const engine2 = new THREE.Mesh(
      new THREE.CylinderGeometry(CONFIG.SHIP_HEIGHT * 0.3, CONFIG.SHIP_HEIGHT * 0.35, CONFIG.SHIP_LENGTH * 0.3, 8),
      accentMaterial
    );
    engine2.rotation.z = Math.PI / 2;
    engine2.position.set(-CONFIG.SHIP_LENGTH * 0.5, 0, -CONFIG.SHIP_WIDTH * 0.4);
    engine2.castShadow = true;
    this.mesh.add(engine2);

    const propeller1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, CONFIG.SHIP_HEIGHT * 0.8, CONFIG.SHIP_WIDTH * 0.3),
      accentMaterial
    );
    propeller1.position.set(-CONFIG.SHIP_LENGTH * 0.7, 0, CONFIG.SHIP_WIDTH * 0.4);
    this.mesh.add(propeller1);

    const propeller2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, CONFIG.SHIP_HEIGHT * 0.8, CONFIG.SHIP_WIDTH * 0.3),
      accentMaterial
    );
    propeller2.position.set(-CONFIG.SHIP_LENGTH * 0.7, 0, -CONFIG.SHIP_WIDTH * 0.4);
    this.mesh.add(propeller2);

    this.mesh.castShadow = true;
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  spawn(position: THREE.Vector3, direction: THREE.Vector3): void {
    this.state.position.copy(position);
    this.state.position.y += 3;
    this.state.velocity.set(0, 0, 0);
    this.state.rotation.y = Math.atan2(direction.x, direction.z);
    this.state.energy = CONFIG.INITIAL_ENERGY;
    this.state.speed = 0;
    this.state.lap = 0;
    this.state.progress = 0;
    this.state.totalTime = 0;
    this.state.isStunned = false;
    this.state.outOfControl = false;
    
    this.mesh.position.copy(this.state.position);
    this.mesh.rotation.copy(this.state.rotation);
    this.scene.add(this.mesh);
    
    this.updateBoundingBox();
  }

  update(dt: number, isOnTrack: boolean, trackHeight: number): void {
    if (this.state.outOfControl) {
      this.state.outOfControlTimer -= dt;
      this.state.velocity.multiplyScalar(Math.max(0, 1 - dt * 3));
      if (this.state.outOfControlTimer <= 0) {
        this.state.outOfControl = false;
        this.state.energy = CONFIG.MAX_ENERGY * 0.3;
      }
    } else if (!this.state.isStunned) {
      this.handleInput(dt);
    } else {
      this.state.stunTimer -= dt;
      if (this.state.stunTimer <= 0) {
        this.state.isStunned = false;
      }
    }

    const maxAltitude = trackHeight + CONFIG.MAX_ALTITUDE;
    const minAltitude = trackHeight + 2;
    
    if (!isOnTrack) {
      this.state.velocity.y -= CONFIG.GRAVITY * dt;
      
      const altitudeAboveTrack = this.state.position.y - trackHeight;
      if (altitudeAboveTrack < 0) {
        this.state.velocity.y = Math.max(0, this.state.velocity.y);
        this.state.position.y = trackHeight;
      }
    } else {
      const liftFactor = THREE.MathUtils.clamp(1 - (this.state.position.y - trackHeight) / CONFIG.MAX_ALTITUDE, 0, 1);
      
      if (this.state.position.y < minAltitude) {
        this.state.velocity.y += (minAltitude - this.state.position.y) * dt * 8 * liftFactor;
      } else if (this.state.position.y > maxAltitude) {
        this.state.velocity.y -= (this.state.position.y - maxAltitude) * dt * 8;
      } else {
        const targetAltitude = minAltitude + 1;
        this.state.velocity.y += (targetAltitude - this.state.position.y) * dt * 2 * liftFactor;
      }
    }

    if (this.state.position.y < trackHeight) {
      this.state.position.y = trackHeight;
      this.state.velocity.y = Math.max(0, this.state.velocity.y);
    }

    this.state.position.add(this.state.velocity.clone().multiplyScalar(dt));

    const friction = 1 - CONFIG.FRICTION * dt;
    this.state.velocity.x *= friction;
    this.state.velocity.z *= friction;

    this.state.speed = Math.sqrt(
      this.state.velocity.x ** 2 + this.state.velocity.z ** 2
    );

    this.mesh.position.copy(this.state.position);
    this.mesh.rotation.set(this.pitch, this.state.rotation.y, this.state.rotation.z);

    this.updateBoundingBox();
  }

  private handleInput(dt: number): void {
    const forward = new THREE.Vector3(
      -Math.sin(this.state.rotation.y),
      0,
      -Math.cos(this.state.rotation.y)
    );

    if (this.keys['w']) {
      const thrust = forward.clone().multiplyScalar(CONFIG.MAX_THRUST * dt);
      this.state.velocity.add(thrust);
    }
    if (this.keys['s']) {
      const brake = forward.clone().multiplyScalar(-CONFIG.BRAKE_FORCE * dt);
      this.state.velocity.add(brake);
    }

    if (this.keys['a']) {
      this.state.rotation.y += CONFIG.TURN_SPEED * dt;
    }
    if (this.keys['d']) {
      this.state.rotation.y -= CONFIG.TURN_SPEED * dt;
    }

    const targetRoll = (this.keys['q'] ? 0.5 : 0) - (this.keys['e'] ? 0.5 : 0);
    this.state.rotation.z = THREE.MathUtils.lerp(
      this.state.rotation.z,
      targetRoll,
      CONFIG.ROLL_SPEED * dt
    );

    const velocityForward = this.state.velocity.dot(forward);
    const turnRate = THREE.MathUtils.clamp(velocityForward / 50, -1, 1);
    this.pitch = -turnRate * 0.2;
  }

  private updateBoundingBox(): void {
    this.boundingBox.setFromObject(this.mesh);
  }

  applyCollision(collisionNormal: THREE.Vector3, impactSpeed: number): void {
    const bounceVelocity = collisionNormal.clone().multiplyScalar(
      impactSpeed * CONFIG.BOUNCE_FORCE
    );
    this.state.velocity.copy(bounceVelocity);
    this.state.energy = Math.max(0, this.state.energy - CONFIG.ENERGY_LOSS);
    this.state.isStunned = true;
    this.state.stunTimer = CONFIG.STUN_DURATION;
    
    if (this.state.energy <= 0) {
      this.state.outOfControl = true;
      this.state.outOfControlTimer = CONFIG.OUT_OF_CONTROL_DURATION;
    }
    
    eventEmitter.emit('collision', { ship: 'player', energy: this.state.energy });
  }

  collectEnergy(): void {
    this.state.energy = Math.min(CONFIG.MAX_ENERGY, this.state.energy + CONFIG.ENERGY_GAIN);
    eventEmitter.emit('energyCollected', { energy: this.state.energy });
  }

  getPosition(): THREE.Vector3 {
    return this.state.position.clone();
  }

  getVelocity(): THREE.Vector3 {
    return this.state.velocity.clone();
  }

  getRotation(): THREE.Euler {
    return this.state.rotation.clone();
  }

  getEnergy(): number {
    return this.state.energy;
  }

  getSpeed(): number {
    return this.state.speed;
  }

  getState(): ShipState {
    return { ...this.state };
  }

  getBoundingBox(): THREE.Box3 {
    return this.boundingBox.clone();
  }

  getMesh(): THREE.Group {
    return this.mesh;
  }

  setLap(lap: number): void {
    this.state.lap = lap;
  }

  setProgress(progress: number): void {
    this.state.progress = progress;
  }

  setTotalTime(time: number): void {
    this.state.totalTime = time;
  }

  isOutOfControl(): boolean {
    return this.state.outOfControl;
  }

  removeFromScene(): void {
    this.scene.remove(this.mesh);
  }

  reset(): void {
    this.state.energy = CONFIG.INITIAL_ENERGY;
    this.state.speed = 0;
    this.state.lap = 0;
    this.state.progress = 0;
    this.state.totalTime = 0;
    this.state.isStunned = false;
    this.state.outOfControl = false;
    this.state.velocity.set(0, 0, 0);
    this.pitch = 0;
  }
}
