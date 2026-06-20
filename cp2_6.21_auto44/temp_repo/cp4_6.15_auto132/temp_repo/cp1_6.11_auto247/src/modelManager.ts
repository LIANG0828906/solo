import * as THREE from 'three';
import { ParticleSystem } from './particleSystem.js';

export type StepId = 'wax_model' | 'clay_shell' | 'dewaxing' | 'pouring' | 'cooling' | 'polishing';

interface StepCallback {
  onProgress?: (p: number) => void;
  onComplete?: () => void;
}

export class ModelManager {
  private _scene: THREE.Scene;
  private _particleSystem: ParticleSystem;

  private _dingGroup: THREE.Group;
  private _waxDing: THREE.Group | null = null;
  private _clayOuter: THREE.Group | null = null;
  private _bronzeDing: THREE.Group | null = null;
  private _pouringLadle: THREE.Group | null = null;
  private _metalFilled: THREE.Group | null = null;

  private _activeStep: StepId | null = null;
  private _completedSteps: Set<StepId> = new Set();

  private _animations: Array<(dt: number) => boolean> = [];

  public pourAngle: number = 0;

  constructor(scene: THREE.Scene, particleSystem: ParticleSystem) {
    this._scene = scene;
    this._particleSystem = particleSystem;

    this._dingGroup = new THREE.Group();
    this._dingGroup.position.set(0, 0, 0);
    this._scene.add(this._dingGroup);

    this._initFurnaceFlame();
  }

  private _initFurnaceFlame(): void {
    const furnaceTop = new THREE.Vector3(260, 290, 120);
    const flame = this._particleSystem.createEmitter(
      'furnace_flame',
      'flame',
      120,
      furnaceTop,
      0xff7733,
      1.2,
      14
    );
    flame.emitRate = 45;
    flame.velocityMin.set(-0.8, 1.2, -0.8);
    flame.velocityMax.set(0.8, 3.0, 0.8);
    flame.running = true;
  }

  public attachUpdate(sceneManager: { onUpdate: (cb: (dt: number) => void) => void }): void {
    sceneManager.onUpdate((dt) => this._update(dt));
  }

  public get completedSteps(): Set<StepId> {
    return this._completedSteps;
  }

  public get activeStep(): StepId | null {
    return this._activeStep;
  }

  public canStartStep(step: StepId): boolean {
    const order: StepId[] = ['wax_model', 'clay_shell', 'dewaxing', 'pouring', 'cooling', 'polishing'];
    const idx = order.indexOf(step);
    if (idx < 0) return false;
    if (this._activeStep !== null) return false;
    for (let i = 0; i < idx; i++) {
      if (!this._completedSteps.has(order[i])) return false;
    }
    return !this._completedSteps.has(step);
  }

  public startStep(step: StepId, cb?: StepCallback): void {
    if (!this.canStartStep(step)) return;
    this._activeStep = step;

    switch (step) {
      case 'wax_model': this._startWaxModel(cb); break;
      case 'clay_shell': this._startClayShell(cb); break;
      case 'dewaxing': this._startDewaxing(cb); break;
      case 'pouring': this._startPouring(cb); break;
      case 'cooling': this._startCooling(cb); break;
      case 'polishing': this._startPolishing(cb); break;
    }
  }

  private _completeStep(step: StepId, cb?: StepCallback): void {
    this._completedSteps.add(step);
    this._activeStep = null;
    if (cb?.onComplete) cb.onComplete();
  }

