import axios from 'axios';
import type { Character, CharacterClass, Attributes } from '../../types';
import { CLASS_DATA, STARTER_ITEMS } from '../../data/gameData';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = '/api/characters';

function backendToFrontend(data: any): Character {
  return {
    ...data,
    class: data.characterClass || data.class,
  } as Character;
}

function frontendToBackend(character: Character): any {
  const { class: charClass, ...rest } = character;
  return {
    ...rest,
    characterClass: charClass,
  };
}

function createLocalCharacter(data: {
  name: string;
  class: CharacterClass;
  attributes: Attributes;
  avatarColor: string;
  avatarShape: 'circle' | 'square' | 'diamond';
}): Character {
  const classData = CLASS_DATA[data.class];
  const inventory = STARTER_ITEMS.map((item) => ({
    ...item,
    id: `${item.id}-${uuidv4().slice(0, 8)}`,
  }));

  return {
    id: `char-${Date.now()}`,
    name: data.name,
    class: data.class,
    level: 1,
    experience: 0,
    experienceToNext: 100,
    attributes: { ...data.attributes },
    baseAttributes: { ...data.attributes },
    maxHealth: classData.baseHealth,
    currentHealth: classData.baseHealth,
    maxMana: classData.baseMana,
    currentMana: classData.baseMana,
    skillPoints: 0,
    skills: [],
    equipment: { head: null, body: null, weapon: null, ring: null },
    inventory,
    gold: 50,
    avatarColor: data.avatarColor,
    avatarShape: data.avatarShape,
  };
}

export const CharacterAPI = {
  async createCharacter(data: {
    name: string;
    class: CharacterClass;
    attributes: Attributes;
    avatarColor: string;
    avatarShape: 'circle' | 'square' | 'diamond';
  }): Promise<Character> {
    try {
      const response = await axios.post(`${API_BASE}`, {
        name: data.name,
        characterClass: data.class,
        attributes: data.attributes,
        avatarColor: data.avatarColor,
        avatarShape: data.avatarShape,
      });
      return backendToFrontend(response.data);
    } catch (error) {
      console.warn('Backend not available, using local character creation');
      return createLocalCharacter(data);
    }
  },

  async saveCharacter(character: Character): Promise<Character> {
    try {
      const response = await axios.put(
        `${API_BASE}/${character.id}`,
        frontendToBackend(character)
      );
      return backendToFrontend(response.data);
    } catch (error) {
      console.warn('Backend not available, character saved locally');
      localStorage.setItem('trpg_character', JSON.stringify(character));
      return character;
    }
  },

  async loadCharacter(id: string): Promise<Character | null> {
    try {
      const response = await axios.get(`${API_BASE}/${id}`);
      return backendToFrontend(response.data);
    } catch (error) {
      console.warn('Backend not available, trying local storage');
      const saved = localStorage.getItem('trpg_character');
      if (saved) {
        return JSON.parse(saved) as Character;
      }
      return null;
    }
  },

  async listCharacters(): Promise<Character[]> {
    try {
      const response = await axios.get<any[]>(`${API_BASE}`);
      return response.data.map(backendToFrontend);
    } catch (error) {
      console.warn('Backend not available, returning empty list');
      return [];
    }
  },

  async deleteCharacter(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/${id}`);
    } catch (error) {
      console.warn('Backend not available, could not delete character');
      localStorage.removeItem('trpg_character');
    }
  },
};
