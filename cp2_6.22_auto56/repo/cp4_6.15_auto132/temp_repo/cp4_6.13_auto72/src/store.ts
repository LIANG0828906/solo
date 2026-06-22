import { create } from 'zustand';
import { Creature, createCreatureInstance, allCreatures, upgradeCreature, Skill, extraSkills } from './creatures';
import { BattleResult, runBattle, generateEnemyWave, BattleLogEntry } from './combatEngine';

interface GameState {
  gold: number;
  level: number;
  exp: number;
  expToNextLevel: number;
  wave: number;
  skillSlots: number;
  
  team: (Creature | null)[];
  enemies: Creature[];
  
  shopCreatures: Creature[];
  shopSkills: Skill[];
  
  isBattling: boolean;
  battleResult: BattleResult | null;
  showBattleReport: boolean;
  currentBattleLogIndex: number;
  
  selectedCreature: Creature | null;
  showCreatureDetail: boolean;
  
  screenShake: boolean;
  
  setTeam: (team: (Creature | null)[]) => void;
  placeCreature: (creature: Creature, position: number) => void;
  removeCreature: (position: number) => void;
  
  startBattle: () => void;
  nextBattleLog: () => boolean;
  finishBattle: () => void;
  closeBattleReport: () => void;
  
  refreshShop: () => void;
  buyCreature: (creature: Creature) => boolean;
  upgradeTeamCreature: (position: number) => boolean;
  buySkill: (skill: Skill, creaturePosition: number) => boolean;
  
  addGold: (amount: number) => void;
  addExp: (amount: number) => void;
  nextWave: () => void;
  
  selectCreature: (creature: Creature | null) => void;
  toggleCreatureDetail: () => void;
  
