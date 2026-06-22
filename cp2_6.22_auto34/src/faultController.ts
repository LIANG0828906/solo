import * as THREE from 'three';
import { TerrainModel, FaultType, FaultParameters, LAYER_COLORS } from './terrainModel';

export interface FaultDescription {
  title: string;
  stress: string;
  text: string;
  diagram: string;
}

export const FAULT_DESCRIPTIONS: Record<FaultType, FaultDescription> = {
  normal: {
    title: '正断层 (Normal Fault)',
    stress: '应力类型：拉张应力 (Tensional Stress)',
    text: '正断层是由拉张应力作用形成的断层。上盘（hanging wall）相对于下盘（footwall）沿断层面倾向向下滑动。常见于地壳拉伸区域，如裂谷带、大洋中脊等地。倾角通常较陡（45°~90°），断层线以高角度切入岩层。典型特征是地层重复缺失，形成地堑、半地堑等构造形态。',
    diagram: 'normal'
  },
  reverse: {
    title: '逆断层 (Reverse Fault)',
    stress: '应力类型：挤压应力 (Compressional Stress)',
    text: '逆断层由挤压应力作用形成。上盘沿断层面倾向向上滑动，叠覆于下盘之上。多形成于板块汇聚边界，如造山带、俯冲带区域。倾角通常小于45°，倾角特别缓（<30°）时称为推覆构造（nappe）。逆断层常导致地层重复出现，形成褶皱-冲断带等复杂构造组合。',
    diagram: 'reverse'
  },
  'strike-slip': {
    title: '平移断层 (Strike-Slip Fault)',
    stress: '应力类型：剪切应力 (Shear Stress)',
    text: '平移断层由剪切应力作用形成，两盘沿断层面走向做水平相对运动。根据滑动方向可分为左行（sinistral）和右行（dextral）平移断层。典型例子包括转换断层边界，如美国圣安德烈亚斯断层。断层面通常近于直立，两盘地层仅在水平方向发生错位，垂向位移极小。',
    diagram: 'strike-slip'
  }
};

type ProgressCallback = (progress: number) => void;

export class FaultAnimator {
  private terrain: TerrainModel;
  private currentParams: FaultParameters;
  private animating = false;
  private progressCallbacks: ProgressCallback[] = [];

  private smoothedDip: number;
  private smoothedDisplacement: number;
  private smoothedSlipSpeed: number;
  private targetDip: number;
  private targetDisplacement: number;
  private targetSlipSpeed: number;

  private hasTriggeredParticles = false;

  public sliceScene: THREE.Scene;
  public sliceCamera: THREE.OrthographicCamera;
  public sliceRenderer: THREE.WebGLRenderer;

  private sliceMesh: THREE.Mesh | null = null;
  private sliceFaultLine: THREE.Line | null = null;
  private clippingPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  private activeType: FaultType | null = null;

  constructor(terrain: TerrainModel) {
    this.terrain = terrain;
    this.currentParams = terrain.getParameters();
    this.smoothedDip = this.currentParams.dipAngle;
    this.smoothedDisplacement = this.currentParams.displacement;
    this.smoothedSlipSpeed = this.currentParams.slipSpeed;
    this.targetDip = this.smoothedDip;
    this.targetDisplacement = this.smoothedDisplacement;
    this.targetSlipSpeed = this.smoothedSlipSpeed;

    this.sliceScene = new THREE.Scene();
    this.sliceCamera = new THREE.OrthographicCamera(-4, 4, 3.5, -3.5, 0.1, 1000);
    this.sliceCamera.position.z = 5;
    this.sliceRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  }

  public onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  private emitProgress(p: number): void {
    for (const cb of this.progressCallbacks) {
      cb(p);
    }
  }

  public async triggerFault(type: FaultType): Promise<void> {
    if (this.animating) {
      return;
    }
    this.animating = true;
    this.activeType = type;

    this.terrain.reset();
    this.currentParams.type = type;
    this.terrain.setParameters({ type });

    await this.delay(50);

    this.hasTriggeredParticles = false;

    this.terrain.setProgress(1, true);

    this.emitProgress(0);
    const startProgress = this.terrain.getProgress();
    const startTime = performance.now();
    const duration = 1500 / this.currentParams.slipSpeed;

    await new Promise<void>((resolve) => {
      const checkProgress = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = this.easeOutCubic(t);

        if (eased >= 0.8 && !this.hasTriggeredParticles) {
          this.hasTriggeredParticles = true;
          this.terrain.triggerShake();
          this.terrain.emitParticles();
        }

        this.emitProgress(startProgress + (1 - startProgress) * eased);

        if (this.terrain.getProgress() < 0.999) {
          requestAnimationFrame(checkProgress);
        } else {
          this.emitProgress(1);
          resolve();
        }
      };
      checkProgress();
    });

