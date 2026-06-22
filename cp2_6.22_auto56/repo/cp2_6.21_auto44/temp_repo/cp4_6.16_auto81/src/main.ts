import { generateDungeon, isWalkable, getRoomAt } from './map/generator';
import { MapData, Room, TileType } from './map/types';
import { Player, createPlayer, startMove, updatePlayer, attackMonster, takeDamage as playerTakeDamage, Direction } from './game/player';
import { Monster, createMonster, updateMonster, takeDamage as monsterTakeDamage, getMonsterDrop, attackPlayer } from './game/monster';
import { Item, ItemManager, createItemManager, createChest, openChest, collectItem, updateItem, createMonsterDrop, ItemEvent } from './game/item';
import { RenderState, createRenderer, updateRenderer, updateCamera, render, startRoomTransition, isTransitioning, triggerHurtFlash, handleItemEvent } from './game/renderer';

const TILE_SIZE = 16;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

interface GameState {
  mapData: MapData;
  player: Player;
  monsters: Monster[];
  itemManager: ItemManager;
  renderer: RenderState;
  keys: Set<string>;
  gameRunning: boolean;
  inBattle: boolean;
  battleMonster: Monster | null;
  battleTurn: 'player' | 'monster';
  battleTimer: number;
  pendingRoomChange: { roomX: number; roomY: number; gridX: number; gridY: number } | null;
  lastTime: number;
  accumulator: number;
  fps: number;
  frameCount: number;
  fpsTimer: number;
}

let gameState: GameState | null = null;

function initGame(canvas: HTMLCanvasElement): GameState {
  const mapData = generateDungeon();
  const renderer = createRenderer(canvas, TILE_SIZE);
  const itemManager = createItemManager();

  const startRoom = mapData.rooms.find(r => r.type === 'start')!;
  const startGridX = startRoom.gridX + Math.floor(startRoom.width / 2);
  const startGridY = startRoom.gridY + Math.floor(startRoom.height / 2);

  const player = createPlayer(startGridX, startGridY, startRoom.x, startRoom.y, TILE_SIZE);

  const monsters: Monster[] = [];
  const monsterTypes: Monster['type'][] = ['slime', 'skeleton', 'bat'];

  for (const room of mapData.rooms) {
    if (room.type === 'start') continue;

    const monsterCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < monsterCount; i++) {
      const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
      const gridX = room.gridX + 2 + Math.floor(Math.random() * (room.width - 4));
      const gridY = room.gridY + 2 + Math.floor(Math.random() * (room.height - 4));

      const monster = createMonster(
        gridX, gridY, room.x, room.y, TILE_SIZE, monsterType, room
      );
      monsters.push(monster);
    }

    if (room.type === 'chest') {
      const chestX = room.gridX + Math.floor(room.width / 2);
      const chestY = room.gridY + Math.floor(room.height / 2);
      itemManager.items.push(createChest(chestX, chestY, TILE_SIZE));
    }
  }

  itemManager.addListener((event: ItemEvent) => {
    handleItemEvent(renderer, event, player, canvas);
  });

  const state: GameState = {
    mapData,
    player,
    monsters,
    itemManager,
    renderer,
    keys: new Set(),
    gameRunning: false,
    inBattle: false,
    battleMonster: null,
    battleTurn: 'player',
    battleTimer: 0,
    pendingRoomChange: null,
    lastTime: performance.now(),
    accumulator: 0,
    fps: 0,
    frameCount: 0,
    fpsTimer: 0,
  };

  return state;
}

function getCurrentRoom(state: GameState): Room | undefined {
  return getRoomAt(state.mapData.rooms, state.player.roomX, state.player.roomY);
}

function getRoomForGrid(state: GameState, gridX: number, gridY: number): Room | undefined {
  for (const room of state.mapData.rooms) {
    if (gridX >= room.gridX && gridX < room.gridX + room.width &&
        gridY >= room.gridY && gridY < room.gridY + room.height) {
      return room;
    }
  }
  return undefined;
}

