import Phaser from 'phaser';

export class Terrain {
  private scene: Phaser.Scene;
  private graphics!: Phaser.GameObjects.Graphics;
  private heightMap: number[] = [];
  private physicsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private terrainWidth: number = 0;
  private terrainX: number = 0;
  private terrainTopY: number = 0;
  private terrainBottomY: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generate(): void {
    const { width, height } = this.scene.scale;
    
    this.terrainWidth = width * 0.6;
    this.terrainX = (width - this.terrainWidth) / 2;
    this.terrainTopY = height * 0.3;
    this.terrainBottomY = height * 0.7;
    
    const segments = Math.floor(this.terrainWidth / 4);
    this.heightMap = new Array(segments);
    
    const peaks = 3 + Math.floor(Math.random() * 3);
    const peakPositions: number[] = [];
    for (let i = 0; i < peaks; i++) {
      peakPositions.push(0.15 + (i / (peaks - 1)) * 0.7 + (Math.random() - 0.5) * 0.1);
    }
    const peakHeights: number[] = peakPositions.map(() => 0.3 + Math.random() * 0.4);
    
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      
      let h = 0;
      for (let p = 0; p < peaks; p++) {
        const dist = Math.abs(t - peakPositions[p]);
        const influence = Math.max(0, 1 - dist * 3);
        h += peakHeights[p] * influence * influence;
      }
      
      h += this.perlinNoise(t * 8) * 0.15;
      h += this.perlinNoise(t * 16 + 100) * 0.08;
      
      h = Phaser.Math.Clamp(h, 0.1, 0.9);
      
      this.heightMap[i] = this.terrainBottomY - h * (this.terrainBottomY - this.terrainTopY);
    }
    
    this.createGraphics();
    this.createPhysicsBodies();
  }

  private perlinNoise(x: number): number {
    const xi = Math.floor(x);
    const xf = x - xi;
    
    const a = this.hash(xi);
    const b = this.hash(xi + 1);
    
    const u = xf * xf * (3 - 2 * xf);
    
    return Phaser.Math.Linear(a, b, u);
  }

  private hash(x: number): number {
    const n = Math.sin(x * 12.9898 + 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  private createGraphics(): void {
    if (this.graphics) {
      this.graphics.destroy();
    }
    
    this.graphics = this.scene.add.graphics();
    
    this.graphics.fillGradientStyle(0x7CC87C, 0x7CC87C, 0xA08060, 0xA08060, 1);
    
    this.graphics.beginPath();
    this.graphics.moveTo(this.terrainX, this.scene.scale.height);
    
    for (let i = 0; i < this.heightMap.length; i++) {
      const x = this.terrainX + i * 4;
      const y = this.heightMap[i];
      this.graphics.lineTo(x, y);
    }
    
    this.graphics.lineTo(this.terrainX + this.terrainWidth, this.scene.scale.height);
    this.graphics.closePath();
    this.graphics.fillPath();
    
    this.graphics.lineStyle(3, 0x5DAE5D, 1);
    this.graphics.beginPath();
    for (let i = 0; i < this.heightMap.length; i++) {
      const x = this.terrainX + i * 4;
      const y = this.heightMap[i];
      if (i === 0) {
        this.graphics.moveTo(x, y);
      } else {
        this.graphics.lineTo(x, y);
      }
    }
    this.graphics.strokePath();
  }

  private createPhysicsBodies(): void {
    if (this.physicsGroup) {
      this.physicsGroup.clear(true, true);
    }
    
    this.physicsGroup = this.scene.physics.add.staticGroup();
    
    const step = 20;
    const bodyHeight = 30;
    
    for (let i = 0; i < this.heightMap.length; i += step) {
      const x = this.terrainX + i * 4;
      const y = this.heightMap[i];
      const bottomY = this.scene.scale.height;
      const h = bottomY - y;
      
      let width = step * 4 + 2;
      if (i + step > this.heightMap.length) {
        width = (this.heightMap.length - i) * 4 + 2;
      }
      
      const body = this.physicsGroup.create(x + width / 2, y + h / 2) as Phaser.Physics.Arcade.Sprite;
      body.setSize(width, h);
      body.setVisible(false);
      body.refreshBody();
    }
  }

  getHeightAt(x: number): number {
    if (x < this.terrainX || x > this.terrainX + this.terrainWidth) {
      return this.scene.scale.height - 50;
    }
    
    const index = Math.floor((x - this.terrainX) / 4);
    const clampedIndex = Phaser.Math.Clamp(index, 0, this.heightMap.length - 1);
    return this.heightMap[clampedIndex];
  }

  getPhysicsGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.physicsGroup;
  }

  getBounds(): { x: number; width: number } {
    return { x: this.terrainX, width: this.terrainWidth };
  }

  destroy(): void {
    if (this.graphics) this.graphics.destroy();
    if (this.physicsGroup) this.physicsGroup.clear(true, true);
  }
}
