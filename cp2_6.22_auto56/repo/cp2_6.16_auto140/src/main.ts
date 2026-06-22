import { GameEngine } from './game/GameEngine';
import { MenuUI } from './ui/Menu';
import { HUD } from './ui/HUD';
import './ui/styles.css';

const canvasContainer = document.getElementById('canvas-container') as HTMLElement;
const uiContainer = document.getElementById('ui-container') as HTMLElement;

const engine = new GameEngine(canvasContainer);
const menu = new MenuUI(uiContainer, engine);
const hud = new HUD(uiContainer);

menu.init();
hud.init();
engine.init();
