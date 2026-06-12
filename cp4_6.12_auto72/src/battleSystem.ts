import type { Pet, BattleState, Particle } from './types';
import { calculateDamage, levelUp, checkEvolution, evolvePet, calculateCatchRate, createParticles, updateParticles } from './gameLogic';

const TURN_INTERVAL = 0.8;

export function createBattleState(): BattleState {
  return {
    active: false,
    playerTeam: [],
    currentPetIndex: 0,
    enemy: null,
    turn: 0,
    turnTimer: TURN_INTERVAL,
    battleLog: [],
    catching: false,
    catchAnimation: 0,
    catchResult: null,
    animationState: null,
    animationTimer: 0,
    levelUpPet: null,
    levelUpTimer: 0,
    evolving: false,
    evolveTimer: 0,
    evolvePet: null,
    evolvePixels: [],
    expGained: 0,
    pokeballs: 5,
    battleEnded: false,
  };
}

export function startBattle(
  state: BattleState,
  playerTeam: Pet[],
  enemy: Pet,
  pokeballs: number
): void {
  state.active = true;
  state.playerTeam = playerTeam.map(p => ({ ...p, stats: { ...p.stats } }));
  state.currentPetIndex = 0;
  state.enemy = { ...enemy, stats: { ...enemy.stats } };
  state.turn = 0;
  state.turnTimer = TURN_INTERVAL;
  state.battleLog = ['野生的 ' + enemy.name + ' 出现了！'];
  state.catching = false;
  state.catchAnimation = 0;
  state.catchResult = null;
  state.animationState = null;
  state.animationTimer = 0;
  state.levelUpPet = null;
  state.levelUpTimer = 0;
  state.evolving = false;
  state.evolveTimer = 0;
  state.evolvePet = null;
  state.evolvePixels = [];
  state.pokeballs = pokeballs;
  state.battleEnded = false;
}

export function updateBattle(
  state: BattleState,
  deltaTime: number,
  particlesRef: { current: Particle[] }
): void {
  if (!state.active || state.battleEnded) return;
  
  if (state.evolving && state.evolvePet) {
    updateEvolution(state, deltaTime, particlesRef);
    return;
  }
  
  if (state.levelUpPet) {
    state.levelUpTimer -= deltaTime;
    if (state.levelUpTimer <= 0) {
      state.levelUpPet = null;
      state.animationState = null;
    }
    
    if (Math.random() < 0.3) {
      particlesRef.current.push(...createParticles(
        200 + (Math.random() - 0.5) * 80,
        300 + (Math.random() - 0.5) * 80,
        1,
        '#ffd700',
        3
      ));
    }
    return;
  }
  
  if (state.catching) {
    updateCatchAnimation(state, deltaTime, particlesRef);
    return;
  }
  
  if (state.animationState) {
    state.animationTimer -= deltaTime;
    if (state.animationTimer <= 0) {
      state.animationState = null;
    }
    return;
  }
  
  state.turnTimer -= deltaTime;
  
  if (state.turnTimer <= 0) {
    executeTurn(state, particlesRef);
    state.turnTimer = TURN_INTERVAL;
    state.turn++;
  }
}

function executeTurn(state: BattleState, particlesRef: { current: Particle[] }): void {
  if (!state.enemy || state.battleEnded) return;
  
  const playerPet = state.playerTeam[state.currentPetIndex];
  const enemy = state.enemy;
  
  if (!playerPet || playerPet.stats.hp <= 0) {
    const nextIndex = state.playerTeam.findIndex(p => p.stats.hp > 0);
    if (nextIndex === -1) {
      state.battleLog.push('你的队伍全军覆没了...');
      state.battleEnded = true;
      return;
    }
    state.currentPetIndex = nextIndex;
    state.battleLog.push('去吧，' + state.playerTeam[nextIndex].name + '！');
    return;
  }
  
  const playerFirst = playerPet.stats.speed >= enemy.stats.speed;
  
  if (playerFirst) {
    playerAttack(state, particlesRef);
    if (enemy.stats.hp <= 0) {
      endBattleVictory(state, particlesRef);
      return;
    }
    
    setTimeout(() => {}, 0);
    state.turnTimer = TURN_INTERVAL;
    state.animationState = 'enemy_attack';
    state.animationTimer = 0.4;
    
    setTimeout(() => {
      enemyAttack(state, particlesRef);
    }, 400);
  } else {
    enemyAttack(state, particlesRef);
    if (playerPet.stats.hp <= 0) {
      state.battleLog.push(playerPet.name + ' 倒下了！');
      const nextIndex = state.playerTeam.findIndex((p, i) => i !== state.currentPetIndex && p.stats.hp > 0);
      if (nextIndex === -1) {
        state.battleLog.push('你的队伍全军覆没了...');
        state.battleEnded = true;
        return;
      }
      state.currentPetIndex = nextIndex;
      state.battleLog.push('去吧，' + state.playerTeam[nextIndex].name + '！');
      return;
    }
    
    state.animationState = 'player_attack';
    state.animationTimer = 0.4;
    
    setTimeout(() => {
      playerAttack(state, particlesRef);
      if (enemy.stats.hp <= 0) {
        endBattleVictory(state, particlesRef);
      }
    }, 400);
  }
}

