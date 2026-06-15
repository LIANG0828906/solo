import { PhysicsEngine, Vector2, Projectile, AABB } from './physicsEngine';
import { GameState } from './gameState';
import { EntityManager } from './entityManager';
import { Renderer } from './renderer';
import { AIController } from './aiController';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const uiOverlay = document.getElementById('ui-overlay') as HTMLDivElement;

function resizeCanvas(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const gameState = new GameState();
const entityManager = new EntityManager();
const renderer = new Renderer(canvas);
const aiController = new AIController(canvas.width / 50, canvas.height / 50);

renderer.resize(canvas.width, canvas.height);

const GRID_SIZE = 50;
const PLAYER_CANNON_POS: Vector2 = { x: 2, y: 10 };
const ENEMY_CANNON_POS: Vector2 = { x: canvas.width / GRID_SIZE - 3, y: 10 };

let mousePos: Vector2 = { x: 0, y: 0 };
let isMouseDown: boolean = false;
let isDraggingStructure: boolean = false;
let hoveredSkillIndex: number = -1;

const PLAYER_PLACE_ZONE = { minX: 1, maxX: 8, minY: 2, maxY: 18 };

function screenToGrid(screenX: number, screenY: number): Vector2 {
  return {
    x: Math.floor(screenX / GRID_SIZE),
    y: Math.floor(screenY / GRID_SIZE),
  };
}

function gridToScreen(gridX: number, gridY: number): Vector2 {
  return {
    x: gridX * GRID_SIZE + GRID_SIZE / 2,
    y: gridY * GRID_SIZE + GRID_SIZE / 2,
  };
}

function isInPlayerZone(gridX: number, gridY: number): boolean {
  return (
    gridX >= PLAYER_PLACE_ZONE.minX &&
    gridX <= PLAYER_PLACE_ZONE.maxX &&
    gridY >= PLAYER_PLACE_ZONE.minY &&
    gridY <= PLAYER_PLACE_ZONE.maxY
  );
}

function isGridOccupied(gridX: number, gridY: number): boolean {
  const allStructures = [...gameState.playerStructures, ...gameState.enemyStructures];
  return allStructures.some(
    (s) => Math.floor(s.position.x) === gridX && Math.floor(s.position.y) === gridY && s.health > 0
  );
}

function getUnitAtScreen(screenX: number, screenY: number): any {
  for (const unit of gameState.units) {
    const dx = screenX - unit.position.x * GRID_SIZE;
    const dy = screenY - unit.position.y * GRID_SIZE;
    if (Math.sqrt(dx * dx + dy * dy) < 15) {
      return unit;
    }
  }
  return null;
}

function isPointInSkillDisc(screenX: number, screenY: number): { hit: boolean; index: number } {
  const discX = canvas.width - 100;
  const discY = canvas.height - 100;
  const dx = screenX - discX;
  const dy = screenY - discY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 20 && dist < 85) {
    let angle = Math.atan2(dy, dx) + Math.PI / 4;
    if (angle < 0) angle += Math.PI * 2;
    const index = Math.floor(angle / (Math.PI / 2)) % 4;
    return { hit: true, index };
  }
  return { hit: false, index: -1 };
}

function updateAimAngle(): void {
  const cannonScreen = gridToScreen(PLAYER_CANNON_POS.x, PLAYER_CANNON_POS.y);
  const dx = mousePos.x - cannonScreen.x;
  const dy = cannonScreen.y - mousePos.y;
  gameState.aimAngle = Math.atan2(dy, dx);
  if (gameState.aimAngle < 0) gameState.aimAngle = 0;
  if (gameState.aimAngle > Math.PI * 0.85) gameState.aimAngle = Math.PI * 0.85;
}

function fireProjectile(): void {
  const power = 15 + gameState.chargeLevel * 35;
  const rad = gameState.aimAngle;

  const projectile = entityManager.createProjectile(
    { ...PLAYER_CANNON_POS },
    {
      x: power * Math.cos(rad),
      y: -power * Math.sin(rad),
    },
    gameState.selectedAmmoType,
    false
  );

  gameState.projectiles.push(projectile as unknown as Projectile);
  gameState.stats.shotsFired++;
  gameState.chargeLevel = 0;
  gameState.phase = 'firing';

  setTimeout(() => {
    if (gameState.phase === 'firing') {
      gameState.phase = 'aiming';
    }
  }, 500);
}