  private _startWaxModel(cb?: StepCallback): void {
    this._waxDing = this._buildDingGroup(0xfff2cc, false);
    this._setGroupOpacity(this._waxDing, 0);
    this._waxDing.scale.setScalar(0.01);
    this._dingGroup.add(this._waxDing);

    const duration = 2.2;
    let t = 0;
    const anim = (dt: number): boolean => {
      t += dt;
      const p = Math.min(1, t / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      this._setGroupOpacity(this._waxDing!, ease);
      this._waxDing!.scale.setScalar(0.01 + ease * 0.99);
      if (cb?.onProgress) cb.onProgress(p);
      if (p >= 1) {
        this._completeStep('wax_model', cb);
        return false;
      }
      return true;
    };
    this._animations.push(anim);
  }

  private _startClayShell(cb?: StepCallback): void {
    if (!this._waxDing) return;
    this._clayOuter = this._buildDingGroup(0x8a5a2a, false, 1.15);
    this._setGroupOpacity(this._clayOuter, 0.9);
    this._clayOuter.scale.setScalar(0.01);
    this._dingGroup.add(this._clayOuter);

    const duration = 2.4;
    let t = 0;
    const anim = (dt: number): boolean => {
      t += dt;
      const p = Math.min(1, t / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      this._clayOuter!.scale.setScalar(0.01 + ease * 0.99);
      if (cb?.onProgress) cb.onProgress(p);
      if (p >= 1) {
        this._completeStep('clay_shell', cb);
        return false;
      }
      return true;
    };
    this._animations.push(anim);
  }

  private _startDewaxing(cb?: StepCallback): void {
    const steamEmitter = this._particleSystem.createEmitter(
      'dewax_steam',
      'steam',
      180,
      new THREE.Vector3(0, 60, 0),
      0xeeeeee,
      2.2,
      18
    );
    steamEmitter.emitRate = 55;
    steamEmitter.velocityMin.set(-0.5, 0.6, -0.5);
    steamEmitter.velocityMax.set(0.5, 1.8, 0.5);
    steamEmitter.running = true;

    const duration = 3.2;
    let t = 0;
    const anim = (dt: number): boolean => {
      t += dt;
      const p = Math.min(1, t / duration);
      if (this._waxDing) {
        const newOp = Math.max(0, 1 - p * 1.3);
        this._setGroupOpacity(this._waxDing, newOp);
        const sway = Math.sin(t * 3) * 0.003;
        this._waxDing.scale.setScalar(1 - p * 0.15 + sway);
      }
      if (cb?.onProgress) cb.onProgress(p);
      if (p >= 1) {
        steamEmitter.running = false;
        setTimeout(() => this._particleSystem.removeEmitter('dewax_steam'), 2500);
        if (this._waxDing) {
          this._disposeGroup(this._waxDing);
          this._dingGroup.remove(this._waxDing);
          this._waxDing = null;
        }
        this._completeStep('dewaxing', cb);
        return false;
      }
      return true;
    };
    this._animations.push(anim);
  }

  private _startPouring(cb?: StepCallback): void {
    this._createLadle();

    const metalEmitter = this._particleSystem.createEmitter(
      'metal_flow',
      'metal_flow',
      220,
      new THREE.Vector3(80, 140, 40),
      0xff6600,
      1.6,
      6
    );
    metalEmitter.velocityMin.set(-0.3, -2.0, -0.3);
    metalEmitter.velocityMax.set(0.3, -3.6, 0.3);
    metalEmitter.emitRate = 0;
    metalEmitter.running = true;

    const splashEmitter = this._particleSystem.createEmitter(
      'metal_splash',
      'splash',
      120,
      new THREE.Vector3(0, 55, 0),
      0xff4500,
      0.9,
      5
    );
    splashEmitter.velocityMin.set(-1.2, 1.8, -1.2);
    splashEmitter.velocityMax.set(1.2, 3.6, 1.2);
    splashEmitter.emitRate = 0;
    splashEmitter.running = true;

    this._metalFilled = this._buildDingGroup(0xff5500, true);
    this._metalFilled.scale.setScalar(0.001);
    this._dingGroup.add(this._metalFilled);

    let fillLevel = 0;
    const anim = (dt: number): boolean => {
      const targetRate = this.pourAngle > 12 ? (this.pourAngle / 90) * 80 : 0;
      metalEmitter.emitRate = targetRate;
      metalEmitter.origin.set(80 - this.pourAngle * 0.4, 150 - this.pourAngle * 0.3, 40);

      const willSplash = this.pourAngle > 62 && targetRate > 20;
      splashEmitter.emitRate = willSplash ? Math.min(35, targetRate * 0.35) : 0;

      const fillRate = Math.max(0, (this.pourAngle / 90) * 0.18);
      fillLevel = Math.min(1, fillLevel + fillRate * dt);
      if (this._metalFilled) {
        this._metalFilled.scale.setScalar(0.001 + fillLevel * 0.999);
      }

      if (this._pouringLadle) {
        this._pouringLadle.rotation.z = -THREE.MathUtils.degToRad(this.pourAngle);
      }

      if (cb?.onProgress) cb.onProgress(fillLevel);

      if (fillLevel >= 1) {
        metalEmitter.running = false;
        splashEmitter.running = false;
        setTimeout(() => {
          this._particleSystem.removeEmitter('metal_flow');
          this._particleSystem.removeEmitter('metal_splash');
        }, 2000);
        if (this._pouringLadle) {
          this._disposeGroup(this._pouringLadle);
          this._dingGroup.remove(this._pouringLadle);
          this._pouringLadle = null;
        }
        this._completeStep('pouring', cb);
        return false;
      }
      return true;
    };
    this._animations.push(anim);
  }

  private _startCooling(cb?: StepCallback): void {
    if (!this._metalFilled) return;
    const duration = 3.0;
    let t = 0;
    const anim = (dt: number): boolean => {
      t += dt;
      const p = Math.min(1, t / duration);
      this._metalFilled!.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mat = obj.material as THREE.MeshLambertMaterial;
          if (mat.emissive !== undefined) {
            mat.emissiveIntensity = 0.8 * (1 - p);
          }
          mat.color.setHSL(0.05 + p * 0.03, 0.55, 0.35 - p * 0.1);
        }
      });
      if (cb?.onProgress) cb.onProgress(p);
      if (p >= 1) {
        this._completeStep('cooling', cb);
        return false;
      }
      return true;
    };
    this._animations.push(anim);
  }

  private _startPolishing(cb?: StepCallback): void {
    const duration = 3.5;
    let t = 0;

    this._bronzeDing = this._buildDingGroup(0xb08a3a, false, 1.0, true);
    this._bronzeDing.scale.setScalar(0);
    this._dingGroup.add(this._bronzeDing);

    const anim = (dt: number): boolean => {
      t += dt;
      const p = Math.min(1, t / duration);
      if (this._clayOuter) {
        this._setGroupOpacity(this._clayOuter, Math.max(0, 1 - p * 1.4));
        this._clayOuter.scale.setScalar(1 + p * 0.25);
      }
      this._bronzeDing!.scale.setScalar(p);
      if (this._metalFilled) {
        this._metalFilled.visible = false;
      }
      if (cb?.onProgress) cb.onProgress(p);
      if (p >= 1) {
        if (this._clayOuter) {
          this._disposeGroup(this._clayOuter);
          this._dingGroup.remove(this._clayOuter);
          this._clayOuter = null;
        }
        this._completeStep('polishing', cb);
        this._startFinalShowcase();
        return false;
      }
      return true;
    };
    this._animations.push(anim);
  }

  private _startFinalShowcase(): void {
    if (!this._bronzeDing) return;
    let t = 0;
    const startY = 0;
    const targetY = 80;
    const anim = (dt: number): boolean => {
      t += dt;
      this._bronzeDing!.rotation.y += dt * 0.8;
      this._bronzeDing!.position.y = THREE.MathUtils.lerp(startY, targetY, Math.min(1, t / 2.0));
      return t < 999;
    };
    this._animations.push(anim);
  }

  private _createLadle(): void {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(32, 28, 44, 18, 1, true),
      new THREE.MeshLambertMaterial({ color: 0x3a2a1a, side: THREE.DoubleSide })
    );
    body.position.y = 18;
    g.add(body);
    const bottom = new THREE.Mesh(
      new THREE.CircleGeometry(28, 18),
      new THREE.MeshLambertMaterial({ color: 0x2a1a0a })
    );
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = -4;
    g.add(bottom);
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(8, 8, 90),
      new THREE.MeshLambertMaterial({ color: 0x5a3a1a })
    );
    handle.position.set(0, 28, 55);
    handle.rotation.x = 0.3;
    g.add(handle);
    const melt = new THREE.Mesh(
      new THREE.CircleGeometry(27, 18),
      new THREE.MeshBasicMaterial({ color: 0xff4500 })
    );
    melt.rotation.x = -Math.PI / 2;
    melt.position.y = 39.5;
    g.add(melt);

    g.position.set(140, 120, 40);
    g.rotation.y = -0.6;
    this._pouringLadle = g;
    this._dingGroup.add(g);
  }

  private _buildDingGroup(
    color: number,
    emissive: boolean,
    scale: number = 1.0,
    polished: boolean = false
  ): THREE.Group {
    const g = new THREE.Group();
    const bodyHeight = 90;
    const bodyTop = 70;
    const bodyBottom = 50;

    const createMat = (): THREE.Material => {
      if (polished) {
        return new THREE.MeshPhongMaterial({
          color,
          shininess: 75,
          specular: 0x8a6a2a
        });
      }
      const m = new THREE.MeshLambertMaterial({ color });
      if (emissive) {
        (m as THREE.MeshLambertMaterial).emissive = new THREE.Color(0xff3300);
        (m as THREE.MeshLambertMaterial).emissiveIntensity = 0.8;
      }
      return m;
    };

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(bodyTop * scale, bodyBottom * scale, bodyHeight * scale, 28),
      createMat()
    );
    body.position.y = 0;
    g.add(body);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry((bodyTop + 6) * scale, 6 * scale, 8, 32),
      createMat()
    );
    rim.position.y = bodyHeight / 2 * scale;
    rim.rotation.x = Math.PI / 2;
    g.add(rim);

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(11 * scale, 15 * scale, 55 * scale, 10),
        createMat()
      );
      leg.position.set(
        Math.cos(angle) * (bodyBottom * 0.55 * scale),
        -bodyHeight / 2 * scale - 27 * scale,
        Math.sin(angle) * (bodyBottom * 0.55 * scale)
      );
      g.add(leg);
    }

    for (let i = 0; i < 2; i++) {
      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(18 * scale, 5 * scale, 6, 16, Math.PI),
        createMat()
      );
      handle.position.set(
        (i === 0 ? -1 : 1) * bodyTop * 0.75 * scale,
        bodyHeight / 2 * scale + 18 * scale,
        0
      );
      handle.rotation.z = (i === 0 ? 1 : -1) * Math.PI / 2;
      handle.rotation.x = Math.PI;
      g.add(handle);
    }

    return g;
  }

  private _setGroupOpacity(group: THREE.Group, opacity: number): void {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mat = obj.material as THREE.Material;
        mat.transparent = true;
        mat.opacity = opacity;
        mat.depthWrite = opacity >= 0.95;
      }
    });
  }

  private _disposeGroup(group: THREE.Group): void {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  private _update(dt: number): void {
    for (let i = this._animations.length - 1; i >= 0; i--) {
      const keep = this._animations[i](dt);
      if (!keep) this._animations.splice(i, 1);
    }
  }

  public setPourAngle(angle: number): void {
    this.pourAngle = THREE.MathUtils.clamp(angle, 0, 90);
  }
}
