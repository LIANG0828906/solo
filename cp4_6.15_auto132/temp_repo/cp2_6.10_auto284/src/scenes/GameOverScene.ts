import Phaser from 'phaser'

interface GameOverData {
  score: number
  stardust: number
  highScore: number
}

export class GameOverScene extends Phaser.Scene {
  private data!: GameOverData

  constructor() {
    super('GameOverScene')
  }

  init(data: GameOverData): void {
    this.data = data
  }

  create(): void {
    const { width, height } = this.cameras.main

    const bgGradient = this.add.graphics()
    bgGradient.fillStyle(0x0b0f2a, 0.9)
    bgGradient.fillRect(0, 0, width, height)
    bgGradient.setDepth(-10)

    this.createBackgroundStars()

    const panelWidth = Math.min(500, width - 80)
    const panelHeight = 420
    const panelX = width / 2
    const panelY = height / 2

    const panelGlow = this.add.graphics()
    panelGlow.lineStyle(4, 0x7b2ff7, 0.8)
    panelGlow.strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 20)
    panelGlow.lineStyle(2, 0xff4b8b, 0.6)
    panelGlow.strokeRoundedRect(panelX - panelWidth / 2 - 4, panelY - panelHeight / 2 - 4, panelWidth + 8, panelHeight + 8, 22)

    const panel = this.add.graphics()
    panel.fillStyle(0x0a0a20, 0.95)
    panel.fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 20)
    panel.lineStyle(3, 0x00e5ff, 0.8)
    panel.strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 20)

    const title = this.add.text(panelX, panelY - panelHeight / 2 + 50, '游戏结束', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#ff4b8b',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    title.setDepth(10)
    title.setShadow(4, 4, '#000000', 4, true, true)

    this.tweens.add({
      targets: title,
      scale: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.out'
    })

    const items = [
      { label: '最终分数', value: this.data.score.toString(), color: '#00e5ff', y: 0 },
      { label: '星尘收集', value: this.data.stardust.toString(), color: '#ffd700', y: 70 },
      { label: '最高分数', value: this.data.highScore.toString(), color: '#ff4b8b', y: 140 }
    ]

    items.forEach((item, index) => {
      const y = panelY + item.y

      const label = this.add.text(panelX - 20, y, item.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#aaaaaa'
      })
      label.setOrigin(1, 0.5)
      label.setDepth(10)
      label.setAlpha(0)

      const value = this.add.text(panelX + 20, y, item.value, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '32px',
        color: item.color,
        fontStyle: 'bold'
      })
      value.setOrigin(0, 0.5)
      value.setDepth(10)
      value.setShadow(2, 2, '#000000', 2, true, true)
      value.setAlpha(0)

      this.tweens.add({
        targets: [label, value],
        alpha: { from: 0, to: 1 },
        duration: 500,
        delay: 300 + index * 150,
        ease: 'Power2.out'
      })
    })

    const buttonWidth = 200
    const buttonHeight = 60
    const buttonX = panelX
    const buttonY = panelY + panelHeight / 2 - 70

    const buttonBg = this.add.graphics()
    const drawButton = (scale: number, glowIntensity: number) => {
      buttonBg.clear()
      buttonBg.fillStyle(0x7b2ff7, 0.8)
      buttonBg.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 15)
      buttonBg.lineStyle(2 + glowIntensity, 0xff4b8b, 0.8 + glowIntensity * 0.2)
      buttonBg.strokeRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 15)
    }
    drawButton(1, 0)

    const buttonText = this.add.text(buttonX, buttonY, '重新开始', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    buttonText.setOrigin(0.5)
    buttonText.setDepth(10)
    buttonText.setShadow(2, 2, '#000000', 2, true, true)

    const buttonContainer = this.add.container(buttonX, buttonY)
    buttonContainer.setSize(buttonWidth, buttonHeight)
    buttonContainer.setInteractive({ useHandCursor: true })

    buttonContainer.on('pointerover', () => {
      this.tweens.add({
        targets: buttonContainer,
        scale: 1.05,
        duration: 150
      })
      drawButton(1.05, 1)
    })

    buttonContainer.on('pointerout', () => {
      this.tweens.add({
        targets: buttonContainer,
        scale: 1,
        duration: 150
      })
      drawButton(1, 0)
    })

    buttonContainer.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.time.delayedCall(300, () => {
        this.scene.start('GameScene')
      })
    })

    this.tweens.add({
      targets: [buttonBg, buttonContainer],
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1 },
      duration: 400,
      delay: 800,
      ease: 'Back.out'
    })

    const hint = this.add.text(panelX, panelY + panelHeight / 2 - 25, '按空格键或点击按钮重新开始', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#666666'
    })
    hint.setOrigin(0.5)
    hint.setDepth(10)
    hint.setAlpha(0)

    this.tweens.add({
      targets: hint,
      alpha: { from: 0, to: 1 },
      duration: 500,
      delay: 1200
    })

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.time.delayedCall(300, () => {
        this.scene.start('GameScene')
      })
    })

    this.cameras.main.fadeIn(400, 0, 0, 0)
  }

  private createBackgroundStars(): void {
    const { width, height } = this.cameras.main

    for (let i = 0; i < 50; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.Between(0.3, 0.8)
      )

      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 1 },
        yoyo: true,
        repeat: -1,
        duration: Phaser.Math.Between(1000, 3000),
        delay: Phaser.Math.Between(0, 1000)
      })
    }
  }
}
