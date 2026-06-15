import Phaser from 'phaser';

export type PlantType = 'fireFlower' | 'iceGrass' | 'windBell';
export type PlantStage = 'seed' | 'sprout' | 'seedling' | 'mature';
export type PlantAction = 'idle' | 'dance' | 'yawn' | 'glow';

export interface EnvironmentParams {
  temperature: number;
  humidity: number;
  light: number;
}

interface PlantColors {
  body: number;
  leaf: number;
  accent: number;
}

const PLANT_COLORS: Record<PlantType, PlantColors> = {
  fireFlower: { body: 0xff6b35, leaf: 0x2ecc71, accent: 0xffcc02 },
  iceGrass: { body: 0x74b9ff, leaf: 0x00cec9, accent: 0xdfe6e9 },
  windBell: { body: 0xa29bfe, leaf: 0x55efc4, accent: 0xffeaa7 }
};

export class Plant extends Phaser.GameObjects.Container {
  private plantType: PlantType;
  private stage: PlantStage = 'seed';
  private action: PlantAction = 'idle';
  private nextActionTime: number = 0;
  private actionEndTime: number = 0;
  private transitionProgress: number = 1;
  private previousAction: PlantAction = 'idle';
  private growthTimer: number = 0;
  private swayAngle: number = 0;
  private swaySpeed: number = 2;
  private plantScale: number = 0.25;
  private growthInterval: number = 30000;

  private environment: EnvironmentParams = {
    temperature: 50,
    humidity: 50,
    light: 50
  };

  private targetEnvironment: EnvironmentParams = {
    temperature: 50,
    humidity: 50,
    light: 50
  };

  private envTransitionProgress: number = 1;
  private envTransitionDuration: number = 1000;
  private envTransitionActive: boolean = false;

  private bodyGraphics!: Phaser.GameObjects.Graphics;
  private leafGraphics!: Phaser.GameObjects.Graphics;
  private stemGraphics!: Phaser.GameObjects.Graphics;
  private glowGraphics!: Phaser.GameObjects.Graphics;
  private waterDroplets: Phaser.GameObjects.Graphics[] = [];