function playerAttack(state: BattleState, particlesRef: { current: Particle[] }): void {
  if (!state.enemy) return;
  
  const playerPet = state.playerTeam[state.currentPetIndex];
  if (!playerPet) return;
  
  const skillIndex = Math.floor(Math.random() * playerPet.skills.length);
  const skill = playerPet.skills[skillIndex];
  const damage = calculateDamage(playerPet, state.enemy, skillIndex);
  
  if (damage === -1) {
    state.battleLog.push(playerPet.name + ' 使用了 ' + skill.name + '，但是没有命中！');
  } else {
    state.enemy.stats.hp = Math.max(0, state.enemy.stats.hp - damage);
    state.battleLog.push(playerPet.name + ' 使用了 ' + skill.name + '，造成 ' + damage + ' 点伤害！');
    
    const color = getElementColor(skill.element);
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push(...createParticles(550, 250, 1, color, 4));
    }
  }
}

function enemyAttack(state: BattleState, particlesRef: { current: Particle[] }): void {
  if (!state.enemy) return;
  
  const playerPet = state.playerTeam[state.currentPetIndex];
  if (!playerPet) return;
  
  const skillIndex = Math.floor(Math.random() * state.enemy.skills.length);
  const skill = state.enemy.skills[skillIndex];
  const damage = calculateDamage(state.enemy, playerPet, skillIndex);
  
  if (damage === -1) {
    state.battleLog.push(state.enemy.name + ' 使用了 ' + skill.name + '，但是没有命中！');
  } else {
    playerPet.stats.hp = Math.max(0, playerPet.stats.hp - damage);
    state.battleLog.push(state.enemy.name + ' 使用了 ' + skill.name + '，造成 ' + damage + ' 点伤害！');
    
    const color = getElementColor(skill.element);
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push(...createParticles(200, 300, 1, color, 4));
    }
  }
}

function getElementColor(element: string): string {
  const colors: Record<string, string> = {
    fire: '#e74c3c',
    water: '#3498db',
    grass: '#27ae60',
    normal: '#95a5a6',
  };
  return colors[element] || '#ffffff';
}

function endBattleVictory(state: BattleState, particlesRef: { current: Particle[] }): void {
  if (!state.enemy) return;
  
  state.battleLog.push('野生的 ' + state.enemy.name + ' 倒下了！');
  
  const baseExp = state.enemy.level * 15 + Math.floor(Math.random() * 11) - 5;
  state.expGained = baseExp;
  
  const playerPet = state.playerTeam[state.currentPetIndex];
  if (playerPet) {
    const leveledUp = levelUp(playerPet);
    state.battleLog.push(playerPet.name + ' 获得了 ' + baseExp + ' 点经验值！');
    
    if (leveledUp) {
      state.battleLog.push('恭喜！' + playerPet.name + ' 升到了 ' + playerPet.level + ' 级！');
      state.levelUpPet = playerPet;
      state.levelUpTimer = 1.5;
      state.animationState = 'levelup';
      
      for (let i = 0; i < 30; i++) {
        particlesRef.current.push(...createParticles(200, 300, 1, '#ffd700', 5));
      }
    }
    
    const evolveTo = checkEvolution(playerPet);
    if (evolveTo) {
      startEvolution(state, playerPet);
    }
  }
  
  if (Math.random() < 0.2) {
    state.pokeballs++;
    state.battleLog.push('获得了 1 个精灵球！');
  }
  
  setTimeout(() => {
    state.battleEnded = true;
  }, 2000);
}

