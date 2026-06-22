export class HUD {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private energyBar!: Phaser.GameObjects.Graphics;
  private energyBarBg!: Phaser.GameObjects.Graphics;
  private energyBarWidth: number = 400;
  private energyBarHeight: number = 20;
  private selectedTurretButton: number | null = null;
  private turretButtons: Phaser.GameObjects.Container[] = [];
  private screenFlash!: Phaser.GameObjects.Rectangle;
  private edgeGlow!: Phaser.GameObjects.Graphics;
  private waveBanner!: Phaser.GameObjects.Container;
  private chordWaveReadyIndicator!: Phaser.GameObjects.Text;

  private colors = {
    background: '#0d0221',
    grid: '#00ffff',
    treble: '#aaff00',
    mid: '#ff8800',
    bass: '#aa00ff'
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.screenFlash = this.scene.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0)
      .setDepth(1000);

    this.edgeGlow = this.scene.add.graphics()
      .setDepth(999);

    this.scoreText = this.scene.add.text(30, 30, '得分: 0', {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '28px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setDepth(100);

    this.waveText = this.scene.add.text(30, 70, '波次: 1', {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: '#ff8800',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(100);

    this.healthText = this.scene.add.text(30, 105, '生命: 100', {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '20px',
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(100);

    this.comboText = this.scene.add.text(width - 30, 105, '连击: 0', {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'right'
    }).setOrigin(1, 0).setDepth(100);

    this.energyBarBg = this.scene.add.graphics()
      .setDepth(100);
    this.energyBar = this.scene.add.graphics()
      .setDepth(101);

    this.drawEnergyBarBackground();

    this.chordWaveReadyIndicator = this.scene.add.text(width / 2, height - 60, '和弦波就绪！点击释放', {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff00ff',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(102).setVisible(false);

    this.createTurretButtons();
    this.createWaveBanner();
  }

  private drawEnergyBarBackground(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const x = width / 2 - this.energyBarWidth / 2;
    const y = height - 45;

    this.energyBarBg.clear();
    this.energyBarBg.lineStyle(3, 0x00ffff, 1);
    this.energyBarBg.strokeRoundedRect(x, y, this.energyBarWidth, this.energyBarHeight, 5);
    this.energyBarBg.fillStyle(0x0d0221, 0.8);
    this.energyBarBg.fillRoundedRect(x, y, this.energyBarWidth, this.energyBarHeight, 5);
  }

  updateEnergy(energy: number, maxEnergy: number): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const x = width / 2 - this.energyBarWidth / 2;
    const y = height - 45;

    this.energyBar.clear();
    
    const progress = Phaser.Math.Clamp(energy / maxEnergy, 0, 1);
    const fillWidth = (this.energyBarWidth - 4) * progress;
    
    this.energyBar.fillGradientStyle(0x00ffff, 0xffff00, 0x00ffff, 0xffff00, 1, 1, 1, 1);
    this.energyBar.fillRoundedRect(x + 2, y + 2, fillWidth, this.energyBarHeight - 4, 3);

    this.chordWaveReadyIndicator.setVisible(energy >= maxEnergy);
    
    if (energy >= maxEnergy) {
      this.chordWaveReadyIndicator.setAlpha(0.5 + Math.sin(this.scene.time.now * 0.01) * 0.5);
    }
  }

  private createTurretButtons(): void {
    const height = this.scene.cameras.main.height;
    const buttonY = height - 100;
    const buttonSize = 70;
    const spacing = 20;
    const startX = 30;

    const turretTypes = [
      { name: '高音', color: this.colors.treble, frequency: 880, id: 0 },
      { name: '中音', color: this.colors.mid, frequency: 440, id: 1 },
      { name: '低音', color: this.colors.bass, frequency: 220, id: 2 }
    ];

    turretTypes.forEach((turret, index) => {
      const container = this.scene.add.container(startX + index * (buttonSize + spacing), buttonY);
      
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x0d0221, 0.9);
      bg.lineStyle(3, Phaser.Display.Color.HexStringToColor(turret.color).color, 1);
      bg.strokeRoundedRect(0, 0, buttonSize, buttonSize, 10);
      bg.fillRoundedRect(0, 0, buttonSize, buttonSize, 10);
      
      const icon = this.scene.add.graphics();
      const centerX = buttonSize / 2;
      const centerY = buttonSize / 2;
      
      if (index === 0) {
        for (let i = 0; i < 3; i++) {
          icon.fillStyle(Phaser.Display.Color.HexStringToColor(turret.color).color, 1);
          icon.fillCircle(centerX - 15 + i * 15, centerY, 6 - i);
        }
      } else if (index === 1) {
        icon.fillStyle(Phaser.Display.Color.HexStringToColor(turret.color).color, 1);
        icon.fillCircle(centerX, centerY, 12);
      } else {
        icon.fillStyle(Phaser.Display.Color.HexStringToColor(turret.color).color, 1);
        icon.fillCircle(centerX, centerY, 16);
      }
      
      const text = this.scene.add.text(centerX, buttonSize + 20, turret.name, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '14px',
        color: turret.color,
        fontStyle: 'bold'
      }).setOrigin(0.5);

      container.add([bg, icon, text]);
      container.setSize(buttonSize, buttonSize);
      container.setDepth(100);
      
      container.setInteractive({ useHandCursor: true });
      
      container.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x1a0540, 0.9);
        bg.lineStyle(4, Phaser.Display.Color.HexStringToColor(turret.color).color, 1);
        bg.strokeRoundedRect(0, 0, buttonSize, buttonSize, 10);
        bg.fillRoundedRect(0, 0, buttonSize, buttonSize, 10);
        container.setScale(1.05);
      });
      
      container.on('pointerout', () => {
        const isSelected = this.selectedTurretButton === index;
        bg.clear();
        bg.fillStyle(isSelected ? 0x1a0540 : 0x0d0221, 0.9);
        bg.lineStyle(isSelected ? 4 : 3, Phaser.Display.Color.HexStringToColor(turret.color).color, 1);
        bg.strokeRoundedRect(0, 0, buttonSize, buttonSize, 10);
        bg.fillRoundedRect(0, 0, buttonSize, buttonSize, 10);
        container.setScale(1);
      });
      
      container.on('pointerdown', () => {
        this.selectTurret(index);
      });

      this.turretButtons.push(container);
    });
  }

  private selectTurret(index: number): void {
    this.selectedTurretButton = this.selectedTurretButton === index ? null : index;
    
    this.turretButtons.forEach((btn, i) => {
      const bg = btn.getAt(0) as Phaser.GameObjects.Graphics;
      const buttonSize = 70;
      const turretTypes = [
        { color: this.colors.treble },
        { color: this.colors.mid },
        { color: this.colors.bass }
      ];
      
      bg.clear();
      const isSelected = this.selectedTurretButton === i;
      bg.fillStyle(isSelected ? 0x1a0540 : 0x0d0221, 0.9);
      bg.lineStyle(isSelected ? 4 : 3, Phaser.Display.Color.HexStringToColor(turretTypes[i].color).color, 1);
      bg.strokeRoundedRect(0, 0, buttonSize, buttonSize, 10);
      bg.fillRoundedRect(0, 0, buttonSize, buttonSize, 10);
    });

    this.scene.events.emit('turret-selected', this.selectedTurretButton);
  }

  getSelectedTurret(): number | null {
    return this.selectedTurretButton;
  }

  updateScore(score: number): void {
    this.scoreText.setText(`得分: ${score}`);
  }

  updateWave(wave: number): void {
    this.waveText.setText(`波次: ${wave}`);
    this.showWaveBanner(wave);
  }

  updateHealth(health: number): void {
    this.healthText.setText(`生命: ${health}`);
    if (health <= 30) {
      this.healthText.setColor('#ff0000');
    } else if (health <= 60) {
      this.healthText.setColor('#ffaa00');
    } else {
      this.healthText.setColor('#ff4444');
    }
  }

  updateCombo(combo: number): void {
    this.comboText.setText(`连击: ${combo}`);
    
    if (combo >= 5) {
      this.comboText.setScale(1.2 + Math.sin(this.scene.time.now * 0.02) * 0.1);
      this.triggerEdgeGlow(combo);
    } else {
      this.comboText.setScale(1);
    }
  }

  private triggerEdgeGlow(combo: number): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const intensity = Math.min(combo / 20, 1);
    
    this.edgeGlow.clear();
    
    this.edgeGlow.fillGradientStyle(0xff00ff, 0xff00ff, 0x00ffff, 0x00ffff, intensity * 0.5, intensity * 0.5, intensity * 0.3, intensity * 0.3);
    this.edgeGlow.fillRect(0, 0, width, 50);
    
    this.edgeGlow.fillGradientStyle(0x00ffff, 0x00ffff, 0xff00ff, 0xff00ff, intensity * 0.3, intensity * 0.3, intensity * 0.5, intensity * 0.5);
    this.edgeGlow.fillRect(0, height - 50, width, 50);
    
    this.scene.time.delayedCall(200, () => {
      this.edgeGlow.clear();
    });
  }

  triggerScreenFlash(duration: number = 150, color: number = 0xffffff): void {
    this.screenFlash.fillColor = color;
    this.screenFlash.setAlpha(0.8);
    
    this.scene.tweens.add({
      targets: this.screenFlash,
      alpha: 0,
      duration: duration,
      ease: 'Quad.easeOut'
    });
  }

  triggerScreenShake(intensity: number = 0.02, duration: number = 300): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  private createWaveBanner(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    this.waveBanner = this.scene.add.container(width / 2, height / 2 - 100);
    this.waveBanner.setDepth(200);
    this.waveBanner.setVisible(false);
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0d0221, 0.8);
    bg.lineStyle(3, 0x00ffff, 1);
    bg.strokeRoundedRect(-200, -50, 400, 100, 15);
    bg.fillRoundedRect(-200, -50, 400, 100, 15);
    
    const text = this.scene.add.text(0, 0, '', {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '36px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    this.waveBanner.add([bg, text]);
  }

  private showWaveBanner(wave: number): void {
    const text = this.waveBanner.getAt(1) as Phaser.GameObjects.Text;
    text.setText(`第 ${wave} 波`);
    
    this.waveBanner.setVisible(true);
    this.waveBanner.setScale(0.5);
    this.waveBanner.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.waveBanner,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 1000,
      onComplete: () => {
        this.waveBanner.setVisible(false);
      }
    });
  }

  resize(width: number, height: number): void {
    this.scoreText.setPosition(30, 30);
    this.waveText.setPosition(30, 70);
    this.healthText.setPosition(30, 105);
    this.comboText.setPosition(width - 30, 105);
    
    this.drawEnergyBarBackground();
    
    const buttonY = height - 100;
    const buttonSize = 70;
    const spacing = 20;
    const startX = 30;
    
    this.turretButtons.forEach((btn, index) => {
      btn.setPosition(startX + index * (buttonSize + spacing), buttonY);
    });

    this.screenFlash.setPosition(width / 2, height / 2);
    this.screenFlash.setSize(width, height);
    
    this.waveBanner.setPosition(width / 2, height / 2 - 100);
    this.chordWaveReadyIndicator.setPosition(width / 2, height - 60);
  }
}
