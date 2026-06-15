import { GameEngine } from './GameEngine';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
}

const gameEngine = new GameEngine(canvas);

const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      gameEngine.setMoveInput({ up: true });
      break;
    case 's':
    case 'arrowdown':
      gameEngine.setMoveInput({ down: true });
      break;
    case 'a':
    case 'arrowleft':
      gameEngine.setMoveInput({ left: true });
      break;
    case 'd':
    case 'arrowright':
      gameEngine.setMoveInput({ right: true });
      break;
    case 'e':
      gameEngine.triggerInteract();
      break;
    case 'r':
      gameEngine.triggerReset();
      break;
  }
};

const handleKeyUp = (e: KeyboardEvent) => {
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      gameEngine.setMoveInput({ up: false });
      break;
    case 's':
    case 'arrowdown':
      gameEngine.setMoveInput({ down: false });
      break;
    case 'a':
    case 'arrowleft':
      gameEngine.setMoveInput({ left: false });
      break;
    case 'd':
    case 'arrowright':
      gameEngine.setMoveInput({ right: false });
      break;
  }
};

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

gameEngine.start();