export function attemptCatch(state: BattleState, particlesRef: { current: Particle[] }): boolean {
  if (!state.enemy || state.catching || state.pokeballs <= 0) return false;
  
  const hpPercent = state.enemy.stats.hp / state.enemy.stats.maxHp;
  if (hpPercent > 0.3) {
    state.battleLog.push('对方生命值太高，不容易捕捉！');
    return false;
  }
  
  state.pokeballs--;
  state.catching = true;
  state.catchAnimation = 0;
  state.catchResult = null;
  state.battleLog.push('投出了精灵球！');
  
  return true;
}

function updateCatchAnimation(state: BattleState, deltaTime: number, particlesRef: { current: Particle[] }): void {
  if (!state.enemy) return;
  
  state.catchAnimation += deltaTime;
  
  const totalShakes = 3;
  const shakeDuration = 0.2;
  const pauseDuration = 0.3;
  const cycleDuration = shakeDuration * 2 + pauseDuration;
  
  if (state.catchAnimation < 0.5) {
    return;
  }
  
  const animTime = state.catchAnimation - 0.5;
  const shakeCycle = Math.floor(animTime / cycleDuration);
  
  if (shakeCycle >= totalShakes) {
    if (state.catchResult === null) {
      const catchRate = calculateCatchRate(state.enemy);
      const success = Math.random() < catchRate;
      state.catchResult = success ? 'success' : 'fail';
      
      if (success) {
        state.battleLog.push('太棒了！成功捕获了 ' + state.enemy.name + '！');
        for (let i = 0; i < 20; i++) {
          particlesRef.current.push(...createParticles(550, 200, 1, '#2ecc71', 4));
        }
      } else {
        state.battleLog.push('啊哦，' + state.enemy.name + ' 挣脱了！');
        for (let i = 0; i < 15; i++) {
          particlesRef.current.push(...createParticles(550, 200, 1, '#e74c3c', 3));
        }
      }
    }
    
    if (state.catchAnimation > totalShakes * cycleDuration + 0.5 + 1) {
      state.catching = false;
      state.catchAnimation = 0;
      
      if (state.catchResult === 'success') {
        state.battleEnded = true;
      }
    }
  }
}

export function getCatchShakeOffset(state: BattleState): { x: number; y: number } {
  if (!state.catching) return { x: 0, y: 0 };
  
  const animTime = state.catchAnimation - 0.5;
  if (animTime < 0) return { x: 0, y: 0 };
  
  const totalShakes = 3;
  const shakeDuration = 0.2;
  const pauseDuration = 0.3;
  const cycleDuration = shakeDuration * 2 + pauseDuration;
  
  const cycle = Math.floor(animTime / cycleDuration);
  if (cycle >= totalShakes) return { x: 0, y: 0 };
  
  const cycleTime = animTime % cycleDuration;
  
  if (cycleTime < shakeDuration) {
    const t = cycleTime / shakeDuration;
    return { x: -10 * Math.sin(t * Math.PI), y: 0 };
  } else if (cycleTime < shakeDuration * 2) {
    const t = (cycleTime - shakeDuration) / shakeDuration;
    return { x: 10 * Math.sin(t * Math.PI), y: 0 };
  }
  
  return { x: 0, y: 0 };
}

function startEvolution(state: BattleState, pet: Pet): void {
  state.evolving = true;
  state.evolveTimer = 0;
  state.evolvePet = pet;
  state.evolvePixels = [];
  state.battleLog.push('等等，' + pet.name + ' 正在进化...');
  
  const sprite = pet.spriteData;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const color = sprite[y][x];
      if (color !== 'transparent') {
        state.evolvePixels.push({
          x: x * 3,
          y: y * 3,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4 - 2,
          color,
        });
      }
    }
  }
}

