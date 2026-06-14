import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Race, CharacterClass, Attributes, AttributeKey } from '../shared/types';
import { RACE_DATA } from './data';
import { eventBus } from '../shared/eventBus';

const STORAGE_KEY = 'rpg_character_builder';
const BASE_ATTRIBUTE = 5;
const TOTAL_FREE_POINTS = 30;
const MAX_ATTRIBUTE = 20;
const EXP_PER_LEVEL = 100;

interface CharacterState {
  id: string;
  race: Race;
  characterClass: CharacterClass;
  level: number;
  experience: number;
  skillPoints: number;
  attributes: Attributes;
  allocatedPoints: number;
  activatedSkills: string[];
  loaded: boolean;
}

interface CharacterActions {
  setRace: (race: Race) => void;
  setClass: (characterClass: CharacterClass) => void;
  allocatePoints: (attr: AttributeKey, delta: number) => void;
  activateSkill: (skillId: string) => void;
  addExperience: (amount: number) => void;
  reset: () => void;
  loadFromStorage: () => void;
  getTotalAttributes: () => Attributes;
  getFreePoints: () => number;
}

const defaultAttributes: Attributes = {
  strength: BASE_ATTRIBUTE,
  agility: BASE_ATTRIBUTE,
  intelligence: BASE_ATTRIBUTE,
  constitution: BASE_ATTRIBUTE,
  spirit: BASE_ATTRIBUTE,
};

const defaultState: CharacterState = {
  id: uuidv4(),
  race: 'human',
  characterClass: 'warrior',
  level: 1,
  experience: 0,
  skillPoints: 0,
  attributes: { ...defaultAttributes },
  allocatedPoints: 0,
  activatedSkills: [],
  loaded: false,
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function saveToStorage(state: CharacterState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const data = JSON.stringify({
        id: state.id,
        race: state.race,
        characterClass: state.characterClass,
        level: state.level,
        experience: state.experience,
        skillPoints: state.skillPoints,
        attributes: state.attributes,
        allocatedPoints: state.allocatedPoints,
        activatedSkills: state.activatedSkills,
      });
      localStorage.setItem(STORAGE_KEY, data);
    } catch {
      // ignore storage errors
    }
  }, 300);
}

function getRaceBonuses(race: Race): Partial<Attributes> {
  const raceData = RACE_DATA.find((r) => r.id === race);
  return raceData ? raceData.bonuses : {};
}

function loadInitialState(): CharacterState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        ...data,
        loaded: true,
      };
    }
  } catch {
    // ignore
  }
  return { ...defaultState, loaded: false };
}

export const useCharacterStore = create<CharacterState & CharacterActions>((set, get) => ({
  ...loadInitialState(),

  setRace: (race: Race) => {
    set((state) => {
      const newState = { ...state, race };
      saveToStorage(newState);
      eventBus.emit('character:raceChanged', race);
      return newState;
    });
  },

  setClass: (characterClass: CharacterClass) => {
    set((state) => {
      const newState = { ...state, characterClass, activatedSkills: [] };
      saveToStorage(newState);
      eventBus.emit('character:classChanged', characterClass);
      return newState;
    });
  },

  allocatePoints: (attr: AttributeKey, delta: number) => {
    set((state) => {
      const currentVal = state.attributes[attr];
      const newVal = currentVal + delta;
      const newAllocated = state.allocatedPoints + delta;

      if (newVal < BASE_ATTRIBUTE || newVal > MAX_ATTRIBUTE) return state;
      if (newAllocated < 0 || newAllocated > TOTAL_FREE_POINTS) return state;

      const newAttributes = { ...state.attributes, [attr]: newVal };
      const newState = { ...state, attributes: newAttributes, allocatedPoints: newAllocated };
      saveToStorage(newState);
      eventBus.emit('character:attributesChanged', newAttributes);
      return newState;
    });
  },

  activateSkill: (skillId: string) => {
    set((state) => {
      if (state.skillPoints <= 0) return state;
      if (state.activatedSkills.includes(skillId)) return state;
      const newActivated = [...state.activatedSkills, skillId];
      const newState = { ...state, activatedSkills: newActivated, skillPoints: state.skillPoints - 1 };
      saveToStorage(newState);
      eventBus.emit('character:skillActivated', skillId);
      return newState;
    });
  },

  addExperience: (amount: number) => {
    set((state) => {
      let newExp = state.experience + amount;
      let newLevel = state.level;
      let newSkillPoints = state.skillPoints;
      const expNeeded = newLevel * EXP_PER_LEVEL;

      while (newExp >= expNeeded) {
        newExp -= newLevel * EXP_PER_LEVEL;
        newLevel++;
        if (newLevel % 2 === 0) {
          newSkillPoints++;
        }
      }

      const newState = { ...state, experience: newExp, level: newLevel, skillPoints: newSkillPoints };
      saveToStorage(newState);
      eventBus.emit('character:levelChanged', newLevel);
      return newState;
    });
  },

  reset: () => {
    const newState = {
      ...defaultState,
      id: uuidv4(),
      attributes: { ...defaultAttributes },
      activatedSkills: [],
    };
    set(newState);
    saveToStorage(newState);
    eventBus.emit('character:reset');
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          ...data,
          loaded: true,
        });
        eventBus.emit('character:loaded');
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  getTotalAttributes: () => {
    const state = get();
    const bonuses = getRaceBonuses(state.race);
    return {
      strength: state.attributes.strength + (bonuses.strength || 0),
      agility: state.attributes.agility + (bonuses.agility || 0),
      intelligence: state.attributes.intelligence + (bonuses.intelligence || 0),
      constitution: state.attributes.constitution + (bonuses.constitution || 0),
      spirit: state.attributes.spirit + (bonuses.spirit || 0),
    };
  },

  getFreePoints: () => {
    return TOTAL_FREE_POINTS - get().allocatedPoints;
  },
}));

export { BASE_ATTRIBUTE, TOTAL_FREE_POINTS, MAX_ATTRIBUTE, EXP_PER_LEVEL };
