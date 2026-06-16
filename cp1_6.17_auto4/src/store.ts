import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type CharacterType = 'swordsman' | 'mage';
export type SwordsmanSkill = 'heavy_slash' | 'whirlwind' | 'block';
export type MageSkill = 'fireball' | 'ice_spike' | 'shield';
export type LogType = 'attack' | 'defense' | 'special';

export interface Character {
  type: CharacterType;
  hp: number;
  maxHp: number;
  attack: number;
  skill: SwordsmanSkill | MageSkill;
}

export interface LogEntry {
  id: string;
  round: number;
  message: string;
  type: LogType;
  timestamp: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  skill: SwordsmanSkill | MageSkill;
  progress: number;
  duration: number;
}

export interface SlashEffect {
  id: string;
  x: number;
  y: number;
  progress: number;
  duration: number;
  direction: number;
}

interface CombatState {
  swordsman: Character;
  mage: Character;
  fighting: boolean;
  round: number;
  winner: CharacterType | null;
  winnerTimer: number;
  logs: LogEntry[];
  particles: Particle[];
  projectiles: Projectile[];
  slashEffects: SlashEffect[];
  swordsmanCooldown: number;
  mageCooldown: number;
  mageChargeTime: number;
  swordsmanLunge: number;
  mageLunge: number;

  updateCharacter: (type: CharacterType, field: string, value: number | string) => void;
  startFight: () => void;
  recordLog: (message: string, type: LogType) => void;
  processTick: (deltaTime: number) => void;
  addParticle: (particle: Omit<Particle, 'id'>) => void;
  addProjectile: (projectile: Omit<Projectile, 'id'>) => void;
  addSlashEffect: (effect: Omit<SlashEffect, 'id'>) => void;
  resetFight: () => void;
}

const SWORDSMAN_SKILL_NAMES: Record<SwordsmanSkill, string> = {
  heavy_slash: '重斩',
  whirlwind: '旋风斩',
  block: '格挡',
};

const MAGE_SKILL_NAMES: Record<MageSkill, string> = {
  fireball: '火球',
  ice_spike: '冰锥',
  shield: '护盾',
};

const createInitialSwordsman = (): Character => ({
  type: 'swordsman',
  hp: 200,
  maxHp: 200,
  attack: 30,
  skill: 'heavy_slash',
});

const createInitialMage = (): Character => ({
  type: 'mage',
  hp: 140,
  maxHp: 140,
  attack: 40,
  skill: 'fireball',
});

const getSkillDamage = (skill: SwordsmanSkill | MageSkill, baseAttack: number): number => {
  switch (skill) {
    case 'heavy_slash':
      return Math.floor(baseAttack * 1.5);
    case 'whirlwind':
      return Math.floor(baseAttack * 1.2);
    case 'block':
      return 0;
    case 'fireball':
      return Math.floor(baseAttack * 1.4);
    case 'ice_spike':
      return Math.floor(baseAttack * 1.2);
    case 'shield':
      return 0;
    default:
      return baseAttack;
  }
};

const getDefenseReduction = (skill: SwordsmanSkill | MageSkill): number => {
  if (skill === 'block') return 0.7;
  if (skill === 'shield') return 0.6;
  return 0;
};

const isDefensiveSkill = (skill: SwordsmanSkill | MageSkill): boolean => {
  return skill === 'block' || skill === 'shield';
};