function canMoveTo(state: GameState, gridX: number, gridY: number): boolean {
  if (!isWalkable(state.mapData.tiles, gridX, gridY)) {
    return false;
  }

  for (const monster of state.monsters) {
    if (monster.state !== 'dead' && monster.gridX === gridX && monster.gridY === gridY) {
      return false;
    }
  }

  return true;
}

function checkMonsterCollision(state: GameState): Monster | null {
  for (const monster of state.monsters) {
    if (monster.state === 'dead') continue;

    const dx = Math.abs(monster.gridX - state.player.gridX);
    const dy = Math.abs(monster.gridY - state.player.gridY);

    if (dx <= 1 && dy <= 1 && dx + dy <= 1) {
      if (monster.roomX === state.player.roomX && monster.roomY === state.player.roomY) {
        return monster;
      }
    }
  }
  return null;
}

function startBattle(state: GameState, monster: Monster): void {
  state.inBattle = true;
  state.battleMonster = monster;
  state.battleTurn = 'player';
  state.battleTimer = 0.5;
}

function updateBattle(state: GameState, deltaTime: number): void {
  if (!state.battleMonster) return;

  state.battleTimer -= deltaTime;

  if (state.battleTimer <= 0) {
    if (state.battleTurn === 'player') {
      const damage = attackMonster(state.player);
      monsterTakeDamage(state.battleMonster, damage);

      if (state.battleMonster.hp <= 0) {
        const dropType = getMonsterDrop();
        const drop = createMonsterDrop(
          dropType,
          state.battleMonster.gridX,
          state.battleMonster.gridY,
          TILE_SIZE
        );
        state.itemManager.items.push(drop);

        state.inBattle = false;
        state.battleMonster = null;
        return;
      }

      state.battleTurn = 'monster';
      state.battleTimer = 0.6;
    } else {
      const damage = attackPlayer(state.battleMonster);
      playerTakeDamage(state.player, damage);
      triggerHurtFlash(state.renderer);

      if (state.player.hp <= 0) {
        endGame(false);
        return;
      }

      state.battleTurn = 'player';
      state.battleTimer = 0.5;
    }
  }
}

function checkItemPickup(state: GameState): void {
  for (const item of state.itemManager.items) {
    if (item.collected) continue;

    if (item.gridX === state.player.gridX && item.gridY === state.player.gridY) {
      if (item.type === 'chest') {
        const newItems = openChest(item, TILE_SIZE);
        item.collected = true;
        for (const newItem of newItems) {
          state.itemManager.items.push(newItem);
        }
      } else {
        collectItem(item, state.itemManager, state.player);
      }
    }
  }

  state.itemManager.items = state.itemManager.items.filter(
    item => !item.collected || item.type === 'gold' || item.type === 'potion'
  );

  const collectedItems = state.itemManager.items.filter(item => item.collected);
  if (collectedItems.length > 0) {
    setTimeout(() => {
      if (gameState) {
        gameState.itemManager.items = gameState.itemManager.items.filter(item => !item.collected);
      }
    }, 1000);
  }
}

