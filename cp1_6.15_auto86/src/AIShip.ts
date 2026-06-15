import * as THREE from 'three';
import { CONFIG, ShipState, eventEmitter } from './types';

export class AIShip {
  private scene: THREE.Scene;
  private mesh: THREE.Group = new THREE.Group();
  private state: ShipState;
  private name: string;
  private color: number;
  private boundingBox: THREE.Box3 = new THREE.Box3();
  private targetSpeed: number = 50;
  private speedEvalTimer: number = 0;
  private frameCounter: number = 0;
  private avoidTimer: number = 0;
  private avoidDirection: number = 0;
  private laneOffset: number = 0;
  private trackCurve: THREE.CatmullRomCurve3;
  private pitch: number = 0;

  constructor(scene: THREE.Scene, index: number, trackCurve: THREE.CatmullRomCurve3) {
    this.scene = scene;
    this.name = ['红隼号', '蓝燕号', '绿鹰号'][index] || `AI-${index + 1}`;
    this.color = CONFIG.COLORS.AI_COLORS[index] || CONFIG.COLORS.AI_COLORS[0];
    this.trackCurve = trackCurve;
    
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
  }

  private createMesh(): void {
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
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

    this.mesh.castShadow = true;
  }

  spawn(position: THREE.Vector3, direction: THREE.Vector3, laneOffset: number): void {
    this.laneOffset = laneOffset;
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
    this.targetSpeed = 50;
    this.speedEvalTimer = 0;
    this.avoidTimer = 0;
    
    this.mesh.position.copy(this.state.position);
    this.mesh.rotation.copy(this.state.rotation);
    this.scene.add(this.mesh);
    
    this.updateBoundingBox();
  }

