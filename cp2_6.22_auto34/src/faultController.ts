import { TerrainModel, FaultType, FaultParameters } from './terrainModel';

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

  constructor(terrain: TerrainModel) {
    this.terrain = terrain;
    this.currentParams = terrain.getParameters();
    this.smoothedDip = this.currentParams.dipAngle;
    this.smoothedDisplacement = this.currentParams.displacement;
    this.smoothedSlipSpeed = this.currentParams.slipSpeed;
    this.targetDip = this.smoothedDip;
    this.targetDisplacement = this.smoothedDisplacement;
    this.targetSlipSpeed = this.smoothedSlipSpeed;
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

    this.terrain.reset();
    this.currentParams.type = type;
    this.terrain.setParameters({ type });

    await this.delay(50);

    this.terrain.triggerShake();
    this.terrain.emitParticles();

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
