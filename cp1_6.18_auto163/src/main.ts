import { BattleEngine } from './engine/battleEngine';
import { GameRenderer } from './renderer/gameRenderer';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const battleEngine = new BattleEngine();
const renderer = new GameRenderer(canvas, battleEngine);

requestAnimationFrame((t) => renderer.render(t));
