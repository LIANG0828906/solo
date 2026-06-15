import Phaser from 'phaser';
import { AssembledMech, Part, PartType } from '../types';

export class MechRenderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private partContainers: Record<PartType, Phaser.GameObjects.Container>;
  private baseX: number;
  private baseY: number;
  private scale: number;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number = 1.5) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.scale = scale;
    this.container = scene.add.container(x, y);
    this.container.setScale(scale);
    this.partContainers = {
      head: scene.add.container(0, -120),
      torso: scene.add.container(0, -40),
      arms: scene.add.container(0, -40),
      legs: scene.add.container(0, 60)
    };
    for (const key of Object.keys(this.partContainers) as PartType[]) {
      this.container.add(this.partContainers[key]);
    }
  }

  destroy() {
    this.container.destroy();
  }

  setVisible(v: boolean) {
    this.container.setVisible(v);
  }

  setPosition(x: number, y: number) {
    this.baseX = x;
    this.baseY = y;
    this.container.setPosition(x, y);
  }

  setScale(s: number) {
    this.scale = s;
    this.container.setScale(s);
  }

  getContainer() {
    return this.container;
  }

  animatePartChange(type: PartType, onComplete?: () => void) {
    const partContainer = this.partContainers[type];
    this.scene.tweens.add({
      targets: partContainer,
      alpha: 0,
      duration: 150,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        if (onComplete) onComplete();
        this.scene.tweens.add({
          targets: partContainer,
          alpha: 1,
          duration: 150,
          ease: 'Cubic.easeOut'
        });
      }
    });
  }

  renderMech(mech: AssembledMech) {
    this.renderHead(mech.head);
    this.renderTorso(mech.torso);
    this.renderArms(mech.arms);
    this.renderLegs(mech.legs);
  }

  private clearPart(type: PartType) {
    this.partContainers[type].removeAll(true);
  }

  private renderHead(part: Part) {
    this.clearPart('head');
    const c = this.partContainers['head'];
    const color = part.color;
    const highlight = 0xff8c42;

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.lineStyle(2, highlight, 0.8);

    switch (part.shape.head) {
      case 'round':
        graphics.fillEllipse(0, 0, 50, 45);
        graphics.strokeEllipse(0, 0, 50, 45);
        graphics.fillStyle(0x1a1d24, 1);
        graphics.fillRect(-18, -8, 36, 10);
        graphics.fillStyle(highlight, 1);
        graphics.fillRect(-15, -6, 10, 6);
        graphics.fillRect(5, -6, 10, 6);
        break;
      case 'angular':
        graphics.fillTriangle(-25, 15, 0, -25, 25, 15);
        graphics.strokeTriangle(-25, 15, 0, -25, 25, 15);
        graphics.fillRect(-20, 15, 40, 15);
        graphics.strokeRect(-20, 15, 40, 15);
        graphics.fillStyle(highlight, 1);
        graphics.fillTriangle(-12, 8, 0, -12, 12, 8);
        break;
      case 'visor':
        graphics.fillRoundedRect(-28, -18, 56, 36, 8);
        graphics.strokeRoundedRect(-28, -18, 56, 36, 8);
        graphics.fillStyle(0x1a1d24, 1);
        graphics.fillRoundedRect(-24, -12, 48, 20, 4);
        const visorGrad = this.scene.add.graphics();
        visorGrad.fillGradientStyle(0xff8c42, 0xff8c42, 0xff6b35, 0xff6b35, 1);
        visorGrad.fillRoundedRect(-22, -10, 44, 16, 3);
        c.add(visorGrad);
        break;
    }
    c.add(graphics);
  }

  private renderTorso(part: Part) {
    this.clearPart('torso');
    const c = this.partContainers['torso'];
    const color = part.color;
    const highlight = 0xff8c42;

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.lineStyle(2, highlight, 0.8);

    switch (part.shape.torso) {
      case 'bulky':
        graphics.fillRoundedRect(-45, -35, 90, 100, 10);
        graphics.strokeRoundedRect(-45, -35, 90, 100, 10);
        graphics.fillStyle(highlight, 0.6);
        graphics.fillRoundedRect(-35, -25, 70, 20, 5);
        graphics.fillStyle(0x1a1d24, 1);
        graphics.fillCircle(0, 25, 12);
        graphics.fillStyle(highlight, 1);
        graphics.fillCircle(0, 25, 8);
        break;
      case 'slim':
        graphics.fillRoundedRect(-30, -30, 60, 90, 8);
        graphics.strokeRoundedRect(-30, -30, 60, 90, 8);
        graphics.fillStyle(highlight, 0.5);
        graphics.fillRoundedRect(-22, -20, 44, 15, 4);
        graphics.fillStyle(0x1a1d24, 1);
        graphics.fillCircle(0, 20, 10);
        break;
      case 'titan':
        graphics.fillRoundedRect(-60, -40, 120, 110, 12);
        graphics.strokeRoundedRect(-60, -40, 120, 110, 12);
        graphics.fillStyle(highlight, 0.7);
        graphics.fillRoundedRect(-50, -30, 100, 25, 6);
        graphics.fillRoundedRect(-50, 10, 100, 20, 5);
        graphics.fillStyle(0x1a1d24, 1);
        graphics.fillCircle(0, 35, 16);
        graphics.fillStyle(highlight, 1);
        graphics.fillCircle(0, 35, 11);
        break;
    }
    c.add(graphics);
  }

  private renderArms(part: Part) {
    this.clearPart('arms');
    const c = this.partContainers['arms'];
    const color = part.color;
    const highlight = 0xff8c42;

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.lineStyle(2, highlight, 0.8);

    switch (part.shape.arms) {
      case 'cannon':
        graphics.fillRoundedRect(-70, -15, 25, 60, 6);
        graphics.strokeRoundedRect(-70, -15, 25, 60, 6);
        graphics.fillRoundedRect(45, -15, 25, 60, 6);
        graphics.strokeRoundedRect(45, -15, 25, 60, 6);
        graphics.fillStyle(highlight, 1);
        graphics.fillRoundedRect(-68, 35, 21, 25, 5);
        graphics.fillRoundedRect(47, 35, 21, 25, 5);
        graphics.fillStyle(0x1a1d24, 1);
        graphics.fillCircle(-57, 47, 5);
        graphics.fillCircle(58, 47, 5);
        break;
      case 'blade':
        graphics.fillRoundedRect(-65, -10, 20, 55, 5);
        graphics.strokeRoundedRect(-65, -10, 20, 55, 5);
        graphics.fillRoundedRect(45, -10, 20, 55, 5);
        graphics.strokeRoundedRect(45, -10, 20, 55, 5);
        graphics.fillStyle(highlight, 1);
        graphics.fillTriangle(-55, 35, -75, 85, -35, 45);
        graphics.strokeTriangle(-55, 35, -75, 85, -35, 45);
        graphics.fillTriangle(55, 35, 75, 85, 35, 45);
        graphics.strokeTriangle(55, 35, 75, 85, 35, 45);
        break;
      case 'shield':
        graphics.fillRoundedRect(-70, -15, 22, 55, 5);
        graphics.strokeRoundedRect(-70, -15, 22, 55, 5);
        graphics.fillStyle(highlight, 0.9);
        graphics.fillRoundedRect(-90, -30, 25, 90, 8);
        graphics.strokeRoundedRect(-90, -30, 25, 90, 8);
        graphics.fillStyle(0x1a1d24, 0.7);
        graphics.fillRoundedRect(-85, -22, 15, 74, 5);
        graphics.fillRoundedRect(45, -15, 22, 55, 5);
        graphics.strokeRoundedRect(45, -15, 22, 55, 5);
        graphics.fillStyle(highlight, 1);
        graphics.fillRoundedRect(47, 30, 18, 25, 5);
        break;
    }
    c.add(graphics);
  }

  private renderLegs(part: Part) {
    this.clearPart('legs');
    const c = this.partContainers['legs'];
    const color = part.color;
    const highlight = 0xff8c42;

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.lineStyle(2, highlight, 0.8);

    switch (part.shape.legs) {
      case 'tank':
        graphics.fillRoundedRect(-55, -10, 40, 25, 5);
        graphics.strokeRoundedRect(-55, -10, 40, 25, 5);
        graphics.fillRoundedRect(15, -10, 40, 25, 5);
        graphics.strokeRoundedRect(15, -10, 40, 25, 5);
        graphics.fillStyle(0x2a2d35, 1);
        graphics.fillEllipse(-35, 20, 55, 20);
        graphics.fillEllipse(35, 20, 55, 20);
        graphics.fillStyle(highlight, 0.7);
        for (let i = 0; i < 5; i++) {
          graphics.fillRect(-60 + i * 11, 15, 8, 10);
          graphics.fillRect(10 + i * 11, 15, 8, 10);
        }
        break;
      case 'spider':
        for (let i = 0; i < 4; i++) {
          const angle = -120 + i * 30;
          const rad = Phaser.Math.DegToRad(angle);
          const x1 = Math.cos(rad) * 10;
          const y1 = Math.sin(rad) * 5;
          const x2 = Math.cos(rad) * 55;
          const y2 = Math.sin(rad) * 55 + 30;
          graphics.lineStyle(8, color, 1);
          graphics.lineBetween(x1, y1, x2, y2);
          graphics.fillStyle(highlight, 1);
          graphics.fillCircle(x2, y2, 6);
        }
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(-25, -10, 50, 25, 6);
        graphics.strokeRoundedRect(-25, -10, 50, 25, 6);
        break;
      case 'bipedal':
        graphics.fillRoundedRect(-30, -10, 22, 40, 5);
        graphics.strokeRoundedRect(-30, -10, 22, 40, 5);
        graphics.fillRoundedRect(8, -10, 22, 40, 5);
        graphics.strokeRoundedRect(8, -10, 22, 40, 5);
        graphics.fillStyle(highlight, 0.9);
        graphics.fillRoundedRect(-40, 25, 35, 15, 5);
        graphics.strokeRoundedRect(-40, 25, 35, 15, 5);
        graphics.fillRoundedRect(5, 25, 35, 15, 5);
        graphics.strokeRoundedRect(5, 25, 35, 15, 5);
        graphics.fillStyle(0x1a1d24, 0.6);
        graphics.fillRoundedRect(-35, 28, 5, 9, 2);
        graphics.fillRoundedRect(10, 28, 5, 9, 2);
        break;
    }
    c.add(graphics);
  }
}