  update(
    dt: number,
    playerPosition: THREE.Vector3,
    playerSpeed: number,
    isOnTrack: boolean,
    trackHeight: number,
    obstacles: Array<{ position: THREE.Vector3; boundingBox: THREE.Box3 }>
  ): void {
    this.frameCounter++;
    
    if (this.state.outOfControl) {
      this.state.outOfControlTimer -= dt;
      this.state.velocity.multiplyScalar(Math.max(0, 1 - dt * 3));
      if (this.state.outOfControlTimer <= 0) {
        this.state.outOfControl = false;
        this.state.energy = CONFIG.MAX_ENERGY * 0.3;
      }
    } else if (!this.state.isStunned) {
      if (this.frameCounter % CONFIG.AI_UPDATE_INTERVAL === 0) {
        this.updateAI(dt, playerPosition, playerSpeed, obstacles);
      }
    } else {
      this.state.stunTimer -= dt;
      if (this.state.stunTimer <= 0) {
        this.state.isStunned = false;
      }
    }

    if (this.avoidTimer > 0) {
      this.avoidTimer -= dt;
      this.state.rotation.y += this.avoidDirection * CONFIG.AI_AVOID_ANGLE * dt;
    }

    this.applySteering(dt);

    if (!isOnTrack) {
      this.state.velocity.y -= CONFIG.GRAVITY * dt;
    } else {
      const targetAltitude = trackHeight + 3;
      if (this.state.position.y < targetAltitude) {
        this.state.velocity.y += (targetAltitude - this.state.position.y) * dt * 5;
      }
      if (this.state.position.y > trackHeight + CONFIG.MAX_ALTITUDE) {
        this.state.velocity.y -= (this.state.position.y - (trackHeight + CONFIG.MAX_ALTITUDE)) * dt * 5;
      }
    }

    if (Math.abs(this.state.velocity.y) < 0.1 && isOnTrack && this.state.position.y < trackHeight + 3) {
      this.state.position.y = trackHeight + 3;
      this.state.velocity.y = 0;
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

  private updateAI(
    dt: number,
    playerPosition: THREE.Vector3,
    playerSpeed: number,
    obstacles: Array<{ position: THREE.Vector3; boundingBox: THREE.Box3 }>
  ): void {
    this.speedEvalTimer -= dt * CONFIG.AI_UPDATE_INTERVAL;
    if (this.speedEvalTimer <= 0) {
      const speedMultiplier = CONFIG.AI_SPEED_MIN + Math.random() * (CONFIG.AI_SPEED_MAX - CONFIG.AI_SPEED_MIN);
      this.targetSpeed = playerSpeed * speedMultiplier;
      this.targetSpeed = THREE.MathUtils.clamp(this.targetSpeed, 30, 180);
      this.speedEvalTimer = 5;
    }

    const forward = new THREE.Vector3(
      -Math.sin(this.state.rotation.y),
      0,
      -Math.cos(this.state.rotation.y)
    );

    const currentSpeed = this.state.speed;
    if (currentSpeed < this.targetSpeed) {
      const thrust = forward.clone().multiplyScalar(CONFIG.MAX_THRUST * 0.8 * dt * CONFIG.AI_UPDATE_INTERVAL);
      this.state.velocity.add(thrust);
    } else if (currentSpeed > this.targetSpeed) {
      const brake = forward.clone().multiplyScalar(-CONFIG.BRAKE_FORCE * 0.5 * dt * CONFIG.AI_UPDATE_INTERVAL);
      this.state.velocity.add(brake);
    }

    const currentProgress = this.state.progress;
    const lookAheadT = (currentProgress + 0.02) % 1;
    const targetPoint = this.trackCurve.getPoint(lookAheadT);
    
    const tangent = this.trackCurve.getTangent(lookAheadT).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    
    const playerOffset = playerPosition.clone().sub(targetPoint).dot(normal);
    const trackOffset = THREE.MathUtils.clamp(playerOffset * 0.5, -CONFIG.TRACK_WIDTH * CONFIG.AI_OFFSET_MAX, CONFIG.TRACK_WIDTH * CONFIG.AI_OFFSET_MAX);
    const finalOffset = this.laneOffset + trackOffset;
    
    const adjustedTarget = targetPoint.clone().add(normal.multiplyScalar(finalOffset));
    
    const toTarget = adjustedTarget.clone().sub(this.state.position);
    toTarget.y = 0;
    toTarget.normalize();
    
    const targetAngle = Math.atan2(toTarget.x, toTarget.z);
    const angleDiff = this.normalizeAngle(targetAngle - this.state.rotation.y);
    
    this.state.rotation.y += THREE.MathUtils.clamp(angleDiff, -CONFIG.TURN_SPEED * dt * CONFIG.AI_UPDATE_INTERVAL, CONFIG.TURN_SPEED * dt * CONFIG.AI_UPDATE_INTERVAL);

    const velocityForward = this.state.velocity.dot(forward);
    const turnRate = THREE.MathUtils.clamp(velocityForward / 50, -1, 1);
    this.pitch = -turnRate * 0.2;
    this.state.rotation.z = -turnRate * 0.3;

    const avoidDistance = this.targetSpeed * CONFIG.AI_AVOID_TIME;
    const futurePosition = this.state.position.clone().add(forward.clone().multiplyScalar(avoidDistance));
    
    for (const obstacle of obstacles) {
      const distToObstacle = futurePosition.distanceTo(obstacle.position);
      if (distToObstacle < 8) {
        this.avoidTimer = CONFIG.AI_AVOID_DURATION;
        this.avoidDirection = Math.random() > 0.5 ? 1 : -1;
        break;
      }
    }
  }

  private applySteering(dt: number): void {
    const targetRoll = this.avoidDirection * 0.3;
    this.state.rotation.z = THREE.MathUtils.lerp(
      this.state.rotation.z,
      targetRoll,
      CONFIG.ROLL_SPEED * dt
    );
  }

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
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
    
    eventEmitter.emit('collision', { ship: this.name, energy: this.state.energy });
  }

  collectEnergy(): void {
    this.state.energy = Math.min(CONFIG.MAX_ENERGY, this.state.energy + CONFIG.ENERGY_GAIN);
  }

  getPosition(): THREE.Vector3 {
    return this.state.position.clone();
  }

  getVelocity(): THREE.Vector3 {
    return this.state.velocity.clone();
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

  getName(): string {
    return this.name;
  }

  getColor(): string {
    return '#' + this.color.toString(16).padStart(6, '0');
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

  setTrackCurve(curve: THREE.CatmullRomCurve3): void {
    this.trackCurve = curve;
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
    this.targetSpeed = 50;
    this.speedEvalTimer = 0;
    this.avoidTimer = 0;
  }
}
