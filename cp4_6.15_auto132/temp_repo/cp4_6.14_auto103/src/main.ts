import { generateDungeon, getRoomCenter, type DungeonMap } from './mapGenerator';
import {
  createPlayer,
  createMonster,
  startPlayerMove,
  updatePlayerMovement,
  moveMonsterAI,
  checkAdjacentForBattle,
  type Player,
  type Monster,
  type MonsterType,
} from './entity';
import { initBattleUI, startBattle, isBattleActive } from './battle';
import { createRenderer, resizeRenderer, render, type RendererState } from './renderer';

interface GameState {
  map: DungeonMap;
  player: Player;
  monsters: Monster[];
  renderer: RendererState;
  lastTime: number;
  keys: Set<string>;
  moveCooldown: number;
}

let state: GameState | null = null;

function updateStatusBar(player: Player): void {
  const levelEl = document.getElementById('level-text');
  if (levelEl) levelEl.textContent = `Lv.${player.level}`;

  const expFill = document.getElementById('exp-fill');
  const expText = document.getElementById('exp-text');
  if (expFill) {
    const pct = (player.exp / player.expToNext) * 100;
    expFill.style.width = pct + '%';
  }
  if (expText) expText.textContent = `${player.exp}/${player.expToNext}`;

  const hpFill = document.getElementById('hp-fill');
  const hpText = document.getElementById('hp-text');
  if (hpFill) {
    const pct = (player.hp / player.maxHp) * 100;
    hpFill.style.width = pct + '%';
  }
  if (hpText) hpText.textContent = `${player.hp}/${player.maxHp}`;

  const mpFill = document.getElementById('mp-fill');
  const mpText = document.getElementById('mp-text');
  if (mpFill) {
    const pct = (player.mp / player.maxMp) * 100;
    mpFill.style.width = pct + '%';
  }
  if (mpText) mpText.textContent = `${player.mp}/${player.maxMp}`;

  const goldText = document.getElementById('gold-text');
  if (goldText) goldText.textContent = `金币: ${player.gold}`;
}

function spawnMonsters(map: DungeonMap): Monster[] {
  const monsters: Monster[] = [];
  const types: MonsterType[] = ['slime', 'bat', 'skeleton'];

  for (let i = 1; i < map.rooms.length; i++) {
    const room = map.rooms[i];
    const count = 1 + Math.floor(Math.random() * 2);
    for (let c = 0; c < count; c++) {
      const type = types[Math.floor(Math.random() * types.length)];
      let mx = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
      let my = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
      let attempts = 0;
      while (attempts < 10) {
        const clash = monsters.some((m) => m.x === mx && m.y === my);
        if (!clash) break;
        mx = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
        my = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
        attempts++;
      }
      monsters.push(createMonster(type, mx, my));
    }
  }
  return monsters;
}

function initGame(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
  const canvasWrapper = document.getElementById('canvas-wrapper') as HTMLElement;
  const minimapBtn = document.getElementById('minimap-btn') as HTMLElement;
  const minimapPanel = document.getElementById('minimap-panel') as HTMLElement;

  const map = generateDungeon();
  const startRoom = map.rooms[0];
  const startPos = getRoomCenter(startRoom);
  startRoom.explored = true;

  const player = createPlayer(startPos.x, startPos.y);
  const monsters = spawnMonsters(map);

  const renderer = createRenderer(canvas, minimapCanvas);

  const resize = () => {
    const w = canvasWrapper.clientWidth;
    const h = canvasWrapper.clientHeight;
    resizeRenderer(renderer, map, w, h);
  };
  resize();
  window.addEventListener('resize', resize);

  minimapBtn.addEventListener('click', () => {
    minimapPanel.classList.toggle('open');
  });

  initBattleUI();

  state = {
    map,
    player,
    monsters,
    renderer,
    lastTime: performance.now(),
    keys: new Set(),
    moveCooldown: 0,
  };

  updateStatusBar(player);

  window.addEventListener('keydown', (e) => {
    if (isBattleActive()) return;
    state?.keys.add(e.key.toLowerCase());
  });
  window.addEventListener('keyup', (e) => {
    state?.keys.delete(e.key.toLowerCase());
  });

  requestAnimationFrame(gameLoop);
}

function handlePlayerMovement(s: GameState, dt: number): void {
  s.moveCooldown = Math.max(0, s.moveCooldown - dt);

  if (s.player.isMoving) {
    updatePlayerMovement(s.player, dt);
    if (!s.player.isMoving) {
      onPlayerMoved(s);
    }
    return;
  }

  if (s.moveCooldown > 0) return;

  let dx = 0;
  let dy = 0;
  if (s.keys.has('arrowup') || s.keys.has('w')) dy = -1;
  else if (s.keys.has('arrowdown') || s.keys.has('s')) dy = 1;
  else if (s.keys.has('arrowleft') || s.keys.has('a')) dx = -1;
  else if (s.keys.has('arrowright') || s.keys.has('d')) dx = 1;

  if (dx !== 0 || dy !== 0) {
    const moved = startPlayerMove(s.player, s.map.tiles, dx, dy, s.monsters);
    if (moved) {
      s.moveCooldown = 0.05;
    }
  }
}

function onPlayerMoved(s: GameState): void {
  updateStatusBar(s.player);

  for (const m of s.monsters) {
    moveMonsterAI(m, s.player, s.map.tiles, s.monsters);
  }

  const target = checkAdjacentForBattle(s.player, s.monsters);
  if (target) {
    startBattle(s.player, target, (victory, monster) => {
      if (victory) {
        s.monsters = s.monsters.filter((m) => m.id !== monster.id);
      }
      updateStatusBar(s.player);
    });
  }
}

function gameLoop(now: number): void {
  if (!state) return;
  const s = state;

  const dt = Math.min(0.05, (now - s.lastTime) / 1000);
  s.lastTime = now;

  if (!isBattleActive()) {
    handlePlayerMovement(s, dt);
  }

  render(s.renderer, s.map, s.player, s.monsters, dt);
  updateStatusBar(s.player);

  requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', initGame);
