import { HexGrid, HexCoord } from './grid';
import { UnitData, isAlive } from './unit';
import { EffectsSystem } from './effects';
import { Renderer } from './renderer';
import { Game, GamePhase, ActionType, BattleLog } from './game';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const phaseBanner = document.getElementById('phase-banner') as HTMLDivElement;
const turnIndicator = document.getElementById('turn-indicator') as HTMLDivElement;
const deployPalette = document.getElementById('deploy-palette') as HTMLDivElement;
const btnStartBattle = document.getElementById('btn-start-battle') as HTMLButtonElement;
const btnRestart = document.getElementById('btn-restart') as HTMLButtonElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;

const statRound = document.getElementById('stat-round') as HTMLDivElement;
const statAlly = document.getElementById('stat-ally') as HTMLDivElement;
const statEnemy = document.getElementById('stat-enemy') as HTMLDivElement;
const statDmg = document.getElementById('stat-dmg') as HTMLDivElement;
const statHit = document.getElementById('stat-hit') as HTMLDivElement;
const statSkills = document.getElementById('stat-skills') as HTMLDivElement;

const actionLog = document.getElementById('action-log') as HTMLDivElement;
const unitInfo = document.getElementById('unit-info') as HTMLDivElement;

const hexGrid = new HexGrid();
const effectsSystem = new EffectsSystem();
const renderer = new Renderer(canvas, hexGrid, effectsSystem);
const game = new Game(hexGrid, effectsSystem);

renderer.resize();
renderer.centerGrid();
renderer.initInputHandlers();

let lastTime = 0;
let aiTimer = 0;

game.onEvent((event, data) => {
  switch (event) {
    case 'battleStart':
      deployPalette.style.display = 'none';
      phaseBanner.textContent = 'BATTLE PHASE';
      turnIndicator.textContent = `Round ${game.round} — ${game.getCurrentUnit().team === 'player' ? 'Your turn' : 'Enemy turn'}`;
      updateStats();
      break;

    case 'unitSelected':
      updateUnitInfo(data as UnitData);
      break;

    case 'turnChanged': {
      const cur = game.getCurrentUnit();
      renderer.selectedUnitId = cur.id;
      renderer.reachableHexes = [];
      renderer.skillRangeHexes = [];
      turnIndicator.textContent = `Round ${game.round} — ${cur.team === 'player' ? cur.name + ' (Ally)' : cur.name + ' (Enemy)'}`;
      updateStats();
      if (game.selectedUnit) {
        updateUnitInfo(game.selectedUnit);
      }
      break;
    }

    case 'aiTurnStart':
      aiTimer = 0.6;
      break;

    case 'unitMoved':
      renderer.reachableHexes = [];
      break;

    case 'skillUsed':
      renderer.skillRangeHexes = [];
      renderer.reachableHexes = [];
      break;

    case 'logAdded':
      addLogEntry(data as BattleLog);
      break;

    case 'gameOver':
      phaseBanner.textContent = data === 'player' ? 'VICTORY!' : 'DEFEAT!';
      turnIndicator.textContent = `Battle ended in ${game.round} rounds`;
      showGameOverOverlay(data as string);
      break;

    case 'gameReset':
      deployPalette.style.display = 'flex';
      phaseBanner.textContent = 'DEPLOY PHASE';
      turnIndicator.textContent = 'Drag units onto the grid to deploy';
      renderer.selectedUnitId = null;
      renderer.reachableHexes = [];
      renderer.skillRangeHexes = [];
      renderer.deployHighlight = null;
      unitInfo.innerHTML = '<div style="color:#556677;font-size:12px;text-align:center;padding:20px 0;">Select a unit to view details</div>';
      const logEntries = actionLog.querySelectorAll('.log-entry');
      logEntries.forEach(e => e.remove());
      removeGameOverOverlay();
      updateStats();
      break;

    case 'unitDeployed':
      updateStats();
      break;

    case 'newRound':
      updateStats();
      break;
  }
});

