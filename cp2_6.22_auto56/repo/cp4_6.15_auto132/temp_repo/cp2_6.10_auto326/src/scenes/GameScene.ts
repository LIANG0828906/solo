import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  public create(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add.text(centerX, centerY - 100, '游戏场景', {
      fontSize: '48px',
      color: '#00ffff',
      fontFamily: 'Orbitron, sans-serif'
    }).setOrigin(0.5);

    this.add.text(centerX, centerY, '按空格键开始游戏', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Orbitron, sans-serif'
    }).setOrigin(0.5);

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.startGame();
    });
  }

  private startGame(): void {
    this.cameras.main.fade(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        '游戏进行中...',
        {
          fontSize: '32px',
          color: '#ffff00',
          fontFamily: 'Orbitron, sans-serif'
        }
      ).setOrigin(0.5);

      this.add.image(200, 200, 'player').setScale(1.5);
      this.add.image(600, 400, 'lightWall');
      this.add.image(900, 250, 'pulseTrap');
      this.add.image(400, 500, 'debris');
      this.add.image(800, 550, 'starDust').setScale(1.5);
    });
  }
}
