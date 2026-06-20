import Phaser from 'phaser';
import { BootScene } from './BootScene';
import { DungeonScene } from './DungeonScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#2A2A2A',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, DungeonScene]
};

const game = new Phaser.Game(config);

const seedInput = document.getElementById('seed-input') as HTMLInputElement;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
const seedContainer = document.getElementById('seed-input-container') as HTMLDivElement;
const gameOverOverlay = document.getElementById('game-over-overlay') as HTMLDivElement;
const victoryOverlay = document.getElementById('victory-overlay') as HTMLDivElement;
const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;
const victoryRestartBtn = document.getElementById('victory-restart-btn') as HTMLButtonElement;
const victoryTime = document.getElementById('victory-time') as HTMLParagraphElement;
const victoryKills = document.getElementById('victory-kills') as HTMLParagraphElement;

startBtn.addEventListener('click', () => {
  let seed = parseInt(seedInput.value, 10);
  if (isNaN(seed) || seed < 1 || seed > 9999) {
    seed = 1;
  }
  seedContainer.style.display = 'none';
  game.registry.set('seed', seed);
  game.scene.start('BootScene');
});

restartBtn.addEventListener('click', () => {
  gameOverOverlay.style.display = 'none';
  seedContainer.style.display = 'flex';
  game.scene.stop('DungeonScene');
});

victoryRestartBtn.addEventListener('click', () => {
  victoryOverlay.style.display = 'none';
  seedContainer.style.display = 'flex';
  game.scene.stop('DungeonScene');
});

(game as any).showGameOver = () => {
  gameOverOverlay.style.display = 'flex';
};

(game as any).showVictory = (time: number, kills: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  victoryTime.textContent = `通关时间: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  victoryKills.textContent = `击杀数: ${kills}`;
  victoryOverlay.style.display = 'flex';
};
