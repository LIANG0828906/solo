import Phaser from 'phaser';

console.log('[TRACE] 初始化 ParticleEffects 模块...');

export interface ParticlePoolItem {
  particle: Phaser.GameObjects.Particles.Particle;
  active: boolean;
}

export class ParticleEffects {
  private scene: Phaser.Scene;
  private deathParticlePool: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private damageNumberPool: Phaser.GameObjects.Text[] = [];
  private energyGlowPool: Phaser.GameObjects.Arc[] = [];
  private maxDeathParticles = 100;
  private maxDamageNumbers = 50;
  private maxEnergyGlows = 80;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    console.log('[TRACE] ParticleEffects 实例已创建');
    this.initializePools();
  }

  private initializePools() {
    console.log('[TRACE] 初始化粒子对象池...');
    this.createDeathParticlePool();
    this.createDamageNumberPool();
    this.createEnergyGlowPool();
  }

  private createDeathParticlePool() {
    const particles = this.scene.add.particles(0, 0, 'particle', {
      lifespan: 400,
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 15,
      emitting: false
    });
    particles.setDepth(100);
    this.deathParticlePool.push(particles);
    console.log('[TRACE] 死亡粒子池初始化完成，最大数量:', this.maxDeathParticles);
  }

  private createDamageNumberPool() {
    for (let i = 0; i < this.maxDamageNumbers; i++) {
      const text = this.scene.add.text(0, 0, '', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#EF4444',
        stroke: '#000000',
        strokeThickness: 2
      });
      text.setOrigin(0.5);
      text.setDepth(200);
      text.setVisible(false);
      text.setActive(false);
      this.damageNumberPool.push(text);
    }
    console.log('[TRACE] 伤害数字池初始化完成，数量:', this.maxDamageNumbers);
  }

  private createEnergyGlowPool() {
    for (let i = 0; i < this.maxEnergyGlows; i++) {
      const glow = this.scene.add.circle(0, 0, 20, 0x7DD3FC, 0.3);
      glow.setStrokeStyle(2, 0x7DD3FC, 0.6);
      glow.setVisible(false);
      glow.setActive(false);
      this.energyGlowPool.push(glow);
    }
    console.log('[TRACE] 能量光效池初始化完成，数量:', this.maxEnergyGlows);
  }

  public playDeathExplosion(x: number, y: number, color: number = 0x94A3B8) {
    const emitter = this.deathParticlePool[0];
    if (!emitter) return;

    console.log('[TRACE] 播放死亡爆炸效果，位置:', x, y);

    emitter.setPosition(x, y);
    emitter.particleTint = color;
    emitter.explode(15, x, y);

    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 400,
      onUpdate: (tween) => {
        const value = tween.getValue();
        emitter.setAlpha(1 - value);
      },
      onComplete: () => {
        emitter.setAlpha(1);
      }
    });
  }

  public showDamageNumber(x: number, y: number, damage: number, isCrit: boolean = false) {
    const textObj = this.damageNumberPool.find(t => !t.active);
    if (!textObj) {
      console.log('[TRACE] 伤害数字池已满，跳过显示');
      return;
    }

    textObj.setActive(true);
    textObj.setVisible(true);
    textObj.setPosition(x, y);
    textObj.setText(`-${Math.floor(damage)}`);
    textObj.setColor(isCrit ? '#FBBF24' : '#EF4444');
    textObj.setFontSize(isCrit ? '22px' : '16px');
    textObj.setAlpha(1);
    textObj.setScale(isCrit ? 1.2 : 1);

    console.log('[TRACE] 显示伤害数字:', damage, '位置:', x, y, '暴击:', isCrit);

    this.scene.tweens.add({
      targets: textObj,
      y: y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.out',
      onComplete: () => {
        textObj.setActive(false);
        textObj.setVisible(false);
      }
    });
  }

  public playScreenFlash() {
    console.log('[TRACE] 播放屏幕四周红色闪烁警告');

    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0xEF4444,
      0
    );
    flash.setDepth(999);

    const border = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height
    );
    border.setStrokeStyle(8, 0xEF4444, 0);
    border.setDepth(998);

    this.scene.tweens.add({
      targets: [flash, border],
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        flash.destroy();
        border.destroy();
      }
    });
  }

  public playPortalEffect(x: number, y: number): Phaser.GameObjects.Container {
    console.log('[TRACE] 创建传送门粒子效果，位置:', x, y);

    const container = this.scene.add.container(x, y);

    const vortex = this.scene.add.circle(0, 0, 35, 0x7C3AED, 0.4);
    vortex.setStrokeStyle(3, 0xA78BFA, 0.8);
    container.add(vortex);

    const innerVortex = this.scene.add.circle(0, 0, 20, 0x581C87, 0.6);
    container.add(innerVortex);

    const particles = this.scene.add.particles(0, 0, 'particle', {
      lifespan: 1500,
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: 0xA78BFA,
      quantity: 2,
      emitZone: {
        type: 'edge',
        source: new Phaser.Geom.Circle(0, 0, 30),
        quantity: 36
      }
    });
    container.add(particles);

    this.scene.tweens.add({
      targets: [vortex, innerVortex],
      rotation: Math.PI * 2,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    });

    this.scene.tweens.add({
      targets: innerVortex,
      scale: { from: 0.8, to: 1.2 },
      duration: 1500,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    return container;
  }

  public playEnergyFlow(target: Phaser.GameObjects.Container, color: number, level: number) {
    const glow = this.energyGlowPool.find(g => !g.active);
    if (!glow) return;

    glow.setActive(true);
    glow.setVisible(true);
    glow.setPosition(target.x, target.y);
    glow.setFillStyle(color, 0.2);
    glow.setStrokeStyle(2, color, 0.5);
    glow.setRadius(20 + level * 5);
    glow.setAlpha(0);

    this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0, to: 0.6 },
      scale: { from: 0.8, to: 1.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      onComplete: () => {
        glow.setActive(false);
        glow.setVisible(false);
      }
    });
  }

  public playBuildEffect(x: number, y: number, color: number) {
    console.log('[TRACE] 播放建造特效，位置:', x, y);

    const ring = this.scene.add.circle(x, y, 10, color, 0);
    ring.setStrokeStyle(3, color, 0.8);

    this.scene.tweens.add({
      targets: ring,
      radius: 50,
      alpha: { from: 1, to: 0 },
      duration: 300,
      onComplete: () => ring.destroy()
    });

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = x + Math.cos(angle) * 20;
      const py = y + Math.sin(angle) * 20;
      const particle = this.scene.add.circle(px, py, 4, color, 0.8);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => particle.destroy()
      });
    }
  }

  public playUpgradeEffect(x: number, y: number, color: number) {
    console.log('[TRACE] 播放升级特效，位置:', x, y);

    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        const ring = this.scene.add.circle(x, y, 10, color, 0);
        ring.setStrokeStyle(4, color, 0.9);

        this.scene.tweens.add({
          targets: ring,
          radius: 60 + i * 20,
          alpha: { from: 1, to: 0 },
          duration: 500,
          onComplete: () => ring.destroy()
        });
      });
    }

    const beam = this.scene.add.rectangle(x, y - 50, 6, 100, color, 0);
    this.scene.tweens.add({
      targets: beam,
      y: y - 150,
      alpha: { from: 0.8, to: 0 },
      height: 200,
      duration: 600,
      onComplete: () => beam.destroy()
    });
  }

  public playRuneEmbedEffect(x: number, y: number, color: number) {
    console.log('[TRACE] 播放符文镶嵌特效，位置:', x, y);

    const runeIcon = this.scene.add.circle(x, y, 12, color, 0.9);
    runeIcon.setStrokeStyle(2, 0xffffff, 0.8);

    this.scene.tweens.add({
      targets: runeIcon,
      scale: { from: 0, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 500,
      ease: 'Back.out',
      onComplete: () => runeIcon.destroy()
    });

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spark = this.scene.add.circle(x, y, 3, color, 0.9);

      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        duration: 400,
        onComplete: () => spark.destroy()
      });
    }
  }

  public playSplashEffect(x: number, y: number, radius: number, color: number) {
    console.log('[TRACE] 播放溅射效果，位置:', x, y, '半径:', radius);

    const splash = this.scene.add.circle(x, y, radius, color, 0.3);
    splash.setStrokeStyle(3, color, 0.6);

    this.scene.tweens.add({
      targets: splash,
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0.6, to: 0 },
      duration: 300,
      onComplete: () => splash.destroy()
    });
  }

  public createParticleTexture() {
    console.log('[TRACE] 创建粒子纹理...');
    const graphics = this.scene.make.graphics(undefined, false);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 6);
    graphics.generateTexture('particle', 16, 16);
    graphics.destroy();
  }

  public cleanup() {
    console.log('[TRACE] 清理 ParticleEffects 资源');
    this.deathParticlePool.forEach(p => p.destroy());
    this.damageNumberPool.forEach(t => t.destroy());
    this.energyGlowPool.forEach(g => g.destroy());
  }
}
