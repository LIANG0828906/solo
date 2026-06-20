import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CatapultModel } from './CatapultModel';
import { ProjectilePhysics } from './ProjectilePhysics';
import { UI, FireParams, HistoryRecord } from './UI';

class App {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  clock: THREE.Clock;

  catapult: CatapultModel;
  physics: ProjectilePhysics;
  ui: UI;

  ground!: THREE.Mesh;
  trajectoryLine: THREE.Line | null = null;
  impactMarkers!: THREE.Group;
  quickTestArea: THREE.Line | null = null;

  private activeProjectile: THREE.Mesh | null = null;
  private projectileVelocity: THREE.Vector3 = new THREE.Vector3();
  private isFiring: boolean = false;
  private flightTime: number = 0;

  private trailParticles: THREE.Points | null = null;
  private trailPool: { position: THREE.Vector3; life: number; maxLife: number }[] = [];
  private readonly MAX_TRAIL_PARTICLES = 50;

  private explosionEffects: {
    ring: THREE.Mesh;
    dustParticles: THREE.Points;
    dustData: { velocity: THREE.Vector3; life: number; maxLife: number }[];
    startTime: number;
  }[] = [];

  private readonly MAX_PARTICLES = 200;

  constructor() {
    const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xF5E6CA);
    this.scene.fog = new THREE.Fog(0xF5E6CA, 40, 100);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(12, 10, 18);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.set(0, 2, 0);

    this.clock = new THREE.Clock();

    this.setupLights();
    this.createGround();

    this.catapult = new CatapultModel();
    this.scene.add(this.catapult.catapultGroup);

    this.physics = new ProjectilePhysics();
    this.ui = new UI();

    this.impactMarkers = new THREE.Group();
    this.scene.add(this.impactMarkers);