  setScreenShake: (shake: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  gold: 300,
  level: 1,
  exp: 0,
  expToNextLevel: 100,
  wave: 1,
  skillSlots: 1,
  
  team: [null, null, null, null, null, null],
  enemies: [],
  
  shopCreatures: [],
  shopSkills: [],
  
  isBattling: false,
  battleResult: null,
  showBattleReport: false,
  currentBattleLogIndex: 0,
  
  selectedCreature: null,
  showCreatureDetail: false,
  
  screenShake: false,
  
  setTeam: (team) => set({ team }),
  
  placeCreature: (creature, position) => {
    const newCreature = { ...creature, position };
    const newTeam = [...get().team];
    
    const existingIndex = newTeam.findIndex(c => c?.id === creature.id);
    if (existingIndex !== -1) {
      newTeam[existingIndex] = null;
    }
    
    newTeam[position] = newCreature;
    set({ team: newTeam });
  },
  
  removeCreature: (position) => {
    const newTeam = [...get().team];
    newTeam[position] = null;
    set({ team: newTeam });
  },
  
  startBattle: () => {
    const { team, wave } = get();
    const allies = team.filter((c): c is Creature => c !== null);
    
    if (allies.length === 0) return;
    
    const enemies = generateEnemyWave(wave);
    
    const battleResult = runBattle(allies, enemies);
    
    set({
      enemies,
      isBattling: true,
      battleResult,
      currentBattleLogIndex: 0,
      showBattleReport: false,
    });
  },
  
  nextBattleLog: () => {
    const { battleResult, currentBattleLogIndex } = get();
    if (!battleResult) return false;
    
    if (currentBattleLogIndex < battleResult.battleLog.length - 1) {
      set({ currentBattleLogIndex: currentBattleLogIndex + 1 });
      return true;
    }
    return false;
  },
  
  finishBattle: () => {
    const { battleResult } = get();
    if (!battleResult) return;
    
    const { goldReward, expReward } = battleResult;
    
    set(state => {
      let newExp = state.exp + expReward;
      let newLevel = state.level;
      let newExpToNext = state.expToNextLevel;
      let newSkillSlots = state.skillSlots;
      
      while (newExp >= newExpToNext) {
        newExp -= newExpToNext;
        newLevel++;
        newExpToNext = Math.floor(newExpToNext * 1.5);
        if (newLevel % 2 === 0) {
          newSkillSlots++;
        }
      }
      
      return {
        gold: state.gold + goldReward,
        exp: newExp,
        level: newLevel,
        expToNextLevel: newExpToNext,
        skillSlots: newSkillSlots,
        isBattling: false,
        showBattleReport: true,
      };
    });
  },
  
  closeBattleReport: () => set({ showBattleReport: false, battleResult: null }),
  
  refreshShop: () => {
    const shuffled = [...allCreatures].sort(() => Math.random() - 0.5);
    const shopCreatures = shuffled.slice(0, 4).map(c => createCreatureInstance(c.id, 1));
    
    const shuffledSkills = [...extraSkills].sort(() => Math.random() - 0.5);
    const shopSkills = shuffledSkills.slice(0, 3);
    
    set({ shopCreatures, shopSkills });
  },
  
  buyCreature: (creature) => {
    const { gold, team } = get();
    if (gold < creature.cost) return false;
    
    const emptySlot = team.findIndex(c => c === null);
    if (emptySlot === -1) return false;
    
    const newCreature = { ...creature, position: emptySlot };
    const newTeam = [...team];
    newTeam[emptySlot] = newCreature;
    
    set(state => ({
      gold: state.gold - creature.cost,
      team: newTeam,
    }));
    
    return true;
  },
  
  upgradeTeamCreature: (position) => {
    const { gold, team } = get();
    const creature = team[position];
    if (!creature) return false;
    
    const upgradeCost = creature.cost * creature.level;
    if (gold < upgradeCost) return false;
    
    const upgraded = upgradeCreature(creature);
    const newTeam = [...team];
    newTeam[position] = upgraded;
    
    set(state => ({
      gold: state.gold - upgradeCost,
      team: newTeam,
    }));
    
    return true;
  },
  
  buySkill: (skill, creaturePosition) => {
    const { gold, team, level } = get();
    const creature = team[creaturePosition];
    if (!creature) return false;
    
    const skillCost = 150;
    if (gold < skillCost) return false;
    
    if (creature.equippedSkills.length >= level) return false;
    
    const newCreature = {
      ...creature,
      equippedSkills: [...creature.equippedSkills, skill],
    };
    
    const newTeam = [...team];
    newTeam[creaturePosition] = newCreature;
    
    set(state => ({
      gold: state.gold - skillCost,
      team: newTeam,
    }));
    
    return true;
  },
  
  addGold: (amount) => set(state => ({ gold: state.gold + amount })),
  
  addExp: (amount) => {
    set(state => {
      let newExp = state.exp + amount;
      let newLevel = state.level;
      let newExpToNext = state.expToNextLevel;
      let newSkillSlots = state.skillSlots;
      
      while (newExp >= newExpToNext) {
        newExp -= newExpToNext;
        newLevel++;
        newExpToNext = Math.floor(newExpToNext * 1.5);
        if (newLevel % 2 === 0) {
          newSkillSlots++;
        }
      }
      
      return {
        exp: newExp,
        level: newLevel,
        expToNextLevel: newExpToNext,
        skillSlots: newSkillSlots,
      };
    });
  },
  
  nextWave: () => set(state => ({ wave: state.wave + 1 })),
  
  selectCreature: (creature) => set({ selectedCreature: creature }),
  
  toggleCreatureDetail: () => set(state => ({ showCreatureDetail: !state.showCreatureDetail })),
  
  setScreenShake: (shake) => set({ screenShake: shake }),
}));

export function initializeGame() {
  const store = useGameStore.getState();
  store.refreshShop();
  
  const initialCreatures = [
    createCreatureInstance('fire-spirit', 1),
    createCreatureInstance('ice-lizard', 1),
    createCreatureInstance('thunder-eagle', 1),
  ];
  
  const team: (Creature | null)[] = [null, null, null, null, null, null];
  initialCreatures.forEach((creature, index) => {
    creature.position = index;
    team[index] = creature;
  });
  
  useGameStore.setState({ team });
}
