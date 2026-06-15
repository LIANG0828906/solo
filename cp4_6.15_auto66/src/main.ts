import { GameEngine } from './game/GameEngine';
import { MenuScene } from './ui/MenuScene';
import { HUD } from './ui/HUD';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const menuLayer = document.getElementById('menu-layer') as HTMLElement;
const uiLayer = document.getElementById('ui-layer') as HTMLElement;

const gameEngine = new GameEngine(canvas);
const hud = new HUD(uiLayer);
const menu = new MenuScene(menuLayer, (songId, difficulty) => {
  startGame(songId, difficulty);
});

let animationId: number = 0;

function startGame(songId: string, difficulty: 'normal' | 'hard'): void {
  menuLayer.classList.add('hidden');
  uiLayer.style.display = 'block';
  hud.hideGameOver();

  gameEngine.setCallbacks(
    (state) => {
      hud.update(state);
    },
    () => {
      const state = gameEngine.getState();
      hud.showGameOver(
        state.score,
        state.maxCombo,
        () => {
          hud.hideGameOver();
          gameEngine.reset();
          startGame(songId, difficulty);
        },
        () => {
          hud.hideGameOver();
          gameEngine.reset();
          uiLayer.style.display = 'none';
          menu.show();
        }
      );
    }
  );

  gameEngine.startSong(songId, difficulty);
  gameLoop();
}

function gameLoop(): void {
  gameEngine.update();
  animationId = requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      gameEngine.handleInput('jump');
      break;
    case 'ArrowUp':
    case 'KeyW':
      e.preventDefault();
      gameEngine.handleInput('jump');
      break;
    case 'ArrowDown':
    case 'KeyS':
      e.preventDefault();
      gameEngine.handleInput('slide');
      break;
    case 'ArrowLeft':
    case 'KeyA':
      e.preventDefault();
      gameEngine.handleInput('left');
      break;
    case 'ArrowRight':
    case 'KeyD':
      e.preventDefault();
      gameEngine.handleInput('right');
      break;
  }
});
