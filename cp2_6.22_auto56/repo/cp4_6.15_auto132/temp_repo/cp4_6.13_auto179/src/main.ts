import { Game } from './game';
import { AudioManager } from './audio';
import { load, save } from './storage';
import type { VoiceCommand } from './audio';

let game: Game;
let audioManager: AudioManager;
let canvas: HTMLCanvasElement;
let micButton: HTMLButtonElement;
let lastTime: number = 0;
let animationId: number = 0;
let audioReady: boolean = false;
let highScore: number = 0;
let playCount: number = 0;

function init(): void {
  canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  micButton = document.getElementById('micButton') as HTMLButtonElement;

  if (!canvas || !micButton) {
    console.error('Required elements not found');
    return;
  }

  game = new Game(canvas);

  audioManager = new AudioManager({
    onVolumeChange: handleVolumeChange,
    onCommand: handleCommand
  });

  load().then((data) => {
    highScore = data.highScore;
    playCount = data.playCount;
  });

  game.setOnGameOver(handleGameOver);

  micButton.addEventListener('click', handleMicClick);
  canvas.addEventListener('click', handleCanvasClick);

  document.addEventListener('visibilitychange', handleVisibilityChange);

  lastTime = performance.now();
  gameLoop(lastTime);
}

function handleVolumeChange(volume: number): void {
  if (game) {
    game.handleVolume(volume);
  }
}

function handleCommand(command: VoiceCommand, confidence: number): void {
  if (game) {
    game.handleCommand(command, confidence);
  }
}

async function handleMicClick(): Promise<void> {
  if (!audioReady) {
    const success = await audioManager.init();
    if (success) {
      audioReady = true;
      micButton.textContent = '✅ 麦克风已授权';
      micButton.classList.add('authorized');
      game.start();

      playCount++;
      save({ playCount });
    } else {
      micButton.textContent = '❌ 授权失败，请重试';
    }
  }
}

function handleCanvasClick(event: MouseEvent): void {
  const state = game.getState();

  if (state.status === 'gameover') {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const btnX = 320 - 60;
    const btnY = 300;
    const btnW = 120;
    const btnH = 40;

    if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
      restartGame();
    }
  }
}

function handleGameOver(score: number): void {
  if (score > highScore) {
    highScore = score;
    save({ highScore });
  }
}

function restartGame(): void {
  game.restart();
  playCount++;
  save({ playCount });
}

function handleVisibilityChange(): void {
  if (document.hidden) {
    if (game) {
      game.pause();
    }
  } else {
    if (game) {
      game.resume();
    }
    lastTime = performance.now();
  }
}

function gameLoop(currentTime: number): void {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  const clampedDelta = Math.min(deltaTime, 1 / 30);

  if (game) {
    game.update(clampedDelta);
  }

  animationId = requestAnimationFrame(gameLoop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