export const useCombatStore = create<CombatState>((set, get) => ({
  swordsman: createInitialSwordsman(),
  mage: createInitialMage(),
  fighting: false,
  round: 0,
  winner: null,
  winnerTimer: 0,
  logs: [],
  particles: [],
  projectiles: [],
  slashEffects: [],
  swordsmanCooldown: 0,
  mageCooldown: 0,
  mageChargeTime: 0,
  swordsmanLunge: 0,
  mageLunge: 0,

  updateCharacter: (type, field, value) =>
    set((state) => {
      const character = state[type];
      const newCharacter = { ...character, [field]: value };
      if (field === 'maxHp') {
        newCharacter.hp = value as number;
      }
      return { [type]: newCharacter };
    }),

  startFight: () =>
    set(() => ({
      swordsman: { ...createInitialSwordsman() },
      mage: { ...createInitialMage() },
      fighting: true,
      round: 0,
      winner: null,
      winnerTimer: 0,
      logs: [],
      particles: [],
      projectiles: [],
      slashEffects: [],
      swordsmanCooldown: 0,
      mageCooldown: 0,
      mageChargeTime: 0,
      swordsmanLunge: 0,
      mageLunge: 0,
    })),

  recordLog: (message, type) =>
    set((state) => {
      const newLog: LogEntry = {
        id: uuidv4(),
        round: state.round,
        message,
        type,
        timestamp: Date.now(),
      };
      const newLogs = [newLog, ...state.logs].slice(0, 30);
      return { logs: newLogs };
    }),

  addParticle: (particle) =>
    set((state) => {
      if (state.particles.length >= 100) {
        return { particles: [...state.particles.slice(1), { ...particle, id: uuidv4() }] };
      }
      return { particles: [...state.particles, { ...particle, id: uuidv4() }] };
    }),

  addProjectile: (projectile) =>
    set((state) => ({
      projectiles: [...state.projectiles, { ...projectile, id: uuidv4() }],
    })),

  addSlashEffect: (effect) =>
    set((state) => ({
      slashEffects: [...state.slashEffects, { ...effect, id: uuidv4() }],
    })),

  resetFight: () =>
    set(() => ({
      fighting: false,
      winner: null,
      winnerTimer: 0,
      round: 0,
      logs: [],
      particles: [],
      projectiles: [],
      slashEffects: [],
      swordsmanCooldown: 0,
      mageCooldown: 0,
      mageChargeTime: 0,
      swordsmanLunge: 0,
      mageLunge: 0,
    })),

  processTick: (deltaTime: number) => {
    const state = get();
    if (!state.fighting) return;

    if (state.winner) {
      const newTimer = state.winnerTimer + deltaTime;
      if (newTimer >= 3) {
        get().resetFight();
      } else {
        set({ winnerTimer: newTimer });
      }
      return;
    }

    let {
      swordsman,
      mage,
      swordsmanCooldown,
      mageCooldown,
      mageChargeTime,
      swordsmanLunge,
      mageLunge,
      round,
    } = state;

    swordsmanCooldown = Math.max(0, swordsmanCooldown - deltaTime);
    mageCooldown = Math.max(0, mageCooldown - deltaTime);
    swordsmanLunge = Math.max(0, swordsmanLunge - deltaTime);
    mageLunge = Math.max(0, mageLunge - deltaTime);

    const updatedParticles = state.particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * deltaTime,
        y: p.y + p.vy * deltaTime,
        vy: p.vy + 200 * deltaTime,
        life: p.life - deltaTime,
      }))
      .filter((p) => p.life > 0);

    const updatedProjectiles = state.projectiles
      .map((p) => ({
        ...p,
        progress: p.progress + deltaTime / p.duration,
      }))
      .filter((p) => {
        if (p.progress >= 1) {
          const { addParticle } = get();
          const particleCount = p.skill === 'fireball' ? 15 : 12;
          const colors = p.skill === 'fireball' 
            ? ['#FF6B35', '#FFA500', '#FFD700', '#FF4500']
            : ['#00BFFF', '#87CEEB', '#4169E1', '#00CED1'];
          
          for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = 80 + Math.random() * 120;
            addParticle({
              x: p.targetX,
              y: p.targetY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 50,
              color: colors[Math.floor(Math.random() * colors.length)],
              life: 0.6 + Math.random() * 0.4,
              maxLife: 1,
              size: 3 + Math.random() * 5,
            });
          }
          return false;
        }
        return true;
      });

    const updatedSlashEffects = state.slashEffects
      .map((s) => ({
        ...s,
        progress: s.progress + deltaTime / s.duration,
      }))
      .filter((s) => s.progress < 1);

    let newRound = round;
    let swordsmanHp = swordsman.hp;
    let mageHp = mage.hp;

    const processAttack = (
      attacker: Character,
      defender: Character,
      defenderHp: number
    ): { damage: number; newDefenderHp: number; logType: LogType } => {
      const skill = attacker.skill;
      const baseDamage = getSkillDamage(skill, attacker.attack);
      const defenseReduction = getDefenseReduction(defender.skill);
      const finalDamage = Math.max(0, Math.floor(baseDamage * (1 - defenseReduction)));
      const newDefenderHp = Math.max(0, defenderHp - finalDamage);
      const logType = isDefensiveSkill(skill) ? 'defense' : 'special';
      
      return { damage: finalDamage, newDefenderHp, logType };
    };

    if (swordsmanCooldown <= 0 && mageCooldown <= 0) {
      newRound = round + 1;

      const swordsmanResult = processAttack(swordsman, mage, mageHp);
      const mageResult = processAttack(mage, swordsman, swordsmanHp);

      swordsmanHp = mageResult.newDefenderHp;
      mageHp = swordsmanResult.newDefenderHp;

      const sSkillName = SWORDSMAN_SKILL_NAMES[swordsman.skill as SwordsmanSkill];
      const mSkillName = MAGE_SKILL_NAMES[mage.skill as MageSkill];

      let logMessage = `回合${newRound}：`;
      
      if (isDefensiveSkill(swordsman.skill)) {
        logMessage += `剑士使用${sSkillName}抵消${Math.floor(mage.attack * getDefenseReduction(swordsman.skill))}点伤害`;
      } else {
        logMessage += `剑士使用${sSkillName}造成${swordsmanResult.damage}点伤害`;
      }
      
      logMessage += '，';
      
      if (isDefensiveSkill(mage.skill)) {
        logMessage += `法师使用${mSkillName}抵消${Math.floor(swordsman.attack * getDefenseReduction(mage.skill))}点伤害`;
      } else {
        logMessage += `法师使用${mSkillName}造成${mageResult.damage}点伤害`;
      }

      const combinedType: LogType = 
        !isDefensiveSkill(swordsman.skill) || !isDefensiveSkill(mage.skill)
          ? 'attack'
          : 'defense';

      get().recordLog(logMessage, combinedType);

      if (!isDefensiveSkill(swordsman.skill)) {
        get().addSlashEffect({
          x: 550,
          y: 300,
          progress: 0,
          duration: 0.3,
          direction: -1,
        });
        swordsmanLunge = 0.2;
      }

      if (!isDefensiveSkill(mage.skill)) {
        const projectileColor = mage.skill === 'fireball' ? '#FF6B35' : '#00BFFF';
        get().addProjectile({
          x: 650,
          y: 300,
          targetX: 200,
          targetY: 300,
          color: projectileColor,
          skill: mage.skill,
          progress: 0,
          duration: 0.8,
        });
        mageChargeTime = 0.5;
      }

      swordsmanCooldown = 1.5;
      mageCooldown = 2;
    }

    let winner: CharacterType | null = null;
    if (swordsmanHp <= 0 && mageHp <= 0) {
      winner = Math.random() > 0.5 ? 'swordsman' : 'mage';
    } else if (swordsmanHp <= 0) {
      winner = 'mage';
    } else if (mageHp <= 0) {
      winner = 'swordsman';
    }

    if (winner) {
      const winnerName = winner === 'swordsman' ? '剑士' : '法师';
      get().recordLog(`战斗结束！${winnerName}获胜！`, 'special');
    }

    set({
      swordsman: { ...swordsman, hp: swordsmanHp },
      mage: { ...mage, hp: mageHp },
      round: newRound,
      winner,
      winnerTimer: winner ? 0 : state.winnerTimer,
      swordsmanCooldown,
      mageCooldown,
      mageChargeTime: Math.max(0, mageChargeTime - deltaTime),
      swordsmanLunge,
      mageLunge,
      particles: updatedParticles,
      projectiles: updatedProjectiles,
      slashEffects: updatedSlashEffects,
    });
  },
}));
