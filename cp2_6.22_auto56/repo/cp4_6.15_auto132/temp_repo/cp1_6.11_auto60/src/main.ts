import * as THREE from 'three';
import { BattleScene } from './render/scene';
import { generateFormation, findCellByPosition, findCellByCreatureId, setCreatureInCell } from './engine/formation';
import { simulateCombat } from './engine/combat';
import { createCreatureSet, resetCreatureHp } from './utils/creatureFactory';
import { Creature, Formation, CombatLog, CombatResult, Element, Team, ELEMENT_ICONS } from './types';

let battleScene: BattleScene;
let allyCreatures: Creature[] = [];
let enemyCreatures: Creature[] = [];
let creatureMap: Map<string, Creature> = new Map();
let allyFormation: Formation = [];
let enemyFormation: Formation = [];
let isFormationSet = false;
let isBattling = false;
let currentRound = 0;

const MAX_ROUNDS = 10;

let draggedCreature: Creature | null = null;
let draggedFromCellId: string | null = null;
let dragGhost: HTMLElement | null = null;
let dropHighlight: HTMLElement | null = null;

function init(): void {
  const canvasContainer = document.querySelector('.scene-container') as HTMLElement;
  const labelContainer = document.getElementById('ui-label-renderer') as HTMLElement;
  
  if (!canvasContainer || !labelContainer) {
    console.error('Required containers not found');
    return;
  }
  
  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement;
  if (!canvasContainer.contains(canvas)) {
    canvasContainer.insertBefore(canvas, canvasContainer.firstChild);
  }
  
  battleScene = new BattleScene(canvasContainer, labelContainer);
  
  generateCreatures();
  renderCreatureList();
  setupEventListeners();
}

function generateCreatures(): void {
  allyCreatures = createCreatureSet('ally');
  enemyCreatures = createCreatureSet('enemy');
  
  creatureMap.clear();
  for (const c of [...allyCreatures, ...enemyCreatures]) {
    creatureMap.set(c.id, c);
  }
}

function renderCreatureList(): void {
  const listContainer = document.getElementById('creature-list') as HTMLElement;
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  
  const elements: Element[] = ['fire', 'water', 'grass'];
  const displayCreatures = allyCreatures.filter(c => !isInFormation(c.id, allyFormation));
  
  for (const element of elements) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'element-group';
    
    const title = document.createElement('div');
    title.className = `group-title ${element}`;
    title.textContent = getElementName(element);
    groupDiv.appendChild(title);
    
    const elementCreatures = displayCreatures.filter(c => c.element === element);
    
    for (const creature of elementCreatures) {
      const card = createCreatureCard(creature);
      groupDiv.appendChild(card);
    }
    
    listContainer.appendChild(groupDiv);
  }
}

function getElementName(element: Element): string {
  const names: Record<Element, string> = {
    fire: '🔥 火元素',
    water: '💧 水元素',
    grass: '🌿 草元素'
  };
  return names[element];
}

function isInFormation(creatureId: string, formation: Formation): boolean {
  return formation.some(cell => cell.creatureId === creatureId);
}

function createCreatureCard(creature: Creature): HTMLElement {
  const card = document.createElement('div');
  card.className = 'creature-card';
  card.dataset.creatureId = creature.id;
  card.draggable = true;
  
  const hpPercent = (creature.currentHp / creature.maxHp) * 100;
  let hpClass = '';
  if (hpPercent <= 25) hpClass = 'critical';
  else if (hpPercent <= 50) hpClass = 'low';
  
  card.innerHTML = `
    <div class="card-header">
      <div class="creature-icon">${ELEMENT_ICONS[creature.element]}</div>
      <div class="element-dot ${creature.element}"></div>
      <span class="creature-name">${creature.name}</span>
    </div>
    <div class="card-stats">
      <div class="stat">
        <span class="stat-label">攻击</span>
        <span class="stat-value">${creature.attack}</span>
      </div>
      <div class="stat stat-speed">
        <span class="stat-label">速度</span>
        <span class="stat-value">${creature.speed}</span>
      </div>
    </div>
    <div class="hp-bar-container">
      <div class="hp-bar ${hpClass}" style="width: ${hpPercent}%"></div>
    </div>
  `;
  
  card.addEventListener('dragstart', (e) => handleDragStart(e, creature));
  card.addEventListener('dragend', handleDragEnd);
  
  return card;
}

