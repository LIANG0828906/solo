import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    private progressBar!: Phaser.GameObjects.Graphics;
    private progressBox!: Phaser.GameObjects.Graphics;

    constructor() {
        super('BootScene');
    }

    preload(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.progressBox = this.add.graphics();
        this.progressBox.lineStyle(2, 0xffffff, 1);
        this.progressBox.strokeRect(width / 2 - 160, height / 2 - 25, 320, 50);

        this.progressBar = this.add.graphics();

        const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        });
        loadingText.setOrigin(0.5);

        this.load.on('progress', (value: number) => {
            this.progressBar.clear();
            this.progressBar.fillStyle(0xffffff, 1);
            this.progressBar.fillRect(width / 2 - 156, height / 2 - 21, 312 * value, 42);
        });

        this.load.on('complete', () => {
            this.progressBar.destroy();
            this.progressBox.destroy();
        });

        this.createPlaceholderAssets();
    }

    private createPlaceholderAssets(): void {
        const graphics = this.add.graphics();

        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(50, 50, 40);
        graphics.generateTexture('player', 100, 100);
        graphics.clear();

        graphics.fillStyle(0x00ff00, 1);
        graphics.fillCircle(50, 50, 30);
        graphics.generateTexture('enemy', 100, 100);
        graphics.clear();

        graphics.fillStyle(0xffff00, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('coin', 32, 32);
        graphics.clear();

        graphics.destroy();
    }

    create(): void {
        this.scene.start('PlayScene');
    }
}
