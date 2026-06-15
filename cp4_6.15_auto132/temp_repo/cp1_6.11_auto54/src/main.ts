import {
  getFormationTemplates,
  createFormation,
  applyBondEffects,
  getRaceEmoji,
  type Hero,
  type FormationTemplate,
  type BondResult
} from './heroManager';
import {
  init as initCollision,
  update as updateCollision,
  getAliveHeroes,
  getCollisionCount,
  setSimulationActive,
  setAllAgile,
  type CollisionEvent
} from './collisionEngine';
import * as Renderer from './sceneRenderer';
import type { Race } from './heroManager';

const ARENA_RADIUS = 8;
const COUNTDOWN_SECONDS = 5;

let currentHeroes: Hero[] = [];
let currentBonds: BondResult | null = null;
let currentTemplateId: string | null = null;

let isSimulating: boolean = false;
let isCountingDown: boolean = false;
let countdownRemaining: number = 0;
let countdownTimerId: number | null = null;

let lastFrameTime: number = 0;
let frameCount: number = 0;
let fpsAccumulator: number = 0;
let currentFps: number = 60;

const fpsValueEl = document.getElementById('fps-value') as HTMLElement;
const collisionValueEl = document.getElementById('collision-value') as HTMLElement;
const aliveValueEl = document.getElementById('alive-value') as HTMLElement;
const formationListEl = document.getElementById('formation-list') as HTMLElement;
const bondInfoEl = document.getElementById('bond-info') as HTMLElement;
const appEl = document.getElementById('app') as HTMLElement;

function createStarfield(): void {
  const starfield = document.getElementById('starfield');
  if (!starfield) return;
  starfield.innerHTML = '';
  const starCount = 150;
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 3 + 's';
    star.style.animationDuration = (2 + Math.random() * 3) + 's';
    const size = 1 + Math.random() * 2;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    starfield.appendChild(star);
  }
}

function renderFormationTemplates(): void {
  const templates = getFormationTemplates();
  formationListEl.innerHTML = '';

  templates.forEach(template => {
    const card = document.createElement('div');
    card.className = 'formation-card' + (currentTemplateId === template.id ? ' active' : '');
    card.dataset.templateId = template.id;

    const races = template.id === 'random'
      ? ['human', 'elf', 'orc', 'undead', 'human']
      : template.heroRaces;

    card.innerHTML = `
      <div class="formation-header">
        <span class="formation-icon">${template.icon}</span>
        <span class="formation-name">${template.name}</span>
      </div>
      <div class="formation-desc">${template.description}</div>
      <div class="race-icons">
        ${races.map(r => `<span class="race-dot ${r}"></span>`).join('')}
      </div>
    `;

    card.addEventListener('click', () => selectFormation(template));
    formationListEl.appendChild(card);
  });
}

function updateBondInfo(): void {
  if (!currentBonds) {
    bondInfoEl.className = 'bond-info';
    bondInfoEl.textContent = '暂无羁绊效果';
    return;
  }

  const bonds = currentBonds;
  const effects: string[] = [];
  if (bonds.buffedHeroId) {
    const hero = currentHeroes.find(h => h.id === bonds.buffedHeroId);
    if (hero) {
      effects.push(`⭐ ${getRaceEmoji(hero.race)} ${hero.name} 获得羁绊增益（体型+20%）`);
    }
  }
  if (bonds.allAgile) {
    effects.push('⚡ 四族齐聚，全体敏捷加成（速度+30%）');
  }

  if (effects.length > 0) {
    bondInfoEl.className = 'bond-info active';
    bondInfoEl.innerHTML = effects.join('<br>');
  } else {
    bondInfoEl.className = 'bond-info';
    bondInfoEl.textContent = '暂无羁绊效果';
  }
}

function clearCountdownOverlay(): void {
  const existing = appEl.querySelector('.countdown-overlay');
  if (existing) existing.remove();
}

function showCountdownNumber(n: number): void {
  clearCountdownOverlay();
  const overlay = document.createElement('div');
  overlay.className = 'countdown-overlay';
  overlay.style.animation = 'none';
  overlay.offsetHeight;
  overlay.style.animation = '';
  overlay.textContent = n > 0 ? n.toString() : '开始!';
  appEl.appendChild(overlay);
}

function startCountdown(): void {
  if (isCountingDown) return;

  isCountingDown = true;
  countdownRemaining = COUNTDOWN_SECONDS;
  Renderer.hideWinner();

  showCountdownNumber(countdownRemaining);

  countdownTimerId = window.setInterval(() => {
    countdownRemaining--;
    if (countdownRemaining > 0) {
      showCountdownNumber(countdownRemaining);
    } else if (countdownRemaining === 0) {
      showCountdownNumber(0);
    } else {
      if (countdownTimerId !== null) {
        clearInterval(countdownTimerId);
        countdownTimerId = null;
      }
      clearCountdownOverlay();
      isCountingDown = false;
      isSimulating = true;
      setSimulationActive(true);
    }
  }, 1000);
}

function stopSimulation(): void {
  isSimulating = false;
  isCountingDown = false;
  setSimulationActive(false);
  if (countdownTimerId !== null) {
    clearInterval(countdownTimerId);
    countdownTimerId = null;
  }
  clearCountdownOverlay();
}

function checkWinner(): void {
  const alive = getAliveHeroes();
  if (alive.length <= 1 && isSimulating) {
    stopSimulation();
    if (alive.length === 1) {
      Renderer.showWinner(alive[0].race as Race);
    }
  }
}

function selectFormation(template: FormationTemplate): void {
  stopSimulation();
  Renderer.hideWinner();

  currentTemplateId = template.id;
  currentHeroes = createFormation(template.id, ARENA_RADIUS);
  currentBonds = applyBondEffects(currentHeroes);
  setAllAgile(currentBonds.allAgile);

  initCollision(currentHeroes, ARENA_RADIUS);
  Renderer.setHeroes(currentHeroes);
  renderFormationTemplates();
  updateBondInfo();

  updateStats();
  startCountdown();
}

function updateStats(): void {
  fpsValueEl.textContent = Math.round(currentFps).toString();
  collisionValueEl.textContent = getCollisionCount().toString();

  const aliveCount = getAliveHeroes().length;
  aliveValueEl.textContent = aliveCount.toString();
  if (aliveCount <= 1) {
    aliveValueEl.classList.add('warn');
  } else {
    aliveValueEl.classList.remove('warn');
  }
}

function gameLoop(timestamp: number): void {
  if (lastFrameTime === 0) lastFrameTime = timestamp;
  const deltaTime = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
  lastFrameTime = timestamp;

  frameCount++;
  fpsAccumulator += deltaTime;
  if (fpsAccumulator >= 0.5) {
    currentFps = frameCount / fpsAccumulator;
    frameCount = 0;
    fpsAccumulator = 0;
  }

  const collisions: CollisionEvent[] = updateCollision(deltaTime);
  collisions.forEach(c => {
    Renderer.addCollisionEffect(c.position.x, c.position.z);
  });

  const aliveHeroes = getAliveHeroes();
  Renderer.updateHeroes(aliveHeroes);
  Renderer.updateBoundaryPulse(timestamp);
  Renderer.updateCollisionEffects(timestamp);
  Renderer.render();

  updateStats();

  if (isSimulating) {
    checkWinner();
  }

  requestAnimationFrame(gameLoop);
}

function init(): void {
  createStarfield();

  const container = document.getElementById('scene-container') as HTMLElement;
  Renderer.init({ container, arenaRadius: ARENA_RADIUS });

  renderFormationTemplates();
  updateBondInfo();
  updateStats();

  requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', init);