function handleExplosion(position: Vector2, damage: number, isEnemy: boolean): void {
  const particles = entityManager.createExplosion(position, 3);
  gameState.particles.push(...particles);

  const targetStructures = isEnemy ? gameState.playerStructures : gameState.enemyStructures;

  for (const structure of targetStructures) {
    if (structure.health <= 0) continue;

    const aabb = entityManager.getStructureAABB(structure);
    const centerX = (aabb.min.x + aabb.max.x) / 2;
    const centerY = (aabb.min.y + aabb.max.y) / 2;
    const dx = position.x - centerX;
    const dy = position.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 3) {
      const actualDamage = damage * (1 - dist / 3);
      structure.health -= actualDamage;

      if (!isEnemy && actualDamage > gameState.stats.maxSingleDamage) {
        gameState.stats.maxSingleDamage = Math.floor(actualDamage);
      }

      if (structure.health <= 0) {
        const fragments = entityManager.createFragmentsFromStructure(structure);
        PhysicsEngine.applyExplosionForce(position, 5, 20, fragments);
        gameState.fragments.push(...fragments);

        if (!isEnemy) {
          gameState.stats.shotsHit++;
        }
      }
    }
  }
}

function checkCollisions(): void {
  const projectilesToRemove: number[] = [];

  for (let i = 0; i < gameState.projectiles.length; i++) {
    const p = gameState.projectiles[i];
    const proj = p as any;

    if (p.position.y > 25 || p.position.x < -5 || p.position.x > 30) {
      projectilesToRemove.push(i);
      continue;
    }

    const projAABB: AABB = {
      min: { x: p.position.x - p.radius / GRID_SIZE, y: p.position.y - p.radius / GRID_SIZE },
      max: { x: p.position.x + p.radius / GRID_SIZE, y: p.position.y + p.radius / GRID_SIZE },
    };

    const targetStructures = proj.isEnemy ? gameState.playerStructures : gameState.enemyStructures;
    let hit = false;

    for (const structure of targetStructures) {
      if (structure.health <= 0) continue;

      const structAABB = entityManager.getStructureAABB(structure);
      if (PhysicsEngine.checkAABBCollision(projAABB, structAABB)) {
        handleExplosion(p.position, 50, proj.isEnemy);
        projectilesToRemove.push(i);
        hit = true;
        break;
      }
    }

    if (!hit && p.position.y >= 20) {
      handleExplosion(p.position, 20, proj.isEnemy);
      projectilesToRemove.push(i);
    }
  }

  for (let i = projectilesToRemove.length - 1; i >= 0; i--) {
    gameState.projectiles.splice(projectilesToRemove[i], 1);
  }
}