function setupEventListeners(): void {
  const btnFormation = document.getElementById('btn-formation') as HTMLButtonElement;
  const btnBattle = document.getElementById('btn-battle') as HTMLButtonElement;
  const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
  const btnModalReset = document.getElementById('btn-modal-reset') as HTMLButtonElement;
  const sceneContainer = document.querySelector('.scene-container') as HTMLElement;
  
  btnFormation?.addEventListener('click', handleAutoFormation);
  btnBattle?.addEventListener('click', handleStartBattle);
  btnReset?.addEventListener('click', handleReset);
  btnModalReset?.addEventListener('click', () => {
    hideResultModal();
    handleReset();
  });
  
  sceneContainer?.addEventListener('dragover', handleDragOver);
  sceneContainer?.addEventListener('drop', handleDrop);
  sceneContainer?.addEventListener('dragleave', handleDragLeave);
  
  sceneContainer?.addEventListener('mousemove', handleMouseMove);
}

function handleAutoFormation(): void {
  if (isBattling) return;
  
  const result = generateFormation(allyCreatures, enemyCreatures, 0, 0);
  allyFormation = result.allyFormation;
  enemyFormation = result.enemyFormation;
  
  battleScene.clearFormation();
  battleScene.renderFormation(allyFormation, creatureMap, 'ally');
  battleScene.renderFormation(enemyFormation, creatureMap, 'enemy');
  
  isFormationSet = true;
  currentRound = 0;
  updateUI();
  renderCreatureList();
  
  const btnBattle = document.getElementById('btn-battle') as HTMLButtonElement;
  if (btnBattle) btnBattle.disabled = false;
}

function handleStartBattle(): void {
  if (!isFormationSet || isBattling) return;
  
  isBattling = true;
  currentRound = 0;
  
  const btnFormation = document.getElementById('btn-formation') as HTMLButtonElement;
  const btnBattle = document.getElementById('btn-battle') as HTMLButtonElement;
  const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
  
  if (btnFormation) btnFormation.disabled = true;
  if (btnBattle) btnBattle.disabled = true;
  if (btnReset) btnReset.disabled = true;
  
  const getPosition = (creatureId: string): { x: number; y: number; z: number } | undefined => {
    const allFormation = [...allyFormation, ...enemyFormation];
    const cell = allFormation.find(c => c.creatureId === creatureId);
    if (cell) {
      return { x: cell.position.x, y: 0.5, z: cell.position.z };
    }
    return undefined;
  };
  
  const result = simulateCombat(allyFormation, enemyFormation, creatureMap, { getPosition });
  
  animateBattle(result);
}

async function animateBattle(result: CombatResult): Promise<void> {
  const logsByRound: Map<number, CombatLog[]> = new Map();
  
  for (const log of result.logs) {
    if (!logsByRound.has(log.round)) {
      logsByRound.set(log.round, []);
    }
    logsByRound.get(log.round)!.push(log);
  }
  
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const logs = logsByRound.get(round);
    if (!logs || logs.length === 0) break;
    
    currentRound = round;
    updateUI();
    
    for (const log of logs) {
      const attacker = creatureMap.get(log.attackerId);
      const target = creatureMap.get(log.targetId);
      
      if (!attacker || !target) continue;
      
      battleScene.showAttackRay(log);
      battleScene.showDamageFlash(log.targetId);
      
      target.currentHp = Math.max(0, target.currentHp - log.damage);
      if (target.currentHp <= 0) {
        target.isAlive = false;
        battleScene.showDeathAnimation(log.targetId);
      }
      
      updateUI();
      
      await sleep(300);
    }
    
    const allyAlive = countSurvivors('ally');
    const enemyAlive = countSurvivors('enemy');
    
    if (allyAlive === 0 || enemyAlive === 0) {
      break;
    }
    
    await sleep(1000);
  }
  
  await sleep(500);
  showResultModal(result);
  
  isBattling = false;
  const btnFormation = document.getElementById('btn-formation') as HTMLButtonElement;
  const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
  
  if (btnFormation) btnFormation.disabled = false;
  if (btnReset) btnReset.disabled = false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function countSurvivors(team: Team): number {
  const creatures = team === 'ally' ? allyCreatures : enemyCreatures;
  return creatures.filter(c => c.isAlive).length;
}

function updateUI(): void {
  const roundDisplay = document.getElementById('round-display') as HTMLElement;
  const allyCount = document.getElementById('ally-count') as HTMLElement;
  const enemyCount = document.getElementById('enemy-count') as HTMLElement;
  
  if (roundDisplay) roundDisplay.textContent = `${currentRound} / ${MAX_ROUNDS}`;
  if (allyCount) allyCount.textContent = String(countSurvivors('ally'));
  if (enemyCount) enemyCount.textContent = String(countSurvivors('enemy'));
}

