import Phaser from 'phaser';

export interface BrickData {
  hp: number;
  maxHp: number;
  color: string;
  row: number;
  col: number;
}

const RAINBOW_COLORS = [
  '#ff0000', '#ff4500', '#ff8c00', '#ffd700',
  '#ffff00', '#7cfc00', '#00ff00', '#00fa9a',
  '#00ffff', '#1e90ff', '#4169e1', '#4fc3f7'
];

export class BrickManager {
  private scene: Phaser.Scene;
  private bricks!: Phaser.Physics.Arcade.StaticGroup;
  public onBrickDestroy: Phaser.Events.EventEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.onBrickDestroy = new Phaser.Events.EventEmitter();
  }

  generateLevel(level: number, width: number, height: number): Phaser.Physics.Arcade.StaticGroup {
    if (this.bricks) {
      this.bricks.clear(true, true);
    }
    this.bricks = this.scene.physics.add.staticGroup();

    const cols = 8 + Math.min(level, 4);
    const rows = 4 + Math.min(level, 3);
    const brickWidth = Math.min((width - 100) / cols, 90);
    const brickHeight = 28;
    const startX = (width - cols * brickWidth) / 2;
    const startY = 100;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (Math.random() > 0.1) {
          const hp = Phaser.Math.Between(1, Math.min(3, 1 + Math.floor(row / 3)));
          const colorIndex = Math.floor((row / rows) * (RAINBOW_COLORS.length - 1));
          const color = RAINBOW_COLORS[colorIndex];
          
          const brick = this.createBrick(
            startX + col * brickWidth + brickWidth / 2,
            startY + row * (brickHeight + 6),
            brickWidth - 4,
            brickHeight,
            hp,
            color,
            row,
            col
          );
          this.bricks.add(brick);
        }
      }
    }

    return this.bricks;
  }

  private createBrick(
    x: number, y: number, width: number, height: number,
    hp: number, color: string, row: number, col: number
  ): Phaser.Physics.Arcade.Sprite {
    const key = `brick-${color}-${hp}-${Date.now()}-${Math.random()}`;
    this.createBrickTexture(key, width, height, color, hp);

    const brick = this.scene.physics.add.staticSprite(x, y, key);
    const data: BrickData = { hp, maxHp: hp, color, row, col };
    brick.setData('brickData', data);
    brick.setData('textureKey', key);
    brick.refreshBody();
    return brick;
  }

  private createBrickTexture(key: string, width: number, height: number, color: string, hp: number): void {
    if (this.scene.textures.exists(key)) return;

    const texture = this.scene.textures.createCanvas(key, width, height);
    if (!texture) return;
    const ctx = texture.getContext();
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, this.shadeColor(color, -30));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 4);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(0.5, 0.5, width - 1, height - 1, 4);
    ctx.stroke();

    if (hp > 1) {
