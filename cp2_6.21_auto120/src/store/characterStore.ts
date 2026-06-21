import { create } from 'zustand';
import {
  Abilities,
  AbilityKey,
  ClassType,
  RaceType,
  Equipment,
  SpellSlot,
  calcModifier,
  calcProficiencyBonus,
  CLASS_MAX_SKILLS,
  RACE_BONUSES,
  CLASS_BONUSES,
  CASTER_CLASSES,
  getSpellSlotsForLevel,
} from '../types';

const MIN_ABILITY = 8;
const MAX_ABILITY = 18;
const TOTAL_POINTS = 72;

interface CharacterState {
  name: string;
  classType: ClassType;
  race: RaceType;
  level: number;
  experience: number;
  abilities: Abilities;
  proficientSkills: string[];
  equipment: Equipment[];
  spellSlots: Record<number, SpellSlot>;
  hp: number;
  ac: number;
  speed: number;
  validationErrors: string[];
}

interface CharacterActions {
  setName: (name: string) => void;
  setClassType: (classType: ClassType) => void;
  setRace: (race: RaceType) => void;
  setLevel: (level: number) => void;
  setExperience: (exp: number) => void;
  incrementAbility: (key: AbilityKey) => void;
  decrementAbility: (key: AbilityKey) => void;
  toggleSkillProficiency: (skillKey: string) => void;
  addEquipment: (equip: Equipment) => void;
  removeEquipment: (id: string) => void;
  useSpellSlot: (level: number) => void;
  restoreSpellSlot: (level: number) => void;
  restoreAllSpellSlots: () => void;
  setHp: (hp: number) => void;
  setAc: (ac: number) => void;
  setSpeed: (speed: number) => void;
  getAbilityModifier: (key: AbilityKey) => number;
  getRaceBonus: (key: AbilityKey) => number;
  getClassBonus: (key: AbilityKey) => number;
  getTotalAbility: (key: AbilityKey) => number;
  getTotalModifier: (key: AbilityKey) => number;
  getSkillModifier: (skillKey: string, abilityKey: AbilityKey) => number;
  getProficiencyBonus: () => number;
  getRemainingPoints: () => number;
  getMaxSkillSlots: () => number;
  isCaster: () => boolean;
  getSpellSlotInfo: (level: number) => SpellSlot | undefined;
  getCharacterData: () => CharacterState;
}

const defaultAbilities: Abilities = {
  str: 12,
  dex: 12,
  con: 12,
  int: 12,
  wis: 12,
  cha: 12,
};

function buildSpellSlots(level: number): Record<number, SpellSlot> {
  const slots: Record<number, SpellSlot> = {};
  const slotInfo = getSpellSlotsForLevel(level);
  for (let i = 1; i <= 9; i++) {
    slots[i] = { total: slotInfo[i] || 0, used: 0 };
  }
  return slots;
}

function sumAbilities(abilities: Abilities): number {
  return abilities.str + abilities.dex + abilities.con + abilities.int + abilities.wis + abilities.cha;
}