function checkRoomChange(state: GameState): void {
  if (state.pendingRoomChange || isTransitioning(state.renderer)) return;

  const room = getCurrentRoom(state);
  if (!room) return;

  const inCorridor = state.mapData.tiles[state.player.gridY]?.[state.player.gridX] === TileType.CORRIDOR;

  if (inCorridor) {
    const newRoom = getRoomForGrid(state, state.player.gridX, state.player.gridY);

    if (newRoom && (newRoom.x !== state.player.roomX || newRoom.y !== state.player.roomY)) {
      state.pendingRoomChange = {
        roomX: newRoom.x,
        roomY: newRoom.y,
        gridX: state.player.gridX,
        gridY: state.player.gridY,
      };
      startRoomTransition(state.renderer);
    }
  } else {
    const atNorthDoor = state.player.gridY === room.gridY && room.corridors.north;
    const atSouthDoor = state.player.gridY === room.gridY + room.height - 1 && room.corridors.south;
    const atWestDoor = state.player.gridX === room.gridX && room.corridors.west;
    const atEastDoor = state.player.gridX === room.gridX + room.width - 1 && room.corridors.east;

    if (atNorthDoor || atSouthDoor || atWestDoor || atEastDoor) {
      let targetRoomX = state.player.roomX;
      let targetRoomY = state.player.roomY;

      if (atNorthDoor) targetRoomY--;
      else if (atSouthDoor) targetRoomY++;
      else if (atWestDoor) targetRoomX--;
      else if (atEastDoor) targetRoomX++;

      const targetRoom = getRoomAt(state.mapData.rooms, targetRoomX, targetRoomY);
      if (targetRoom) {
        state.pendingRoomChange = {
          roomX: targetRoomX,
          roomY: targetRoomY,
          gridX: state.player.gridX,
          gridY: state.player.gridY,
        };
        startRoomTransition(state.renderer);
      }
    }
  }

  if (state.pendingRoomChange && state.renderer.fadeAlpha >= 1 && state.renderer.fadeDirection === 'in') {
    state.player.roomX = state.pendingRoomChange.roomX;
    state.player.roomY = state.pendingRoomChange.roomY;

    const newRoom = getRoomAt(state.mapData.rooms, state.player.roomX, state.player.roomY);
    if (newRoom) {
      newRoom.visited = true;

      if (newRoom.type === 'exit') {
        endGame(true);
        return;
      }
    }

    state.pendingRoomChange = null;
  }
}

function handleInput(state: GameState): void {
  if (state.inBattle || state.player.isMoving || isTransitioning(state.renderer)) return;

  let direction: Direction | null = null;

  if (state.keys.has('w') || state.keys.has('W') || state.keys.has('ArrowUp')) {
    direction = 'up';
  } else if (state.keys.has('s') || state.keys.has('S') || state.keys.has('ArrowDown')) {
    direction = 'down';
  } else if (state.keys.has('a') || state.keys.has('A') || state.keys.has('ArrowLeft')) {
    direction = 'left';
  } else if (state.keys.has('d') || state.keys.has('D') || state.keys.has('ArrowRight')) {
    direction = 'right';
  }

  if (direction) {
    let targetGridX = state.player.gridX;
    let targetGridY = state.player.gridY;

    switch (direction) {
      case 'up': targetGridY--; break;
      case 'down': targetGridY++; break;
      case 'left': targetGridX--; break;
      case 'right': targetGridX++; break;
    }

    if (canMoveTo(state, targetGridX, targetGridY)) {
      startMove(state.player, direction, TILE_SIZE);
    }
  }
}

function update(state: GameState, deltaTime: number): void {
  state.frameCount++;
  state.fpsTimer += deltaTime;
  if (state.fpsTimer >= 1) {
    state.fps = state.frameCount;
    state.frameCount = 0;
    state.fpsTimer = 0;
  }

  if (state.inBattle) {
    updateBattle(state, deltaTime);
    return;
  }

  handleInput(state);
  updatePlayer(state.player, deltaTime);

  if (!state.player.isMoving && state.player.moveCooldown <= 0) {
    const monster = checkMonsterCollision(state);
    if (monster) {
      startBattle(state, monster);
      return;
    }
    checkItemPickup(state);
    checkRoomChange(state);
  }

  for (let i = state.monsters.length - 1; i >= 0; i--) {
    const monster = state.monsters[i];
    const shouldRemove = updateMonster(
      monster,
      state.player,
      deltaTime,
      TILE_SIZE,
      (x, y) => isWalkable(state.mapData.tiles, x, y)
    );

    if (shouldRemove) {
      state.monsters.splice(i, 1);
    }
  }

  for (const item of state.itemManager.items) {
    updateItem(item, deltaTime);
  }

  updateRenderer(state.renderer, deltaTime);
  updateCamera(state.renderer, state.player, state.mapData);

  const currentRoom = getCurrentRoom(state);
  if (currentRoom) {
    currentRoom.visited = true;
  }
}