    this.bindUI();
    this.setupResizeHandler();
    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(-8, 12, -8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    const spotLight = new THREE.SpotLight(0xffffff, 0.5);
    spotLight.position.set(0, 18, 0);
    spotLight.angle = (15 * Math.PI) / 180;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(spotLight);
  }

  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
    const positions = groundGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      const noise = (Math.sin(x * 0.3) + Math.cos(z * 0.3)) * 0.15 + (Math.random() - 0.5) * 0.1;
      positions.setZ(i, noise);
    }
    groundGeometry.computeVertexNormals();

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#D4B896';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const s = Math.random() * 2 + 0.5;
      ctx.fillStyle = `rgba(${100 + Math.random() * 60}, ${80 + Math.random() * 50}, ${50 + Math.random() * 40}, ${0.1 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
    const groundTexture = new THREE.CanvasTexture(canvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(8, 8);

    const groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture,
      color: 0xC8A878,
      roughness: 1.0,
      metalness: 0.0
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    const gridHelper = new THREE.GridHelper(60, 60, 0x8B5A2B, 0xA88868);
    (gridHelper.material as THREE.Material).opacity = 0.2;
    (gridHelper.material as THREE.Material).transparent = true;
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }

  private bindUI(): void {
    this.ui.onWeightChange((kg) => {
      this.catapult.setWeight(kg);
      this.physics.setWeight(kg);
      this.updateTrajectoryPreview();
    });

    this.ui.onLeverChange((ratio) => {
      this.catapult.setLeverPosition(ratio);
      this.physics.setLeverPosition(ratio);
      this.updateTrajectoryPreview();
    });

    this.ui.onAngleChange((deg) => {
      this.catapult.setAngle(deg);
      this.physics.setAngle(deg);
      this.updateTrajectoryPreview();
    });

    this.ui.onFire(() => this.fire());
    this.ui.onReset(() => this.resetAll());
    this.ui.onQuickTest(() => this.runQuickTest());
  }

  private updateTrajectoryPreview(): void {
    if (this.isFiring) return;
    this.clearTrajectoryLine();

    const startPos = this.catapult.getProjectileStartPosition();
    const points = this.physics.getTrajectoryPoints(startPos, 0.05);

    if (points.length < 2) return;

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0xFFD700,
      dashSize: 0.3,
      gapSize: 0.2,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.5
    });

    this.trajectoryLine = new THREE.Line(geometry, material);
    this.trajectoryLine.computeLineDistances();
    this.scene.add(this.trajectoryLine);
  }

  private clearTrajectoryLine(): void {
    if (this.trajectoryLine) {
      this.scene.remove(this.trajectoryLine);
      this.trajectoryLine.geometry.dispose();
      (this.trajectoryLine.material as THREE.Material).dispose();
      this.trajectoryLine = null;
    }
  }

  private fire(): void {
    if (this.isFiring) return;
    this.isFiring = true;
    this.ui.setFireButtonDisabled(true);

    const params = this.ui.getCurrentSliderValues();
    this.physics.setWeight(params.weight);
    this.physics.setLeverPosition(params.leverRatio);
    this.physics.setAngle(params.angle);

    this.clearTrajectoryLine();

    const startPos = this.catapult.getProjectileStartPosition();
    const trajectoryPoints = this.physics.getTrajectoryPoints(startPos);

    const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
    const trajectoryMaterial = new THREE.LineDashedMaterial({
      color: 0xFFD700,
      dashSize: 0.3,
      gapSize: 0.2,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.7
    });
    this.trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
    this.trajectoryLine.computeLineDistances();
    this.scene.add(this.trajectoryLine);

    this.activeProjectile = this.catapult.detachProjectile();
    this.scene.add(this.activeProjectile);
    this.activeProjectile.position.copy(startPos);

    this.projectileVelocity.copy(this.physics.calculateInitialVelocity());
    this.flightTime = 0;

    this.initTrailParticles();

    const impactPoint = this.physics.getImpactPoint(startPos);
    const impactDistance = this.physics.getImpactDistance(startPos);

    this.waitForImpact(params, impactPoint, impactDistance);
  }

  private initTrailParticles(): void {
    this.clearTrailParticles();
    this.trailPool = [];

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.MAX_TRAIL_PARTICLES * 3);
    const colors = new Float32Array(this.MAX_TRAIL_PARTICLES * 3);
    const sizes = new Float32Array(this.MAX_TRAIL_PARTICLES);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.trailParticles = new THREE.Points(geometry, material);
    this.scene.add(this.trailParticles);
  }

  private clearTrailParticles(): void {
    if (this.trailParticles) {
      this.scene.remove(this.trailParticles);
      this.trailParticles.geometry.dispose();
      (this.trailParticles.material as THREE.Material).dispose();
      this.trailParticles = null;
    }
    this.trailPool = [];
  }

  private addTrailParticle(position: THREE.Vector3): void {
    if (!this.trailParticles || this.trailPool.length >= this.MAX_TRAIL_PARTICLES) return;

    this.trailPool.push({
      position: position.clone(),
      life: 1.0,
      maxLife: 1.0
    });
    this.updateTrailParticleBuffer();
  }

  private updateTrailParticles(delta: number): void {
    if (!this.trailParticles) return;

    for (let i = this.trailPool.length - 1; i >= 0; i--) {
      this.trailPool[i].life -= delta;
      if (this.trailPool[i].life <= 0) {
        this.trailPool.splice(i, 1);
      }
    }
    this.updateTrailParticleBuffer();
  }

  private updateTrailParticleBuffer(): void {
    if (!this.trailParticles) return;

    const positions = this.trailParticles.geometry.attributes.position as THREE.BufferAttribute;
    const colors = this.trailParticles.geometry.attributes.color as THREE.BufferAttribute;
    const sizes = this.trailParticles.geometry.attributes.size as THREE.BufferAttribute;
    const posArr = positions.array as Float32Array;
    const colArr = colors.array as Float32Array;
    const sizeArr = sizes.array as Float32Array;

    for (let i = 0; i < this.MAX_TRAIL_PARTICLES; i++) {
      if (i < this.trailPool.length) {
        const p = this.trailPool[i];
        const t = 1 - p.life / p.maxLife;

        posArr[i * 3] = p.position.x;
        posArr[i * 3 + 1] = p.position.y;
        posArr[i * 3 + 2] = p.position.z;

        const r = 1.0;
        const g = 0.55 - t * 0.25;
        const b = 0.0 - t * 0.0;
        const gray = 0.63;
        colArr[i * 3] = r * (1 - t) + gray * t;
        colArr[i * 3 + 1] = g * (1 - t) + gray * t;
        colArr[i * 3 + 2] = b * (1 - t) + gray * t;

        sizeArr[i] = (1 - t) * 0.4;
      } else {
        sizeArr[i] = 0;
      }
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
  }

  private waitForImpact(
    params: FireParams,
    impactPoint: THREE.Vector3,
    impactDistance: number
  ): void {
    const checkImpact = () => {
      if (!this.activeProjectile || !this.isFiring) return;

      if (this.activeProjectile.position.y <= 0.5) {
        this.activeProjectile.position.y = 0.5;
        this.onImpact(params, impactPoint, impactDistance);
        return;
      }
      requestAnimationFrame(checkImpact);
    };
    checkImpact();
  }

  private onImpact(
    params: FireParams,
    impactPoint: THREE.Vector3,
    impactDistance: number
  ): void {
    this.isFiring = false;
    this.clearTrailParticles();

    this.createExplosion(impactPoint);
    this.createImpactMarker(impactPoint);

    this.ui.updateDisplay(params, impactDistance, impactPoint);

    const record: HistoryRecord = {
      time: UI.formatTime(new Date()),
      weight: params.weight,
      leverRatio: params.leverRatio,
      angle: params.angle,
      distance: impactDistance,
      x: impactPoint.x,
      z: impactPoint.z
    };
    this.ui.addHistoryRecord(record);

    setTimeout(() => {
      this.ui.setFireButtonDisabled(false);
      this.resetProjectile();
    }, 800);
  }

  private createExplosion(position: THREE.Vector3): void {
    const ringGeometry = new THREE.RingGeometry(0, 0.1, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF6600,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(position);
    ring.position.y = 0.02;
    this.scene.add(ring);

    const dustCount = 30;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSizes = new Float32Array(dustCount);
    const dustData: { velocity: THREE.Vector3; life: number; maxLife: number }[] = [];

    for (let i = 0; i < dustCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const vy = 1 + Math.random() * 4;

      dustPositions[i * 3] = position.x;
      dustPositions[i * 3 + 1] = position.y + 0.1;
      dustPositions[i * 3 + 2] = position.z;

      dustSizes[i] = 0.2 + Math.random() * 0.3;

      dustData.push({
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          vy,
          Math.sin(angle) * speed
        ),
        life: 0.8,
        maxLife: 0.8
      });
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));

    const dustMaterial = new THREE.PointsMaterial({
      color: 0xC0C0C0,
      size: 0.3,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      depthWrite: false
    });

    const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
    this.scene.add(dustParticles);

    this.explosionEffects.push({
      ring,
      dustParticles,
      dustData,
      startTime: this.clock.getElapsedTime()
    });
  }

  private updateExplosions(delta: number): void {
    const currentTime = this.clock.getElapsedTime();

    for (let i = this.explosionEffects.length - 1; i >= 0; i--) {
      const fx = this.explosionEffects[i];
      const elapsed = currentTime - fx.startTime;

      if (elapsed > 0.8) {
        this.scene.remove(fx.ring);
        fx.ring.geometry.dispose();
        (fx.ring.material as THREE.Material).dispose();

        this.scene.remove(fx.dustParticles);
        fx.dustParticles.geometry.dispose();
        (fx.dustParticles.material as THREE.Material).dispose();

        this.explosionEffects.splice(i, 1);
        continue;
      }

      const ringT = Math.min(elapsed / 0.5, 1);
      const ringScale = ringT * 4;
      fx.ring.scale.setScalar(ringScale);

      const ringColor = new THREE.Color();
      ringColor.setRGB(
        1.0 * (1 - ringT) + 0.5 * ringT,
        0.3 * (1 - ringT) + 0.0 * ringT,
        0.0
      );
      (fx.ring.material as THREE.MeshBasicMaterial).color.copy(ringColor);
      (fx.ring.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - ringT);

      const dustPositions = fx.dustParticles.geometry.attributes.position as THREE.BufferAttribute;
      const posArr = dustPositions.array as Float32Array;
      const dustMaterial = fx.dustParticles.material as THREE.PointsMaterial;

      for (let j = 0; j < fx.dustData.length; j++) {
        const d = fx.dustData[j];
        d.life -= delta;
        d.velocity.y -= 9.8 * delta;

        posArr[j * 3] += d.velocity.x * delta;
        posArr[j * 3 + 1] += d.velocity.y * delta;
        posArr[j * 3 + 2] += d.velocity.z * delta;

        if (posArr[j * 3 + 1] < 0.05) {
          posArr[j * 3 + 1] = 0.05;
          d.velocity.y *= -0.3;
          d.velocity.x *= 0.5;
          d.velocity.z *= 0.5;
        }
      }

      dustPositions.needsUpdate = true;
      dustMaterial.opacity = 0.7 * Math.max(0, 1 - elapsed / 0.8);
    }
  }

  private createImpactMarker(position: THREE.Vector3): void {
    const group = new THREE.Group();

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xFF4444,
      linewidth: 2
    });

    const size = 0.5;
    const line1Points = [
      new THREE.Vector3(position.x - size, 0.02, position.z),
      new THREE.Vector3(position.x + size, 0.02, position.z)
    ];
    const line1Geometry = new THREE.BufferGeometry().setFromPoints(line1Points);
    const line1 = new THREE.Line(line1Geometry, lineMaterial);
    group.add(line1);

    const line2Points = [
      new THREE.Vector3(position.x, 0.02, position.z - size),
      new THREE.Vector3(position.x, 0.02, position.z + size)
    ];
    const line2Geometry = new THREE.BufferGeometry().setFromPoints(line2Points);
    const line2 = new THREE.Line(line2Geometry, lineMaterial);
    group.add(line2);

    this.impactMarkers.add(group);
  }

  private resetProjectile(): void {
    if (this.activeProjectile) {
      if (this.activeProjectile.parent) {
        this.activeProjectile.parent.remove(this.activeProjectile);
      }
      this.activeProjectile = null;
    }
    this.catapult.reset();
  }

  private resetAll(): void {
    this.clearTrajectoryLine();
    this.clearTrailParticles();
    this.ui.clearDisplay();
    this.ui.clearHistory();
    this.ui.setFireButtonDisabled(false);
    this.isFiring = false;

    if (this.activeProjectile) {
      if (this.activeProjectile.parent) {
        this.activeProjectile.parent.remove(this.activeProjectile);
      }
      this.activeProjectile = null;
    }

    while (this.impactMarkers.children.length > 0) {
      const child = this.impactMarkers.children[0];
      this.impactMarkers.remove(child);
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    if (this.quickTestArea) {
      this.scene.remove(this.quickTestArea);
      this.quickTestArea.geometry.dispose();
      (this.quickTestArea.material as THREE.Material).dispose();
      this.quickTestArea = null;
    }

    this.catapult.reset();

    const defaultParams: FireParams = {
      weight: 300,
      leverRatio: 0.5,
      angle: 45
    };
    this.ui.setSliderValues(defaultParams);
    this.physics.setWeight(defaultParams.weight);
    this.physics.setLeverPosition(defaultParams.leverRatio);
    this.physics.setAngle(defaultParams.angle);

    for (let i = this.explosionEffects.length - 1; i >= 0; i--) {
      const fx = this.explosionEffects[i];
      this.scene.remove(fx.ring);
      fx.ring.geometry.dispose();
      (fx.ring.material as THREE.Material).dispose();
      this.scene.remove(fx.dustParticles);
      fx.dustParticles.geometry.dispose();
      (fx.dustParticles.material as THREE.Material).dispose();
    }
    this.explosionEffects = [];
  }

  private async runQuickTest(): Promise<void> {
    if (this.isFiring) return;

    this.ui.setAllButtonsDisabled(true);

    while (this.impactMarkers.children.length > 0) {
      const child = this.impactMarkers.children[0];
      this.impactMarkers.remove(child);
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    if (this.quickTestArea) {
      this.scene.remove(this.quickTestArea);
      this.quickTestArea.geometry.dispose();
      (this.quickTestArea.material as THREE.Material).dispose();
      this.quickTestArea = null;
    }

    const testParams: FireParams[] = [];
    for (let i = 0; i < 4; i++) {
      testParams.push({
        weight: Math.round((150 + Math.random() * 300) / 10) * 10,
        leverRatio: Math.round((0.4 + Math.random() * 0.3) * 100) / 100,
        angle: Math.round(35 + Math.random() * 30)
      });
    }

    const impactPoints: THREE.Vector3[] = [];

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < testParams.length; i++) {
      const params = testParams[i];
      this.ui.setSliderValues(params);
      this.catapult.setWeight(params.weight);
      this.catapult.setLeverPosition(params.leverRatio);
      this.catapult.setAngle(params.angle);
      this.physics.setWeight(params.weight);
      this.physics.setLeverPosition(params.leverRatio);
      this.physics.setAngle(params.angle);

      await delay(200);

      const startPos = this.catapult.getProjectileStartPosition();
      const impactPoint = this.physics.getImpactPoint(startPos);
      impactPoints.push(impactPoint);

      this.createImpactMarker(impactPoint);

      this.ui.updateDisplay(
        params,
        this.physics.getImpactDistance(startPos),
        impactPoint
      );

      const record: HistoryRecord = {
        time: UI.formatTime(new Date()),
        weight: params.weight,
        leverRatio: params.leverRatio,
        angle: params.angle,
        distance: this.physics.getImpactDistance(startPos),
        x: impactPoint.x,
        z: impactPoint.z
      };
      this.ui.addHistoryRecord(record);
    }

    if (impactPoints.length === 4) {
      this.drawQuickTestArea(impactPoints);
    }

    this.ui.setAllButtonsDisabled(false);
  }

  private drawQuickTestArea(points: THREE.Vector3[]): void {
    const center = new THREE.Vector3();
    points.forEach(p => center.add(p));
    center.divideScalar(points.length);

    const sorted = [...points].sort((a, b) => {
      const angleA = Math.atan2(a.z - center.z, a.x - center.x);
      const angleB = Math.atan2(b.z - center.z, b.x - center.x);
      return angleA - angleB;
    });

    const closedPoints = [...sorted, sorted[0]];
    const linePoints = closedPoints.map(p => new THREE.Vector3(p.x, 0.03, p.z));

    const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const material = new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 0.3,
      gapSize: 0.2,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });

    this.quickTestArea = new THREE.Line(geometry, material);
    this.quickTestArea.computeLineDistances();
    this.scene.add(this.quickTestArea);
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      const container = document.getElementById('scene-container');
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height, false);
    });

    this.resizeRenderer();
  }

  private resizeRenderer(): void {
    const container = document.getElementById('scene-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
  }

  private updateProjectile(delta: number): void {
    if (!this.activeProjectile || !this.isFiring) return;

    this.flightTime += delta;
    const gravity = 9.8;

    this.projectileVelocity.y -= gravity * delta;
    this.activeProjectile.position.x += this.projectileVelocity.x * delta;
    this.activeProjectile.position.y += this.projectileVelocity.y * delta;
    this.activeProjectile.position.z += this.projectileVelocity.z * delta;

    this.activeProjectile.rotation.x += delta * 5;
    this.activeProjectile.rotation.z += delta * 3;

    const speed = this.projectileVelocity.length();
    const particleInterval = 0.02;
    if (Math.random() < Math.min(speed / 20, 1) && delta < 0.1) {
      this.addTrailParticle(this.activeProjectile.position.clone());
    }

    if (this.activeProjectile.position.y <= 0.5) {
      this.activeProjectile.position.y = 0.5;
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.05);

    this.controls.update();
    this.updateProjectile(delta);
    this.updateTrailParticles(delta);
    this.updateExplosions(delta);

    this.renderer.render(this.scene, this.camera);
  };
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
