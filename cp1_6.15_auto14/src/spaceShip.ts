import * as THREE from 'three';
import { gameState } from './gameState';

type ShipAnimationState = 'idle' | 'flying' | 'loading' | 'unloading';

class SpaceShip {
  private scene: THREE.Scene;
  private shipGroup: THREE.Group;
  private bodyMesh!: THREE.Mesh;
  private cargoMesh!: THREE.Mesh;
  private engineGlow!: THREE.Mesh;
  private shieldMesh!: THREE.Mesh;
  private trailParticles: THREE.Points;
  private trailPositions: Float32Array;
  private trailCount: number = 0;
  private maxTrailParticles: number = 500;
  private coinParticles: THREE.Points;
  private coinPositions: Float32Array;
  private coinVelocities: Float32Array;
  private coinCount: number = 0;
  private maxCoinParticles: number = 200;
  
  private animationState: ShipAnimationState = 'idle';
  private targetPosition: THREE.Vector3 | null = null;
  private flightStartTime: number = 0;
  private flightDuration: number = 3000;
  private startPosition: THREE.Vector3 = new THREE.Vector3();
  private flightProgress: number = 0;
  private loadingProgress: number = 0;
  
  private onFlightComplete: (() => void) | null = null;
  private onLoadingComplete: (() => void) | null = null;

  private cargoLevel: number = 0;
  private engineIntensity: number = 1;
  private shieldOpacity: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.shipGroup = new THREE.Group();
    
    this.trailPositions = new Float32Array(this.maxTrailParticles * 3);
    this.trailParticles = this.createTrailParticles();
    
    this.coinPositions = new Float32Array(this.maxCoinParticles * 3);
    this.coinVelocities = new Float32Array(this.maxCoinParticles * 3);
    this.coinParticles = this.createCoinParticles();
    
    this.createShipModel();
    this.setupInitialPosition();
    this.setupEventListeners();
    