canvas.addEventListener('mousemove', (e) => {
  mousePos = { x: e.clientX, y: e.clientY };

  const skillHit = isPointInSkillDisc(e.clientX, e.clientY);
  hoveredSkillIndex = skillHit.hit ? skillHit.index : -1;
  renderer.hoveredSkillIndex = hoveredSkillIndex;

  if (gameState.phase === 'aiming' || gameState.phase === 'charging') {
    updateAimAngle();
  }

  if (isDraggingStructure) {
    uiOverlay.style.cursor = 'grabbing';
  } else if (skillHit.hit) {
    uiOverlay.style.cursor = 'pointer';
  } else if (gameState.phase === 'placing') {
    const gridPos = screenToGrid(e.clientX, e.clientY);
    if (isInPlayerZone(gridPos.x, gridPos.y)) {
      uiOverlay.style.cursor = 'cell';
    } else {
      uiOverlay.style.cursor = 'crosshair';
    }
  } else if (getUnitAtScreen(e.clientX, e.clientY)) {
    uiOverlay.style.cursor = 'pointer';
  } else {
    uiOverlay.style.cursor = 'crosshair';
  }
});

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;

  const skillHit = isPointInSkillDisc(e.clientX, e.clientY);
  if (skillHit.hit) {
    const ammoTypes = ['cannonball', 'explosive', 'scatter', 'ice'];
    gameState.selectedAmmoType = ammoTypes[skillHit.index];
    return;
  }

  const clickedUnit = getUnitAtScreen(e.clientX, e.clientY);
  if (clickedUnit) {
    gameState.units.forEach((u) => (u.isSelected = false));
    clickedUnit.isSelected = true;
    return;
  }

  const selectedUnit = gameState.units.find((u) => u.isSelected);
  if (selectedUnit && gameState.phase !== 'placing') {
    const targetGrid = screenToGrid(e.clientX, e.clientY);
    selectedUnit.targetPosition = { ...targetGrid };
    selectedUnit.isMoving = true;
    selectedUnit.moveProgress = 0;
    selectedUnit.isSelected = false;
    return;
  }

  if (gameState.phase === 'placing') {
    const gridPos = screenToGrid(e.clientX, e.clientY);
    if (isInPlayerZone(gridPos.x, gridPos.y) && !isGridOccupied(gridPos.x, gridPos.y)) {
      const structure = entityManager.createStructure(
        gameState.selectedStructureType,
        { x: gridPos.x + 0.5, y: gridPos.y + 0.5 },
        true
      );
      gameState.playerStructures.push(structure);
    }
  } else if (gameState.phase === 'aiming') {
    isMouseDown = true;
    gameState.phase = 'charging';
    gameState.chargeLevel = 0;
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (e.button !== 0) return;

  if (isDraggingStructure) {
    isDraggingStructure = false;
  }

  if (isMouseDown && gameState.phase === 'charging') {
    isMouseDown = false;
    fireProjectile();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === '1') gameState.selectedStructureType = 'wall';
  if (e.key === '2') gameState.selectedStructureType = 'fence';
  if (e.key === '3') gameState.selectedStructureType = 'sandbag';
  if (e.key === 'Enter' && gameState.phase === 'placing') {
    if (gameState.playerStructures.length > 0) {
      gameState.phase = 'aiming';
    }
  }
});

let lastTime = performance.now();