canvas.addEventListener('click', (e) => {
  if (game.phase === 'deploy') return;
  if (game.phase === 'gameOver') return;
  if (game.phase === 'battle') {
    const cur = game.getCurrentUnit();
    if (cur.team === 'enemy') return;
  }

  const hex = renderer.screenToHex(e.clientX, e.clientY);
  if (!hexGrid.isValid(hex)) return;

  const clickedUnit = game.getUnitAt(hex.col, hex.row);

  if (game.actionType === 'none') {
    if (clickedUnit && clickedUnit.team === 'player' && clickedUnit.id === game.getCurrentUnit().id) {
      game.selectUnit(clickedUnit);
      renderer.selectedUnitId = clickedUnit.id;
    } else if (clickedUnit && clickedUnit.team === 'player') {
      game.selectUnit(clickedUnit);
      renderer.selectedUnitId = clickedUnit.id;
    }
  } else if (game.actionType === 'move') {
    if (clickedUnit && clickedUnit.team === 'player' && clickedUnit.id === game.getCurrentUnit().id) {
      game.actionType = 'none';
      renderer.reachableHexes = [];
    } else {
      game.moveUnit(game.getCurrentUnit(), hex.col, hex.row);
    }
  } else if (game.actionType === 'skill' && game.selectedSkill) {
    if (clickedUnit) {
      game.useSkill(game.getCurrentUnit(), game.selectedSkill, { col: clickedUnit.col, row: clickedUnit.row });
    } else {
      game.useSkill(game.getCurrentUnit(), game.selectedSkill, hex);
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (game.phase !== 'deploy') return;
  const hex = renderer.screenToHex(e.clientX, e.clientY);
  if (hexGrid.isValid(hex)) {
    const occupied = !!game.getUnitAt(hex.col, hex.row);
    renderer.deployHighlight = { hex, valid: !occupied };
  } else {
    renderer.deployHighlight = null;
  }
});

const deployUnits = document.querySelectorAll('.deploy-unit');
deployUnits.forEach(el => {
  el.addEventListener('dragstart', (e) => {
    const de = e as DragEvent;
    de.dataTransfer!.setData('text/plain', JSON.stringify({
      team: (el as HTMLElement).dataset.team,
      template: (el as HTMLElement).dataset.template
    }));
    de.dataTransfer!.effectAllowed = 'copy';
  });
});

canvas.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'copy';
  const hex = renderer.screenToHex(e.clientX, e.clientY);
  if (hexGrid.isValid(hex)) {
    const occupied = !!game.getUnitAt(hex.col, hex.row);
    renderer.deployHighlight = { hex, valid: !occupied };
  }
});

canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  try {
    const raw = e.dataTransfer!.getData('text/plain');
    const { team, template } = JSON.parse(raw);
    const hex = renderer.screenToHex(e.clientX, e.clientY);
    game.deployUnit(team as 'player' | 'enemy', template, hex.col, hex.row);
  } catch { /* ignore */ }
  renderer.deployHighlight = null;
});

canvas.addEventListener('dragleave', () => {
  renderer.deployHighlight = null;
});

btnStartBattle.addEventListener('click', () => {
  game.startBattle();
});

btnRestart.addEventListener('click', () => {
  game.reset();
});