function renderGame(state: GameState): void {
  const currentRoom = getCurrentRoom(state);
  render(
    state.renderer,
    state.mapData,
    state.player,
    state.monsters,
    state.itemManager.items,
    currentRoom
  );

  if (state.inBattle && state.battleMonster) {
    const ctx = state.renderer.ctx;
    const canvas = state.renderer.canvas;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 60, 300, 120);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width / 2 - 150, canvas.height / 2 - 60, 300, 120);

    ctx.fillStyle = '#fff';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    if (state.battleTurn === 'player') {
      ctx.fillText('你的回合！', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#d4af37';
      ctx.fillText('按任意方向键攻击', canvas.width / 2, canvas.height / 2 + 10);
    } else {
      ctx.fillStyle = '#e74c3c';
      ctx.fillText('敌人回合...', canvas.width / 2, canvas.height / 2);
    }

    ctx.textAlign = 'left';
  }
}

function gameLoop(currentTime: number): void {
  if (!gameState || !gameState.gameRunning) return;

  const deltaTime = Math.min((currentTime - gameState.lastTime) / 1000, 0.1);
  gameState.lastTime = currentTime;
  gameState.accumulator += deltaTime;

  while (gameState.accumulator >= FRAME_TIME / 1000) {
    update(gameState, FRAME_TIME / 1000);
    gameState.accumulator -= FRAME_TIME / 1000;
  }

  renderGame(gameState);
  requestAnimationFrame(gameLoop);
}

function endGame(victory: boolean): void {
  if (!gameState) return;

  gameState.gameRunning = false;

  const gameOverScreen = document.getElementById('game-over-screen');
  const victoryScreen = document.getElementById('victory-screen');
  const finalStats = document.getElementById('final-stats');
  const victoryStats = document.getElementById('victory-stats');

  if (victory && victoryScreen && victoryStats) {
    victoryStats.textContent = `金币: ${gameState.player.gold} | 剩余HP: ${gameState.player.hp}/${gameState.player.maxHp}`;
    victoryScreen.classList.remove('hidden');
  } else if (gameOverScreen && finalStats) {
    finalStats.textContent = `获得金币: ${gameState.player.gold}`;
    gameOverScreen.classList.remove('hidden');
  }
}

function startGame(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const victoryScreen = document.getElementById('victory-screen');

  if (startScreen) startScreen.classList.add('hidden');
  if (gameOverScreen) gameOverScreen.classList.add('hidden');
  if (victoryScreen) victoryScreen.classList.add('hidden');

  gameState = initGame(canvas);
  gameState.gameRunning = true;
  gameState.lastTime = performance.now();

  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
  if (gameState) {
    gameState.keys.add(e.key);

    if (gameState.inBattle && gameState.battleTurn === 'player' && gameState.battleMonster) {
      if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const damage = attackMonster(gameState.player);
        monsterTakeDamage(gameState.battleMonster, damage);

        if (gameState.battleMonster.hp <= 0) {
          const dropType = getMonsterDrop();
          const drop = createMonsterDrop(
            dropType,
            gameState.battleMonster.gridX,
            gameState.battleMonster.gridY,
            TILE_SIZE
          );
          gameState.itemManager.items.push(drop);

          gameState.inBattle = false;
          gameState.battleMonster = null;
        } else {
          gameState.battleTurn = 'monster';
          gameState.battleTimer = 0.6;
        }
        e.preventDefault();
      }
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (gameState) {
    gameState.keys.delete(e.key);
  }
});

document.getElementById('start-btn')?.addEventListener('click', startGame);
document.getElementById('restart-btn')?.addEventListener('click', startGame);
document.getElementById('play-again-btn')?.addEventListener('click', startGame);

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
});