function gameLoop(currentTime: number): void {
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  if (gameState.phase !== 'ended') {
    gameState.update(deltaTime);

    if (gameState.phase === 'charging' && isMouseDown) {
      gameState.chargeLevel = Math.min(1, gameState.chargeLevel + deltaTime * 1.5);
    }

    const entities = {
      projectiles: gameState.projectiles as any[],
      particles: gameState.particles,
      fragments: gameState.fragments,
    };
    entityManager.updateAll(entities, deltaTime, PhysicsEngine);
    entityManager.cleanup(entities);

    checkCollisions();

    if (gameState.phase !== 'placing') {
      aiController.update(gameState, PhysicsEngine, deltaTime);

      if (aiController.currentWarning) {
        const progress = aiController.getWarningProgress();
        renderer.drawWarningCircle(aiController.currentWarning.position, progress);
      }
    }
  }

  if (gameState.phase === 'ended' && gameState.statsPanelProgress < 1) {
    gameState.statsPanelProgress = Math.min(1, gameState.statsPanelProgress + deltaTime * 2.5);
  }

  renderer.clear();
  renderer.ctx.fillStyle = '#3D2914';
  renderer.ctx.fillRect(0, 0, canvas.width, canvas.height);

  renderer.drawGrid();

  if (gameState.phase === 'placing') {
    const gridPos = screenToGrid(mousePos.x, mousePos.y);
    if (isInPlayerZone(gridPos.x, gridPos.y)) {
      renderer.ctx.save();
      renderer.ctx.globalAlpha = 0.5;
      const previewStruct = {
        type: gameState.selectedStructureType,
        position: { x: gridPos.x + 0.5, y: gridPos.y + 0.5 },
        placementProgress: 1,
        scale: 1,
        health: 100,
        maxHealth: 100,
      } as any;
      renderer.drawStructure(previewStruct);
      renderer.ctx.restore();
    }

    renderer.ctx.save();
    renderer.ctx.fillStyle = 'rgba(76, 175, 80, 0.15)';
    renderer.ctx.fillRect(
      PLAYER_PLACE_ZONE.minX * GRID_SIZE,
      PLAYER_PLACE_ZONE.minY * GRID_SIZE,
      (PLAYER_PLACE_ZONE.maxX - PLAYER_PLACE_ZONE.minX + 1) * GRID_SIZE,
      (PLAYER_PLACE_ZONE.maxY - PLAYER_PLACE_ZONE.minY + 1) * GRID_SIZE
    );
    renderer.ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
    renderer.ctx.lineWidth = 2;
    renderer.ctx.setLineDash([5, 5]);
    renderer.ctx.strokeRect(
      PLAYER_PLACE_ZONE.minX * GRID_SIZE,
      PLAYER_PLACE_ZONE.minY * GRID_SIZE,
      (PLAYER_PLACE_ZONE.maxX - PLAYER_PLACE_ZONE.minX + 1) * GRID_SIZE,
      (PLAYER_PLACE_ZONE.maxY - PLAYER_PLACE_ZONE.minY + 1) * GRID_SIZE
    );
    renderer.ctx.setLineDash([]);
    renderer.ctx.restore();

    renderer.ctx.fillStyle = '#F4E4BC';
    renderer.ctx.font = 'bold 18px "Comic Sans MS", cursive';
    renderer.ctx.textAlign = 'center';
    renderer.ctx.fillText(
      '📍 点击绿色区域放置防御工事 | 按1/2/3切换类型 | 按Enter开始战斗',
      canvas.width / 2,
      40
    );
  }

  for (const structure of gameState.enemyStructures) {
    if (structure.health > 0) {
      renderer.drawStructure(structure);
    }
  }

  for (const structure of gameState.playerStructures) {
    if (structure.health > 0) {
      renderer.drawStructure(structure);
    }
  }

  for (const unit of gameState.units) {
    renderer.drawUnit(unit);
  }

  for (const fragment of gameState.fragments) {
    renderer.drawFragment(fragment, 'wall');
  }

  for (const particle of gameState.particles) {
    renderer.drawParticle(particle);
  }

  for (const projectile of gameState.projectiles) {
    renderer.drawProjectile(projectile);
  }

  if (aiController.currentWarning) {
    const progress = aiController.getWarningProgress();
    renderer.drawWarningCircle(aiController.currentWarning.position, progress);
  }

  if (gameState.phase === 'aiming' || gameState.phase === 'charging') {
    const power = 15 + gameState.chargeLevel * 35;
    const trajectory = PhysicsEngine.calculateTrajectory(
      (gameState.aimAngle * 180) / Math.PI,
      power,
      PLAYER_CANNON_POS
    );
    renderer.drawTrajectory(trajectory);
  }

  renderer.drawCannon(PLAYER_CANNON_POS, gameState.aimAngle, gameState.chargeLevel);
  renderer.drawCannon(ENEMY_CANNON_POS, Math.PI * 0.75, 0.3);

  if (gameState.phase === 'charging') {
    renderer.drawChargeBar(gameState.chargeLevel, PLAYER_CANNON_POS);
  }

  renderer.drawResourcePanel(gameState, 20, 20);
  renderer.drawSkillDisc(gameState, canvas.width - 100, canvas.height - 100);

  if (gameState.statsPanelProgress > 0) {
    renderer.drawStatsPanel(gameState.stats, gameState.statsPanelProgress);
  }

  requestAnimationFrame(gameLoop);
}

gameState.units.push(
  {
    id: 'unit-1',
    position: { x: 4, y: 10 },
    targetPosition: { x: 4, y: 10 },
    moveProgress: 1,
    isSelected: false,
    isMoving: false,
  },
  {
    id: 'unit-2',
    position: { x: 5, y: 12 },
    targetPosition: { x: 5, y: 12 },
    moveProgress: 1,
    isSelected: false,
    isMoving: false,
  }
);

gameState.on('gameEnd', () => {
  console.log('Game ended!', gameState.stats);
});

requestAnimationFrame(gameLoop);
