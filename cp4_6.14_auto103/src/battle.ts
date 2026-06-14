import type { Player, Monster } from './entity';
import { addExp } from './entity';

export interface BattleState {
  active: boolean;
  player: Player;
  monster: Monster;
  defending: boolean;
  message: string;
  turn: 'player' | 'monster';
  animating: boolean;
}

type BattleEndCallback = (victory: boolean, monster: Monster) => void;

let currentState: BattleState | null = null;
let onBattleEnd: BattleEndCallback | null = null;

let overlayEl: HTMLElement | null = null;
let monsterAvatarEl: HTMLElement | null = null;
let monsterNameEl: HTMLElement | null = null;
let playerHpFillEl: HTMLElement | null = null;
let playerHpEmptyEl: HTMLElement | null = null;
let playerHpTextEl: HTMLElement | null = null;
let monsterHpFillEl: HTMLElement | null = null;
let monsterHpEmptyEl: HTMLElement | null = null;
let monsterHpTextEl: HTMLElement | null = null;
let messageEl: HTMLElement | null = null;
let btnAttack: HTMLElement | null = null;
let btnDefend: HTMLElement | null = null;
let btnSkill: HTMLElement | null = null;

export function initBattleUI(): void {
  overlayEl = document.getElementById('battle-overlay');
  monsterAvatarEl = document.getElementById('battle-monster-avatar');
  monsterNameEl = document.getElementById('battle-monster-name');
  playerHpFillEl = document.getElementById('battle-player-hp-fill');
  playerHpEmptyEl = document.getElementById('battle-player-hp-empty');
  playerHpTextEl = document.getElementById('battle-player-hp-text');
  monsterHpFillEl = document.getElementById('battle-monster-hp-fill');
  monsterHpEmptyEl = document.getElementById('battle-monster-hp-empty');
  monsterHpTextEl = document.getElementById('battle-monster-hp-text');
  messageEl = document.getElementById('battle-message');
  btnAttack = document.getElementById('btn-attack');
  btnDefend = document.getElementById('btn-defend');
  btnSkill = document.getElementById('btn-skill');

  if (btnAttack) {
    btnAttack.addEventListener('click', () => handleAction('attack'));
  }
  if (btnDefend) {
    btnDefend.addEventListener('click', () => handleAction('defend'));
  }
  if (btnSkill) {
    btnSkill.addEventListener('click', () => handleAction('skill'));
  }
}

function pulseButton(btn: HTMLElement | null): void {
  if (!btn) return;
  btn.classList.remove('clicked');
  void btn.offsetWidth;
  btn.classList.add('clicked');
}

function updateUIFromState(): void {
  if (!currentState) return;
  const { player, monster } = currentState;

  if (monsterAvatarEl) {
    monsterAvatarEl.textContent = monster.symbol;
    monsterAvatarEl.style.color = monster.color;
  }
  if (monsterNameEl) {
    monsterNameEl.textContent = monster.name;
  }

  const playerPct = Math.max(0, (player.hp / player.maxHp) * 100);
  if (playerHpFillEl) playerHpFillEl.style.width = playerPct + '%';
  if (playerHpEmptyEl) playerHpEmptyEl.style.width = (100 - playerPct) + '%';
  if (playerHpTextEl) {
    playerHpTextEl.textContent = `生命值：${Math.max(0, player.hp)}/${player.maxHp}`;
  }

  const mPct = Math.max(0, (monster.hp / monster.maxHp) * 100);
  if (monsterHpFillEl) monsterHpFillEl.style.width = mPct + '%';
  if (monsterHpEmptyEl) monsterHpEmptyEl.style.width = (100 - mPct) + '%';
  if (monsterHpTextEl) {
    monsterHpTextEl.textContent = `生命值：${Math.max(0, monster.hp)}/${monster.maxHp}`;
  }

  if (messageEl) messageEl.textContent = currentState.message;

  if (btnSkill) {
    if (player.mp < 1 || currentState.turn !== 'player' || currentState.animating) {
      (btnSkill as HTMLButtonElement).disabled = true;
    } else {
      (btnSkill as HTMLButtonElement).disabled = false;
    }
  }
  if (btnAttack) {
    (btnAttack as HTMLButtonElement).disabled =
      currentState.turn !== 'player' || currentState.animating;
  }
  if (btnDefend) {
    (btnDefend as HTMLButtonElement).disabled =
      currentState.turn !== 'player' || currentState.animating;
  }
}