    this.scene.add(this.shipGroup);
  }

  private createShipModel(): void {
    const bodyGeometry = new THREE.ConeGeometry(0.8, 3, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a90d9,
      shininess: 100,
      specular: 0x666666
    });
    this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.bodyMesh.rotation.x = Math.PI / 2;
    this.shipGroup.add(this.bodyMesh);

    const wingGeometry = new THREE.BoxGeometry(3, 0.1, 1);
    const wingMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a7bc8,
      shininess: 80
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.z = 0.5;
    this.shipGroup.add(wings);

    const cargoGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.5);
    const cargoMaterial = new THREE.MeshPhongMaterial({
      color: 0x6b8e23,
      shininess: 40
    });
    this.cargoMesh = new THREE.Mesh(cargoGeometry, cargoMaterial);
    this.cargoMesh.position.z = -0.5;
    this.updateCargoSize();
    this.shipGroup.add(this.cargoMesh);

    const cockpitGeometry = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshPhongMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.7,
      shininess: 100
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.y = 0.3;
    cockpit.position.z = 0.8;
    cockpit.rotation.x = -Math.PI / 2;
    this.shipGroup.add(cockpit);

    const engineGeometry = new THREE.CylinderGeometry(0.2, 0.4, 0.6, 16);
    const engineMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 100
    });
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.z = -1.5;
    engine.rotation.x = Math.PI / 2;
    this.shipGroup.add(engine);

    const glowGeometry = new THREE.CylinderGeometry(0.3, 0.1, 1, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6
    });
    this.engineGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.engineGlow.position.z = -2;
    this.engineGlow.rotation.x = Math.PI / 2;
    this.shipGroup.add(this.engineGlow);

    const shieldGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    const shieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    this.shipGroup.add(this.shieldMesh);

    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 8);
    const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.y = 1;
    antenna.position.z = 0.3;
    this.shipGroup.add(antenna);

    const antennaTipGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const antennaTipMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const antennaTip = new THREE.Mesh(antennaTipGeometry, antennaTipMaterial);
    antennaTip.position.y = 1.5;
    antennaTip.position.z = 0.3;
    this.shipGroup.add(antennaTip);
  }

  private createTrailParticles(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    
    const colors = new Float32Array(this.maxTrailParticles * 3);
    for (let i = 0; i < this.maxTrailParticles; i++) {
      const alpha = 1 - i / this.maxTrailParticles;
      colors[i * 3] = 0.3 + alpha * 0.7;
      colors[i * 3 + 1] = 0.5 + alpha * 0.5;
      colors[i * 3 + 2] = 1;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const sizes = new Float32Array(this.maxTrailParticles);
    for (let i = 0; i < this.maxTrailParticles; i++) {
      sizes[i] = (1 - i / this.maxTrailParticles) * 0.5;
    }
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    this.scene.add(particles);
    
    return particles;
  }

  private createCoinParticles(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.coinPositions, 3));
    
    const colors = new Float32Array(this.maxCoinParticles * 3);
    for (let i = 0; i < this.maxCoinParticles; i++) {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.84;
      colors[i * 3 + 2] = 0;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    this.scene.add(particles);
    
    return particles;
  }

  private setupInitialPosition(): void {
    const ship = gameState.getShip();
    this.shipGroup.position.set(ship.position.x, ship.position.y, ship.position.z);
    
    const firstPlanetId = gameState.getShip().currentPlanetId;
    if (firstPlanetId) {
      const planet = gameState.getPlanet(firstPlanetId);
      if (planet) {
        this.shipGroup.position.set(
          planet.position.x,
          planet.position.y + planet.size + 2,
          planet.position.z
        );
      }
    }

    this.updateCargoSize();
    this.updateEngineIntensity();
  }

  private setupEventListeners(): void {
    window.addEventListener('coin-fountain', this.handleCoinFountain.bind(this));
    window.addEventListener('ship-upgraded', this.handleShipUpgraded.bind(this));
  }

  private handleCoinFountain(event: Event): void {
    const customEvent = event as CustomEvent;
    const position = customEvent.detail.position;
    this.spawnCoinFountain(new THREE.Vector3(position.x, position.y, position.z));
  }

  private handleShipUpgraded(): void {
    this.updateCargoSize();
    this.updateEngineIntensity();
    this.updateShieldLevel();
  }

  private updateCargoSize(): void {
    const ship = gameState.getShip();
    const cargoRatio = ship.cargoCapacity / ship.baseCargoCapacity;
    this.cargoMesh.scale.set(1, 1 + (cargoRatio - 1) * 0.5, cargoRatio);
    this.updateCargoLevel();
  }

  private updateCargoLevel(): void {
    const ship = gameState.getShip();
    const cargoUsed = ship.cargo.reduce((sum, item) => sum + item.quantity, 0);
    const cargoRatio = cargoUsed / ship.cargoCapacity;
    this.cargoLevel = cargoRatio;
    
    const cargoMaterial = this.cargoMesh.material as THREE.MeshPhongMaterial;
    cargoMaterial.emissive = new THREE.Color(0, cargoRatio * 0.3, 0);
  }

  private updateEngineIntensity(): void {
    const ship = gameState.getShip();
    this.engineIntensity = ship.engineSpeed / ship.baseEngineSpeed;
    
    const glowMaterial = this.engineGlow.material as THREE.MeshBasicMaterial;
    glowMaterial.opacity = 0.4 + this.engineIntensity * 0.4;
    glowMaterial.color.setHSL(0.5 + (this.engineIntensity - 1) * 0.1, 1, 0.5);
    
    this.engineGlow.scale.setScalar(this.engineIntensity);
  }

  private updateShieldLevel(): void {
    const ship = gameState.getShip();
    const shieldRatio = ship.shieldLevel / ship.baseShieldLevel;
    this.shieldOpacity = Math.min(0.3, (shieldRatio - 1) * 0.3);
    
    const shieldMaterial = this.shieldMesh.material as THREE.MeshBasicMaterial;
    shieldMaterial.opacity = this.shieldOpacity;
    shieldMaterial.color.setHSL(0.5, 1, 0.5);
  }

  public flyTo(planetId: string, onComplete?: () => void): boolean {
    if (this.animationState === 'flying') {
      return false;
    }

    const targetPlanet = gameState.getPlanet(planetId);
    if (!targetPlanet) {
      return false;
    }

    const currentPlanetId = gameState.getShip().currentPlanetId;
    if (currentPlanetId === planetId) {
      return false;
    }

    this.targetPosition = new THREE.Vector3(
      targetPlanet.position.x,
      targetPlanet.position.y + targetPlanet.size + 2,
      targetPlanet.position.z
    );
    
    this.startPosition.copy(this.shipGroup.position);
    this.flightStartTime = Date.now();
    
    const distance = this.startPosition.distanceTo(this.targetPosition);
    const ship = gameState.getShip();
    this.flightDuration = Math.max(2000, Math.min(4000, (distance / 10) * 1000 / ship.engineSpeed));
    
    this.animationState = 'flying';
    this.flightProgress = 0;
    this.onFlightComplete = onComplete || null;
    
    gameState.setIsFlying(true);
    gameState.setTargetPlanet(planetId);
    gameState.setCurrentPlanet(null);
    
    this.lookAtTarget();
    
    return true;
  }

  private lookAtTarget(): void {
    if (!this.targetPosition) return;
    
    const direction = new THREE.Vector3()
      .subVectors(this.targetPosition, this.shipGroup.position)
      .normalize();
    
    const lookAtPoint = new THREE.Vector3()
      .copy(this.shipGroup.position)
      .add(direction);
    
    this.shipGroup.lookAt(lookAtPoint);
    this.shipGroup.rotateX(Math.PI / 2);
  }

  public playLoadingAnimation(onComplete?: () => void): void {
    this.animationState = 'loading';
    this.loadingProgress = 0;
    this.onLoadingComplete = onComplete || null;
  }

  public playUnloadingAnimation(onComplete?: () => void): void {
    this.animationState = 'unloading';
    this.loadingProgress = 0;
    this.onLoadingComplete = onComplete || null;
  }

  private spawnCoinFountain(position: THREE.Vector3): void {
    const count = Math.min(50, this.maxCoinParticles - this.coinCount);
    
    for (let i = 0; i < count; i++) {
      const index = this.coinCount * 3;
      this.coinPositions[index] = position.x + (Math.random() - 0.5) * 2;
      this.coinPositions[index + 1] = position.y + 1;
      this.coinPositions[index + 2] = position.z + (Math.random() - 0.5) * 2;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.coinVelocities[index] = Math.cos(angle) * speed;
      this.coinVelocities[index + 1] = 3 + Math.random() * 2;
      this.coinVelocities[index + 2] = Math.sin(angle) * speed;
      
      this.coinCount++;
    }
    
    const positionAttribute = this.coinParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
    positionAttribute.needsUpdate = true;
  }

  private addTrailParticle(): void {
    if (this.trailCount >= this.maxTrailParticles) {
      for (let i = 0; i < this.maxTrailParticles - 1; i++) {
        this.trailPositions[i * 3] = this.trailPositions[(i + 1) * 3];
        this.trailPositions[i * 3 + 1] = this.trailPositions[(i + 1) * 3 + 1];
        this.trailPositions[i * 3 + 2] = this.trailPositions[(i + 1) * 3 + 2];
      }
      this.trailCount = this.maxTrailParticles - 1;
    }

    const index = this.trailCount * 3;
    const glowPos = new THREE.Vector3();
    this.engineGlow.getWorldPosition(glowPos);
    
    this.trailPositions[index] = glowPos.x + (Math.random() - 0.5) * 0.3;
    this.trailPositions[index + 1] = glowPos.y + (Math.random() - 0.5) * 0.3;
    this.trailPositions[index + 2] = glowPos.z + (Math.random() - 0.5) * 0.3;
    
    this.trailCount++;

    const positionAttribute = this.trailParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
    positionAttribute.needsUpdate = true;
    this.trailParticles.geometry.setDrawRange(0, this.trailCount);
  }

  private updateFlight(_deltaTime: number): void {
    if (!this.targetPosition) return;

    const elapsed = Date.now() - this.flightStartTime;
    this.flightProgress = Math.min(1, elapsed / this.flightDuration);
    
    const easeProgress = this.easeInOutCubic(this.flightProgress);
    
    const midPoint = new THREE.Vector3()
      .addVectors(this.startPosition, this.targetPosition)
      .multiplyScalar(0.5);
    
    const height = this.startPosition.distanceTo(this.targetPosition) * 0.3;
    midPoint.y += height;
    
    const curve = new THREE.QuadraticBezierCurve3(
      this.startPosition,
      midPoint,
      this.targetPosition
    );
    
    const newPosition = curve.getPoint(easeProgress);
    this.shipGroup.position.copy(newPosition);
    
    if (easeProgress < 1) {
      const nextPoint = curve.getPoint(Math.min(1, easeProgress + 0.01));
      const lookAtPoint = new THREE.Vector3()
        .copy(newPosition)
        .add(nextPoint.clone().sub(newPosition).normalize());
      
      this.shipGroup.lookAt(lookAtPoint);
      this.shipGroup.rotateX(Math.PI / 2);
    }
    
    gameState.setShipPosition(
      newPosition.x,
      newPosition.y,
      newPosition.z
    );
    
    if (this.flightProgress < 0.9 && Math.random() < 0.5) {
      this.addTrailParticle();
    }
    
    const glowMaterial = this.engineGlow.material as THREE.MeshBasicMaterial;
    glowMaterial.opacity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
    
    if (this.flightProgress >= 1) {
      this.completeFlight();
    }
  }

  private completeFlight(): void {
    this.animationState = 'idle';
    gameState.setIsFlying(false);
    
    const targetPlanetId = gameState.getShip().targetPlanetId;
    if (targetPlanetId) {
      gameState.setCurrentPlanet(targetPlanetId);
      gameState.setTargetPlanet(null);
      
      const planet = gameState.getPlanet(targetPlanetId);
      if (planet) {
        this.shipGroup.position.set(
          planet.position.x,
          planet.position.y + planet.size + 2,
          planet.position.z
        );
        gameState.setShipPosition(
          planet.position.x,
          planet.position.y + planet.size + 2,
          planet.position.z
        );
      }
    }
    
    const glowMaterial = this.engineGlow.material as THREE.MeshBasicMaterial;
    glowMaterial.opacity = 0.6;
    
    if (this.onFlightComplete) {
      this.onFlightComplete();
      this.onFlightComplete = null;
    }
    
    const event = new CustomEvent('planet-arrived', {
      detail: { planetId: targetPlanetId }
    });
    window.dispatchEvent(event);
  }

  private updateLoading(deltaTime: number): void {
    this.loadingProgress += deltaTime * 2;
    
    const scale = 1 + Math.sin(this.loadingProgress * Math.PI * 4) * 0.1;
    this.cargoMesh.scale.y = (1 + (this.cargoLevel - 1) * 0.5) * scale;
    
    if (this.loadingProgress >= 1) {
      this.animationState = 'idle';
      this.updateCargoSize();
      
      if (this.onLoadingComplete) {
        this.onLoadingComplete();
        this.onLoadingComplete = null;
      }
    }
  }

  private updateCoinParticles(deltaTime: number): void {
    const gravity = -9.8;
    const damping = 0.98;
    
    for (let i = 0; i < this.coinCount; i++) {
      const index = i * 3;
      
      this.coinVelocities[index + 1] += gravity * deltaTime;
      
      this.coinPositions[index] += this.coinVelocities[index] * deltaTime;
      this.coinPositions[index + 1] += this.coinVelocities[index + 1] * deltaTime;
      this.coinPositions[index + 2] += this.coinVelocities[index + 2] * deltaTime;
      
      this.coinVelocities[index] *= damping;
      this.coinVelocities[index + 1] *= damping;
      this.coinVelocities[index + 2] *= damping;
      
      if (this.coinPositions[index + 1] < -5) {
        for (let j = i; j < this.coinCount - 1; j++) {
          for (let k = 0; k < 3; k++) {
            this.coinPositions[j * 3 + k] = this.coinPositions[(j + 1) * 3 + k];
            this.coinVelocities[j * 3 + k] = this.coinVelocities[(j + 1) * 3 + k];
          }
        }
        this.coinCount--;
        i--;
      }
    }
    
    const positionAttribute = this.coinParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
    positionAttribute.needsUpdate = true;
    this.coinParticles.geometry.setDrawRange(0, this.coinCount);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public update(deltaTime: number): void {
    switch (this.animationState) {
      case 'flying':
        this.updateFlight(deltaTime);
        break;
      case 'loading':
      case 'unloading':
        this.updateLoading(deltaTime);
        break;
      case 'idle':
        this.idleAnimation(deltaTime);
        break;
    }
    
    this.updateCoinParticles(deltaTime);
    
    if (this.shieldOpacity > 0) {
      const shieldMaterial = this.shieldMesh.material as THREE.MeshBasicMaterial;
      shieldMaterial.opacity = this.shieldOpacity * (0.5 + Math.sin(Date.now() * 0.002) * 0.5);
    }

    this.updateCargoLevel();
  }

  private idleAnimation(_deltaTime: number): void {
    const bobOffset = Math.sin(Date.now() * 0.002) * 0.1;
    const ship = gameState.getShip();
    const currentPlanetId = ship.currentPlanetId;
    
    if (currentPlanetId) {
      const planet = gameState.getPlanet(currentPlanetId);
      if (planet) {
        this.shipGroup.position.y = planet.position.y + planet.size + 2 + bobOffset;
      }
    }
    
    this.shipGroup.rotation.z = Math.sin(Date.now() * 0.001) * 0.05;
  }

  public getPosition(): THREE.Vector3 {
    return this.shipGroup.position.clone();
  }

  public getGroup(): THREE.Group {
    return this.shipGroup;
  }

  public dispose(): void {
    this.shipGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    this.trailParticles.geometry.dispose();
    (this.trailParticles.material as THREE.Material).dispose();
    
    this.coinParticles.geometry.dispose();
    (this.coinParticles.material as THREE.Material).dispose();
    
    window.removeEventListener('coin-fountain', this.handleCoinFountain.bind(this));
    window.removeEventListener('ship-upgraded', this.handleShipUpgraded.bind(this));
  }
}

export { SpaceShip };