    this.animating = false;
  }

  public setDipAngle(value: number): void {
    this.targetDip = value;
    this.currentParams.dipAngle = value;
    this.terrain.setParameters({ dipAngle: value });
  }

  public setDisplacement(value: number): void {
    this.targetDisplacement = value;
    this.currentParams.displacement = value;
    this.terrain.setParameters({ displacement: value });
  }

  public setSlipSpeed(value: number): void {
    this.targetSlipSpeed = value;
    this.currentParams.slipSpeed = value;
    this.terrain.setParameters({ slipSpeed: value });
  }

  public updateParameters(params: Partial<FaultParameters>): void {
    const currentProgress = this.terrain.getProgress();
    this.currentParams = { ...this.currentParams, ...params };
    this.terrain.setParameters(params);

    if (currentProgress > 0) {
      this.terrain.applyFault(currentProgress);
    }

    if (params.dipAngle !== undefined) {
      this.targetDip = params.dipAngle;
      this.smoothedDip = params.dipAngle;
    }
    if (params.displacement !== undefined) {
      this.targetDisplacement = params.displacement;
      this.smoothedDisplacement = params.displacement;
    }
    if (params.slipSpeed !== undefined) {
      this.targetSlipSpeed = params.slipSpeed;
      this.smoothedSlipSpeed = params.slipSpeed;
    }

    if (this.activeType !== null) {
      this.updateSliceView();
    }
  }

  public getParameters(): FaultParameters {
    return { ...this.currentParams };
  }

  public getSmoothedParams(): FaultParameters {
    return {
      ...this.currentParams,
      dipAngle: this.smoothedDip,
      displacement: this.smoothedDisplacement,
      slipSpeed: this.smoothedSlipSpeed
    };
  }

  public initSliceView(canvas: HTMLCanvasElement): void {
    this.sliceRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.sliceRenderer.setPixelRatio(window.devicePixelRatio);
    canvas.appendChild(this.sliceRenderer.domElement);

    this.clippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.sliceScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(2, 3, 5);
    this.sliceScene.add(directionalLight);

    this.updateSliceView();
  }

  public updateSliceView(): void {
    if (this.sliceMesh) {
      this.sliceScene.remove(this.sliceMesh);
      this.sliceMesh.geometry.dispose();
      (this.sliceMesh.material as THREE.Material).dispose();
    }
    if (this.sliceFaultLine) {
      this.sliceScene.remove(this.sliceFaultLine);
      this.sliceFaultLine.geometry.dispose();
      (this.sliceFaultLine.material as THREE.Material).dispose();
    }

    const dipRad = THREE.MathUtils.degToRad(this.currentParams.dipAngle);
    this.clippingPlane.normal.set(Math.sin(dipRad), Math.cos(dipRad), 0);

    const sliceGeometry = this.terrain.getSliceGeometry();

    const sliceMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.05
    });

    this.sliceMesh = new THREE.Mesh(sliceGeometry, sliceMaterial);
    this.sliceScene.add(this.sliceMesh);

    const faultLineGeometry = new THREE.BufferGeometry();
    const faultLinePositions: number[] = [];
    const halfH = 2.5;
    const halfW = 3;
    const tanDip = Math.tan(dipRad);
    const progress = this.terrain.getProgress();
    const maxDisp = this.currentParams.displacement * 1.5;

    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      const y = -halfH + t * 5;
      const x = (y + halfH) / tanDip - halfW;

      let offsetX = 0;
      let offsetY = 0;

      if (this.currentParams.type === 'normal') {
        if (x < (y + halfH) / tanDip - halfW) {
          offsetY = -maxDisp * progress * Math.cos(dipRad);
          offsetX = -maxDisp * progress * Math.sin(dipRad);
        }
      } else if (this.currentParams.type === 'reverse') {
        if (x < (y + halfH) / tanDip - halfW) {
          offsetY = maxDisp * progress * Math.cos(dipRad) * 0.7;
          offsetX = maxDisp * progress * Math.sin(dipRad);
        }
      } else if (this.currentParams.type === 'strike-slip') {
        if (x < 0) {
          offsetX = maxDisp * progress * 0.4;
        } else {
          offsetX = -maxDisp * progress * 0.4;
        }
      }

      faultLinePositions.push(x + offsetX, y + offsetY, 0.01);
    }

    faultLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(faultLinePositions, 3));

    const faultLineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      linewidth: 2
    });

    this.sliceFaultLine = new THREE.Line(faultLineGeometry, faultLineMaterial);
    this.sliceFaultLine.renderOrder = 999;
    this.sliceScene.add(this.sliceFaultLine);

    this.renderSlice();
  }

  private renderSlice(): void {
    this.sliceRenderer.render(this.sliceScene, this.sliceCamera);
  }

  public update(dt: number): void {
    const smoothFactor = 1 - Math.exp(-dt * 4);

    this.smoothedDip += (this.targetDip - this.smoothedDip) * smoothFactor;
    this.smoothedDisplacement += (this.targetDisplacement - this.smoothedDisplacement) * smoothFactor;
    this.smoothedSlipSpeed += (this.targetSlipSpeed - this.smoothedSlipSpeed) * smoothFactor;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public isAnimating(): boolean {
    return this.animating;
  }
}