btnExport.addEventListener('click', () => {
  const summary = game.getBattleSummary();
  const json = JSON.stringify(summary, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `battle-log-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

function updateStats(): void {
  statRound.textContent = String(game.round);
  statAlly.textContent = String(game.units.filter(u => u.team === 'player' && isAlive(u)).length);
  statEnemy.textContent = String(game.units.filter(u => u.team === 'enemy' && isAlive(u)).length);
  statDmg.textContent = String(game.stats.totalDamageDealt);
  const hitRate = game.stats.skillAttempts > 0
    ? Math.round(game.stats.skillHits / game.stats.skillAttempts * 100)
    : 0;
  statHit.textContent = hitRate + '%';
  statSkills.textContent = String(game.stats.skillsUsed);
}

function addLogEntry(log: BattleLog): void {
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const timeStr = new Date(log.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const teamClass = log.team === 'player' ? 'log-player' : 'log-enemy';
  const actionText = log.action === 'move'
    ? `moved to (${log.to.col},${log.to.row})`
    : `used ${log.skillName}`;

  let targetText = '';
  for (const t of log.targets) {
    if (t.damage !== undefined && t.damage > 0) {
      targetText += ` → ${t.unitName} ${t.hit ? '-' + t.damage + 'HP' : 'MISS'}`;
    }
    if (t.heal !== undefined && t.heal > 0) {
      targetText += ` → ${t.unitName} +${t.heal}HP`;
    }
    if (t.shield !== undefined && t.shield > 0) {
      targetText += ` → ${t.unitName} +${t.shield}Shield`;
    }
  }

  entry.innerHTML = `<span class="log-time">${timeStr}</span>` +
    `<span class="${teamClass}">[R${log.round}] ${log.unitName}</span> ` +
    `${actionText}${targetText}`;

  const titleEl = actionLog.querySelector('.panel-title');
  if (titleEl && titleEl.nextSibling) {
    actionLog.insertBefore(entry, titleEl.nextSibling);
  } else {
    actionLog.appendChild(entry);
  }

  actionLog.scrollTop = 0;
}

function updateUnitInfo(unit: UnitData): void {
  const hpPct = Math.round(unit.hp / unit.maxHp * 100);
  const shieldPct = unit.shield > 0 ? Math.min(100, Math.round(unit.shield / unit.maxHp * 100)) : 0;
  const teamClass = unit.team === 'player' ? 'player' : 'enemy';

  let skillsHtml = '';
  const cur = game.getCurrentUnit();
  const canAct = game.phase === 'battle' && cur && cur.id === unit.id && cur.team === 'player';

  for (const skill of unit.skills) {
    const isActive = game.selectedSkill && game.selectedSkill.id === skill.id;
    skillsHtml += `<button class="skill-btn${isActive ? ' active' : ''}" ` +
      `data-skill-id="${skill.id}" ${canAct ? '' : 'disabled'}>` +
      `${skill.name}` +
      `<span class="skill-tooltip">${skill.description}</span>` +
      `</button>`;
  }

  unitInfo.innerHTML =
    `<div class="unit-name ${teamClass}">${unit.icon} ${unit.name}</div>` +
    `<div class="attr-bar">` +
      `<div class="attr-bar-label"><span>HP</span><span>${unit.hp}/${unit.maxHp}</span></div>` +
      `<div class="attr-bar-track"><div class="attr-bar-fill hp" style="width:${hpPct}%"></div></div>` +
    `</div>` +
    (unit.shield > 0 ? `<div class="attr-bar">
      <div class="attr-bar-label"><span>Shield</span><span>${unit.shield}</span></div>
      <div class="attr-bar-track"><div class="attr-bar-fill shield" style="width:${shieldPct}%"></div></div>
    </div>` : '') +
    `<div class="unit-attrs">` +
      `<div class="unit-attr"><div class="label">ATK</div><div class="value">${unit.atk}</div></div>` +
      `<div class="unit-attr"><div class="label">DEF</div><div class="value">${unit.def}</div></div>` +
      `<div class="unit-attr"><div class="label">SPD</div><div class="value">${unit.spd}</div></div>` +
      `<div class="unit-attr"><div class="label">MOV</div><div class="value">${unit.moveRange}</div></div>` +
    `</div>` +
    `<div id="skill-buttons">${skillsHtml}</div>`;

  const skillBtns = unitInfo.querySelectorAll('.skill-btn');
  skillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const skillId = (btn as HTMLElement).dataset.skillId!;
      const skill = unit.skills.find(s => s.id === skillId);
      if (!skill) return;

      if (game.actionType === 'skill' && game.selectedSkill && game.selectedSkill.id === skill.id) {
        game.actionType = 'none';
        game.selectedSkill = null;
        renderer.skillRangeHexes = [];
        renderer.reachableHexes = [];
      } else {
        game.actionType = 'skill';
        game.selectedSkill = skill;
        renderer.skillRangeHexes = game.getSkillRangeHexes(game.getCurrentUnit(), skill);
        renderer.reachableHexes = [];
      }
      updateUnitInfo(unit);
    });
  });

  if (canAct) {
    const moveBtn = document.createElement('button');
    moveBtn.className = 'skill-btn';
    moveBtn.textContent = '移动';
    moveBtn.addEventListener('click', () => {
      if (game.actionType === 'move') {
        game.actionType = 'none';
        renderer.reachableHexes = [];
      } else {
        game.actionType = 'move';
        renderer.reachableHexes = game.getReachableHexes(game.getCurrentUnit());
        renderer.skillRangeHexes = [];
        game.selectedSkill = null;
      }
      updateUnitInfo(unit);
    });
    const skillButtons = unitInfo.querySelector('#skill-buttons');
    if (skillButtons) {
      skillButtons.insertBefore(moveBtn, skillButtons.firstChild);
    }
  }
}

function showGameOverOverlay(winner: string): void {
  removeGameOverOverlay();
  const overlay = document.createElement('div');
  overlay.className = 'game-over-overlay';
  overlay.id = 'game-over-overlay';
  overlay.innerHTML =
    `<div class="game-over-title ${winner === 'player' ? 'victory' : 'defeat'}">` +
    `${winner === 'player' ? 'VICTORY' : 'DEFEAT'}</div>` +
    `<div class="game-over-sub">Battle ended in ${game.round} rounds</div>`;
  document.getElementById('battlefield')!.appendChild(overlay);
}

function removeGameOverOverlay(): void {
  const existing = document.getElementById('game-over-overlay');
  if (existing) existing.remove();
}

window.addEventListener('resize', () => {
  renderer.resize();
  renderer.centerGrid();
});

function gameLoop(timestamp: number): void {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if (game.phase === 'battle' && game.getCurrentUnit() && game.getCurrentUnit().team === 'enemy') {
    if (aiTimer > 0) {
      aiTimer -= dt;
      if (aiTimer <= 0) {
        game.executeAITurn();
        aiTimer = 0;
      }
    }
  }

  effectsSystem.update(dt);
  renderer.draw(game.units, timestamp / 1000);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame((t) => {
  lastTime = t;
  gameLoop(t);
});