function updateEvolution(state: BattleState, deltaTime: number, particlesRef: { current: Particle[] }): void {
  state.evolveTimer += deltaTime;
  
  if (state.evolveTimer < 1.5) {
    for (const pixel of state.evolvePixels) {
      pixel.x += pixel.vx;
      pixel.y += pixel.vy;
      pixel.vy += 0.1;
    }
    
    if (Math.random() < 0.5) {
      particlesRef.current.push(...createParticles(200, 280, 1, '#ffffff', 3));
    }
  } else if (state.evolveTimer < 2.5) {
    for (const pixel of state.evolvePixels) {
      const targetX = pixel.x;
      const targetY = pixel.y;
      pixel.x += (targetX - pixel.x) * 0.1;
      pixel.y += (targetY - pixel.y) * 0.1;
    }
    
    if (Math.random() < 0.7) {
      particlesRef.current.push(...createParticles(200, 280, 1, '#ffd700', 4));
    }
  } else {
    if (state.evolvePet) {
      evolvePet(state.evolvePet);
      state.battleLog.push('恭喜！' + state.evolvePet.name + ' 进化了！');
    }
    state.evolving = false;
    state.evolvePet = null;
    state.evolvePixels = [];
  }
}

export function drawBattle(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  particles: Particle[],
  scale: number = 1
): void {
  ctx.save();
  ctx.scale(scale, scale);
  
  ctx.fillStyle = '#2d4a2d';
  ctx.fillRect(0, 0, 800, 600);
  
  ctx.fillStyle = '#1a3a1a';
  for (let i = 0; i < 10; i++) {
    const x = (i * 90 + 20) % 800;
    const y = 50 + (i % 3) * 100;
    drawBattleTree(ctx, x, y);
  }
  
  if (state.enemy) {
    const enemyY = 180;
    const shakeOffset = state.catching ? getCatchShakeOffset(state) : { x: 0, y: 0 };
    
    if (!state.catching || state.catchResult !== 'success') {
      drawBattlePet(ctx, state.enemy, 550 + shakeOffset.x, enemyY + shakeOffset.y, 3);
    }
    
    if (state.catching) {
      drawPokeball(ctx, 550, enemyY + 30, state.catchAnimation);
    }
  }
  
  const playerPet = state.playerTeam[state.currentPetIndex];
  if (playerPet) {
    if (state.evolving && state.evolvePet === playerPet) {
      drawEvolvingPet(ctx, state.evolvePixels, 200, 280);
    } else {
      drawBattlePet(ctx, playerPet, 200, 320, 4);
    }
    
    if (state.levelUpPet === playerPet) {
      drawLevelUpEffect(ctx, 200, 300, state.levelUpTimer);
    }
  }
  
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  
  ctx.restore();
}

function drawBattleTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#5c3317';
  ctx.fillRect(x - 4, y + 20, 8, 30);
  
  ctx.fillStyle = '#1a3a1a';
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.fill();
}

function drawBattlePet(
  ctx: CanvasRenderingContext2D,
  pet: Pet,
  x: number,
  y: number,
  size: number
): void {
  const pixelSize = size;
  const sprite = pet.spriteData;
  const offsetX = -16 * pixelSize / 2;
  const offsetY = -16 * pixelSize;
  
  ctx.save();
  ctx.translate(x, y);
  
  for (let py = 0; py < 16; py++) {
    for (let px = 0; px < 16; px++) {
      const color = sprite[py][px];
      if (color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(
          offsetX + px * pixelSize,
          offsetY + py * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }
  
  ctx.restore();
}

function drawPokeball(ctx: CanvasRenderingContext2D, x: number, y: number, animTime: number): void {
  const size = 24;
  
  ctx.save();
  ctx.translate(x, y);
  
  if (animTime < 0.5) {
    const t = animTime / 0.5;
    ctx.translate(-200 * (1 - t), -100 * Math.sin(t * Math.PI));
    ctx.rotate(t * Math.PI * 4);
  }
  
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(0, 0, size, Math.PI, 0);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI);
  ctx.fill();
  
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.lineTo(size, 0);
  ctx.stroke();
  
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.restore();
}

function drawEvolvingPet(
  ctx: CanvasRenderingContext2D,
  pixels: { x: number; y: number; color: string }[],
  centerX: number,
  centerY: number
): void {
  ctx.save();
  ctx.translate(centerX - 24, centerY - 48);
  
  for (const pixel of pixels) {
    ctx.fillStyle = pixel.color;
    ctx.fillRect(pixel.x, pixel.y, 3, 3);
  }
  
  ctx.restore();
}

function drawLevelUpEffect(ctx: CanvasRenderingContext2D, x: number, y: number, timer: number): void {
  const intensity = Math.min(1, timer * 2);
  
  ctx.save();
  ctx.globalAlpha = intensity * 0.5;
  
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 20, 50, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}