export function startBattle(
  player: Player,
  monster: Monster,
  callback: BattleEndCallback
): void {
  onBattleEnd = callback;
  currentState = {
    active: true,
    player,
    monster,
    defending: false,
    message: `遭遇了 ${monster.name}！战斗开始！`,
    turn: 'player',
    animating: false,
  };

  if (overlayEl) {
    overlayEl.classList.add('active');
  }
  updateUIFromState();
}

function closeBattle(): void {
  if (overlayEl) {
    overlayEl.classList.remove('active');
  }
  currentState = null;
  onBattleEnd = null;
}

function handleAction(action: 'attack' | 'defend' | 'skill'): void {
  if (!currentState || currentState.turn !== 'player' || currentState.animating) return;

  if (action === 'attack') pulseButton(btnAttack);
  if (action === 'defend') pulseButton(btnDefend);
  if (action === 'skill') pulseButton(btnSkill);

  currentState.animating = true;
  currentState.defending = false;
  const { player, monster } = currentState;

  if (action === 'attack') {
    monster.hp -= 2;
    currentState.message = `你发动攻击，对 ${monster.name} 造成 2 点伤害！`;
  } else if (action === 'defend') {
    currentState.defending = true;
    currentState.message = `你举起防御姿态，本回合受到的伤害减半！`;
  } else if (action === 'skill') {
    if (player.mp < 1) {
      currentState.message = `魔力不足！`;
      currentState.animating = false;
      updateUIFromState();
      return;
    }
    player.mp -= 1;
    monster.hp -= 3;
    currentState.message = `你释放技能，对 ${monster.name} 造成 3 点伤害！`;
  }

  updateUIFromState();

  if (monster.hp <= 0) {
    setTimeout(() => {
      if (!currentState) return;
      currentState.message = `${monster.name} 被击败了！获得 ${monster.expReward} 经验值！`;
      addExp(player, monster.expReward);
      updateUIFromState();
      setTimeout(() => {
        const cb = onBattleEnd;
        const m = monster;
        closeBattle();
        if (cb) cb(true, m);
      }, 800);
    }, 500);
    return;
  }

  setTimeout(() => {
    if (!currentState) return;
    currentState.turn = 'monster';
    updateUIFromState();
    setTimeout(monsterTurn, 600);
  }, 500);
}

function monsterTurn(): void {
  if (!currentState) return;
  const { player, monster, defending } = currentState;

  let dmg = monster.attack;
  if (defending) {
    dmg = Math.max(1, Math.floor(dmg / 2));
  }
  player.hp -= dmg;

  if (defending) {
    currentState.message = `${monster.name} 发动反击，你的防御削减了伤害，受到 ${dmg} 点伤害！`;
  } else {
    currentState.message = `${monster.name} 发动反击，你受到 ${dmg} 点伤害！`;
  }

  updateUIFromState();

  if (player.hp <= 0) {
    setTimeout(() => {
      if (!currentState) return;
      currentState.message = `你被击倒了...`;
      updateUIFromState();
      setTimeout(() => {
        const cb = onBattleEnd;
        const m = monster;
        closeBattle();
        if (cb) cb(false, m);
      }, 1000);
    }, 600);
    return;
  }

  setTimeout(() => {
    if (!currentState) return;
    currentState.turn = 'player';
    currentState.animating = false;
    currentState.defending = false;
    currentState.message = `轮到你了！`;
    updateUIFromState();
  }, 700);
}

export function isBattleActive(): boolean {
  return currentState !== null && currentState.active;
}
