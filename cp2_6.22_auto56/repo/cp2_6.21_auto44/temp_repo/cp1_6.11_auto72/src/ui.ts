export class UIManager {
  private scoreElement: HTMLElement;
  private speedElement: HTMLElement;
  private energyBar: HTMLElement;
  private livesContainer: HTMLElement;
  private loadingScreen: HTMLElement;
  private startScreen: HTMLElement;
  private hud: HTMLElement;
  private gameOverScreen: HTMLElement;
  private finalScoreElement: HTMLElement;
  private highScoreElement: HTMLElement;
  private damageOverlay: HTMLElement;

  private highScore = 0;

  constructor() {
    this.scoreElement = document.getElementById('score-value')!;
    this.speedElement = document.getElementById('speed-value')!;
    this.energyBar = document.getElementById('energy-bar')!;
    this.livesContainer = document.getElementById('lives-container')!;
    this.loadingScreen = document.getElementById('loading-screen')!;
    this.startScreen = document.getElementById('start-screen')!;
    this.hud = document.getElementById('hud')!;
    this.gameOverScreen = document.getElementById('game-over-screen')!;
    this.finalScoreElement = document.getElementById('final-score')!;
    this.highScoreElement = document.getElementById('high-score')!;
    this.damageOverlay = document.getElementById('damage-overlay')!;

    this.loadHighScore();
  }

  private loadHighScore() {
    const saved = localStorage.getItem('neon_race_high_score');
    if (saved) {
      this.highScore = parseInt(saved, 10);
    }
  }

  private saveHighScore() {
    localStorage.setItem('neon_race_high_score', this.highScore.toString());
  }

  hideLoading() {
    this.loadingScreen.classList.add('hidden');
    setTimeout(() => {
      this.loadingScreen.style.display = 'none';
    }, 1000);
  }

  showStartScreen() {
    this.startScreen.classList.add('visible');
  }

  hideStartScreen() {
    this.startScreen.classList.remove('visible');
  }

  showHUD() {
    this.hud.classList.add('visible');
  }

  hideHUD() {
    this.hud.classList.remove('visible');
  }

  updateScore(score: number) {
    this.scoreElement.textContent = Math.floor(score).toString();
  }

  updateSpeed(speed: number) {
    this.speedElement.textContent = Math.floor(speed).toString();
  }

  updateEnergy(energy: number, maxEnergy: number) {
    const percentage = (energy / maxEnergy) * 100;
    this.energyBar.style.width = `${percentage}%`;

    if (percentage < 20) {
      this.energyBar.classList.add('low');
    } else {
      this.energyBar.classList.remove('low');
    }
  }

  updateLives(lives: number) {
    const lifeIcons = this.livesContainer.querySelectorAll('.life-icon');
    lifeIcons.forEach((icon, index) => {
      if (index < lives) {
        icon.classList.remove('lost');
      } else {
        icon.classList.add('lost');
      }
    });
  }

  showDamageEffect() {
    this.damageOverlay.classList.add('active');
    setTimeout(() => {
      this.damageOverlay.classList.remove('active');
    }, 500);
  }

  showGameOver(score: number) {
    const isNewHighScore = score > this.highScore;
    if (isNewHighScore) {
      this.highScore = Math.floor(score);
      this.saveHighScore();
    }

    this.finalScoreElement.textContent = Math.floor(score).toString();
    this.highScoreElement.textContent = `最高分: ${this.highScore}`;
    
    if (isNewHighScore) {
      this.highScoreElement.textContent += ' (新纪录!)';
    }

    this.gameOverScreen.classList.add('visible');
  }

  hideGameOver() {
    this.gameOverScreen.classList.remove('visible');
  }

  getHighScore(): number {
    return this.highScore;
  }

  reset() {
    this.updateScore(0);
    this.updateSpeed(0);
    this.updateEnergy(100, 100);
    this.updateLives(3);
    this.hideGameOver();
  }
}