export const useCharacterStore = create<CharacterState & CharacterActions>((set, get) => ({
  name: '',
  classType: '战士',
  race: '人类',
  level: 1,
  experience: 0,
  abilities: { ...defaultAbilities },
  proficientSkills: [],
  equipment: [],
  spellSlots: buildSpellSlots(1),
  hp: 10,
  ac: 10,
  speed: 30,
  validationErrors: [],

  setName: (name) => set({ name }),

  setClassType: (classType) => {
    const state = get();
    const maxSkills = CLASS_MAX_SKILLS[classType];
    const trimmed = state.proficientSkills.slice(0, maxSkills);
    const isCasterNew = CASTER_CLASSES.includes(classType);
    const newSpellSlots = isCasterNew ? buildSpellSlots(state.level) : {};
    set({
      classType,
      proficientSkills: trimmed,
      spellSlots: newSpellSlots,
    });
  },

  setRace: (race) => set({ race }),

  setLevel: (level) => {
    const clamped = Math.max(1, Math.min(20, level));
    const state = get();
    const isCaster = CASTER_CLASSES.includes(state.classType);
    const newSpellSlots = isCaster ? buildSpellSlots(clamped) : {};
    set({ level: clamped, spellSlots: newSpellSlots });
  },

  setExperience: (experience) => set({ experience }),

  incrementAbility: (key) => {
    const state = get();
    const current = state.abilities[key];
    if (current >= MAX_ABILITY) return;
    const totalAfter = sumAbilities(state.abilities) + 1;
    if (totalAfter > TOTAL_POINTS) return;
    set({
      abilities: { ...state.abilities, [key]: current + 1 },
    });
  },

  decrementAbility: (key) => {
    const state = get();
    const current = state.abilities[key];
    if (current <= MIN_ABILITY) return;
    set({
      abilities: { ...state.abilities, [key]: current - 1 },
    });
  },

  toggleSkillProficiency: (skillKey) => {
    const state = get();
    const maxSkills = CLASS_MAX_SKILLS[state.classType];
    const idx = state.proficientSkills.indexOf(skillKey);
    if (idx >= 0) {
      const updated = [...state.proficientSkills];
      updated.splice(idx, 1);
      set({ proficientSkills: updated });
    } else {
      if (state.proficientSkills.length >= maxSkills) return;
      set({ proficientSkills: [...state.proficientSkills, skillKey] });
    }
  },

  addEquipment: (equip) => set((state) => ({
    equipment: [...state.equipment, equip],
  })),

  removeEquipment: (id) => set((state) => ({
    equipment: state.equipment.filter((e) => e.id !== id),
  })),

  useSpellSlot: (level) => {
    const state = get();
    const slot = state.spellSlots[level];
    if (!slot || slot.used >= slot.total) return;
    set({
      spellSlots: {
        ...state.spellSlots,
        [level]: { ...slot, used: slot.used + 1 },
      },
    });
  },

  restoreSpellSlot: (level) => {
    const state = get();
    const slot = state.spellSlots[level];
    if (!slot || slot.used <= 0) return;
    set({
      spellSlots: {
        ...state.spellSlots,
        [level]: { ...slot, used: slot.used - 1 },
      },
    });
  },

  restoreAllSpellSlots: () => {
    const state = get();
    const reset: Record<number, SpellSlot> = {};
    for (const [lvl, slot] of Object.entries(state.spellSlots)) {
      reset[Number(lvl)] = { ...slot, used: 0 };
    }
    set({ spellSlots: reset });
  },

  setHp: (hp) => set({ hp }),
  setAc: (ac) => set({ ac }),
  setSpeed: (speed) => set({ speed }),

  getAbilityModifier: (key) => {
    return calcModifier(get().abilities[key]);
  },

  getRaceBonus: (key) => {
    const race = get().race;
    return (RACE_BONUSES[race] as Record<string, number>)[key] || 0;
  },

  getClassBonus: (key) => {
    const classType = get().classType;
    return (CLASS_BONUSES[classType] as Record<string, number>)[key] || 0;
  },

  getTotalAbility: (key) => {
    const state = get();
    const base = state.abilities[key];
    const raceB = (RACE_BONUSES[state.race] as Record<string, number>)[key] || 0;
    const classB = (CLASS_BONUSES[state.classType] as Record<string, number>)[key] || 0;
    return base + raceB + classB;
  },

  getTotalModifier: (key) => {
    return calcModifier(get().getTotalAbility(key));
  },

  getSkillModifier: (skillKey, abilityKey) => {
    const state = get();
    const totalAbility = state.getTotalAbility(abilityKey);
    const abilityMod = calcModifier(totalAbility);
    const isProficient = state.proficientSkills.includes(skillKey);
    const profBonus = isProficient ? calcProficiencyBonus(state.level) : 0;
    return abilityMod + profBonus;
  },

  getProficiencyBonus: () => {
    return calcProficiencyBonus(get().level);
  },

  getRemainingPoints: () => {
    return TOTAL_POINTS - sumAbilities(get().abilities);
  },

  getMaxSkillSlots: () => {
    return CLASS_MAX_SKILLS[get().classType];
  },

  isCaster: () => {
    return CASTER_CLASSES.includes(get().classType);
  },

  getSpellSlotInfo: (level) => {
    return get().spellSlots[level];
  },

  getCharacterData: () => {
    const state = get();
    return {
      name: state.name,
      classType: state.classType,
      race: state.race,
      level: state.level,
      experience: state.experience,
      abilities: state.abilities,
      proficientSkills: state.proficientSkills,
      equipment: state.equipment,
      spellSlots: state.spellSlots,
      hp: state.hp,
      ac: state.ac,
      speed: state.speed,
      validationErrors: state.validationErrors,
    };
  },
}));