  private danceOffsetY: number = 0;
  private danceRotation: number = 0;
  private glowIntensity: number = 0;
  private yawnProgress: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PlantType) {
    super(scene, x, y);
    this.plantType = type;

    this.bodyGraphics = scene.add.graphics();
    this.leafGraphics = scene.add.graphics();
    this.stemGraphics = scene.add.graphics();
    this.glowGraphics = scene.add.graphics();

    this.add(this.glowGraphics);
    this.add(this.stemGraphics);
    this.add(this.bodyGraphics);
    this.add(this.leafGraphics);

    this.drawPlant();

    scene.add.existing(this);
  }

  public getType(): PlantType {
    return this.plantType;
  }

  public getStage(): PlantStage {
    return this.stage;
  }

  public setEnvironment(params: Partial<EnvironmentParams>): void {
    this.targetEnvironment = { ...this.targetEnvironment, ...params };
    this.envTransitionActive = true;
    this.envTransitionProgress = 0;
  }

  public update(deltaTime: number): void {
    const dt = deltaTime;

    this.updateEnvironmentTransition(dt);
    this.updateGrowth(dt);
    this.updateAction(dt);
    this.updateAnimation(dt);
    this.drawPlant();
  }

  private updateEnvironmentTransition(dt: number): void {
    if (!this.envTransitionActive) return;

    this.envTransitionProgress += dt / this.envTransitionDuration;
    if (this.envTransitionProgress >= 1) {
      this.envTransitionProgress = 1;
      this.envTransitionActive = false;
      this.environment = { ...this.targetEnvironment };
    } else {
      const t = this.envTransitionProgress;
      this.environment.temperature = Phaser.Math.Linear(
        this.environment.temperature,
        this.targetEnvironment.temperature,
        t
      );
      this.environment.humidity = Phaser.Math.Linear(
        this.environment.humidity,
        this.targetEnvironment.humidity,
        t
      );
      this.environment.light = Phaser.Math.Linear(
        this.environment.light,
        this.targetEnvironment.light,
        t
      );
    }
  }

  private getActionInterval(): { min: number; max: number } {
    const temp = this.environment.temperature;
    const minInterval = Phaser.Math.Linear(8000, 3000, temp / 100);
    const maxInterval = Phaser.Math.Linear(12000, 5000, temp / 100);
    return { min: minInterval, max: maxInterval };
  }

  private getRandomAction(): PlantAction {
    const light = this.environment.light;
    const rand = Math.random();

    const glowProb = Phaser.Math.Linear(0.1, 0.5, light / 100);
    const yawnProb = Phaser.Math.Linear(0.5, 0.1, light / 100);
    const danceProb = 1 - glowProb - yawnProb;

    if (rand < glowProb) return 'glow';
    if (rand < glowProb + danceProb) return 'dance';
    return 'yawn';
  }

  private updateGrowth(dt: number): void {
    if (this.stage === 'mature') return;

    this.growthTimer += dt;
    if (this.growthTimer >= this.growthInterval) {
      this.growthTimer = 0;
      this.advanceStage();
    }
  }

  private advanceStage(): void {
    if (this.stage === 'seed') {
      this.stage = 'sprout';
      this.plantScale = 0.4;
    } else if (this.stage === 'sprout') {
      this.stage = 'seedling';
      this.plantScale = 0.7;
    } else if (this.stage === 'seedling') {
      this.stage = 'mature';
      this.plantScale = 1.0;
      this.scheduleNextAction();
    }
  }

  private scheduleNextAction(): void {
    const { min, max } = this.getActionInterval();
    const interval = Phaser.Math.Linear(min, max, Math.random());
    this.nextActionTime = this.scene.time.now + interval;
  }

  private updateAction(dt: number): void {
    if (this.stage !== 'mature') return;

    const now = this.scene.time.now;

    if (this.action !== 'idle' && now >= this.actionEndTime) {
      this.startTransitionTo('idle');
    }

    if (this.action === 'idle' && now >= this.nextActionTime) {
      const newAction = this.getRandomAction();
      this.startTransitionTo(newAction);
    }

    if (this.transitionProgress < 1) {
      this.transitionProgress += dt / 500;
      if (this.transitionProgress > 1) this.transitionProgress = 1;
    }
  }

  private startTransitionTo(newAction: PlantAction): void {
    this.previousAction = this.action;
    this.action = newAction;
    this.transitionProgress = 0;

    if (newAction !== 'idle') {
      const duration = Phaser.Math.Linear(2000, 3000, Math.random());
      this.actionEndTime = this.scene.time.now + duration;
    } else {
      this.scheduleNextAction();
    }
  }

  private updateAnimation(dt: number): void {
    this.swayAngle = Math.sin(this.scene.time.now / 1000 * this.swaySpeed) * 5;

    if (this.stage !== 'mature') return;

    const t = this.transitionProgress;
    const prevAction = this.previousAction;
    const currAction = this.action;

    this.danceOffsetY = this.getActionValue('dance', prevAction, currAction, t,
      () => Math.sin(this.scene.time.now / 150) * 8
    );

    this.danceRotation = this.getActionValue('dance', prevAction, currAction, t,
      () => Math.sin(this.scene.time.now / 200) * 15
    );

    this.glowIntensity = this.getActionValue('glow', prevAction, currAction, t,
      () => (Math.sin(this.scene.time.now / 300) + 1) / 2 * 0.8
    );

    this.yawnProgress = this.getActionValue('yawn', prevAction, currAction, t,
      () => {
        const totalDuration = 2500;
        const remaining = this.actionEndTime - this.scene.time.now;
        const elapsed = totalDuration - remaining;
        const phase = elapsed / totalDuration;
        if (phase < 0.3) return phase / 0.3;
        if (phase < 0.7) return 1;
        return 1 - (phase - 0.7) / 0.3;
      }
    );

    this.updateWaterDroplets(dt);
  }

  private getActionValue(
    actionType: string,
    prev: PlantAction,
    curr: PlantAction,
    t: number,
    valueFn: () => number
  ): number {
    const prevVal = prev === actionType ? valueFn() : 0;
    const currVal = curr === actionType ? valueFn() : 0;
    return Phaser.Math.Linear(prevVal, currVal, t);
  }

  private updateWaterDroplets(dt: number): void {
    const humidity = this.environment.humidity;

    if (humidity > 60 && Math.random() < dt / 2000 * (humidity / 100)) {
      this.spawnWaterDroplet();
    }

    this.waterDroplets = this.waterDroplets.filter(droplet => {
      droplet.y += dt * 0.1;
      droplet.alpha -= dt / 2000;
      if (droplet.alpha <= 0 || droplet.y > 50) {
        droplet.destroy();
        return false;
      }
      return true;
    });
  }

  private spawnWaterDroplet(): void {
    const droplet = this.scene.add.graphics();
    droplet.fillStyle(0x74b9ff, 0.7);
    droplet.fillCircle(
      Phaser.Math.Between(-15, 15) * this.plantScale,
      -20 * this.plantScale,
      2
    );
    this.add(droplet);
    this.waterDroplets.push(droplet);
  }

  private getTintColor(): number {
    const temp = this.environment.temperature;
    const light = this.environment.light;

    const baseColor = PLANT_COLORS[this.plantType].body;
    let r = (baseColor >> 16) & 255;
    let g = (baseColor >> 8) & 255;
    let b = baseColor & 255;

    if (temp < 50) {
      const blueShift = (50 - temp) / 50;
      r = r * (1 - blueShift * 0.3);
      b = b + (255 - b) * blueShift * 0.3;
    } else {
      const redShift = (temp - 50) / 50;
      r = r + (255 - r) * redShift * 0.3;
      b = b * (1 - redShift * 0.3);
    }

    const brightness = Phaser.Math.Linear(0.6, 1.4, light / 100);
    r = Math.min(255, Math.max(0, r * brightness));
    g = Math.min(255, Math.max(0, g * brightness));
    b = Math.min(255, Math.max(0, b * brightness));

    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }

  private drawPlant(): void {
    this.bodyGraphics.clear();
    this.leafGraphics.clear();
    (this.stemGraphics as Phaser.GameObjects.Graphics).clear();
    this.glowGraphics.clear();

    const scale = this.plantScale;
    const colors = PLANT_COLORS[this.plantType];

    const leafCurl = this.environment.humidity < 40
      ? (40 - this.environment.humidity) / 40 * 0.3
      : 0;

    const leafScaleFactor = Phaser.Math.Linear(0.8, 1.3, this.environment.humidity / 100);

    if (this.stage === 'seed') {
      this.drawSeed(scale);
      this.applyTransforms();
      return;
    }

    this.drawStem(scale);

    if (this.stage === 'sprout') {
      this.drawSproutLeaves(scale, leafScaleFactor, leafCurl);
    } else if (this.stage === 'seedling' || this.stage === 'mature') {
      this.drawPlantBody(scale, colors, leafScaleFactor, leafCurl);
    }

    if (this.glowIntensity > 0.01) {
      this.drawGlow(scale);
    }

    this.applyTransforms();
  }

  private drawSeed(scale: number): void {
    const color = this.getTintColor();
    this.bodyGraphics.fillStyle(color);
    this.bodyGraphics.fillEllipse(0, 0, 12 * scale, 16 * scale);

    this.bodyGraphics.fillStyle(0xffffff, 0.3);
    this.bodyGraphics.fillEllipse(-2 * scale, -4 * scale, 4 * scale, 6 * scale);
  }

  private drawStem(scale: number): void {
    const stemG = this.stemGraphics as Phaser.GameObjects.Graphics;
    const stemColor = Phaser.Display.Color.IntegerToColor(this.getTintColor());
    stemColor.darken(20);

    const swayX = this.swayAngle * 0.3;
    const height = this.stage === 'sprout' ? 20 :
                   this.stage === 'seedling' ? 40 : 60;

    stemG.lineStyle(3 * scale, stemColor.color, 1);
    stemG.beginPath();
    stemG.moveTo(0, 10 * scale);

    const segments = 8;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = swayX * scale * t;
      const y = 10 * scale - height * scale * t;
      stemG.lineTo(x, y);
    }
    stemG.strokePath();
  }

  private drawSproutLeaves(scale: number, leafScale: number, curl: number): void {
    const leafColorObj = Phaser.Display.Color.IntegerToColor(PLANT_COLORS[this.plantType].leaf);
    const tintColorObj = Phaser.Display.Color.IntegerToColor(this.getTintColor());
    leafColorObj.red = Phaser.Math.Linear(leafColorObj.red, tintColorObj.red, 0.3);
    leafColorObj.green = Phaser.Math.Linear(leafColorObj.green, tintColorObj.green, 0.3);
    leafColorObj.blue = Phaser.Math.Linear(leafColorObj.blue, tintColorObj.blue, 0.3);

    const swayX = this.swayAngle * 0.3;
    const topY = -20 * scale;

    this.leafGraphics.fillStyle(leafColorObj.color);

    const leafW = 12 * scale * leafScale * (1 - curl * 0.5);
    const leafH = 6 * scale * leafScale;

    this.leafGraphics.fillEllipse(
      -10 * scale * leafScale + swayX * scale,
      topY + 5 * scale,
      leafW,
      leafH
    );
    this.leafGraphics.fillEllipse(
      10 * scale * leafScale + swayX * scale,
      topY + 5 * scale,
      leafW,
      leafH
    );
  }

  private drawPlantBody(
    scale: number,
    colors: PlantColors,
    leafScale: number,
    curl: number
  ): void {
    const swayX = this.swayAngle * 0.3;
    const topY = this.stage === 'seedling' ? -40 : -60;

    const leafColorObj = Phaser.Display.Color.IntegerToColor(colors.leaf);
    const tintColorObj = Phaser.Display.Color.IntegerToColor(this.getTintColor());
    leafColorObj.red = Phaser.Math.Linear(leafColorObj.red, tintColorObj.red, 0.2);
    leafColorObj.green = Phaser.Math.Linear(leafColorObj.green, tintColorObj.green, 0.2);
    leafColorObj.blue = Phaser.Math.Linear(leafColorObj.blue, tintColorObj.blue, 0.2);

    this.leafGraphics.fillStyle(leafColorObj.color);

    const leafCount = this.stage === 'seedling' ? 3 : 5;
    const leafSpread = this.stage === 'seedling' ? 30 : 45;

    const yawnScale = 1 - this.yawnProgress * 0.5;

    for (let i = 0; i < leafCount; i++) {
      const angle = -Math.PI / 2 + (i - (leafCount - 1) / 2) * (Math.PI / leafCount);
      const leafX = Math.cos(angle) * leafSpread * scale + swayX * scale;
      const leafY = topY * scale + Math.sin(angle) * 10 * scale;

      const leafW = 18 * scale * yawnScale * leafScale * (1 - curl * 0.5);
      const leafH = 8 * scale * yawnScale * leafScale;

      this.drawRotatedEllipse(this.leafGraphics, leafX, leafY, leafW, leafH, angle);
    }

    const bodyColor = this.getTintColor();
    const bodySize = this.stage === 'seedling' ? 15 : 20;

    this.bodyGraphics.fillStyle(bodyColor);
    this.bodyGraphics.fillCircle(swayX * scale, topY * scale, bodySize * scale);

    this.bodyGraphics.fillStyle(0xffffff);
    this.bodyGraphics.fillCircle(swayX * scale - 5 * scale, topY * scale - 3 * scale, 4 * scale);
    this.bodyGraphics.fillCircle(swayX * scale + 5 * scale, topY * scale - 3 * scale, 4 * scale);

    this.bodyGraphics.fillStyle(0x2d3436);
    this.bodyGraphics.fillCircle(swayX * scale - 4 * scale, topY * scale - 2 * scale, 2 * scale);
    this.bodyGraphics.fillCircle(swayX * scale + 6 * scale, topY * scale - 2 * scale, 2 * scale);

    const accentColor = colors.accent;
    this.bodyGraphics.fillStyle(accentColor, 0.8);

    if (this.plantType === 'fireFlower') {
      for (let i = 0; i < 3; i++) {
        const flameX = swayX * scale + (i - 1) * 8 * scale;
        const flameY = topY * scale - bodySize * scale - 5 * scale;
        this.drawFlame(flameX, flameY, 5 * scale, 10 * scale);
      }
    } else if (this.plantType === 'iceGrass') {
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const cx = swayX * scale + Math.cos(angle) * (bodySize - 3) * scale;
        const cy = topY * scale + Math.sin(angle) * (bodySize - 3) * scale;
        this.drawDiamond(cx, cy, 3 * scale, 5 * scale);
      }
    } else if (this.plantType === 'windBell') {
      for (let i = 0; i < 3; i++) {
        const bellX = swayX * scale + (i - 1) * 12 * scale;
        const bellY = topY * scale - bodySize * scale + 5 * scale;
        this.bodyGraphics.fillEllipse(bellX, bellY, 5 * scale, 4 * scale);
      }
    }
  }

  private drawRotatedEllipse(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    rotation: number
  ): void {
    const segments = 16;
    g.beginPath();
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * ry;

      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const rx1 = x * cos - y * sin;
      const ry1 = x * sin + y * cos;

      if (i === 0) {
        g.moveTo(cx + rx1, cy + ry1);
      } else {
        g.lineTo(cx + rx1, cy + ry1);
      }
    }
    g.closePath();
    g.fillPath();
  }

  private drawFlame(x: number, y: number, w: number, h: number): void {
    const g = this.bodyGraphics;
    g.beginPath();
    g.moveTo(x, y + h);
    const segments = 8;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const px = x + Math.sin(t * Math.PI) * w * (1 - t * 0.5);
      const py = y + h - h * t;
      g.lineTo(px, py);
    }
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const px = x - Math.sin(t * Math.PI) * w * (1 - t * 0.5);
      const py = y + h - h * t;
      g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
  }

  private drawDiamond(x: number, y: number, w: number, h: number): void {
    const g = this.bodyGraphics;
    g.beginPath();
    g.moveTo(x, y - h);
    g.lineTo(x + w, y);
    g.lineTo(x, y + h);
    g.lineTo(x - w, y);
    g.closePath();
    g.fillPath();
  }

  private drawGlow(scale: number): void {
    const intensity = this.glowIntensity;
    if (intensity <= 0.01) return;

    const glowColor = PLANT_COLORS[this.plantType].accent;

    const topY = this.stage === 'seedling' ? -40 : -60;
    const swayX = this.swayAngle * 0.3;
    const centerX = swayX * scale;
    const centerY = topY * scale;

    const layers = 8;
    const maxRadius = 50 * scale;

    for (let i = layers; i >= 0; i--) {
      const t = i / layers;
      const radius = maxRadius * (0.3 + t * 0.7);
      const alpha = intensity * 0.6 * (1 - t) * (1 - t);

      if (alpha > 0.01) {
        this.glowGraphics.fillStyle(glowColor, alpha);
        this.glowGraphics.fillCircle(centerX, centerY, radius);
      }
    }
  }

  private applyTransforms(): void {
    if (this.stage !== 'mature') {
      this.rotation = Phaser.Math.DegToRad(this.swayAngle * 0.3);
      return;
    }

    this.y = this.danceOffsetY;
    this.rotation = Phaser.Math.DegToRad(this.danceRotation + this.swayAngle);
  }

  public destroy(fromScene?: boolean): void {
    this.waterDroplets.forEach(d => d.destroy());
    this.waterDroplets = [];
    super.destroy(fromScene);
  }
}