function showResultModal(result: CombatResult): void {
  const modal = document.getElementById('result-modal') as HTMLElement;
  const title = document.getElementById('result-title') as HTMLElement;
  const resultAlly = document.getElementById('result-ally') as HTMLElement;
  const resultEnemy = document.getElementById('result-enemy') as HTMLElement;
  const chartAlly = document.getElementById('chart-ally') as HTMLElement;
  const chartEnemy = document.getElementById('chart-enemy') as HTMLElement;
  const chartAllyValue = document.getElementById('chart-ally-value') as HTMLElement;
  const chartEnemyValue = document.getElementById('chart-enemy-value') as HTMLElement;
  
  if (!modal) return;
  
  title.className = 'modal-title';
  
  if (result.winner === 'ally') {
    title.textContent = '🎉 我方胜利！';
    title.classList.add('victory');
  } else if (result.winner === 'enemy') {
    title.textContent = '💀 敌方胜利';
    title.classList.add('defeat');
  } else {
    title.textContent = '⚖ 平局';
    title.classList.add('draw');
  }
  
  if (resultAlly) resultAlly.textContent = String(result.allySurvivors);
  if (resultEnemy) resultEnemy.textContent = String(result.enemySurvivors);
  
  const maxDamage = Math.max(result.totalDamageAlly, result.totalDamageEnemy, 1);
  const maxHeight = 120;
  
  if (chartAlly) {
    const height = (result.totalDamageAlly / maxDamage) * maxHeight;
    chartAlly.style.height = `${Math.max(20, height)}px`;
  }
  if (chartEnemy) {
    const height = (result.totalDamageEnemy / maxDamage) * maxHeight;
    chartEnemy.style.height = `${Math.max(20, height)}px`;
  }
  
  if (chartAllyValue) chartAllyValue.textContent = String(result.totalDamageAlly);
  if (chartEnemyValue) chartEnemyValue.textContent = String(result.totalDamageEnemy);
  
  modal.classList.add('active');
}

function hideResultModal(): void {
  const modal = document.getElementById('result-modal') as HTMLElement;
  if (modal) {
    modal.classList.remove('active');
  }
}

function handleReset(): void {
  if (isBattling) return;
  
  resetCreatureHp(allyCreatures);
  resetCreatureHp(enemyCreatures);
  
  allyFormation = [];
  enemyFormation = [];
  isFormationSet = false;
  currentRound = 0;
  
  battleScene.clearFormation();
  battleScene.resetCreatureStates();
  
  const btnBattle = document.getElementById('btn-battle') as HTMLButtonElement;
  if (btnBattle) btnBattle.disabled = true;
  
  updateUI();
  renderCreatureList();
}

function handleDragStart(e: DragEvent, creature: Creature): void {
  if (isBattling) {
    e.preventDefault();
    return;
  }
  
  draggedCreature = creature;
  
  const cell = findCellByCreatureId(allyFormation, creature.id);
  draggedFromCellId = cell?.id || null;
  
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', creature.id);
  }
  
  const target = e.target as HTMLElement;
  target?.classList.add('dragging');
  
  createDragGhost(creature, e.clientX, e.clientY);
}

function createDragGhost(creature: Creature, x: number, y: number): void {
  if (dragGhost) {
    document.body.removeChild(dragGhost);
  }
  
  dragGhost = document.createElement('div');
  dragGhost.className = 'drag-ghost creature-card';
  dragGhost.style.left = `${x}px`;
  dragGhost.style.top = `${y}px`;
  dragGhost.style.width = '200px';
  
  const hpPercent = (creature.currentHp / creature.maxHp) * 100;
  
  dragGhost.innerHTML = `
    <div class="card-header">
      <div class="creature-icon">${ELEMENT_ICONS[creature.element]}</div>
      <div class="element-dot ${creature.element}"></div>
      <span class="creature-name">${creature.name}</span>
    </div>
    <div class="card-stats">
      <div class="stat">
        <span class="stat-label">攻击</span>
        <span class="stat-value">${creature.attack}</span>
      </div>
      <div class="stat stat-speed">
        <span class="stat-label">速度</span>
        <span class="stat-value">${creature.speed}</span>
      </div>
    </div>
    <div class="hp-bar-container">
      <div class="hp-bar" style="width: ${hpPercent}%"></div>
    </div>
  `;
  
  document.body.appendChild(dragGhost);
}

