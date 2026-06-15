import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    private progressBar!: Phaser.GameObjects.Graphics;
    private progressBorder!: Phaser.GameObjects.Graphics;
    private progressWidth: number = 400;
    private progressHeight: number = 24;
    private currentProgress: number = 0;
    private targetProgress: number = 0;

    constructor() {
        super('BootScene');
    }

    preload(): void {
        this.createProgressBar();
        this.generatePixelAssets();

        this.load.on('progress', (value: number) => {
            this.targetProgress = value;
        });

        this.load.on('complete', () => {
            this.targetProgress = 1;
        });

        for (let i = 0; i < 20; i++) {
            this.load.image(`fake_${i}`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        }
    }

    create(): void {
        this.scene.start('GameScene');
        this.scene.start('UIScene');
    }

    update(): void {
        if (this.currentProgress < this.targetProgress) {
            this.currentProgress = Math.min(this.currentProgress + 0.02, this.targetProgress);
            this.updateProgressBar(this.currentProgress);
        }
    }

    private createProgressBar(): void {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        this.progressBorder = this.add.graphics();
        this.progressBorder.lineStyle(2, 0xffffff, 1);
        this.drawPixelRect(
            this.progressBorder,
            centerX - this.progressWidth / 2 - 4,
            centerY - this.progressHeight / 2 - 4,
            this.progressWidth + 8,
            this.progressHeight + 8
        );

        this.progressBar = this.add.graphics();

        const loadingText = this.add.text(centerX, centerY - 50, '加载中...', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        loadingText.setResolution(2);
    }

    private updateProgressBar(progress: number): void {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        this.progressBar.clear();
        this.progressBar.fillStyle(0x333333, 1);
        this.drawPixelFillRect(
            this.progressBar,
            centerX - this.progressWidth / 2,
            centerY - this.progressHeight / 2,
            this.progressWidth,
            this.progressHeight
        );

        const fillWidth = this.progressWidth * progress;
        const color = this.getProgressColor(progress);
        this.progressBar.fillStyle(color, 1);
        this.drawPixelFillRect(
            this.progressBar,
            centerX - this.progressWidth / 2,
            centerY - this.progressHeight / 2,
            fillWidth,
            this.progressHeight
        );

        const percentText = this.add.text(centerX, centerY, `${Math.floor(progress * 100)}%`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        percentText.setResolution(2);

        this.time.delayedCall(16, () => {
            percentText.destroy();
        });
    }

    private getProgressColor(progress: number): number {
        if (progress < 0.33) return 0xff6b6b;
        if (progress < 0.66) return 0xffd93d;
        return 0x6bcb77;
    }

    private drawPixelRect(graphics: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
        const pixelSize = 2;
        for (let px = 0; px < w; px += pixelSize) {
            graphics.fillRect(x + px, y, pixelSize, pixelSize);
            graphics.fillRect(x + px, y + h - pixelSize, pixelSize, pixelSize);
        }
        for (let py = 0; py < h; py += pixelSize) {
            graphics.fillRect(x, y + py, pixelSize, pixelSize);
            graphics.fillRect(x + w - pixelSize, y + py, pixelSize, pixelSize);
        }
    }

    private drawPixelFillRect(graphics: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
        const pixelSize = 2;
        for (let px = 0; px < w; px += pixelSize) {
            for (let py = 0; py < h; py += pixelSize) {
                graphics.fillRect(x + px, y + py, pixelSize, pixelSize);
            }
        }
    }

    private generatePixelAssets(): void {
        this.generateTiles();
        this.generateBuildings();
        this.generateShip();
        this.generateResourceIcons();
        this.generateUIPanel();
    }

    private generateTiles(): void {
        this.generateTile('tile_forest', 0x2d5a27, 0x1e3d1a, 0x3d7a37);
        this.generateTile('tile_stone', 0x6b6b6b, 0x4a4a4a, 0x8b8b8b);
        this.generateTile('tile_farm', 0xd4a84a, 0xb8892d, 0xe8c470);
        this.generateTile('tile_ground', 0x8b6914, 0x6b4e0f, 0xa67c1a);
        this.generateTile('tile_water', 0x1e90ff, 0x0066cc, 0x4da6ff);
    }

    private generateTile(key: string, baseColor: number, darkColor: number, lightColor: number): void {
        const size = 16;
        const graphics = this.make.graphics({ x: 0, y: 0 });

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let color = baseColor;
                const noise = Math.random();
                if (noise < 0.15) color = darkColor;
                else if (noise > 0.85) color = lightColor;

                graphics.fillStyle(color, 1);
                graphics.fillRect(x, y, 1, 1);
            }
        }

        graphics.fillStyle(darkColor, 1);
        for (let i = 0; i < size; i++) {
            graphics.fillRect(i, 0, 1, 1);
            graphics.fillRect(i, size - 1, 1, 1);
            graphics.fillRect(0, i, 1, 1);
            graphics.fillRect(size - 1, i, 1, 1);
        }

        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    private generateBuildings(): void {
        this.generateLumberMill();
        this.generateQuarry();
        this.generateFarm();
        this.generatePort();
    }

    private generateLumberMill(): void {
        this.generateBuilding('lumbermill_1', 48, 48, [
            { color: 0x8b4513, x: 4, y: 24, w: 40, h: 20 },
            { color: 0x654321, x: 8, y: 8, w: 32, h: 18 },
            { color: 0x228b22, x: 12, y: 4, w: 8, h: 8 },
            { color: 0x228b22, x: 28, y: 4, w: 8, h: 8 },
            { color: 0x654321, x: 20, y: 32, w: 8, h: 12 }
        ]);

        this.generateBuilding('lumbermill_2', 48, 48, [
            { color: 0x8b4513, x: 2, y: 20, w: 44, h: 24 },
            { color: 0x654321, x: 6, y: 4, w: 36, h: 18 },
            { color: 0x228b22, x: 8, y: 2, w: 10, h: 10 },
            { color: 0x228b22, x: 30, y: 2, w: 10, h: 10 },
            { color: 0x8b4513, x: 40, y: 28, w: 6, h: 16 },
            { color: 0x654321, x: 18, y: 28, w: 12, h: 16 },
            { color: 0xffd700, x: 22, y: 10, w: 4, h: 4 }
        ]);

        this.generateBuilding('lumbermill_3', 48, 48, [
            { color: 0x8b4513, x: 0, y: 16, w: 48, h: 28 },
            { color: 0x654321, x: 4, y: 0, w: 40, h: 18 },
            { color: 0x228b22, x: 4, y: 0, w: 12, h: 12 },
            { color: 0x228b22, x: 32, y: 0, w: 12, h: 12 },
            { color: 0x8b4513, x: 38, y: 24, w: 8, h: 20 },
            { color: 0x654321, x: 16, y: 24, w: 16, h: 20 },
            { color: 0xffd700, x: 20, y: 8, w: 8, h: 4 },
            { color: 0xffd700, x: 22, y: 4, w: 4, h: 4 },
            { color: 0x8b0000, x: 42, y: 20, w: 4, h: 8 }
        ]);
    }

    private generateQuarry(): void {
        this.generateBuilding('quarry_1', 48, 48, [
            { color: 0x696969, x: 8, y: 28, w: 32, h: 16 },
            { color: 0x808080, x: 12, y: 20, w: 24, h: 12 },
            { color: 0xa9a9a9, x: 16, y: 16, w: 16, h: 8 },
            { color: 0x4a4a4a, x: 20, y: 36, w: 8, h: 8 }
        ]);

        this.generateBuilding('quarry_2', 48, 48, [
            { color: 0x696969, x: 4, y: 24, w: 40, h: 20 },
            { color: 0x808080, x: 8, y: 16, w: 32, h: 12 },
            { color: 0xa9a9a9, x: 12, y: 10, w: 24, h: 10 },
            { color: 0x4a4a4a, x: 36, y: 32, w: 6, h: 12 },
            { color: 0x4a4a4a, x: 18, y: 32, w: 12, h: 12 },
            { color: 0xffd700, x: 22, y: 14, w: 4, h: 4 }
        ]);

        this.generateBuilding('quarry_3', 48, 48, [
            { color: 0x696969, x: 0, y: 20, w: 48, h: 24 },
            { color: 0x808080, x: 4, y: 12, w: 40, h: 12 },
            { color: 0xa9a9a9, x: 8, y: 4, w: 32, h: 12 },
            { color: 0x4a4a4a, x: 38, y: 28, w: 8, h: 16 },
            { color: 0x4a4a4a, x: 16, y: 28, w: 16, h: 16 },
            { color: 0xffd700, x: 20, y: 8, w: 8, h: 4 },
            { color: 0xffd700, x: 22, y: 4, w: 4, h: 4 },
            { color: 0x8b0000, x: 4, y: 36, w: 4, h: 8 }
        ]);
    }

    private generateFarm(): void {
        this.generateBuilding('farm_1', 48, 48, [
            { color: 0x8b4513, x: 8, y: 28, w: 32, h: 16 },
            { color: 0xdaa520, x: 12, y: 12, w: 24, h: 20 },
            { color: 0x8b4513, x: 20, y: 36, w: 8, h: 8 },
            { color: 0xffd700, x: 16, y: 16, w: 4, h: 4 },
            { color: 0xffd700, x: 28, y: 16, w: 4, h: 4 }
        ]);

        this.generateBuilding('farm_2', 48, 48, [
            { color: 0x8b4513, x: 4, y: 24, w: 40, h: 20 },
            { color: 0xdaa520, x: 8, y: 8, w: 32, h: 20 },
            { color: 0x8b4513, x: 36, y: 32, w: 6, h: 12 },
            { color: 0x8b4513, x: 18, y: 32, w: 12, h: 12 },
            { color: 0xffd700, x: 12, y: 12, w: 6, h: 6 },
            { color: 0xffd700, x: 30, y: 12, w: 6, h: 6 },
            { color: 0x228b22, x: 20, y: 14, w: 8, h: 4 }
        ]);

        this.generateBuilding('farm_3', 48, 48, [
            { color: 0x8b4513, x: 0, y: 20, w: 48, h: 24 },
            { color: 0xdaa520, x: 4, y: 4, w: 40, h: 20 },
            { color: 0x8b4513, x: 38, y: 28, w: 8, h: 16 },
            { color: 0x8b4513, x: 16, y: 28, w: 16, h: 16 },
            { color: 0xffd700, x: 8, y: 8, w: 8, h: 8 },
            { color: 0xffd700, x: 32, y: 8, w: 8, h: 8 },
            { color: 0x228b22, x: 18, y: 10, w: 12, h: 6 },
            { color: 0x8b0000, x: 42, y: 24, w: 4, h: 8 },
            { color: 0xffd700, x: 22, y: 4, w: 4, h: 4 }
        ]);
    }

    private generatePort(): void {
        this.generateBuilding('port_1', 48, 48, [
            { color: 0x8b4513, x: 8, y: 32, w: 32, h: 12 },
            { color: 0x654321, x: 12, y: 24, w: 24, h: 12 },
            { color: 0x1e90ff, x: 16, y: 20, w: 16, h: 8 },
            { color: 0x8b4513, x: 22, y: 28, w: 4, h: 12 }
        ]);

        this.generateBuilding('port_2', 48, 48, [
            { color: 0x8b4513, x: 4, y: 28, w: 40, h: 16 },
            { color: 0x654321, x: 8, y: 18, w: 32, h: 14 },
            { color: 0x1e90ff, x: 12, y: 12, w: 24, h: 10 },
            { color: 0x8b4513, x: 36, y: 32, w: 6, h: 12 },
            { color: 0xffd700, x: 22, y: 16, w: 4, h: 4 }
        ]);

        this.generateBuilding('port_3', 48, 48, [
            { color: 0x8b4513, x: 0, y: 24, w: 48, h: 20 },
            { color: 0x654321, x: 4, y: 12, w: 40, h: 16 },
            { color: 0x1e90ff, x: 8, y: 4, w: 32, h: 12 },
            { color: 0x8b4513, x: 38, y: 28, w: 8, h: 16 },
            { color: 0xffd700, x: 20, y: 8, w: 8, h: 4 },
            { color: 0xffd700, x: 22, y: 4, w: 4, h: 4 },
            { color: 0x8b0000, x: 42, y: 20, w: 4, h: 8 },
            { color: 0xffffff, x: 12, y: 8, w: 4, h: 4 },
            { color: 0xffffff, x: 32, y: 8, w: 4, h: 4 }
        ]);
    }

    private generateBuilding(key: string, width: number, height: number, parts: Array<{ color: number; x: number; y: number; w: number; h: number }>): void {
        const graphics = this.make.graphics({ x: 0, y: 0 });

        parts.forEach(part => {
            graphics.fillStyle(part.color, 1);
            for (let y = part.y; y < part.y + part.h; y++) {
                for (let x = part.x; x < part.x + part.w; x++) {
                    const noise = Math.random();
                    if (noise > 0.1) {
                        graphics.fillRect(x, y, 1, 1);
                    }
                }
            }
        });

        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    private generateShip(): void {
        const graphics = this.make.graphics({ x: 0, y: 0 });

        graphics.fillStyle(0x8b4513, 1);
        for (let y = 20; y < 28; y++) {
            for (let x = 4 + (y - 20); x < 44 - (y - 20); x++) {
                graphics.fillRect(x, y, 1, 1);
            }
        }

        graphics.fillStyle(0x654321, 1);
        graphics.fillRect(23, 4, 2, 20);

        graphics.fillStyle(0xffffff, 1);
        for (let y = 6; y < 18; y++) {
            for (let x = 25; x < 25 + (y - 6) / 2 + 2; x++) {
                if (Math.random() > 0.05) {
                    graphics.fillRect(x, y, 1, 1);
                }
            }
        }

        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(25, 4, 6, 4);

        graphics.generateTexture('ship', 48, 32);
        graphics.destroy();
    }

    private generateResourceIcons(): void {
        this.generateResourceIcon('icon_wood', 0x8b4513, 0x654321, 0xa0522d);
        this.generateResourceIcon('icon_stone', 0x808080, 0x696969, 0xa9a9a9);
        this.generateResourceIcon('icon_grain', 0xffd700, 0xdaa520, 0xffec8b);
        this.generateResourceIcon('icon_gold', 0xffd700, 0xffa500, 0xffec8b, true);
    }

    private generateResourceIcon(key: string, mainColor: number, darkColor: number, lightColor: number, isGold: boolean = false): void {
        const size = 24;
        const graphics = this.make.graphics({ x: 0, y: 0 });

        if (isGold) {
            graphics.fillStyle(mainColor, 1);
            for (let y = 4; y < size - 4; y++) {
                for (let x = 4; x < size - 4; x++) {
                    const dx = x - size / 2;
                    const dy = y - size / 2;
                    if (dx * dx + dy * dy < (size / 2 - 4) * (size / 2 - 4)) {
                        const noise = Math.random();
                        let color = mainColor;
                        if (noise < 0.2) color = darkColor;
                        else if (noise > 0.8) color = lightColor;
                        graphics.fillStyle(color, 1);
                        graphics.fillRect(x, y, 1, 1);
                    }
                }
            }

            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(8, 8, 2, 2);
            graphics.fillRect(9, 7, 2, 2);
        } else {
            graphics.fillStyle(darkColor, 1);
            for (let i = 0; i < size; i++) {
                graphics.fillRect(i, 0, 1, 1);
                graphics.fillRect(i, size - 1, 1, 1);
                graphics.fillRect(0, i, 1, 1);
                graphics.fillRect(size - 1, i, 1, 1);
            }

            graphics.fillStyle(mainColor, 1);
            for (let y = 2; y < size - 2; y++) {
                for (let x = 2; x < size - 2; x++) {
                    const noise = Math.random();
                    let color = mainColor;
                    if (noise < 0.15) color = darkColor;
                    else if (noise > 0.85) color = lightColor;
                    graphics.fillStyle(color, 1);
                    graphics.fillRect(x, y, 1, 1);
                }
            }
        }

        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    private generateUIPanel(): void {
        const width = 200;
        const height = 120;
        const graphics = this.make.graphics({ x: 0, y: 0 });

        graphics.fillStyle(0x3d2817, 1);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (x < 4 || x >= width - 4 || y < 4 || y >= height - 4) {
                    const noise = Math.random();
                    let color = 0x3d2817;
                    if (noise < 0.2) color = 0x2a1b0f;
                    else if (noise > 0.8) color = 0x5c3d24;
                    graphics.fillStyle(color, 1);
                    graphics.fillRect(x, y, 1, 1);
                }
            }
        }

        graphics.fillStyle(0x1a0f08, 1);
        for (let y = 4; y < height - 4; y++) {
            for (let x = 4; x < width - 4; x++) {
                const noise = Math.random();
                let color = 0x1a0f08;
                if (noise < 0.1) color = 0x0d0704;
                else if (noise > 0.9) color = 0x2a1b0f;
                graphics.fillStyle(color, 1);
                graphics.fillRect(x, y, 1, 1);
            }
        }

        graphics.fillStyle(0x8b6914, 1);
        for (let i = 0; i < width; i++) {
            graphics.fillRect(i, 2, 1, 1);
            graphics.fillRect(i, height - 3, 1, 1);
        }
        for (let i = 0; i < height; i++) {
            graphics.fillRect(2, i, 1, 1);
            graphics.fillRect(width - 3, i, 1, 1);
        }

        graphics.generateTexture('ui_panel', width, height);
        graphics.destroy();
    }
}
