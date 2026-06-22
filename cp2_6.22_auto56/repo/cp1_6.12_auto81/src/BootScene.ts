import Phaser from 'phaser';
import { DungeonGenerator, DungeonData } from './DungeonGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.generateTextures();
  }

  private generateTextures(): void {
    const tileSize = 16;

    for (let i = 0; i < 4; i++) {
      const g = this.add.graphics();
      const shades = [0x3a3a3a, 0x353535, 0x404040, 0x303030];
      g.fillStyle(shades[i], 1);
      g.fillRect(0, 0, tileSize, tileSize);
      g.lineStyle(1, 0x1a1a1a, 0.6);
      g.strokeRect(0, 0, tileSize, tileSize);
      g.lineStyle(1, 0x4a4a4a, 0.3);
      g.beginPath();
      g.moveTo(0, tileSize / 2);
      g.lineTo(tileSize, tileSize / 2);
      g.moveTo(tileSize / 2, 0);
      g.lineTo(tileSize / 2, tileSize / 2);
      g.moveTo(tileSize / 4, tileSize / 2);
      g.lineTo(tileSize / 4, tileSize);
      g.moveTo(tileSize * 3 / 4, tileSize / 2);
      g.lineTo(tileSize * 3 / 4, tileSize);
      g.strokePath();
      g.generateTexture(`wall_${i}`, tileSize, tileSize);
      g.destroy();
    }

    for (let i = 0; i < 4; i++) {
      const g = this.add.graphics();
      const shades = [0xc0c0c0, 0xb0b0b0, 0xd0d0d0, 0xa8a8a8];
      g.fillStyle(shades[i], 1);
      g.fillRect(0, 0, tileSize, tileSize);
      g.lineStyle(1, 0x888888, 0.4);
      g.strokeRect(1, 1, tileSize - 2, tileSize - 2);
      g.lineStyle(1, 0x999999, 0.2);
      g.beginPath();
      g.moveTo(tileSize / 2, 1);
      g.lineTo(tileSize / 2, tileSize - 1);
      g.moveTo(1, tileSize / 2);
      g.lineTo(tileSize - 1, tileSize / 2);
      g.strokePath();
      g.generateTexture(`floor_${i}`, tileSize, tileSize);
      g.destroy();
    }

    const chestG = this.add.graphics();
    chestG.fillStyle(0xdaa520, 1);
    chestG.fillRect(1, 4, tileSize - 2, tileSize - 5);
    chestG.fillStyle(0xb8860b, 1);
    chestG.fillRect(1, 1, tileSize - 2, 4);
    chestG.lineStyle(1, 0x8b6914, 1);
    chestG.strokeRect(1, 1, tileSize - 2, tileSize - 2);
    chestG.fillStyle(0xffd700, 1);
    chestG.fillRect(tileSize / 2 - 1, tileSize / 2, 2, 3);
    chestG.generateTexture('chest', tileSize, tileSize);
    chestG.destroy();

    const exitG = this.add.graphics();
    exitG.fillStyle(0x228b22, 1);
    exitG.fillRect(0, 0, tileSize, tileSize);
    exitG.fillStyle(0x00ff00, 1);
    exitG.beginPath();
    exitG.moveTo(tileSize / 2, 3);
    exitG.lineTo(tileSize - 3, tileSize / 2);
    exitG.lineTo(tileSize / 2 + 2, tileSize / 2);
    exitG.lineTo(tileSize / 2 + 2, tileSize - 3);
    exitG.lineTo(tileSize / 2 - 2, tileSize - 3);
    exitG.lineTo(tileSize / 2 - 2, tileSize / 2);
    exitG.lineTo(3, tileSize / 2);
    exitG.closePath();
    exitG.fillPath();
    exitG.generateTexture('exit', tileSize, tileSize);
    exitG.destroy();

    const playerG = this.add.graphics();
    playerG.fillStyle(0x1e90ff, 1);
    playerG.fillRect(2, 2, tileSize - 4, tileSize - 4);
    playerG.fillStyle(0xffffff, 1);
    playerG.fillRect(5, 5, 2, 2);
    playerG.fillRect(9, 5, 2, 2);
    playerG.lineStyle(1, 0x0066cc, 1);
    playerG.strokeRect(2, 2, tileSize - 4, tileSize - 4);
    playerG.generateTexture('player', tileSize, tileSize);
    playerG.destroy();

    const slimeG = this.add.graphics();
    slimeG.fillStyle(0x32cd32, 1);
    slimeG.beginPath();
    slimeG.arc(tileSize / 2, tileSize / 2 + 1, 6, 0, Math.PI * 2);
    slimeG.fillPath();
    slimeG.fillStyle(0x228b22, 1);
    slimeG.beginPath();
    slimeG.arc(tileSize / 2, tileSize / 2 + 1, 6, Math.PI, Math.PI * 2);
    slimeG.fillPath();
    slimeG.fillStyle(0x000000, 1);
    slimeG.fillRect(5, 7, 2, 2);
    slimeG.fillRect(9, 7, 2, 2);
    slimeG.fillStyle(0x32cd32, 1);
    slimeG.fillRect(tileSize / 2 - 1, 1, 2, 4);
    slimeG.fillStyle(0x00ff00, 1);
    slimeG.fillCircle(tileSize / 2, 1, 1.5);
    slimeG.generateTexture('slime', tileSize, tileSize);
    slimeG.destroy();

    const heartG = this.add.graphics();
    heartG.fillStyle(0xff0000, 1);
    heartG.beginPath();
    heartG.arc(5, 5, 3, 0, Math.PI * 2);
    heartG.arc(11, 5, 3, 0, Math.PI * 2);
    heartG.moveTo(2, 6);
    heartG.lineTo(8, 14);
    heartG.lineTo(14, 6);
    heartG.fillPath();
    heartG.generateTexture('heart', tileSize, tileSize);
    heartG.destroy();

    const keyG = this.add.graphics();
    keyG.fillStyle(0xc0c0c0, 1);
    keyG.beginPath();
    keyG.arc(5, 8, 3, 0, Math.PI * 2);
    keyG.fillPath();
    keyG.fillStyle(0x2a2a2a, 1);
    keyG.beginPath();
    keyG.arc(5, 8, 1.2, 0, Math.PI * 2);
    keyG.fillPath();
    keyG.fillStyle(0xc0c0c0, 1);
    keyG.fillRect(7, 7, 7, 2);
    keyG.fillRect(11, 9, 2, 2);
    keyG.fillRect(13, 9, 1, 3);
    keyG.generateTexture('key', tileSize, tileSize);
    keyG.destroy();

    const chestOpenG = this.add.graphics();
    chestOpenG.fillStyle(0xdaa520, 1);
    chestOpenG.fillRect(1, 8, tileSize - 2, tileSize - 9);
    chestOpenG.fillStyle(0x1a1a1a, 1);
    chestOpenG.fillRect(2, 9, tileSize - 4, 3);
    chestOpenG.fillStyle(0xb8860b, 1);
    chestOpenG.fillRect(1, 1, tileSize - 2, 4);
    chestOpenG.lineStyle(1, 0x8b6914, 1);
    chestOpenG.strokeRect(1, 8, tileSize - 2, tileSize - 9);
    chestOpenG.strokeRect(1, 1, tileSize - 2, 4);
    chestOpenG.fillStyle(0xffd700, 1);
    chestOpenG.fillRect(tileSize / 2 - 1, 11, 2, 3);
    chestOpenG.generateTexture('chest_open', tileSize, tileSize);
    chestOpenG.destroy();
  }

  create(): void {
    const seed = this.game.registry.get('seed') as number || 1;
    const generator = new DungeonGenerator(seed, 8);
    const dungeonData = generator.generate();

    this.registry.set('dungeonData', dungeonData);
    this.scene.start('DungeonScene');
  }
}