function handleDragEnd(e: DragEvent): void {
  const target = e.target as HTMLElement;
  target?.classList.remove('dragging');
  
  if (dragGhost) {
    document.body.removeChild(dragGhost);
    dragGhost = null;
  }
  
  if (dropHighlight) {
    dropHighlight.remove();
    dropHighlight = null;
  }
  
  draggedCreature = null;
  draggedFromCellId = null;
}

function handleDragOver(e: DragEvent): void {
  if (!draggedCreature || isBattling) return;
  
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  
  const sceneContainer = document.querySelector('.scene-container') as HTMLElement;
  if (!sceneContainer) return;
  
  const point = battleScene.raycastToGround(e.clientX, e.clientY);
  if (point) {
    const cell = findCellByPosition(allyFormation, point.x, point.z, 0.6);
    if (cell) {
      updateDropHighlight(cell.position.x, cell.position.z, sceneContainer);
    } else {
      if (dropHighlight) {
        dropHighlight.remove();
        dropHighlight = null;
      }
    }
  }
  
  if (dragGhost) {
    dragGhost.style.left = `${e.clientX}px`;
    dragGhost.style.top = `${e.clientY}px`;
  }
}

function updateDropHighlight(x: number, z: number, container: HTMLElement): void {
  const worldPos = new THREE.Vector3(x, 0, z);
  const screenPos = worldToScreen(worldPos);
  
  if (!screenPos) return;
  
  if (!dropHighlight) {
    dropHighlight = document.createElement('div');
    dropHighlight.className = 'drop-highlight';
    dropHighlight.style.width = '60px';
    dropHighlight.style.height = '60px';
    container.appendChild(dropHighlight);
  }
  
  dropHighlight.style.left = `${screenPos.x - 30}px`;
  dropHighlight.style.top = `${screenPos.y - 30}px`;
}

function worldToScreen(worldPos: THREE.Vector3): { x: number; y: number } | null {
  const camera = battleScene.getCamera();
  const sceneContainer = document.querySelector('.scene-container') as HTMLElement;
  if (!sceneContainer) return null;
  
  const vector = worldPos.clone();
  vector.project(camera);
  
  const rect = sceneContainer.getBoundingClientRect();
  return {
    x: rect.left + (vector.x + 1) * rect.width / 2,
    y: rect.top + (-vector.y + 1) * rect.height / 2
  };
}

function handleDragLeave(e: DragEvent): void {
  const container = document.querySelector('.scene-container') as HTMLElement;
  if (container && !container.contains(e.relatedTarget as Node)) {
    if (dropHighlight) {
      dropHighlight.remove();
      dropHighlight = null;
    }
  }
}

function handleDrop(e: DragEvent): void {
  if (!draggedCreature || isBattling) return;
  
  e.preventDefault();
  
  if (dropHighlight) {
    dropHighlight.remove();
    dropHighlight = null;
  }
  
  const point = battleScene.raycastToGround(e.clientX, e.clientY);
  if (!point) return;
  
  const targetCell = findCellByPosition(allyFormation, point.x, point.z, 0.6);
  if (!targetCell) return;
  
  const sourceCell = draggedFromCellId 
    ? allyFormation.find(c => c.id === draggedFromCellId)
    : null;
  
  const targetCreature = targetCell.creatureId 
    ? creatureMap.get(targetCell.creatureId)
    : null;
  
  if (sourceCell) {
    sourceCell.creatureId = targetCreature?.id || null;
  }
  
  if (targetCreature && sourceCell) {
    setCreatureInCell(allyFormation, sourceCell.id, targetCreature.id);
  }
  
  setCreatureInCell(allyFormation, targetCell.id, draggedCreature.id);
  
  battleScene.showRipple(new THREE.Vector3(targetCell.position.x, 0, targetCell.position.z));
  
  battleScene.clearFormation();
  battleScene.renderFormation(allyFormation, creatureMap, 'ally');
  battleScene.renderFormation(enemyFormation, creatureMap, 'enemy');
  
  renderCreatureList();
  updateUI();
}

function handleMouseMove(e: MouseEvent): void {
  if (dragGhost) {
    dragGhost.style.left = `${e.clientX}px`;
    dragGhost.style.top = `${e.clientY}px`;
  }
}

document.addEventListener('DOMContentLoaded', init);
